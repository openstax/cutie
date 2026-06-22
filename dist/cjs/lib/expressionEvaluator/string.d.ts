/**
 * String operators
 */
import type { SubEvaluate } from './types';
/**
 * Evaluate qti-substring element
 */
export declare function evaluateSubstring(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
/**
 * Evaluate qti-string-match element
 */
export declare function evaluateStringMatch(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
/**
 * Evaluate qti-pattern-match element
 */
export declare function evaluatePatternMatch(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
