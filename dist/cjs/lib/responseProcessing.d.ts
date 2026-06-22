import { AttemptState, ResponseData } from '../types';
/**
 * Compare response values, using formula comparison when appropriate
 *
 * This is the single source of truth for response comparison. It detects
 * formula responses via data-response-type="formula" and routes to
 * Compute Engine comparison with the specified mode.
 */
export declare function compareResponseValues(itemDoc: Document, responseIdentifier: string, responseValue: unknown, correctValue: unknown): boolean;
/**
 * Processes a response submission by executing response processing rules
 * from a QTI assessment item.
 *
 * This function:
 * 1. Updates response variables with submitted values
 * 2. Executes qti-response-processing rules to score the response
 * 3. Updates outcome variables (SCORE, completionStatus, numAttempts, etc.)
 * 4. Returns updated attempt state
 *
 * Response processing runs on every submission during an attempt.
 * Template variables are not modified - they remain constant.
 *
 * @param itemDoc - Parsed QTI assessment item XML document
 * @param submission - Learner's response data (response IDs mapped to values)
 * @param currentState - Current attempt state before this submission
 * @returns Updated attempt state after processing the response
 */
export declare function processResponse(itemDoc: Document, submission: ResponseData, currentState: AttemptState): AttemptState;
