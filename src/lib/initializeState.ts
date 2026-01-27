import { AttemptState } from '../types';
import { getChildElements, getFirstChildElement } from '../utils/dom';
import { parseValue } from '../utils/typeParser';
import { deriveMaxScore } from './deriveMaxScore';
import {
  evaluateExpression as evaluateExpressionShared,
  type SubEvaluate,
} from './expressionEvaluator/index';

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

  const { score, maxScore } = extractStandardOutcomes(variables, itemDoc);

  return {
    variables,
    completionStatus: 'not_attempted',
    score,
    maxScore
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
      executeTemplateRule(child, itemDoc, variables);
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
function executeTemplateRule(rule: Element, itemDoc: Document, variables: Record<string, unknown>): void {
  const localName = rule.localName;

  switch (localName) {
    case 'qti-set-template-value':
      executeSetTemplateValue(rule, itemDoc, variables);
      break;
    case 'qti-template-condition':
      executeTemplateCondition(rule, itemDoc, variables);
      break;
    case 'qti-template-constraint':
      executeTemplateConstraint(rule, itemDoc, variables);
      break;
    case 'qti-exit-template':
      throw new ExitTemplateError();
    case 'qti-set-correct-response':
      executeSetCorrectResponse(rule, itemDoc, variables);
      break;
    case 'qti-set-default-value':
      executeSetDefaultValue(rule, itemDoc, variables);
      break;
  }
}

/**
 * Execute qti-set-template-value rule
 */
function executeSetTemplateValue(rule: Element, itemDoc: Document, variables: Record<string, unknown>): void {
  const identifier = rule.getAttribute('identifier');
  if (!identifier) return;

  // Evaluate the expression (first child element)
  const child = getFirstChildElement(rule);
  if (!child) {
    throw new Error('Expected child element in <qti-set-template-value>');
  }
  const value = evaluateExpression(child, itemDoc, variables);
  variables[identifier] = value;
}

/**
 * Execute qti-template-condition rule
 */
function executeTemplateCondition(rule: Element, itemDoc: Document, variables: Record<string, unknown>): void {
  // Find template-if, template-else-if, and template-else elements
  for (const child of getChildElements(rule)) {
    const localName = child.localName;

    if (localName === 'qti-template-if') {
      if (evaluateTemplateIf(child, itemDoc, variables)) {
        return;
      }
    } else if (localName === 'qti-template-else-if') {
      if (evaluateTemplateIf(child, itemDoc, variables)) {
        return;
      }
    } else if (localName === 'qti-template-else') {
      executeTemplateBlock(child, itemDoc, variables);
      return;
    }
  }
}

/**
 * Evaluate a template-if or template-else-if block
 * Returns true if the condition was true and the block was executed
 */
function evaluateTemplateIf(element: Element, itemDoc: Document, variables: Record<string, unknown>): boolean {
  // First child is the condition expression
  // Remaining children are the rules to execute
  let conditionResult = false;
  let conditionEvaluated = false;

  for (const child of getChildElements(element)) {
    if (!conditionEvaluated) {
      // This is the condition expression
      const value = evaluateExpression(child, itemDoc, variables);
      if (typeof value !== 'boolean') {
        throw new Error(`Expected boolean value in <${element.localName}> condition, got ${typeof value}`);
      }
      conditionResult = value;
      conditionEvaluated = true;
    } else {
      // These are the rules to execute if condition is true
      if (conditionResult) {
        executeTemplateRule(child, itemDoc, variables);
      }
    }
  }

  return conditionResult;
}

/**
 * Execute all rules in a template block (used for template-else)
 */
function executeTemplateBlock(element: Element, itemDoc: Document, variables: Record<string, unknown>): void {
  for (const child of getChildElements(element)) {
    executeTemplateRule(child, itemDoc, variables);
  }
}

/**
 * Execute qti-template-constraint rule
 */
function executeTemplateConstraint(rule: Element, itemDoc: Document, variables: Record<string, unknown>): void {
  // Evaluate the constraint expression (first child element)
  const child = getFirstChildElement(rule);
  if (!child) {
    throw new Error('Expected child element in <qti-template-constraint>');
  }
  const result = evaluateExpression(child, itemDoc, variables);
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
function executeSetCorrectResponse(rule: Element, itemDoc: Document, variables: Record<string, unknown>): void {
  const identifier = rule.getAttribute('identifier');
  if (!identifier) return;

  // Store the correct response value for later comparison
  // We'll store it with a special prefix to distinguish from actual response values
  const child = getFirstChildElement(rule);
  if (!child) {
    throw new Error('Expected child element in <qti-set-correct-response>');
  }
  const value = evaluateExpression(child, itemDoc, variables);
  variables[`__correct_${identifier}`] = value;
}

/**
 * Execute qti-set-default-value rule
 */
function executeSetDefaultValue(rule: Element, itemDoc: Document, variables: Record<string, unknown>): void {
  const identifier = rule.getAttribute('identifier');
  if (!identifier) return;

  // Set the default value for an outcome variable
  const child = getFirstChildElement(rule);
  if (!child) {
    throw new Error('Expected child element in <qti-set-default-value>');
  }
  const value = evaluateExpression(child, itemDoc, variables);
  variables[identifier] = value;
}

/**
 * Evaluate an expression and return its value
 */
function evaluateExpression(element: Element, itemDoc: Document, variables: Record<string, unknown>): unknown {
  const subEvaluate: SubEvaluate = (el: Element, doc: Document, vars: Record<string, unknown>) =>
    evaluateExpression(el, doc, vars);

  const localName = element.localName;

  switch (localName) {
    // Template-specific operators (randomization only)
    case 'qti-random':
      return evaluateRandom(element, itemDoc, variables, subEvaluate);
    case 'qti-random-integer':
      return evaluateRandomInteger(element);
    case 'qti-random-float':
      return evaluateRandomFloat(element);

    // Fall through to shared evaluator for all other operators
    default:
      return evaluateExpressionShared(element, itemDoc, variables, subEvaluate);
  }
}


/**
 * Evaluate qti-record (template-specific)
 */
function evaluateRandom(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): unknown {
  // Get the container (first child element)
  for (const child of getChildElements(element)) {
    const container = subEvaluate(child, itemDoc, variables);
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

function extractStandardOutcomes(
  variables: Record<string, unknown>,
  itemDoc: Document
): { score: number | null; maxScore: number | null } {
  // Extract SCORE
  const scoreValue = variables['SCORE'];
  const score = typeof scoreValue === 'number' ? scoreValue : null;

  // Derive MAXSCORE using shared function
  const maxScore = deriveMaxScore(itemDoc, variables);

  return { score, maxScore };
}

