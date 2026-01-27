/**
 * Comparison operators
 */

import { getChildElements } from '../../utils/dom';
import { deepEqual, deepEqualUnordered } from '../../utils/equality';
import type { SubEvaluate } from './types';

/**
 * Evaluate qti-lt (less than) element
 */
export function evaluateLessThan(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  const children = Array.from(getChildElements(element));
  if (children.length !== 2) {
    throw new Error('<qti-lt> requires exactly 2 operands');
  }

  const a = subEvaluate(children[0], itemDoc, variables);
  const b = subEvaluate(children[1], itemDoc, variables);

  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error(`Expected number values in <qti-lt>, got ${typeof a} and ${typeof b}`);
  }

  return a < b;
}

/**
 * Evaluate qti-gt (greater than) element
 */
export function evaluateGreaterThan(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  const children = Array.from(getChildElements(element));
  if (children.length !== 2) {
    throw new Error('<qti-gt> requires exactly 2 operands');
  }

  const a = subEvaluate(children[0], itemDoc, variables);
  const b = subEvaluate(children[1], itemDoc, variables);

  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error(`Expected number values in <qti-gt>, got ${typeof a} and ${typeof b}`);
  }

  return a > b;
}

/**
 * Evaluate qti-lte (less than or equal) element
 */
export function evaluateLessThanOrEqual(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  const children = Array.from(getChildElements(element));
  if (children.length !== 2) {
    throw new Error('<qti-lte> requires exactly 2 operands');
  }

  const a = subEvaluate(children[0], itemDoc, variables);
  const b = subEvaluate(children[1], itemDoc, variables);

  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error(`Expected number values in <qti-lte>, got ${typeof a} and ${typeof b}`);
  }

  return a <= b;
}

/**
 * Evaluate qti-gte (greater than or equal) element
 */
export function evaluateGreaterThanOrEqual(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  const children = Array.from(getChildElements(element));
  if (children.length !== 2) {
    throw new Error('<qti-gte> requires exactly 2 operands');
  }

  const a = subEvaluate(children[0], itemDoc, variables);
  const b = subEvaluate(children[1], itemDoc, variables);

  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error(`Expected number values in <qti-gte>, got ${typeof a} and ${typeof b}`);
  }

  return a >= b;
}

/**
 * Evaluate qti-equal element
 */
export function evaluateEqual(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  const children = Array.from(getChildElements(element));
  if (children.length !== 2) {
    throw new Error('<qti-equal> requires exactly 2 operands');
  }

  const a = subEvaluate(children[0], itemDoc, variables);
  const b = subEvaluate(children[1], itemDoc, variables);

  // For numeric values, use numeric comparison
  if (typeof a === 'number' && typeof b === 'number') {
    const tolerance = element.getAttribute('tolerance-mode');
    if (tolerance === 'exact' || !tolerance) {
      return a === b;
    }
    // TODO: Implement other tolerance modes (absolute, relative)
    return a === b;
  }

  // For other types, use deep equality
  return deepEqual(a, b);
}

/**
 * Evaluate qti-match element
 *
 * This uses the enhanced version from responseProcessing that detects qti-multiple
 * containers and uses the appropriate equality function (ordered vs unordered).
 * Since qti-multiple is valid in both template and response contexts, this works for both.
 */
export function evaluateMatch(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  const values: unknown[] = [];
  const childElements: Element[] = [];

  for (const child of getChildElements(element)) {
    childElements.push(child);
    values.push(subEvaluate(child, itemDoc, variables));
  }

  if (values.length >= 2) {
    // Check if either value comes from a qti-multiple container (unordered)
    const isFirstMultiple = childElements[0]?.localName === 'qti-multiple';
    const isSecondMultiple = childElements[1]?.localName === 'qti-multiple';

    // If either is explicitly multiple (unordered), use unordered comparison
    if (isFirstMultiple || isSecondMultiple) {
      return deepEqualUnordered(values[0], values[1]);
    }

    return deepEqual(values[0], values[1]);
  }

  return false;
}
