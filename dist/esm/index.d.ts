import { AttemptState, ProcessingOptions, ResponseData } from './types';
/**
 * Result of attempt operations containing updated state and template.
 */
export interface AttemptResult {
    /**
     * Updated learner state after processing.
     * Should be persisted and passed to subsequent operations.
     */
    state: AttemptState;
    /**
     * Sanitized QTI XML template ready for client rendering.
     * Contains resolved variables, applied visibility rules, and
     * stripped sensitive content (response processing, correct answers, etc.).
     */
    template: string;
}
/**
 * Initializes a new attempt at a QTI assessment item.
 *
 * Creates the initial learner state with default values and renders
 * the first template with any randomized template variables resolved.
 *
 * @param itemXml - Complete QTI v3 assessment item XML definition
 * @param options - Optional processing options (e.g., asset resolver)
 * @returns Promise resolving to initial state and sanitized template XML
 *
 * @example
 * ```typescript
 * const { state, template } = await beginAttempt(itemXml);
 * // Persist state, send template to client for rendering
 * ```
 */
export declare function beginAttempt(itemXml: string, options?: ProcessingOptions): Promise<AttemptResult>;
/**
 * Processes a response submission and updates the attempt state.
 *
 * Runs response processing to score the submission, update outcome variables,
 * and determine completion status. Then generates an updated template with
 * any newly visible feedback or content changes.
 *
 * @param submission - Learner's response data (response IDs mapped to values)
 * @param state - Current attempt state from previous operation
 * @param itemXml - Complete QTI v3 assessment item XML definition
 * @param options - Optional processing options (e.g., asset resolver)
 * @returns Promise resolving to updated state and sanitized template XML
 *
 * @example
 * ```typescript
 * const submission = { RESPONSE_1: 'choiceA', RESPONSE_2: [1, 3] };
 * const { state, template } = await submitResponse(submission, currentState, itemXml);
 *
 * // Check if attempt is complete
 * if (state.completionStatus === 'completed') {
 *   // End session, show final results
 * }
 * ```
 */
export declare function submitResponse(submission: ResponseData, state: AttemptState, itemXml: string, options?: ProcessingOptions): Promise<AttemptResult>;
/**
 * Applies an externally-determined score to an attempt state.
 *
 * Used after `submitResponse` returns a state with `pendingManualScoring`
 * to finalize the score (e.g., after AI or human grading). Clears the
 * `pendingManualScoring` flag and re-renders the template so that any
 * score-based feedback becomes visible.
 *
 * @param score - The score awarded by the external scorer
 * @param comments - Feedback or comments from the external scorer
 * @param state - Current attempt state (should have `pendingManualScoring`)
 * @param itemXml - Complete QTI v3 assessment item XML definition
 * @param options - Optional processing options (e.g., asset resolver)
 * @returns Promise resolving to updated state and sanitized template XML
 */
export declare function setScore(score: number, comments: string, state: AttemptState, itemXml: string, options?: ProcessingOptions): Promise<AttemptResult>;
export { ResponseValidationError } from './lib/validateResponses';
export type { AssetResolver, AttemptState, ProcessingOptions, ResponseData, Score, } from './types';
