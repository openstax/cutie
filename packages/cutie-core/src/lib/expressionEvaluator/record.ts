/**
 * Record operators
 */

import { getChildElements } from '../../utils/dom';
import type { SubEvaluate } from './types';

/**
 * Evaluate qti-record element
 */
export function evaluateRecord(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): Record<string, unknown> {
  const record: Record<string, unknown> = {};

  const fieldElements = element.getElementsByTagName('qti-field-value');

  for (let i = 0; i < fieldElements.length; i++) {
    const fieldElement = fieldElements[i];
    const fieldIdentifier = fieldElement.getAttribute('field-identifier');
    if (!fieldIdentifier) continue;

    const children = Array.from(getChildElements(fieldElement));
    if (children.length !== 1) {
      throw new Error('Expected exactly 1 child element in <qti-field-value>');
    }
    record[fieldIdentifier] = subEvaluate(children[0], itemDoc, variables);
  }

  return record;
}

/**
 * Evaluate qti-field-value element
 */
export function evaluateFieldValue(
  element: Element,
  itemDoc: Document,
  variables: Record<string, unknown>,
  subEvaluate: SubEvaluate
): unknown {
  const fieldIdentifier = element.getAttribute('field-identifier');
  if (!fieldIdentifier) return null;

  for (const child of getChildElements(element)) {
    const record = subEvaluate(child, itemDoc, variables) as Record<string, unknown>;
    if (record && typeof record === 'object' && !Array.isArray(record)) {
      return record[fieldIdentifier] ?? null;
    }
    return null;
  }

  return null;
}
