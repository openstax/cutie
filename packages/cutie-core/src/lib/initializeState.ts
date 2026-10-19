import { AttemptState, DeliveryOptions } from '../types.js';
import { getChildElements, getFirstChildElement } from '../utils/dom.js';
import { generateShuffleOrder, ShuffleItem } from '../utils/shuffle.js';
import { parseValue } from '../utils/typeParser.js';
import { resolveDeliveryOptions } from './deliveryOptions.js';
import {
  evaluateExpression as evaluateExpressionShared,
  type SubEvaluate,
} from './expressionEvaluator/index.js';
import { resolveMaxTries } from './maxTries.js';
import { extractStandardOutcomes } from './scoreUtils.js';

/**
 * Initializes the attempt state by processing template declarations and
 * template processing rules from a QTI assessment item.
 *
 * This function:
 * 1. Parses qti-template-declaration elements to identify template variables
 * 2. Executes qti-template-processing rules to set initial values (randomization, etc.)
 * 3. Initializes outcome variables to their default values, and the
 *    built-in numAttempts to 0
 * 4. Creates the initial AttemptState with all variables, and the tries the
 *    delivery options allow
 *
 * Template processing only runs once at the beginning of an attempt.
 * Template variables remain constant throughout the attempt.
 *
 * @param itemDoc - Parsed QTI assessment item XML document
 * @param options - Resolved delivery options the attempt begins under
 * @returns Initial attempt state with template and outcome variables
 */
export function initializeState(
  itemDoc: Document,
  options: Required<DeliveryOptions> = resolveDeliveryOptions()
): AttemptState {
  const MAX_CONSTRAINT_RETRIES = 1000; // Prevent infinite loops

  // Execute template processing with constraint retry logic. Each run starts
  // afresh, so nothing a run that failed its constraint set carries over.
  let variables = initialVariables(itemDoc);
  let results: TemplateResults = { correctResponses: {}, defaultValues: {} };
  let retryCount = 0;
  while (retryCount < MAX_CONSTRAINT_RETRIES) {
    try {
      executeTemplateProcessing(itemDoc, variables, results);
      break; // Success, exit retry loop
    } catch (error) {
      if (error instanceof ConstraintViolationError) {
        retryCount++;
        variables = initialVariables(itemDoc);
        results = { correctResponses: {}, defaultValues: {} };
      } else {
        throw error;
      }
    }
  }

  const score = extractStandardOutcomes(variables, itemDoc);

  // Generate shuffle orders for interactions that are shuffled
  const shuffleOrders = initializeShuffleOrders(itemDoc, options.shuffleOverride);
  const triesAllowed = resolveMaxTries(itemDoc, options.maxTries, variables);

  return {
    variables,
    completionStatus: 'not_attempted',
    score,
    options,
    triesAllowed,
    triesUsed: 0,
    triesRemaining: triesAllowed,
    ...(shuffleOrders && { shuffleOrders }),
    ...(Object.keys(results.correctResponses).length > 0 && { correctResponses: results.correctResponses }),
    ...(Object.keys(results.defaultValues).length > 0 && { defaultValues: results.defaultValues }),
  };
}

/**
 * The correct responses and default values template processing sets, which
 * belong to the attempt's state rather than its variables (see
 * AttemptState.correctResponses and AttemptState.defaultValues).
 */
interface TemplateResults {
  correctResponses: Record<string, unknown>;
  defaultValues: Record<string, unknown>;
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
 * Resets outcome variables to their default values, for a fresh try: the
 * declared ones, or those template processing set (see AttemptState.defaultValues).
 */
export function resetOutcomeVariables(
  itemDoc: Document,
  variables: Record<string, unknown>,
  defaultValues: Record<string, unknown> = {}
): void {
  const outcomeDeclarations = itemDoc.getElementsByTagName('qti-outcome-declaration');
  const outcomeIdentifiers: string[] = [];

  for (let i = 0; i < outcomeDeclarations.length; i++) {
    const identifier = outcomeDeclarations[i].getAttribute('identifier');
    if (identifier) {
      outcomeIdentifiers.push(identifier);
      delete variables[identifier];
    }
  }

  initializeOutcomeVariables(itemDoc, variables);

  for (const identifier of outcomeIdentifiers) {
    if (identifier in defaultValues) variables[identifier] = defaultValues[identifier];
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
 * The variables before template processing: outcome defaults, and the
 * built-in numAttempts at 0
 */
function initialVariables(itemDoc: Document): Record<string, unknown> {
  const variables: Record<string, unknown> = {};
  initializeOutcomeVariables(itemDoc, variables);
  variables.numAttempts = 0;
  return variables;
}

/**
 * Execute template processing rules
 */
function executeTemplateProcessing(
  itemDoc: Document,
  variables: Record<string, unknown>,
  results: TemplateResults
): void {
  const templateProcessing = itemDoc.getElementsByTagName('qti-template-processing')[0];

  if (!templateProcessing) {
    return; // No template processing to execute
  }

  try {
    // Execute each child rule in order
    for (const child of getChildElements(templateProcessing)) {
      executeTemplateRule(child, itemDoc, variables, results);
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
function executeTemplateRule(
  rule: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  results: TemplateResults
): void {
  const localName = rule.localName;

  switch (localName) {
    case 'qti-set-template-value':
      executeSetTemplateValue(rule, itemDoc, variables);
      break;
    case 'qti-template-condition':
      executeTemplateCondition(rule, itemDoc, variables, results);
      break;
    case 'qti-template-constraint':
      executeTemplateConstraint(rule, itemDoc, variables);
      break;
    case 'qti-exit-template':
      throw new ExitTemplateError();
    case 'qti-set-correct-response':
      executeSetCorrectResponse(rule, itemDoc, variables, results);
      break;
    case 'qti-set-default-value':
      executeSetDefaultValue(rule, itemDoc, variables, results);
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
function executeTemplateCondition(
  rule: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  results: TemplateResults
): void {
  // Find template-if, template-else-if, and template-else elements
  for (const child of getChildElements(rule)) {
    const localName = child.localName;

    if (localName === 'qti-template-if') {
      if (evaluateTemplateIf(child, itemDoc, variables, results)) {
        return;
      }
    } else if (localName === 'qti-template-else-if') {
      if (evaluateTemplateIf(child, itemDoc, variables, results)) {
        return;
      }
    } else if (localName === 'qti-template-else') {
      executeTemplateBlock(child, itemDoc, variables, results);
      return;
    }
  }
}

/**
 * Evaluate a template-if or template-else-if block
 * Returns true if the condition was true and the block was executed
 */
function evaluateTemplateIf(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  results: TemplateResults
): boolean {
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
        executeTemplateRule(child, itemDoc, variables, results);
      }
    }
  }

  return conditionResult;
}

/**
 * Execute all rules in a template block (used for template-else)
 */
function executeTemplateBlock(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  results: TemplateResults
): void {
  for (const child of getChildElements(element)) {
    executeTemplateRule(child, itemDoc, variables, results);
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
function executeSetCorrectResponse(
  rule: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  results: TemplateResults
): void {
  const identifier = rule.getAttribute('identifier');
  if (!identifier) return;

  const child = getFirstChildElement(rule);
  if (!child) {
    throw new Error('Expected child element in <qti-set-correct-response>');
  }
  results.correctResponses[identifier] = evaluateExpression(child, itemDoc, variables);
}

/**
 * Execute qti-set-default-value rule
 */
function executeSetDefaultValue(
  rule: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  results: TemplateResults
): void {
  const identifier = rule.getAttribute('identifier');
  if (!identifier) return;

  // The variable starts from its default; the default itself is kept for resets
  const child = getFirstChildElement(rule);
  if (!child) {
    throw new Error('Expected child element in <qti-set-default-value>');
  }
  const value = evaluateExpression(child, itemDoc, variables);
  variables[identifier] = value;
  results.defaultValues[identifier] = value;
}

/**
 * Evaluate an expression and return its value
 */
function evaluateExpression(element: Element, itemDoc: Document, variables: Record<string, unknown>): unknown {
  const subEvaluate: SubEvaluate = (el: Element, doc: Document, vars: Record<string, unknown>) =>
    evaluateExpression(el, doc, vars);

  return evaluateExpressionShared(element, itemDoc, variables, subEvaluate);
}

type ShuffleOverride = Required<DeliveryOptions>['shuffleOverride'];

/**
 * Whether an interaction's choices are shuffled, given its shuffle attribute
 * and the attempt's shuffle override.
 */
function shouldShuffle(interaction: Element, shuffleOverride: ShuffleOverride): boolean {
  switch (shuffleOverride) {
    case 'never':
      return false;
    case 'shuffle':
      return interaction.getAttribute('shuffle') !== 'false';
    case 'none':
      return interaction.getAttribute('shuffle') === 'true';
  }
}

/**
 * Initialize shuffle orders for interactions that are shuffled (see shouldShuffle).
 * Returns a record mapping response identifiers to ordered arrays of choice identifiers,
 * or undefined if no shuffled interactions are found.
 */
function initializeShuffleOrders(
  itemDoc: Document,
  shuffleOverride: ShuffleOverride
): Record<string, string[]> | undefined {
  const shuffleOrders: Record<string, string[]> = {};

  // Process choice interactions
  processChoiceInteractions(itemDoc, shuffleOrders, shuffleOverride);

  // Process inline-choice interactions
  processInlineChoiceInteractions(itemDoc, shuffleOrders, shuffleOverride);

  // Process match interactions (has two match sets)
  processMatchInteractions(itemDoc, shuffleOrders, shuffleOverride);

  // Process gap-match interactions
  processGapMatchInteractions(itemDoc, shuffleOrders, shuffleOverride);

  // Return undefined if no shuffle orders were generated
  return Object.keys(shuffleOrders).length > 0 ? shuffleOrders : undefined;
}

/**
 * Process qti-choice-interaction elements for shuffle orders.
 */
function processChoiceInteractions(
  itemDoc: Document,
  shuffleOrders: Record<string, string[]>,
  shuffleOverride: ShuffleOverride
): void {
  const interactions = itemDoc.getElementsByTagName('qti-choice-interaction');

  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i];
    if (!shouldShuffle(interaction, shuffleOverride)) continue;

    const responseId = interaction.getAttribute('response-identifier');
    if (!responseId) continue;

    const choices = interaction.getElementsByTagName('qti-simple-choice');
    const items: ShuffleItem[] = [];

    for (let j = 0; j < choices.length; j++) {
      const choice = choices[j];
      const identifier = choice.getAttribute('identifier');
      if (identifier) {
        items.push({
          identifier,
          fixed: choice.getAttribute('fixed') === 'true',
        });
      }
    }

    if (items.length > 0) {
      shuffleOrders[responseId] = generateShuffleOrder(items);
    }
  }
}

/**
 * Process qti-inline-choice-interaction elements for shuffle orders.
 */
function processInlineChoiceInteractions(
  itemDoc: Document,
  shuffleOrders: Record<string, string[]>,
  shuffleOverride: ShuffleOverride
): void {
  const interactions = itemDoc.getElementsByTagName('qti-inline-choice-interaction');

  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i];
    if (!shouldShuffle(interaction, shuffleOverride)) continue;

    const responseId = interaction.getAttribute('response-identifier');
    if (!responseId) continue;

    const choices = interaction.getElementsByTagName('qti-inline-choice');
    const items: ShuffleItem[] = [];

    for (let j = 0; j < choices.length; j++) {
      const choice = choices[j];
      const identifier = choice.getAttribute('identifier');
      if (identifier) {
        items.push({
          identifier,
          fixed: choice.getAttribute('fixed') === 'true',
        });
      }
    }

    if (items.length > 0) {
      shuffleOrders[responseId] = generateShuffleOrder(items);
    }
  }
}

/**
 * Process qti-match-interaction elements for shuffle orders.
 * Match interactions have two qti-simple-match-set elements, each needs its own shuffle order.
 */
function processMatchInteractions(
  itemDoc: Document,
  shuffleOrders: Record<string, string[]>,
  shuffleOverride: ShuffleOverride
): void {
  const interactions = itemDoc.getElementsByTagName('qti-match-interaction');

  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i];
    if (!shouldShuffle(interaction, shuffleOverride)) continue;

    const responseId = interaction.getAttribute('response-identifier');
    if (!responseId) continue;

    const matchSets = interaction.getElementsByTagName('qti-simple-match-set');

    for (let setIndex = 0; setIndex < matchSets.length; setIndex++) {
      const matchSet = matchSets[setIndex];
      const choices = matchSet.getElementsByTagName('qti-simple-associable-choice');
      const items: ShuffleItem[] = [];

      for (let j = 0; j < choices.length; j++) {
        const choice = choices[j];
        const identifier = choice.getAttribute('identifier');
        if (identifier) {
          items.push({
            identifier,
            fixed: choice.getAttribute('fixed') === 'true',
          });
        }
      }

      if (items.length > 0) {
        // Use RESPONSE_0 for first set, RESPONSE_1 for second set
        shuffleOrders[`${responseId}_${setIndex}`] = generateShuffleOrder(items);
      }
    }
  }
}

/**
 * Process qti-gap-match-interaction elements for shuffle orders.
 * Only the draggable choices (qti-gap-text and qti-gap-img) are shuffled, not the gaps.
 */
function processGapMatchInteractions(
  itemDoc: Document,
  shuffleOrders: Record<string, string[]>,
  shuffleOverride: ShuffleOverride
): void {
  const interactions = itemDoc.getElementsByTagName('qti-gap-match-interaction');

  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i];
    if (!shouldShuffle(interaction, shuffleOverride)) continue;

    const responseId = interaction.getAttribute('response-identifier');
    if (!responseId) continue;

    const items: ShuffleItem[] = [];

    // Collect qti-gap-text elements
    const gapTexts = interaction.getElementsByTagName('qti-gap-text');
    for (let j = 0; j < gapTexts.length; j++) {
      const choice = gapTexts[j];
      const identifier = choice.getAttribute('identifier');
      if (identifier) {
        items.push({
          identifier,
          fixed: choice.getAttribute('fixed') === 'true',
        });
      }
    }

    // Collect qti-gap-img elements
    const gapImgs = interaction.getElementsByTagName('qti-gap-img');
    for (let j = 0; j < gapImgs.length; j++) {
      const choice = gapImgs[j];
      const identifier = choice.getAttribute('identifier');
      if (identifier) {
        items.push({
          identifier,
          fixed: choice.getAttribute('fixed') === 'true',
        });
      }
    }

    if (items.length > 0) {
      shuffleOrders[responseId] = generateShuffleOrder(items);
    }
  }
}

