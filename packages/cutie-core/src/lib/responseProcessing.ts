import { AttemptState, ResponseData } from '../types';
import { getChildElements, getFirstChildElement } from '../utils/dom';
import { normalizePair } from '../utils/typeParser';
import { isAdaptive } from './adaptive';
import {
  evaluateExpression as evaluateExpressionShared,
  type SubEvaluate,
} from './expressionEvaluator/index';
import { getExternalScoredInfo } from './externalScoring';
import {
  compareResponseValues,
  getCorrectResponse,
  getResponseDeclaration,
  mapResponse,
  mapResponsePoint,
} from './responseDeclarations';
import { extractStandardOutcomes } from './scoreUtils';

/**
 * Coerce a submitted response value to match the expected type from the response declaration.
 * This handles string values submitted from text inputs that need to be converted to numbers.
 */
function coerceResponseValue(itemDoc: Document, identifier: string, value: unknown): unknown {
  // If value is null/undefined or already a number, no coercion needed for numeric types
  if (value === null || value === undefined) {
    return value;
  }

  // Find the response declaration to get the base-type
  const baseType = getResponseDeclaration(itemDoc, identifier)?.getAttribute('base-type') ?? null;

  // If no declaration found or no base-type, return value as-is
  if (!baseType) {
    return value;
  }

  // Coerce each member of a multiple or ordered response
  if (Array.isArray(value)) {
    return value.map((member) => coerceResponseValue(itemDoc, identifier, member));
  }

  // Coerce string values to numbers for numeric types, and pairs to canonical form
  if (typeof value === 'string') {
    if (baseType === 'pair') {
      return normalizePair(value);
    }
    if (baseType === 'integer') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? value : parsed;
    }
    if (baseType === 'float') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? value : parsed;
    }
  }

  return value;
}

/**
 * Processes a response submission by executing response processing rules
 * from a QTI assessment item.
 *
 * This function:
 * 1. Updates response variables with submitted values
 * 2. Executes qti-response-processing rules to score the response
 * 3. Updates outcome variables (SCORE, completionStatus, numAttempts, etc.)
 * 4. Returns updated attempt state
 *
 * Response processing runs on every submission during an attempt.
 * Template variables are not modified - they remain constant.
 *
 * @param itemDoc - Parsed QTI assessment item XML document
 * @param submission - Learner's response data (response IDs mapped to values)
 * @param currentState - Current attempt state before this submission
 * @returns Updated attempt state after processing the response
 */
export function processResponse(
  itemDoc: Document,
  submission: ResponseData,
  currentState: AttemptState
): AttemptState {
  // Create a copy of the current state's variables
  const variables: Record<string, unknown> = { ...currentState.variables };

  // The built-in numAttempts counts submissions, from the start of each one
  variables.numAttempts = (typeof variables.numAttempts === 'number' ? variables.numAttempts : 0) + 1;

  // Step 1: Update response variables from submission
  // Coerce string values to appropriate types based on response declarations
  for (const [identifier, value] of Object.entries(submission)) {
    variables[identifier] = coerceResponseValue(itemDoc, identifier, value);
  }

  // Step 2: Execute response processing rules
  const responseProcessing = itemDoc.getElementsByTagName('qti-response-processing')[0];

  if (responseProcessing) {
    const template = responseProcessing.getAttribute('template');

    if (template) {
      // Use standard template
      executeResponseTemplate(template, itemDoc, variables);
    } else {
      // Execute inline response processing rules
      for (const child of getChildElements(responseProcessing)) {
        executeResponseRule(child, itemDoc, variables);
      }
    }
  }

  // Step 3: Return updated state
  // An adaptive item decides when it is complete (QTI: it must maintain
  // completionStatus); any other item is complete after every submission,
  // whatever its response processing sets
  const score = extractStandardOutcomes(variables, itemDoc);
  const completionStatus = isAdaptive(itemDoc) && variables.completionStatus === 'incomplete'
    ? 'incomplete'
    : 'completed';

  const externalInfo = getExternalScoredInfo(itemDoc, variables);

  return {
    variables,
    completionStatus,
    score,
    // Delivery options are fixed for the life of the attempt
    options: currentState.options,
    // Tries are counted once the submission's turn ends (see endTry)
    triesRemaining: currentState.triesRemaining,
    // Preserve shuffle orders from input state
    ...(currentState.shuffleOrders && { shuffleOrders: currentState.shuffleOrders }),
    // Signal that external scoring is needed
    ...(externalInfo && { pendingManualScoring: { maxScore: externalInfo.maxScore } }),
  };
}

/**
 * Execute a standard response processing template
 */
function executeResponseTemplate(
  templateUrl: string,
  itemDoc: Document,
  variables: Record<string, unknown>
): void {
  // Normalize template URL to get the template name
  const templateName = templateUrl.split('/').pop()?.replace('.xml', '') || '';

  switch (templateName) {
    case 'match_correct':
    case 'CC2_match_basic':
    case 'CC2_match':
      executeMatchCorrectTemplate(itemDoc, variables);
      break;
    case 'map_response':
    case 'CC2_map_response':
      executeMapResponseTemplate(itemDoc, variables);
      break;
    case 'map_response_point':
      executeMapResponsePointTemplate(itemDoc, variables);
      break;
    default:
      throw new Error(`Unknown response processing template: ${templateName}`);
  }
}

/**
 * Execute MATCH CORRECT template
 * Sets SCORE to 1 if RESPONSE matches correct value, 0 otherwise
 *
 * For formula responses (data-response-type="formula"), uses Compute Engine
 * for mathematical comparison based on the data-comparison-mode attribute.
 *
 * Note: Per QTI spec, match_correct only works with single interactions
 * using the identifier "RESPONSE". Composite items (multiple interactions)
 * require custom response processing.
 */
function executeMatchCorrectTemplate(itemDoc: Document, variables: Record<string, unknown>): void {
  const responseValue = variables['RESPONSE'];
  const correctValue = getCorrectResponse(itemDoc, 'RESPONSE', variables);

  if (compareResponseValues(itemDoc, 'RESPONSE', responseValue, correctValue)) {
    variables['SCORE'] = 1;
  } else {
    variables['SCORE'] = 0;
  }
}

/**
 * Execute MAP RESPONSE template
 * Maps RESPONSE value(s) to SCORE using the mapping declaration
 * If RESPONSE is null, sets SCORE to 0.0
 */
function executeMapResponseTemplate(itemDoc: Document, variables: Record<string, unknown>): void {
  variables['SCORE'] = mapResponse(itemDoc, 'RESPONSE', variables);
}

/**
 * Execute MAP RESPONSE POINT template
 * Maps point RESPONSE value(s) to SCORE using area mapping
 * If RESPONSE is null, sets SCORE to 0
 */
function executeMapResponsePointTemplate(itemDoc: Document, variables: Record<string, unknown>): void {
  variables['SCORE'] = mapResponsePoint(itemDoc, 'RESPONSE', variables);
}

/**
 * Execute a response processing rule
 */
function executeResponseRule(
  rule: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): void {
  const localName = rule.localName;

  switch (localName) {
    case 'qti-set-outcome-value':
      executeSetOutcomeValue(rule, itemDoc, variables);
      break;
    case 'qti-response-condition':
      executeResponseCondition(rule, itemDoc, variables);
      break;
    case 'qti-exit-response':
      throw new ExitResponseError();
  }
}

/**
 * Execute qti-set-outcome-value
 */
function executeSetOutcomeValue(
  rule: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): void {
  const identifier = rule.getAttribute('identifier');
  if (!identifier) return;

  // Evaluate the expression (first child element)
  const child = getFirstChildElement(rule);
  if (!child) {
    throw new Error('Expected child element in <qti-set-outcome-value>');
  }
  const value = evaluateExpression(child, itemDoc, variables);
  variables[identifier] = value;
}

/**
 * Execute qti-response-condition
 */
function executeResponseCondition(
  rule: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): void {
  // Find response-if, response-else-if, and response-else elements
  for (const child of getChildElements(rule)) {
    const localName = child.localName;

    if (localName === 'qti-response-if') {
      if (evaluateResponseIf(child, itemDoc, variables)) {
        return; // Condition was true, stop processing
      }
    } else if (localName === 'qti-response-else-if') {
      if (evaluateResponseIf(child, itemDoc, variables)) {
        return; // Condition was true, stop processing
      }
    } else if (localName === 'qti-response-else') {
      executeResponseBlock(child, itemDoc, variables);
      return;
    }
  }
}

/**
 * Evaluate a response-if or response-else-if block
 * Returns true if condition was true and block was executed
 */
function evaluateResponseIf(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): boolean {
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
        executeResponseRule(child, itemDoc, variables);
      }
    }
  }

  return conditionResult;
}

/**
 * Execute all rules in a response block (used for response-else)
 */
function executeResponseBlock(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): void {
  for (const child of getChildElements(element)) {
    executeResponseRule(child, itemDoc, variables);
  }
}

/**
 * Evaluate an expression in response processing context
 */
function evaluateExpression(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>
): unknown {
  const subEvaluate: SubEvaluate = (el: Element, doc: Document, vars: Record<string, unknown>) =>
    evaluateExpression(el, doc, vars);

  const localName = element.localName;

  switch (localName) {
    // Response-specific operators
    case 'qti-correct':
      return evaluateCorrect(element, itemDoc, variables);
    case 'qti-map-response':
      return evaluateMapResponse(element, itemDoc, variables, subEvaluate);
    case 'qti-map-response-point':
      return evaluateMapResponsePoint(element, itemDoc, variables, subEvaluate);

    // Fall through to shared evaluator for all other operators
    default:
      return evaluateExpressionShared(element, itemDoc, variables, subEvaluate);
  }
}

// Expression evaluators

function evaluateCorrect(element: Element, itemDoc: Document, variables: Record<string, unknown>): unknown {
  const identifier = element.getAttribute('identifier');
  if (!identifier) return null;

  return getCorrectResponse(itemDoc, identifier, variables);
}

function evaluateMapResponse(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  _subEvaluate: SubEvaluate
): number {
  return mapResponse(itemDoc, element.getAttribute('identifier') || 'RESPONSE', variables);
}

function evaluateMapResponsePoint(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  _subEvaluate: SubEvaluate
): number {
  return mapResponsePoint(itemDoc, element.getAttribute('identifier') || 'RESPONSE', variables);
}

/**
 * Custom error thrown when exit-response is encountered
 */
class ExitResponseError extends Error {
  constructor() {
    super('Exit response');
    this.name = 'ExitResponseError';
  }
}

