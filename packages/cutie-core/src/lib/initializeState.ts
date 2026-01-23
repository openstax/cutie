import { AttemptState } from '../types';
import { getChildElements, getFirstChildElement } from '../utils/dom';
import { deepEqual } from '../utils/equality';
import { parseValue } from '../utils/typeParser';

/**
 * Initializes the attempt state by processing template declarations and
 * template processing rules from a QTI assessment item.
 *
 * This function:
 * 1. Parses qti-template-declaration elements to identify template variables
 * 2. Executes qti-template-processing rules to set initial values (randomization, etc.)
 * 3. Initializes outcome variables to their default values
 * 4. Creates the initial AttemptState with all variables
 *
 * Template processing only runs once at the beginning of an attempt.
 * Template variables remain constant throughout the attempt.
 *
 * @param itemDoc - Parsed QTI assessment item XML document
 * @returns Initial attempt state with template and outcome variables
 */
export function initializeState(itemDoc: Document): AttemptState {
  const variables: Record<string, unknown> = {};
  const MAX_CONSTRAINT_RETRIES = 1000; // Prevent infinite loops

  // Initialize outcome variables with default values
  initializeOutcomeVariables(itemDoc, variables);

  // Execute template processing with constraint retry logic
  let retryCount = 0;
  while (retryCount < MAX_CONSTRAINT_RETRIES) {
    try {
      executeTemplateProcessing(itemDoc, variables);
      break; // Success, exit retry loop
    } catch (error) {
      if (error instanceof ConstraintViolationError) {
        // Reset template variables and retry
        retryCount++;
        resetTemplateVariables(itemDoc, variables);
      } else {
        throw error;
      }
    }
  }

  return {
    variables,
    completionStatus: 'not_attempted'
  };
}

/**
 * Custom error thrown when a template constraint is violated
 */
class ConstraintViolationError extends Error {
  constructor() {
    super('Template constraint violated');
    this.name = 'ConstraintViolationError';
  }
}

/**
 * Custom error thrown when exit-template is encountered
 */
class ExitTemplateError extends Error {
  constructor() {
    super('Exit template');
    this.name = 'ExitTemplateError';
  }
}

/**
 * Initialize outcome variables with their default values
 */
function initializeOutcomeVariables(itemDoc: Document, variables: Record<string, unknown>): void {
  const outcomeDeclarations = itemDoc.getElementsByTagName('qti-outcome-declaration');

  for (let i = 0; i < outcomeDeclarations.length; i++) {
    const declaration = outcomeDeclarations[i];
    const identifier = declaration.getAttribute('identifier');
    if (!identifier) continue;

    // Look for default value
    const defaultValueElement = declaration.getElementsByTagName('qti-default-value')[0];

    if (defaultValueElement) {
      const cardinality = declaration.getAttribute('cardinality') || 'single';
      const baseType = declaration.getAttribute('base-type');

      if (cardinality === 'single') {
        const valueElement = defaultValueElement.getElementsByTagName('qti-value')[0];
        if (valueElement && baseType) {
          variables[identifier] = parseValue(valueElement.textContent || '', baseType);
        }
      } else if (cardinality === 'multiple' || cardinality === 'ordered') {
        const valueElements = defaultValueElement.getElementsByTagName('qti-value');
        const values: unknown[] = [];
        for (let j = 0; j < valueElements.length; j++) {
          if (baseType) {
            values.push(parseValue(valueElements[j].textContent || '', baseType));
          }
        }
        variables[identifier] = values;
      } else if (cardinality === 'record') {
        const fieldElements = defaultValueElement.getElementsByTagName('qti-field-value');
        const record: Record<string, unknown> = {};
        for (let j = 0; j < fieldElements.length; j++) {
          const fieldIdentifier = fieldElements[j].getAttribute('field-identifier');
          const valueElement = fieldElements[j].getElementsByTagName('qti-value')[0];
          if (fieldIdentifier && valueElement) {
            const fieldBaseType = fieldElements[j].getAttribute('base-type');
            if (fieldBaseType) {
              record[fieldIdentifier] = parseValue(valueElement.textContent || '', fieldBaseType);
            }
          }
        }
        variables[identifier] = record;
      }
    }
  }
}

/**
 * Reset template variables (remove them from state)
 */
function resetTemplateVariables(itemDoc: Document, variables: Record<string, unknown>): void {
  const templateDeclarations = itemDoc.getElementsByTagName('qti-template-declaration');

  for (let i = 0; i < templateDeclarations.length; i++) {
    const identifier = templateDeclarations[i].getAttribute('identifier');
    if (identifier) {
      delete variables[identifier];
    }
  }
}

/**
 * Execute template processing rules
 */
function executeTemplateProcessing(itemDoc: Document, variables: Record<string, unknown>): void {
  const templateProcessing = itemDoc.getElementsByTagName('qti-template-processing')[0];

  if (!templateProcessing) {
    return; // No template processing to execute
  }

  try {
    // Execute each child rule in order
    for (const child of getChildElements(templateProcessing)) {
      executeTemplateRule(child, variables);
    }
  } catch (error) {
    if (error instanceof ExitTemplateError) {
      // Normal exit, just return
      return;
    }
    throw error;
  }
}

/**
 * Execute a single template rule
 */
function executeTemplateRule(rule: Element, variables: Record<string, unknown>): void {
  const localName = rule.localName;

  switch (localName) {
    case 'qti-set-template-value':
      executeSetTemplateValue(rule, variables);
      break;
    case 'qti-template-condition':
      executeTemplateCondition(rule, variables);
      break;
    case 'qti-template-constraint':
      executeTemplateConstraint(rule, variables);
      break;
    case 'qti-exit-template':
      throw new ExitTemplateError();
    case 'qti-set-correct-response':
      executeSetCorrectResponse(rule, variables);
      break;
    case 'qti-set-default-value':
      executeSetDefaultValue(rule, variables);
      break;
  }
}

/**
 * Execute qti-set-template-value rule
 */
function executeSetTemplateValue(rule: Element, variables: Record<string, unknown>): void {
  const identifier = rule.getAttribute('identifier');
  if (!identifier) return;

  // Evaluate the expression (first child element)
  const child = getFirstChildElement(rule);
  if (!child) {
    throw new Error('Expected child element in <qti-set-template-value>');
  }
  const value = evaluateExpression(child, variables);
  variables[identifier] = value;
}

/**
 * Execute qti-template-condition rule
 */
function executeTemplateCondition(rule: Element, variables: Record<string, unknown>): void {
  // Find template-if, template-else-if, and template-else elements
  for (const child of getChildElements(rule)) {
    const localName = child.localName;

    if (localName === 'qti-template-if') {
      if (evaluateTemplateIf(child, variables)) {
        return;
      }
    } else if (localName === 'qti-template-else-if') {
      if (evaluateTemplateIf(child, variables)) {
        return;
      }
    } else if (localName === 'qti-template-else') {
      executeTemplateBlock(child, variables);
      return;
    }
  }
}

/**
 * Evaluate a template-if or template-else-if block
 * Returns true if the condition was true and the block was executed
 */
function evaluateTemplateIf(element: Element, variables: Record<string, unknown>): boolean {
  // First child is the condition expression
  // Remaining children are the rules to execute
  let conditionResult = false;
  let conditionEvaluated = false;

  for (const child of getChildElements(element)) {
    if (!conditionEvaluated) {
      // This is the condition expression
      const value = evaluateExpression(child, variables);
      if (typeof value !== 'boolean') {
        throw new Error(`Expected boolean value in <${element.localName}> condition, got ${typeof value}`);
      }
      conditionResult = value;
      conditionEvaluated = true;
    } else {
      // These are the rules to execute if condition is true
      if (conditionResult) {
        executeTemplateRule(child, variables);
      }
    }
  }

  return conditionResult;
}

/**
 * Execute all rules in a template block (used for template-else)
 */
function executeTemplateBlock(element: Element, variables: Record<string, unknown>): void {
  for (const child of getChildElements(element)) {
    executeTemplateRule(child, variables);
  }
}

/**
 * Execute qti-template-constraint rule
 */
function executeTemplateConstraint(rule: Element, variables: Record<string, unknown>): void {
  // Evaluate the constraint expression (first child element)
  const child = getFirstChildElement(rule);
  if (!child) {
    throw new Error('Expected child element in <qti-template-constraint>');
  }
  const result = evaluateExpression(child, variables);
  if (typeof result !== 'boolean') {
    throw new Error(`Expected boolean value in <qti-template-constraint>, got ${typeof result}`);
  }
  if (!result) {
    throw new ConstraintViolationError();
  }
}

/**
 * Execute qti-set-correct-response rule
 */
function executeSetCorrectResponse(rule: Element, variables: Record<string, unknown>): void {
  const identifier = rule.getAttribute('identifier');
  if (!identifier) return;

  // Store the correct response value for later comparison
  // We'll store it with a special prefix to distinguish from actual response values
  const child = getFirstChildElement(rule);
  if (!child) {
    throw new Error('Expected child element in <qti-set-correct-response>');
  }
  const value = evaluateExpression(child, variables);
  variables[`__correct_${identifier}`] = value;
}

/**
 * Execute qti-set-default-value rule
 */
function executeSetDefaultValue(rule: Element, variables: Record<string, unknown>): void {
  const identifier = rule.getAttribute('identifier');
  if (!identifier) return;

  // Set the default value for an outcome variable
  const child = getFirstChildElement(rule);
  if (!child) {
    throw new Error('Expected child element in <qti-set-default-value>');
  }
  const value = evaluateExpression(child, variables);
  variables[identifier] = value;
}

/**
 * Evaluate an expression and return its value
 */
function evaluateExpression(element: Element, variables: Record<string, unknown>): unknown {
  const localName = element.localName;

  switch (localName) {
    // Base values
    case 'qti-base-value':
      return evaluateBaseValue(element);
    case 'qti-null':
      return null;
    case 'qti-variable':
      return evaluateVariable(element, variables);

    // Containers
    case 'qti-multiple':
      return evaluateMultiple(element, variables);
    case 'qti-ordered':
      return evaluateOrdered(element, variables);
    case 'qti-record':
      return evaluateRecord(element, variables);

    // Randomization
    case 'qti-random':
      return evaluateRandom(element, variables);
    case 'qti-random-integer':
      return evaluateRandomInteger(element);
    case 'qti-random-float':
      return evaluateRandomFloat(element);

    // Mathematical operators
    case 'qti-sum':
      return evaluateSum(element, variables);
    case 'qti-product':
      return evaluateProduct(element, variables);
    case 'qti-subtract':
      return evaluateSubtract(element, variables);
    case 'qti-divide':
      return evaluateDivide(element, variables);
    case 'qti-integer-divide':
      return evaluateIntegerDivide(element, variables);
    case 'qti-integer-modulus':
      return evaluateIntegerModulus(element, variables);
    case 'qti-truncate':
      return evaluateTruncate(element, variables);
    case 'qti-round':
      return evaluateRound(element, variables);
    case 'qti-power':
      return evaluatePower(element, variables);

    // Logical operators
    case 'qti-match':
      return evaluateMatch(element, variables);
    case 'qti-equal':
      return evaluateEqual(element, variables);
    case 'qti-lt':
      return evaluateLessThan(element, variables);
    case 'qti-gt':
      return evaluateGreaterThan(element, variables);
    case 'qti-lte':
      return evaluateLessThanOrEqual(element, variables);
    case 'qti-gte':
      return evaluateGreaterThanOrEqual(element, variables);
    case 'qti-and':
      return evaluateAnd(element, variables);
    case 'qti-or':
      return evaluateOr(element, variables);
    case 'qti-not':
      return evaluateNot(element, variables);

    // Container operators
    case 'qti-index':
      return evaluateIndex(element, variables);
    case 'qti-contains':
      return evaluateContains(element, variables);
    case 'qti-member':
      return evaluateMember(element, variables);
    case 'qti-container-size':
      return evaluateContainerSize(element, variables);
    case 'qti-delete':
      return evaluateDelete(element, variables);
    case 'qti-repeat':
      return evaluateRepeat(element, variables);

    // String operators
    case 'qti-substring':
      return evaluateSubstring(element, variables);
    case 'qti-string-match':
      return evaluateStringMatch(element, variables);
    case 'qti-pattern-match':
      return evaluatePatternMatch(element, variables);

    // Type conversion
    case 'qti-integer-to-float':
      return evaluateIntegerToFloat(element, variables);
    case 'qti-any-n':
      return evaluateAnyN(element, variables);

    // Field access
    case 'qti-field-value':
      return evaluateFieldValue(element, variables);

    default:
      return null;
  }
}


/**
 * Evaluate qti-base-value
 */
function evaluateBaseValue(element: Element): unknown {
  const baseType = element.getAttribute('base-type');
  const text = element.textContent || '';

  if (!baseType) return text;

  return parseValue(text, baseType);
}

/**
 * Evaluate qti-variable
 */
function evaluateVariable(element: Element, variables: Record<string, unknown>): unknown {
  const identifier = element.getAttribute('identifier');
  if (!identifier) return null;

  return variables[identifier] ?? null;
}

/**
 * Evaluate qti-multiple
 */
function evaluateMultiple(element: Element, variables: Record<string, unknown>): unknown[] {
  const values: unknown[] = [];

  for (const child of getChildElements(element)) {
    values.push(evaluateExpression(child, variables));
  }

  return values;
}

/**
 * Evaluate qti-ordered
 */
function evaluateOrdered(element: Element, variables: Record<string, unknown>): unknown[] {
  return evaluateMultiple(element, variables);
}

/**
 * Evaluate qti-record
 */
function evaluateRecord(element: Element, variables: Record<string, unknown>): Record<string, unknown> {
  const record: Record<string, unknown> = {};

  const fieldElements = element.getElementsByTagName('qti-field-value');

  for (let i = 0; i < fieldElements.length; i++) {
    const fieldElement = fieldElements[i];
    const fieldIdentifier = fieldElement.getAttribute('field-identifier');
    if (!fieldIdentifier) continue;

    const child = getFirstChildElement(fieldElement);
    if (!child) {
      throw new Error('Expected child element in <qti-field-value>');
    }
    record[fieldIdentifier] = evaluateExpression(child, variables);
  }

  return record;
}

/**
 * Evaluate qti-random
 */
function evaluateRandom(element: Element, variables: Record<string, unknown>): unknown {
  // Get the container (first child element)
  for (const child of getChildElements(element)) {
    const container = evaluateExpression(child, variables);
    if (!Array.isArray(container)) {
      throw new Error(`Expected array value in <qti-random>, got ${typeof container}`);
    }
    if (container.length > 0) {
      const randomIndex = Math.floor(Math.random() * container.length);
      return container[randomIndex];
    }
    return null;
  }
  return null;
}

/**
 * Evaluate qti-random-integer
 */
function evaluateRandomInteger(element: Element): number {
  const min = parseInt(element.getAttribute('min') || '0', 10);
  const max = parseInt(element.getAttribute('max') || '0', 10);
  const step = parseInt(element.getAttribute('step') || '1', 10);

  const range = Math.floor((max - min) / step) + 1;
  const randomStep = Math.floor(Math.random() * range);

  return min + (randomStep * step);
}

/**
 * Evaluate qti-random-float
 */
function evaluateRandomFloat(element: Element): number {
  const min = parseFloat(element.getAttribute('min') || '0');
  const max = parseFloat(element.getAttribute('max') || '1');

  return min + (Math.random() * (max - min));
}

/**
 * Evaluate qti-sum
 */
function evaluateSum(element: Element, variables: Record<string, unknown>): number {
  let sum = 0;

  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (value !== null && value !== undefined) {
      if (typeof value !== 'number') {
        throw new Error(`Expected number value in <qti-sum>, got ${typeof value}`);
      }
      sum += value;
    }
  }

  return sum;
}

/**
 * Evaluate qti-product
 */
function evaluateProduct(element: Element, variables: Record<string, unknown>): number {
  let product = 1;

  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (value !== null && value !== undefined) {
      if (typeof value !== 'number') {
        throw new Error(`Expected number value in <qti-product>, got ${typeof value}`);
      }
      product *= value;
    }
  }

  return product;
}

/**
 * Evaluate qti-subtract
 */
function evaluateSubtract(element: Element, variables: Record<string, unknown>): number {
  const values: number[] = [];

  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (typeof value !== 'number') {
      throw new Error(`Expected number value in <qti-subtract>, got ${typeof value}`);
    }
    values.push(value);
  }

  return values.length >= 2 ? values[0] - values[1] : 0;
}

/**
 * Evaluate qti-divide
 */
function evaluateDivide(element: Element, variables: Record<string, unknown>): number {
  const values: number[] = [];

  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (typeof value !== 'number') {
      throw new Error(`Expected number value in <qti-divide>, got ${typeof value}`);
    }
    values.push(value);
  }

  return values.length >= 2 && values[1] !== 0 ? values[0] / values[1] : 0;
}

/**
 * Evaluate qti-integer-divide
 */
function evaluateIntegerDivide(element: Element, variables: Record<string, unknown>): number {
  const values: number[] = [];

  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (typeof value !== 'number') {
      throw new Error(`Expected number value in <qti-integer-divide>, got ${typeof value}`);
    }
    values.push(value);
  }

  return values.length >= 2 && values[1] !== 0 ? Math.floor(values[0] / values[1]) : 0;
}

/**
 * Evaluate qti-integer-modulus
 */
function evaluateIntegerModulus(element: Element, variables: Record<string, unknown>): number {
  const values: number[] = [];

  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (typeof value !== 'number') {
      throw new Error(`Expected number value in <qti-integer-modulus>, got ${typeof value}`);
    }
    values.push(value);
  }

  return values.length >= 2 && values[1] !== 0 ? values[0] % values[1] : 0;
}

/**
 * Evaluate qti-truncate
 */
function evaluateTruncate(element: Element, variables: Record<string, unknown>): number {
  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (typeof value !== 'number') {
      throw new Error(`Expected number value in <qti-truncate>, got ${typeof value}`);
    }
    return Math.trunc(value);
  }
  return 0;
}

/**
 * Evaluate qti-round
 */
function evaluateRound(element: Element, variables: Record<string, unknown>): number {
  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (typeof value !== 'number') {
      throw new Error(`Expected number value in <qti-round>, got ${typeof value}`);
    }
    return Math.round(value);
  }
  return 0;
}

/**
 * Evaluate qti-power
 */
function evaluatePower(element: Element, variables: Record<string, unknown>): number {
  const values: number[] = [];

  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (typeof value !== 'number') {
      throw new Error(`Expected number value in <qti-power>, got ${typeof value}`);
    }
    values.push(value);
  }

  return values.length >= 2 ? Math.pow(values[0], values[1]) : 0;
}

/**
 * Evaluate qti-match
 */
function evaluateMatch(element: Element, variables: Record<string, unknown>): boolean {
  const values: unknown[] = [];

  for (const child of getChildElements(element)) {
    values.push(evaluateExpression(child, variables));
  }

  if (values.length >= 2) {
    return deepEqual(values[0], values[1]);
  }

  return false;
}

/**
 * Evaluate qti-equal
 */
function evaluateEqual(element: Element, variables: Record<string, unknown>): boolean {
  return evaluateMatch(element, variables);
}

/**
 * Evaluate qti-lt
 */
function evaluateLessThan(element: Element, variables: Record<string, unknown>): boolean {
  const values: number[] = [];

  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (typeof value !== 'number') {
      throw new Error(`Expected number value in <qti-lt>, got ${typeof value}`);
    }
    values.push(value);
  }

  return values.length >= 2 ? values[0] < values[1] : false;
}

/**
 * Evaluate qti-gt
 */
function evaluateGreaterThan(element: Element, variables: Record<string, unknown>): boolean {
  const values: number[] = [];

  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (typeof value !== 'number') {
      throw new Error(`Expected number value in <qti-gt>, got ${typeof value}`);
    }
    values.push(value);
  }

  return values.length >= 2 ? values[0] > values[1] : false;
}

/**
 * Evaluate qti-lte
 */
function evaluateLessThanOrEqual(element: Element, variables: Record<string, unknown>): boolean {
  const values: number[] = [];

  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (typeof value !== 'number') {
      throw new Error(`Expected number value in <qti-lte>, got ${typeof value}`);
    }
    values.push(value);
  }

  return values.length >= 2 ? values[0] <= values[1] : false;
}

/**
 * Evaluate qti-gte
 */
function evaluateGreaterThanOrEqual(element: Element, variables: Record<string, unknown>): boolean {
  const values: number[] = [];

  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (typeof value !== 'number') {
      throw new Error(`Expected number value in <qti-gte>, got ${typeof value}`);
    }
    values.push(value);
  }

  return values.length >= 2 ? values[0] >= values[1] : false;
}

/**
 * Evaluate qti-and
 */
function evaluateAnd(element: Element, variables: Record<string, unknown>): boolean {
  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (typeof value !== 'boolean') {
      throw new Error(`Expected boolean value in <qti-and>, got ${typeof value}`);
    }
    if (!value) {
      return false;
    }
  }
  return true;
}

/**
 * Evaluate qti-or
 */
function evaluateOr(element: Element, variables: Record<string, unknown>): boolean {
  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (typeof value !== 'boolean') {
      throw new Error(`Expected boolean value in <qti-or>, got ${typeof value}`);
    }
    if (value) {
      return true;
    }
  }
  return false;
}

/**
 * Evaluate qti-not
 */
function evaluateNot(element: Element, variables: Record<string, unknown>): boolean {
  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (typeof value !== 'boolean') {
      throw new Error(`Expected boolean value in <qti-not>, got ${typeof value}`);
    }
    return !value;
  }
  return false;
}

/**
 * Evaluate qti-index
 */
function evaluateIndex(element: Element, variables: Record<string, unknown>): unknown {
  const n = parseInt(element.getAttribute('n') || '1', 10);

  for (const child of getChildElements(element)) {
    const container = evaluateExpression(child, variables);
    if (!Array.isArray(container)) {
      throw new Error(`Expected array value in <qti-index>, got ${typeof container}`);
    }
    if (n >= 1 && n <= container.length) {
      return container[n - 1]; // 1-indexed in QTI
    }
    return null;
  }
  return null;
}

/**
 * Evaluate qti-contains
 */
function evaluateContains(element: Element, variables: Record<string, unknown>): boolean {
  const values: unknown[] = [];

  for (const child of getChildElements(element)) {
    values.push(evaluateExpression(child, variables));
  }

  if (values.length >= 2) {
    const container = values[0] as unknown[];
    const value = values[1];

    if (Array.isArray(container)) {
      return container.some(item => deepEqual(item, value));
    }
  }

  return false;
}

/**
 * Evaluate qti-member
 */
function evaluateMember(element: Element, variables: Record<string, unknown>): boolean {
  const values: unknown[] = [];

  for (const child of getChildElements(element)) {
    values.push(evaluateExpression(child, variables));
  }

  if (values.length >= 2) {
    const value = values[0];
    const container = values[1] as unknown[];

    if (Array.isArray(container)) {
      return container.some(item => deepEqual(item, value));
    }
  }

  return false;
}

/**
 * Evaluate qti-container-size
 */
function evaluateContainerSize(element: Element, variables: Record<string, unknown>): number {
  for (const child of getChildElements(element)) {
    const container = evaluateExpression(child, variables);
    if (!Array.isArray(container)) {
      throw new Error(`Expected array value in <qti-container-size>, got ${typeof container}`);
    }
    return container.length;
  }
  return 0;
}

/**
 * Evaluate qti-delete
 */
function evaluateDelete(element: Element, variables: Record<string, unknown>): unknown[] {
  const values: unknown[] = [];

  for (const child of getChildElements(element)) {
    values.push(evaluateExpression(child, variables));
  }

  if (values.length >= 2) {
    const container = values[0] as unknown[];
    const valueToDelete = values[1];

    if (Array.isArray(container)) {
      return container.filter(item => !deepEqual(item, valueToDelete));
    }
  }

  return [];
}

/**
 * Evaluate qti-repeat
 */
function evaluateRepeat(element: Element, variables: Record<string, unknown>): unknown[] {
  const numberRepeats = parseInt(element.getAttribute('number-repeats') || '1', 10);
  const result: unknown[] = [];

  const child = getFirstChildElement(element);
  if (!child) {
    throw new Error('Expected child element in <qti-repeat>');
  }
  const value = evaluateExpression(child, variables);
  for (let j = 0; j < numberRepeats; j++) {
    result.push(value);
  }

  return result;
}

/**
 * Evaluate qti-substring
 */
function evaluateSubstring(element: Element, variables: Record<string, unknown>): boolean {
  const caseSensitive = element.getAttribute('case-sensitive') !== 'false';
  const values: string[] = [];

  for (const child of getChildElements(element)) {
    values.push(String(evaluateExpression(child, variables)));
  }

  if (values.length >= 2) {
    const text = caseSensitive ? values[0] : values[0].toLowerCase();
    const substring = caseSensitive ? values[1] : values[1].toLowerCase();
    return text.includes(substring);
  }

  return false;
}

/**
 * Evaluate qti-string-match
 */
function evaluateStringMatch(element: Element, variables: Record<string, unknown>): boolean {
  const caseSensitive = element.getAttribute('case-sensitive') !== 'false';
  const values: string[] = [];

  for (const child of getChildElements(element)) {
    values.push(String(evaluateExpression(child, variables)));
  }

  if (values.length >= 2) {
    const str1 = caseSensitive ? values[0] : values[0].toLowerCase();
    const str2 = caseSensitive ? values[1] : values[1].toLowerCase();
    return str1 === str2;
  }

  return false;
}

/**
 * Evaluate qti-pattern-match
 */
function evaluatePatternMatch(element: Element, variables: Record<string, unknown>): boolean {
  const pattern = element.getAttribute('pattern');
  if (!pattern) return false;

  for (const child of getChildElements(element)) {
    const value = String(evaluateExpression(child, variables));
    const regex = new RegExp(pattern);
    return regex.test(value);
  }

  return false;
}

/**
 * Evaluate qti-integer-to-float
 */
function evaluateIntegerToFloat(element: Element, variables: Record<string, unknown>): number {
  for (const child of getChildElements(element)) {
    const value = evaluateExpression(child, variables);
    if (typeof value !== 'number') {
      throw new Error(`Expected number value in <qti-integer-to-float>, got ${typeof value}`);
    }
    return parseFloat(String(value));
  }
  return 0.0;
}

/**
 * Evaluate qti-any-n
 */
function evaluateAnyN(element: Element, variables: Record<string, unknown>): boolean {
  const min = parseInt(element.getAttribute('min') || '1', 10);
  const max = parseInt(element.getAttribute('max') || String(Number.MAX_SAFE_INTEGER), 10);

  for (const child of getChildElements(element)) {
    const container = evaluateExpression(child, variables);
    if (!Array.isArray(container)) {
      throw new Error(`Expected array value in <qti-any-n>, got ${typeof container}`);
    }
    const trueCount = container.filter(v => v === true).length;
    return trueCount >= min && trueCount <= max;
  }

  return false;
}

/**
 * Evaluate qti-field-value
 */
function evaluateFieldValue(element: Element, variables: Record<string, unknown>): unknown {
  const fieldIdentifier = element.getAttribute('field-identifier');
  if (!fieldIdentifier) return null;

  for (const child of getChildElements(element)) {
    const record = evaluateExpression(child, variables) as Record<string, unknown>;
    if (record && typeof record === 'object' && !Array.isArray(record)) {
      return record[fieldIdentifier] ?? null;
    }
    return null;
  }

  return null;
}

