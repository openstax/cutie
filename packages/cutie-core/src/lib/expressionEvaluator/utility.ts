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

/**
 * Evaluate qti-random element
 * Selects a random value from a container (multiple or ordered)
 */
export function evaluateRandom(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): unknown {
  for (const child of getChildElements(element)) {
    const container = subEvaluate(child, itemDoc, variables);
    if (!Array.isArray(container)) {
      throw new Error(`Expected array value in <qti-random>, got ${typeof container}`);
    }
    if (container.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * container.length);
    return container[randomIndex];
  }
  return null;
}

/**
 * Evaluate qti-random-integer element
 * Returns a random integer between min and max (inclusive), stepping by step
 */
export function evaluateRandomInteger(element: Element): number {
  const min = parseInt(element.getAttribute('min') || '0', 10);
  const max = parseInt(element.getAttribute('max') || '1', 10);
  const step = parseInt(element.getAttribute('step') || '1', 10);

  const range = Math.floor((max - min) / step) + 1;
  const randomStep = Math.floor(Math.random() * range);

  return min + randomStep * step;
}

/**
 * Evaluate qti-random-float element
 * Returns a random float between min and max
 */
export function evaluateRandomFloat(element: Element): number {
  const min = parseFloat(element.getAttribute('min') || '0');
  const max = parseFloat(element.getAttribute('max') || '1');

  return min + Math.random() * (max - min);
}
