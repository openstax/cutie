/**
 * Base value and variable operators
 */

import { parseValue } from '../../utils/typeParser.js';

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

/**
 * Resolve an IntOrIdentifier attribute: an integer, or the identifier of a
 * variable whose value is used. Returns null when the result isn't an integer.
 */
export function resolveIntOrIdentifier(value: string, variables: Record<string, unknown>): number | null {
  const resolved = /^-?\d+$/.test(value) ? parseInt(value, 10) : variables[value];
  return Number.isInteger(resolved) ? (resolved as number) : null;
}
