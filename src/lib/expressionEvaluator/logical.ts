/**
 * Logical operators
 */

import { getChildElements } from '../../utils/dom';
import type { SubEvaluate } from './types';

/**
 * Evaluate qti-and element
 */
export function evaluateAnd(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  for (const child of getChildElements(element)) {
    const value = subEvaluate(child, itemDoc, variables);
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
 * Evaluate qti-or element
 */
export function evaluateOr(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  for (const child of getChildElements(element)) {
    const value = subEvaluate(child, itemDoc, variables);
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
 * Evaluate qti-not element
 */
export function evaluateNot(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  const children = Array.from(getChildElements(element));
  if (children.length !== 1) {
    throw new Error('<qti-not> requires exactly 1 operand');
  }

  const value = subEvaluate(children[0], itemDoc, variables);
  if (typeof value !== 'boolean') {
    throw new Error(`Expected boolean value in <qti-not>, got ${typeof value}`);
  }

  return !value;
}
