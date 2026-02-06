/**
 * Container operators
 */

import { getChildElements } from '../../utils/dom';
import { deepEqual } from '../../utils/equality';
import type { SubEvaluate } from './types';

/**
 * Evaluate qti-multiple element (unordered container)
 */
export function evaluateMultiple(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): unknown[] {
  const values: unknown[] = [];

  for (const child of getChildElements(element)) {
    const value = subEvaluate(child, itemDoc, variables);
    if (Array.isArray(value)) {
      values.push(...value);
    } else {
      values.push(value);
    }
  }

  return values;
}

/**
 * Evaluate qti-ordered element (ordered container)
 */
export function evaluateOrdered(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): unknown[] {
  return evaluateMultiple(element, itemDoc, variables, subEvaluate);
}

/**
 * Evaluate qti-container-size element
 */
export function evaluateContainerSize(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): number {
  for (const child of getChildElements(element)) {
    const container = subEvaluate(child, itemDoc, variables);
    if (!Array.isArray(container)) {
      throw new Error(`Expected array value in <qti-container-size>, got ${typeof container}`);
    }
    return container.length;
  }
  return 0;
}

/**
 * Evaluate qti-repeat element
 */
export function evaluateRepeat(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): unknown[] {
  const numberRepeats = parseInt(element.getAttribute('number-repeats') || '1', 10);
  const result: unknown[] = [];

  const children = Array.from(getChildElements(element));
  if (children.length !== 1) {
    throw new Error('<qti-repeat> requires exactly 1 child element');
  }

  const value = subEvaluate(children[0], itemDoc, variables);
  for (let j = 0; j < numberRepeats; j++) {
    result.push(value);
  }

  return result;
}

/**
 * Evaluate qti-delete element
 *
 * Per QTI spec: The first sub-expression must have single cardinality (value to delete)
 * and the second must be a multiple or ordered container. The result is a new container
 * derived from the second sub-expression with all instances of the first sub-expression removed.
 */
export function evaluateDelete(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): unknown[] {
  const values: unknown[] = [];

  for (const child of getChildElements(element)) {
    values.push(subEvaluate(child, itemDoc, variables));
  }

  if (values.length >= 2) {
    const valueToDelete = values[0];
    const container = values[1] as unknown[];

    if (Array.isArray(container)) {
      return container.filter(item => !deepEqual(item, valueToDelete));
    }
  }

  return [];
}

/**
 * Evaluate qti-member element
 */
export function evaluateMember(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  const children = Array.from(getChildElements(element));
  if (children.length !== 2) {
    throw new Error('<qti-member> requires exactly 2 operands');
  }

  const value = subEvaluate(children[0], itemDoc, variables);
  const container = subEvaluate(children[1], itemDoc, variables);

  if (!Array.isArray(container)) {
    throw new Error(`Expected array value in <qti-member>, got ${typeof container}`);
  }

  return container.some(item => deepEqual(item, value));
}

/**
 * Evaluate qti-contains element
 */
export function evaluateContains(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): boolean {
  const children = Array.from(getChildElements(element));
  if (children.length !== 2) {
    throw new Error('<qti-contains> requires exactly 2 operands');
  }

  const container = subEvaluate(children[0], itemDoc, variables);
  const value = subEvaluate(children[1], itemDoc, variables);

  if (!Array.isArray(container)) {
    throw new Error(`Expected array value in <qti-contains>, got ${typeof container}`);
  }

  return container.some(item => deepEqual(item, value));
}

/**
 * Evaluate qti-index element
 */
export function evaluateIndex(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): unknown {
  const n = parseInt(element.getAttribute('n') || '1', 10);
  const children = Array.from(getChildElements(element));

  if (children.length !== 1) {
    throw new Error('<qti-index> requires exactly 1 child element');
  }

  const container = subEvaluate(children[0], itemDoc, variables);

  if (!Array.isArray(container)) {
    throw new Error(`Expected array value in <qti-index>, got ${typeof container}`);
  }

  // QTI indices are 1-based
  const index = n - 1;
  if (index < 0 || index >= container.length) {
    return null;
  }

  return container[index];
}
