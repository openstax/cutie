/**
 * Utility operators (type conversion, boolean checks, etc.)
 */
import type { SubEvaluate } from './types';
/**
 * Evaluate qti-integer-to-float element
 */
export declare function evaluateIntegerToFloat(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): number;
/**
 * Evaluate qti-any-n element
 */
export declare function evaluateAnyN(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
/**
 * Evaluate qti-is-null element
 */
export declare function evaluateIsNull(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
/**
 * Evaluate qti-random element
 * Selects a random value from a container (multiple or ordered)
 */
export declare function evaluateRandom(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): unknown;
/**
 * Evaluate qti-random-integer element
 * Returns a random integer between min and max (inclusive), stepping by step
 */
export declare function evaluateRandomInteger(element: Element): number;
/**
 * Evaluate qti-random-float element
 * Returns a random float between min and max
 */
export declare function evaluateRandomFloat(element: Element): number;
