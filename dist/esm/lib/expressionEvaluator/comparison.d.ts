/**
 * Comparison operators
 */
import type { SubEvaluate } from './types';
/**
 * Evaluate qti-lt (less than) element
 */
export declare function evaluateLessThan(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
/**
 * Evaluate qti-gt (greater than) element
 */
export declare function evaluateGreaterThan(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
/**
 * Evaluate qti-lte (less than or equal) element
 */
export declare function evaluateLessThanOrEqual(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
/**
 * Evaluate qti-gte (greater than or equal) element
 */
export declare function evaluateGreaterThanOrEqual(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
/**
 * Evaluate qti-equal element
 */
export declare function evaluateEqual(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
/**
 * Evaluate qti-match element
 *
 * This uses the enhanced version from responseProcessing that detects qti-multiple
 * containers and uses the appropriate equality function (ordered vs unordered).
 * Since qti-multiple is valid in both template and response contexts, this works for both.
 *
 * For formula responses (data-response-type="formula" on the response declaration),
 * uses Compute Engine for mathematical comparison based on data-comparison-mode.
 */
export declare function evaluateMatch(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
