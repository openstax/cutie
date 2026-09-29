/**
 * xAPI-compatible score representation.
 *
 * See: https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#2451-score
 */
export interface Score {
  /**
   * The score achieved in the experience. In a range of [min, max].
   */
  raw: number;

  /**
   * The lowest possible score. Always 0 for QTI items.
   */
  min: number;

  /**
   * The highest possible score (derived from MAXSCORE or response mappings).
   */
  max: number;

  /**
   * The score related to the experience as modified by scaling.
   * Calculated as raw / max, or 0 if max is 0.
   */
  scaled: number;
}

/**
 * Represents the state of a learner's attempt at a QTI assessment item.
 *
 * The attempt state is a serializable object that captures all information
 * needed to resume, score, or display an item at a particular point in time.
 */
export interface AttemptState {
  /**
   * Opaque variable storage managed by QTI template and response processing.
   * Contains response variables, outcome variables, template variables, and
   * any other item-defined variables.
   *
   * The host application should not interpret these values directly - they are
   * managed entirely by the QTI processing functions.
   */
  variables: Record<string, unknown>;

  /**
   * Standard QTI outcome variable indicating whether the item attempt is complete.
   *
   * Values:
   * - "not_attempted": No response has been submitted yet
   * - "incomplete": Responses submitted but item allows further attempts (an
   *   adaptive item that isn't complete, or a fresh try)
   * - "completed": Item attempt is finished, no further submissions allowed,
   *   except resubmitting a response that awaits manual scoring
   *   (`pendingManualScoring`)
   * - "unknown": Completion status cannot be determined
   *
   * This is the primary field the host application uses to determine if
   * the item session should be ended.
   */
  completionStatus: 'not_attempted' | 'incomplete' | 'completed' | 'unknown';

  /**
   * xAPI-compatible score for this attempt.
   * Null if either raw score or max score cannot be determined (non-scored items).
   */
  score: Score | null;

  /**
   * Shuffle orders for interactions that are shuffled (see `DeliveryOptions.shuffleOverride`).
   * Maps response identifiers to ordered arrays of choice identifiers.
   * Generated during initializeState and applied during renderTemplate.
   *
   * For match interactions with two sets, uses keys like "RESPONSE_0" and "RESPONSE_1"
   * to store each set's shuffle order separately.
   */
  shuffleOrders?: Record<string, string[]>;

  /**
   * Comments from external scoring (e.g., AI-generated feedback for human-scored items).
   * Null when no external scoring has been performed.
   */
  comments?: string | null;

  /**
   * Present when the item needs external scoring (e.g., human or AI grading).
   * Contains metadata for the scorer to use. Cleared by `setScore()`.
   */
  pendingManualScoring?: { maxScore: number };

  /**
   * The delivery options this attempt began under, defaults filled in.
   * Fixed for the life of the attempt; every later operation follows them.
   */
  options: Required<DeliveryOptions>;

  /**
   * Feedback withheld from the learner under `showFeedback: false`.
   * Decided on the turn the attempt becomes terminal and applied as-is on every
   * later render, so resuming the attempt reproduces the same template.
   */
  withheldFeedback?: FeedbackIdentity[];

  /**
   * Tries the learner has left under `DeliveryOptions.maxTries`, counting the
   * one in progress. A try ends when response processing completes the item.
   * When a try ends short of fully correct with tries left, the attempt
   * continues with a fresh try (see `retryVerdict`); otherwise it is terminal,
   * and no tries remain.
   */
  triesRemaining: number;

  /**
   * How the learner's last try was judged, when it fell short and the attempt
   * continued with a fresh try. Present from the submission that ended that try
   * until the fresh try ends, and drawn on the template until the fresh try's
   * first submission. Meanwhile `score` stays the last try's.
   */
  retryVerdict?: 'incorrect' | 'partial';
}

/**
 * Identifies a feedback element by its tag, outcome-identifier and identifier.
 */
export interface FeedbackIdentity {
  tagName: string;
  outcomeIdentifier: string;
  identifier: string;
}

/**
 * Options that govern how an attempt is delivered to the learner.
 *
 * Chosen when an attempt begins and fixed for its life. The defaults follow QTI:
 * feedback as the item's rules decide, no evaluation of the response beyond what
 * the item renders, and choices shuffled only where the item says `shuffle="true"`.
 * None of the options changes scoring.
 */
export interface DeliveryOptions {
  /**
   * Show feedback that appears when the attempt becomes terminal.
   * Feedback shown on earlier turns is unaffected. Defaults to `true`.
   */
  showFeedback?: boolean;

  /**
   * What the learner is told about how their response was judged, once the
   * attempt is terminal. Each level includes the one before it:
   * - `'none'`: nothing beyond what the item renders
   * - `'correctness'`: each interaction is marked correct, incorrect or partial
   * - `'correctResponse'`: the verdict, plus each interaction's correct response
   *
   * Defaults to `'none'`.
   */
  showEvaluation?: 'none' | 'correctness' | 'correctResponse';

  /**
   * Overrides the item's `shuffle` attributes:
   * - `'none'`: follow them, as QTI does
   * - `'shuffle'`: shuffle every interaction that supports shuffling unless it says `shuffle="false"`
   * - `'never'`: never shuffle
   *
   * Choices marked `fixed` keep their position under every value. Defaults to `'none'`.
   */
  shuffleOverride?: 'none' | 'shuffle' | 'never';

  /**
   * How many tries the learner gets. A try ends when response processing
   * completes the item: every submission for a non-adaptive item, or the
   * submission an adaptive item completes itself on.
   *
   * A try that ends short of fully correct, with tries left, starts a fresh try:
   * the item's outcomes are reset, and its feedback waits for the attempt to be
   * terminal. A non-adaptive item keeps the learner's responses, each
   * interaction marked with its verdict; an adaptive item starts over, with the
   * `adaptiveRetryMessage` at the top.
   *
   * The attempt is terminal once a try is fully correct, the tries run out, or
   * a try awaits manual scoring. `'smart'` derives the number from the item's
   * interactions. Defaults to `1`.
   */
  maxTries?: number | 'smart';

  /**
   * Shown at the top of an adaptive item when it starts a fresh try, with `{n}`
   * replaced by the tries remaining. Defaults to
   * `"That wasn't quite right. Tries remaining: {n}"`.
   */
  adaptiveRetryMessage?: string;
}

/**
 * Response data submitted by the learner.
 * Maps response identifiers to their values.
 */
export type ResponseData = Record<string, unknown>;

/**
 * Async callback to resolve asset URLs.
 * Receives an array of source URLs and returns resolved URLs in the same order.
 */
export type AssetResolver = (urls: string[]) => Promise<string[]>;

/**
 * Options for template processing operations.
 */
export interface ProcessingOptions {
  /**
   * Optional async callback to resolve asset URLs before returning sanitized XML.
   * When provided, all `src` and `data` attributes are collected and passed to this
   * resolver in batch. The resolved URLs replace the original attribute values.
   */
  resolveAssets?: AssetResolver;
}
