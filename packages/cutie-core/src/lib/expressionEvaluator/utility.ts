/**
 * Utility operators (type conversion, boolean checks, etc.)
 */

import { getChildElements } from '../../utils/dom';
import type { SubEvaluate } from './types';

/**
 * Evaluate qti-integer-to-float element
 */
export function evaluateIntegerToFloat(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): number {
  for (const child of getChildElements(element)) {
    const value = subEvaluate(child, itemDoc, variables);
    if (typeof value !== 'number') {
      throw new Error(`Expected number value in <qti-integer-to-float>, got ${typeof value}`);
    }
    return parseFloat(String(value));
  }
  return 0.0;
}

/**
 * Evaluate qti-any-n element
 */
export function evaluateAnyN(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  const min = parseInt(element.getAttribute('min') || '1', 10);
  const max = parseInt(element.getAttribute('max') || String(Number.MAX_SAFE_INTEGER), 10);

  for (const child of getChildElements(element)) {
    const container = subEvaluate(child, itemDoc, variables);
    if (!Array.isArray(container)) {
      throw new Error(`Expected array value in <qti-any-n>, got ${typeof container}`);
    }
    const trueCount = container.filter(v => v === true).length;
    return trueCount >= min && trueCount <= max;
  }

  return false;
}

/**
 * Evaluate qti-is-null element
 */
export function evaluateIsNull(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  for (const child of getChildElements(element)) {
    const value = subEvaluate(child, itemDoc, variables);
    return value === null || value === undefined;
  }
  return true;
}
