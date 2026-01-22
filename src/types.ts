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
}

/**
 * Response data submitted by the learner.
 * Maps response identifiers to their values.
 */
export type ResponseData = Record<string, unknown>;
