/**
 * Shared expression evaluator for QTI expression evaluation
 *
 * This module contains common operators used by both template processing
 * (initializeState) and response processing contexts.
 */

// Import all operator handlers
import {
  evaluateDivide,
  evaluateIntegerDivide,
  evaluateIntegerModulus,
  evaluatePower,
  evaluateProduct,
  evaluateRound,
  evaluateSubtract,
  evaluateSum,
  evaluateTruncate,
} from './arithmetic';
import { evaluateBaseValue, evaluateVariable } from './base';
import {
  evaluateEqual,
  evaluateGreaterThan,
  evaluateGreaterThanOrEqual,
  evaluateLessThan,
  evaluateLessThanOrEqual,
  evaluateMatch,
} from './comparison';
import {
  evaluateContainerSize,
  evaluateContains,
  evaluateDelete,
  evaluateIndex,
  evaluateMember,
  evaluateMultiple,
  evaluateOrdered,
  evaluateRepeat,
} from './containers';
import { evaluateAnd, evaluateNot, evaluateOr } from './logical';
import { evaluateFieldValue, evaluateRecord } from './record';
import { evaluatePatternMatch, evaluateStringMatch, evaluateSubstring } from './string';
import type { SubEvaluate } from './types';
import { evaluateAnyN, evaluateIntegerToFloat, evaluateIsNull } from './utility';

// Export types
export type { SubEvaluate } from './types';

/**
 * Evaluate a QTI expression element
 *
 * This function handles common operators shared across template and response processing.
 * Domain-specific operators should be handled in their respective contexts before
 * falling through to this evaluator.
 *
 * @param element - The QTI expression element to evaluate
 * @param itemDoc - The item document (for DOM queries)
 * @param variables - Current variable bindings
 * @param subEvaluate - Recursive evaluation callback for child expressions
 * @returns The evaluated value
 * @throws Error if the operator is not recognized
 */
export function evaluateExpression(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): unknown {
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
      return evaluateMultiple(element, itemDoc, variables, subEvaluate);
    case 'qti-ordered':
      return evaluateOrdered(element, itemDoc, variables, subEvaluate);
    case 'qti-container-size':
      return evaluateContainerSize(element, itemDoc, variables, subEvaluate);
    case 'qti-repeat':
      return evaluateRepeat(element, itemDoc, variables, subEvaluate);
    case 'qti-delete':
      return evaluateDelete(element, itemDoc, variables, subEvaluate);
    case 'qti-member':
      return evaluateMember(element, itemDoc, variables, subEvaluate);
    case 'qti-contains':
      return evaluateContains(element, itemDoc, variables, subEvaluate);
    case 'qti-index':
      return evaluateIndex(element, itemDoc, variables, subEvaluate);

    // Arithmetic operators
    case 'qti-sum':
      return evaluateSum(element, itemDoc, variables, subEvaluate);
    case 'qti-product':
      return evaluateProduct(element, itemDoc, variables, subEvaluate);
    case 'qti-subtract':
      return evaluateSubtract(element, itemDoc, variables, subEvaluate);
    case 'qti-divide':
      return evaluateDivide(element, itemDoc, variables, subEvaluate);
    case 'qti-integer-divide':
      return evaluateIntegerDivide(element, itemDoc, variables, subEvaluate);
    case 'qti-integer-modulus':
      return evaluateIntegerModulus(element, itemDoc, variables, subEvaluate);
    case 'qti-truncate':
      return evaluateTruncate(element, itemDoc, variables, subEvaluate);
    case 'qti-round':
      return evaluateRound(element, itemDoc, variables, subEvaluate);
    case 'qti-power':
      return evaluatePower(element, itemDoc, variables, subEvaluate);

    // Logical operators
    case 'qti-and':
      return evaluateAnd(element, itemDoc, variables, subEvaluate);
    case 'qti-or':
      return evaluateOr(element, itemDoc, variables, subEvaluate);
    case 'qti-not':
      return evaluateNot(element, itemDoc, variables, subEvaluate);

    // Comparison operators
    case 'qti-lt':
      return evaluateLessThan(element, itemDoc, variables, subEvaluate);
    case 'qti-gt':
      return evaluateGreaterThan(element, itemDoc, variables, subEvaluate);
    case 'qti-lte':
      return evaluateLessThanOrEqual(element, itemDoc, variables, subEvaluate);
    case 'qti-gte':
      return evaluateGreaterThanOrEqual(element, itemDoc, variables, subEvaluate);
    case 'qti-equal':
      return evaluateEqual(element, itemDoc, variables, subEvaluate);
    case 'qti-match':
      return evaluateMatch(element, itemDoc, variables, subEvaluate);

    // String operators
    case 'qti-substring':
      return evaluateSubstring(element, itemDoc, variables, subEvaluate);
    case 'qti-string-match':
      return evaluateStringMatch(element, itemDoc, variables, subEvaluate);
    case 'qti-pattern-match':
      return evaluatePatternMatch(element, itemDoc, variables, subEvaluate);

    // Record operators
    case 'qti-record':
      return evaluateRecord(element, itemDoc, variables, subEvaluate);
    case 'qti-field-value':
      return evaluateFieldValue(element, itemDoc, variables, subEvaluate);

    // Utility operators
    case 'qti-integer-to-float':
      return evaluateIntegerToFloat(element, itemDoc, variables, subEvaluate);
    case 'qti-any-n':
      return evaluateAnyN(element, itemDoc, variables, subEvaluate);
    case 'qti-is-null':
      return evaluateIsNull(element, itemDoc, variables, subEvaluate);

    default:
      throw new Error(`Unsupported expression type: ${localName}`);
  }
}
