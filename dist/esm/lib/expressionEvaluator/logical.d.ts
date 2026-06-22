/**
 * Logical operators
 */
import type { SubEvaluate } from './types';
/**
 * Evaluate qti-and element
 */
export declare function evaluateAnd(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
/**
 * Evaluate qti-or element
 */
export declare function evaluateOr(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
/**
 * Evaluate qti-not element
 */
export declare function evaluateNot(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
