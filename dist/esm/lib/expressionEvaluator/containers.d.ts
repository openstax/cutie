/**
 * Container operators
 */
import type { SubEvaluate } from './types';
/**
 * Evaluate qti-multiple element (unordered container)
 */
export declare function evaluateMultiple(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): unknown[];
/**
 * Evaluate qti-ordered element (ordered container)
 */
export declare function evaluateOrdered(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): unknown[];
/**
 * Evaluate qti-container-size element
 */
export declare function evaluateContainerSize(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): number;
/**
 * Evaluate qti-repeat element
 */
export declare function evaluateRepeat(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): unknown[];
/**
 * Evaluate qti-delete element
 *
 * Per QTI spec: The first sub-expression must have single cardinality (value to delete)
 * and the second must be a multiple or ordered container. The result is a new container
 * derived from the second sub-expression with all instances of the first sub-expression removed.
 */
export declare function evaluateDelete(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): unknown[];
/**
 * Evaluate qti-member element
 */
export declare function evaluateMember(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
/**
 * Evaluate qti-contains element
 */
export declare function evaluateContains(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): boolean;
/**
 * Evaluate qti-index element
 */
export declare function evaluateIndex(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): unknown;
