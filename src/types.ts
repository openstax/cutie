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
   * Current score for this attempt, extracted from SCORE outcome variable.
   * Null if the SCORE outcome variable does not exist (non-scored items).
   */
  score: number | null;

  /**
   * Maximum possible score for this item.
   * Derived from:
   * 1. MAXSCORE outcome variable if explicitly declared, OR
   * 2. upper-bound attribute from response mapping, OR
   * 3. null if neither exists
   */
  maxScore: number | null;
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
