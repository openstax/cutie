/* spell-checker: ignore inlines */
import { DOMParser } from '@xmldom/xmldom';
import { isAdaptive } from './lib/adaptive';
import { AttemptResult, completeTurn, presentState } from './lib/attemptTurn';
import {
  collectAssetReferences,
  uniqueAssetUrls,
} from './lib/collectAssetReferences';
import { finishContent } from './lib/content';
import { isTerminal, resolveDeliveryOptions } from './lib/deliveryOptions';
import { deriveMaxScore } from './lib/deriveMaxScore';
import { initializeState } from './lib/initializeState';
import { buildPreviewDocument, serializeTemplate } from './lib/renderTemplate';
import { processResponse } from './lib/responseProcessing';
import { buildScore } from './lib/scoreUtils';
import {
  buildStimulusDocument,
  collectStimulusReferences,
  findStimulusDocks,
  parseStimulus,
} from './lib/stimulus';
import { instantiateTemplate } from './lib/templateInstance';
import { endTry } from './lib/tries';
import { validateSubmission } from './lib/validateResponses';
import {
  AttemptState,
  DeliveryOptions,
  ItemDependencies,
  PreviewOptions,
  ProcessingOptions,
  ResponseData,
  StimulusDependencies,
} from './types';

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
 * Renders a preview of an item, for instructors and authors: the item as an
 * attempt at it begins, showing each interaction's correct response and,
 * unless `compact`, all of the item's feedback.
 *
 * The preview is not an attempt: there is no state, and nothing can be
 * submitted to it, so render it read-only. Choices keep their
 * authored order, template variables take one randomly generated set of
 * values, and a printed outcome variable reads as a placeholder naming it
 * (`[SCORE]`), as no response has been processed. Every feedback element is
 * shown whatever its condition, so feedback that never appears together can
 * appear side by side, and modal feedback is shown as block feedback at the
 * end of the item body. An adaptive item is always previewed compact (see
 * `PreviewOptions.compact`), showing the feedback its first stage shows.
 * The item body is marked with a `data-cutie-preview` attribute, so the client
 * can show the interactions for an instructor rather than as a learner's.
 *
 * The preview reveals the correct responses and all feedback, so it must
 * never be shown to a learner.
 *
 * @param itemXml - Complete QTI v3 assessment item XML definition
 * @param processing - Optional processing options (e.g., asset resolver)
 * @param options - Preview options
 * @returns Promise resolving to the sanitized preview XML
 *
 * @example
 * ```typescript
 * const template = await renderPreview(itemXml, undefined, { compact: true });
 * const item = mountItem(container, template, { interactionState: 'readonly' });
 * ```
 */
export async function renderPreview(
  itemXml: string,
  processing?: ProcessingOptions,
  options?: PreviewOptions
): Promise<string> {
  const itemDoc = parseItem(itemXml);
  const state = initializeState(itemDoc, resolveDeliveryOptions({ shuffleOverride: 'never' }));
  const allFeedback = !options?.compact && !isAdaptive(itemDoc);

  return serializeTemplate(
    buildPreviewDocument(instantiateTemplate(itemDoc, state), state, allFeedback),
    processing
  );
}

/**
 * Lists everything external an item definition references: its asset URLs
 * (from `src` and `data` attributes) and the stimuli it references, each
 * marked with whether the item body docks it.
 *
 * Hosts resolve the stimuli: a docked stimulus through
 * `ProcessingOptions.resolveStimuli`, which inlines it into the item's
 * templates; one that is not docked the delivery system places itself,
 * rendering it with `renderStimulus`, possibly once for several items.
 *
 * It reads the raw definition, so the result is everything the item could
 * ever reference -- including what is behind template conditionals, inside
 * feedback that is not yet visible, and within rubric blocks hidden from the
 * candidate. It is a superset of what any single rendered template contains.
 *
 * This deliberately bypasses the sanitization applied by the attempt
 * lifecycle, so it is intended for server-side use (pre-caching,
 * packaging, dependency checking). Exposing the result to a learner can
 * reveal content that `beginAttempt` and `submitResponse` withhold.
 * Each document lists only its own references: the assets of the stimuli are
 * not included (see `listStimulusDependencies`). A host inventorying them
 * pairs each with the stimulus's `href` as its `base` (see `AssetRequest`).
 *
 * @param itemXml - Complete QTI v3 assessment item XML definition
 * @returns The item's assets and stimuli
 *
 * @example
 * ```typescript
 * const { assets, stimuli } = listItemDependencies(itemXml);
 * // assets: ['images/red_door.png', 'images/open_goat.png', ...]
 * // stimuli: [{ identifier: 'Stimulus1', href: 'passages/night.xml', docked: false }]
 * ```
 */
export function listItemDependencies(itemXml: string): ItemDependencies {
  const root = parseItem(itemXml).documentElement;
  const dockedIdentifiers = new Set(
    findStimulusDocks(root).map((dock) => dock.getAttribute('data-stimulus-idref'))
  );

  return {
    assets: uniqueAssetUrls(collectAssetReferences(root)),
    stimuli: collectStimulusReferences(root).map((ref) => ({
      ...ref,
      docked: dockedIdentifiers.has(ref.identifier),
    })),
  };
}

/**
 * Renders a shared stimulus (`qti-assessment-stimulus`) for the client, for the
 * delivery system to place itself: one an item references without docking it
 * (see `listItemDependencies`).
 *
 * A stimulus declares no variables and has no processing, so this takes no
 * state, and renders the same for every learner. Asset URLs in it are relative
 * to the stimulus, so the asset resolver should resolve them from there.
 *
 * @param stimulusXml - Complete QTI v3 assessment stimulus XML definition
 * @param processing - Optional processing options (e.g., asset resolver)
 * @returns Promise resolving to the sanitized stimulus XML, for `mountStimulus`
 * @throws When the definition is not a qti-assessment-stimulus with a qti-stimulus-body
 */
export async function renderStimulus(
  stimulusXml: string,
  processing?: ProcessingOptions
): Promise<string> {
  return finishContent(buildStimulusDocument(parseStimulus(stimulusXml)), processing);
}

/**
 * Lists everything external a stimulus definition references: its asset URLs
 * (from `src` and `data` attributes), relative to the stimulus. Like
 * `listItemDependencies`, it lists only the stimulus's own references.
 *
 * @param stimulusXml - Complete QTI v3 assessment stimulus XML definition
 * @returns The stimulus's assets
 */
export function listStimulusDependencies(stimulusXml: string): StimulusDependencies {
  return {
    assets: uniqueAssetUrls(collectAssetReferences(parseStimulus(stimulusXml).documentElement)),
  };
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
  AssetRequest,
  AssetResolver,
  AttemptState,
  DeliveryOptions,
  FeedbackIdentity,
  ItemDependencies,
  PreviewOptions,
  ProcessingOptions,
  ResponseData,
  Score,
  StimulusDependencies,
  StimulusDependency,
  StimulusReference,
  StimulusResolver,
} from './types';
