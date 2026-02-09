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
   * - "incomplete": Responses submitted but item allows further attempts
   * - "completed": Item attempt is finished, no further submissions allowed
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
   * Shuffle orders for interactions with shuffle="true".
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
