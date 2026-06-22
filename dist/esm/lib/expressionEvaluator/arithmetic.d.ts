/**
 * Arithmetic operators
 */
import type { SubEvaluate } from './types';
/**
 * Evaluate qti-sum element
 */
export declare function evaluateSum(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): number;
/**
 * Evaluate qti-product element
 */
export declare function evaluateProduct(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): number;
/**
 * Evaluate qti-subtract element
 */
export declare function evaluateSubtract(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): number;
/**
 * Evaluate qti-divide element
 */
export declare function evaluateDivide(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): number;
/**
 * Evaluate qti-integer-divide element
 */
export declare function evaluateIntegerDivide(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): number;
/**
 * Evaluate qti-integer-modulus element
 */
export declare function evaluateIntegerModulus(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): number;
/**
 * Evaluate qti-truncate element
 */
export declare function evaluateTruncate(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): number;
/**
 * Evaluate qti-round element
 */
export declare function evaluateRound(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): number;
/**
 * Evaluate qti-power element
 */
export declare function evaluatePower(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): number;
