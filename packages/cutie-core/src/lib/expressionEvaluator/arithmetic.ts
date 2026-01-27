/**
 * Arithmetic operators
 */

import { getChildElements } from '../../utils/dom';
import type { SubEvaluate } from './types';

/**
 * Evaluate qti-sum element
 */
export function evaluateSum(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): number {
  let sum = 0;

  for (const child of getChildElements(element)) {
    const value = subEvaluate(child, itemDoc, variables);
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
 * Evaluate qti-product element
 */
export function evaluateProduct(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): number {
  let product = 1;

  for (const child of getChildElements(element)) {
    const value = subEvaluate(child, itemDoc, variables);
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
 * Evaluate qti-subtract element
 */
export function evaluateSubtract(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): number {
  const children = Array.from(getChildElements(element));
  if (children.length !== 2) {
    throw new Error('<qti-subtract> requires exactly 2 operands');
  }

  const a = subEvaluate(children[0], itemDoc, variables);
  const b = subEvaluate(children[1], itemDoc, variables);

  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error(`Expected number values in <qti-subtract>, got ${typeof a} and ${typeof b}`);
  }

  return a - b;
}

/**
 * Evaluate qti-divide element
 */
export function evaluateDivide(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): number {
  const children = Array.from(getChildElements(element));
  if (children.length !== 2) {
    throw new Error('<qti-divide> requires exactly 2 operands');
  }

  const a = subEvaluate(children[0], itemDoc, variables);
  const b = subEvaluate(children[1], itemDoc, variables);

  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error(`Expected number values in <qti-divide>, got ${typeof a} and ${typeof b}`);
  }

  if (b === 0) {
    throw new Error('Division by zero in <qti-divide>');
  }

  return a / b;
}

/**
 * Evaluate qti-integer-divide element
 */
export function evaluateIntegerDivide(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): number {
  const children = Array.from(getChildElements(element));
  if (children.length !== 2) {
    throw new Error('<qti-integer-divide> requires exactly 2 operands');
  }

  const a = subEvaluate(children[0], itemDoc, variables);
  const b = subEvaluate(children[1], itemDoc, variables);

  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error(`Expected number values in <qti-integer-divide>, got ${typeof a} and ${typeof b}`);
  }

  if (b === 0) {
    throw new Error('Division by zero in <qti-integer-divide>');
  }

  return Math.floor(a / b);
}

/**
 * Evaluate qti-integer-modulus element
 */
export function evaluateIntegerModulus(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): number {
  const children = Array.from(getChildElements(element));
  if (children.length !== 2) {
    throw new Error('<qti-integer-modulus> requires exactly 2 operands');
  }

  const a = subEvaluate(children[0], itemDoc, variables);
  const b = subEvaluate(children[1], itemDoc, variables);

  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error(`Expected number values in <qti-integer-modulus>, got ${typeof a} and ${typeof b}`);
  }

  if (b === 0) {
    throw new Error('Division by zero in <qti-integer-modulus>');
  }

  return a % b;
}

/**
 * Evaluate qti-truncate element
 */
export function evaluateTruncate(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): number {
  const children = Array.from(getChildElements(element));
  if (children.length !== 1) {
    throw new Error('<qti-truncate> requires exactly 1 operand');
  }

  const value = subEvaluate(children[0], itemDoc, variables);
  if (typeof value !== 'number') {
    throw new Error(`Expected number value in <qti-truncate>, got ${typeof value}`);
  }

  return Math.trunc(value);
}

/**
 * Evaluate qti-round element
 */
export function evaluateRound(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): number {
  const children = Array.from(getChildElements(element));
  if (children.length !== 1) {
    throw new Error('<qti-round> requires exactly 1 operand');
  }

  const value = subEvaluate(children[0], itemDoc, variables);
  if (typeof value !== 'number') {
    throw new Error(`Expected number value in <qti-round>, got ${typeof value}`);
  }

  return Math.round(value);
}

/**
 * Evaluate qti-power element
 */
export function evaluatePower(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): number {
  const children = Array.from(getChildElements(element));
  if (children.length !== 2) {
    throw new Error('<qti-power> requires exactly 2 operands');
  }

  const base = subEvaluate(children[0], itemDoc, variables);
  const exponent = subEvaluate(children[1], itemDoc, variables);

  if (typeof base !== 'number' || typeof exponent !== 'number') {
    throw new Error(`Expected number values in <qti-power>, got ${typeof base} and ${typeof exponent}`);
  }

  return Math.pow(base, exponent);
}
