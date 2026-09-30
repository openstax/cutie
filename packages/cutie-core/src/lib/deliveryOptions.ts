import { AttemptState, DeliveryOptions } from '../types';

const DEFAULT_DELIVERY_OPTIONS: Required<DeliveryOptions> = {
  showFeedback: true,
  showEvaluation: 'none',
  shuffleOverride: 'none',
  maxTries: 1,
  adaptiveRetryMessage: 'That wasn\'t quite right. Tries remaining: {n}',
};

/**
 * Fills in defaults for any delivery option not given.
 */
export function resolveDeliveryOptions(options?: DeliveryOptions): Required<DeliveryOptions> {
  return {
    showFeedback: options?.showFeedback ?? DEFAULT_DELIVERY_OPTIONS.showFeedback,
    showEvaluation: options?.showEvaluation ?? DEFAULT_DELIVERY_OPTIONS.showEvaluation,
    shuffleOverride: options?.shuffleOverride ?? DEFAULT_DELIVERY_OPTIONS.shuffleOverride,
    maxTries: options?.maxTries ?? DEFAULT_DELIVERY_OPTIONS.maxTries,
    adaptiveRetryMessage: options?.adaptiveRetryMessage ?? DEFAULT_DELIVERY_OPTIONS.adaptiveRetryMessage,
  };
}

/**
 * Whether the attempt is terminal: completed, with no further submissions.
 * Feedback that appears from here on is subject to `showFeedback`.
 */
export function isTerminal(state: AttemptState): boolean {
  return state.completionStatus === 'completed';
}

/**
 * Whether the attempt's responses may be evaluated for the learner: terminal,
 * with no manual scoring pending. Governs `showEvaluation`.
 */
export function canEvaluate(state: AttemptState): boolean {
  return isTerminal(state) && !state.pendingManualScoring;
}
