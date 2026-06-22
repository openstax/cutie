/**
 * Shared expression evaluator for QTI expression evaluation
 *
 * This module contains common operators used by both template processing
 * (initializeState) and response processing contexts.
 */
import type { SubEvaluate } from './types';
export type { SubEvaluate } from './types';
/**
 * Evaluate a QTI expression element
 *
 * This function handles common operators shared across template and response processing.
 * Domain-specific operators should be handled in their respective contexts before
 * falling through to this evaluator.
 *
 * @param element - The QTI expression element to evaluate
 * @param itemDoc - The item document (for DOM queries)
 * @param variables - Current variable bindings
 * @param subEvaluate - Recursive evaluation callback for child expressions
 * @returns The evaluated value
 * @throws Error if the operator is not recognized
 */
export declare function evaluateExpression(element: Element, itemDoc: Document, variables: Record<string, unknown>, subEvaluate: SubEvaluate): unknown;
