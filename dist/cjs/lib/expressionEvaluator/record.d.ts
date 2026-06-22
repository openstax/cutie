/**
 * Record operators
 */
import type { SubEvaluate } from './types';
/**
 * Evaluate qti-record element
 */
export declare function evaluateRecord(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): Record<string, unknown>;
/**
 * Evaluate qti-field-value element
 */
export declare function evaluateFieldValue(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): unknown;
