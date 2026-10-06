import type { AttemptState } from '@openstax/cutie-core';
import type { InteractionState } from '@openstax/cutie-client';

/**
 * How a learner can interact with an attempt's item: disabled while a submission
 * is pending, and read-only once the response is final. A finished attempt takes
 * no more submissions, except that a response awaiting manual scoring can still
 * be edited and resubmitted.
 */
export function attemptInteractionState(attemptState: AttemptState | null, isSubmitting: boolean): InteractionState {
  const acceptsResponses = attemptState?.completionStatus !== 'completed' || !!attemptState.pendingManualScoring;
  return isSubmitting ? 'disabled' : acceptsResponses ? 'enabled' : 'readonly';
}
