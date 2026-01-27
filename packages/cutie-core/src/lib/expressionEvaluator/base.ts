/**
 * Base value and variable operators
 */

import { parseValue } from '../../utils/typeParser';

/**
 * Evaluate qti-base-value element
 */
export function evaluateBaseValue(element: Element): unknown {
  const baseType = element.getAttribute('base-type');
  const text = element.textContent || '';

  if (!baseType) return text;

  return parseValue(text, baseType);
}

/**
 * Evaluate qti-variable element
 */
export function evaluateVariable(element: Element, variables: Record<string, unknown>): unknown {
  const identifier = element.getAttribute('identifier');
  if (!identifier) return null;

  return variables[identifier] ?? null;
}
