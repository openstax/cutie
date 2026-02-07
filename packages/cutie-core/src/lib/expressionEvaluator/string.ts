/**
 * String operators
 */

import { getChildElements } from '../../utils/dom';
import { stringEquals, stringIncludes } from '../../utils/equality';
import type { SubEvaluate } from './types';

/**
 * Evaluate qti-substring element
 */
export function evaluateSubstring(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  const caseSensitive = element.getAttribute('case-sensitive') === 'true';
  const values: string[] = [];

  for (const child of getChildElements(element)) {
    values.push(String(subEvaluate(child, itemDoc, variables)));
  }

  if (values.length >= 2) {
    return stringIncludes(values[0], values[1], caseSensitive);
  }

  return false;
}

/**
 * Evaluate qti-string-match element
 */
export function evaluateStringMatch(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  const caseSensitive = element.getAttribute('case-sensitive') === 'true';
  const values: string[] = [];

  for (const child of getChildElements(element)) {
    values.push(String(subEvaluate(child, itemDoc, variables)));
  }

  if (values.length >= 2) {
    return stringEquals(values[0], values[1], caseSensitive);
  }

  return false;
}

/**
 * Evaluate qti-pattern-match element
 */
export function evaluatePatternMatch(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  const pattern = element.getAttribute('pattern');
  if (!pattern) return false;

  for (const child of getChildElements(element)) {
    const value = String(subEvaluate(child, itemDoc, variables));
    const regex = new RegExp(pattern);
    return regex.test(value);
  }

  return false;
}
