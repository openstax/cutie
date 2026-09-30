import { DOMParser } from '@xmldom/xmldom';
import { AttemptResult, completeTurn, presentState } from './lib/attemptTurn';
import {
  collectAssetReferences,
  uniqueAssetUrls,
} from './lib/collectAssetReferences';
import { isTerminal, resolveDeliveryOptions } from './lib/deliveryOptions';
import { deriveMaxScore } from './lib/deriveMaxScore';
import { initializeState } from './lib/initializeState';
import { processResponse } from './lib/responseProcessing';
import { buildScore } from './lib/scoreUtils';
import { instantiateTemplate } from './lib/templateInstance';
import { endTry } from './lib/tries';
import { validateSubmission } from './lib/validateResponses';
import { AttemptState, DeliveryOptions, ProcessingOptions, ResponseData } from './types';

/**
 * Initializes a new attempt at a QTI assessment item.
 *
 * Creates the initial learner state with default values and renders
 * the first template with any randomized template variables resolved.
 *
 * @param itemXml - Complete QTI v3 assessment item XML definition
 * @param processing - Optional processing options (e.g., asset resolver)
 * @param options - Delivery options the attempt is fixed to for its life;
 *   recorded, defaults filled in, in `state.options`
 * @returns Promise resolving to initial state and sanitized template XML
 *
 * @example
 * ```typescript
 * const { state, template } = await beginAttempt(itemXml);
 * // Persist state, send template to client for rendering
 * ```
 */
export async function beginAttempt(
  itemXml: string,
  processing?: ProcessingOptions,
  options?: DeliveryOptions
): Promise<AttemptResult> {
  const itemDoc = parseItem(itemXml);

  // Initialize state by processing template declarations and template processing
  const state = initializeState(itemDoc, resolveDeliveryOptions(options));

  return presentState(instantiateTemplate(itemDoc, state), state, processing);
}

/**
 * Renders an existing attempt state without advancing it.
 *
 * Returns the template exactly as the call that produced `state` rendered it,
 * and `state` unchanged. Nothing is processed or re-randomized: choices keep the
 * order the attempt began with, under the delivery options in `state.options`.
 * Use it when a learner returns to an attempt the host holds.
 *
 * @param state - Attempt state from a previous operation
 * @param itemXml - Complete QTI v3 assessment item XML definition
 * @param processing - Optional processing options (e.g., asset resolver)
 * @returns Promise resolving to the unchanged state and its sanitized template XML
 */
export async function resumeAttempt(
  state: AttemptState,
  itemXml: string,
  processing?: ProcessingOptions
): Promise<AttemptResult> {
  return presentState(instantiateTemplate(parseItem(itemXml), state), state, processing);
}

/**
 * Processes a response submission and updates the attempt state.
 *
 * Runs response processing to score the submission, update outcome variables,
 * and determine completion status. A submission that ends a try short of fully
 * correct, with tries left, starts a fresh try (see `DeliveryOptions.maxTries`).
 * Then generates an updated template with
 * any newly visible feedback or content changes, under the delivery options
 * the attempt began with.
 *
 * @param submission - Learner's response data (response IDs mapped to values)
 * @param state - Current attempt state from previous operation
 * @param itemXml - Complete QTI v3 assessment item XML definition
 * @param processing - Optional processing options (e.g., asset resolver)
 * @returns Promise resolving to updated state and sanitized template XML
 * @throws When the attempt is complete (terminal), unless its response awaits
 *   manual scoring; and a ResponseValidationError when the submission breaks
 *   the item's response constraints
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
export async function submitResponse(
  submission: ResponseData,
  state: AttemptState,
  itemXml: string,
  processing?: ProcessingOptions
): Promise<AttemptResult> {
  // A finished attempt takes no more submissions, except to edit a response
  // that awaits manual scoring
  if (isTerminal(state) && !state.pendingManualScoring) {
    throw new Error('The attempt is complete; it takes no further submissions');
  }

  const itemDoc = instantiateTemplate(parseItem(itemXml), state);

  // Validate response constraints before processing
  validateSubmission(submission, itemDoc);

  // Process the response submission to update state
  const processedState = processResponse(itemDoc, submission, state);

  // Count the try it ended, continuing with a fresh one if it fell short
  const { state: updatedState, tryConsumed } = endTry(itemDoc, state, processedState);

  // Render the updated template with new state (feedback may now be visible)
  return completeTurn(itemDoc, state, updatedState, processing, tryConsumed);
}

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
 * @param processing - Optional processing options (e.g., asset resolver)
 * @returns Promise resolving to updated state and sanitized template XML
 */
export async function setScore(
  score: number,
  comments: string,
  state: AttemptState,
  itemXml: string,
  processing?: ProcessingOptions
): Promise<AttemptResult> {
  const itemDoc = instantiateTemplate(parseItem(itemXml), state);

  const maxScore = deriveMaxScore(itemDoc, state.variables);
  if (maxScore === null) {
    throw new Error('Cannot determine max score for item');
  }

  const updatedState: AttemptState = {
    ...state,
    variables: { ...state.variables, SCORE: score },
    score: buildScore(score, maxScore),
    comments,
    pendingManualScoring: undefined,
  };

  return completeTurn(itemDoc, state, updatedState, processing);
}

/**
 * Lists every asset URL referenced by an item definition.
 *
 * Reads the `src` and `data` attributes of the raw definition, so the
 * result is the complete set of assets the item could ever reference --
 * including those behind template conditionals, inside feedback that is
 * not yet visible, and within rubric blocks hidden from the candidate.
 * It is a superset of what any single rendered template contains.
 *
 * This deliberately bypasses the sanitization applied by the attempt
 * lifecycle, so it is intended for server-side use (pre-caching,
 * packaging, dependency checking). Exposing the result to a learner can
 * reveal content that `beginAttempt` and `submitResponse` withhold.
 *
 * @param itemXml - Complete QTI v3 assessment item XML definition
 * @returns Unique asset URLs, unresolved, in document order
 *
 * @example
 * ```typescript
 * const urls = listItemAssets(itemXml);
 * // ['images/red_door.png', 'images/open_goat.png', ...]
 * ```
 */
export function listItemAssets(itemXml: string): string[] {
  return uniqueAssetUrls(collectAssetReferences(parseItem(itemXml).documentElement));
}

/**
 * Parses a QTI item definition
 */
function parseItem(itemXml: string): Document {
  return new DOMParser().parseFromString(itemXml.trim(), 'text/xml');
}

export { ResponseValidationError } from './lib/validateResponses';

// Re-export types for convenience
export type { AttemptResult } from './lib/attemptTurn';
export type { ResponseEvaluation } from './lib/evaluateResponses';
export type {
  AssetResolver,
  AttemptState,
  DeliveryOptions,
  FeedbackIdentity,
  ProcessingOptions,
  ResponseData,
  Score,
} from './types';
