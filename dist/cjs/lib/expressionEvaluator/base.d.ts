/**
 * Base value and variable operators
 */
/**
 * Evaluate qti-base-value element
 */
export declare function evaluateBaseValue(element: Element): unknown;
/**
 * Evaluate qti-variable element
 */
export declare function evaluateVariable(element: Element, variables: Record<string, unknown>): unknown;
