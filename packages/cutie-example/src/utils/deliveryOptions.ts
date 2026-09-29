import type { DeliveryOptions } from '@openstax/cutie-core';

export type ResolvedDeliveryOptions = Required<DeliveryOptions>;

export const SHOW_EVALUATION_VALUES: ResolvedDeliveryOptions['showEvaluation'][] = ['none', 'correctness', 'correctResponse'];
export const SHUFFLE_OVERRIDE_VALUES: ResolvedDeliveryOptions['shuffleOverride'][] = ['none', 'shuffle', 'never'];
export const MAX_TRIES_VALUES: ResolvedDeliveryOptions['maxTries'][] = [1, 2, 3, 4, 5, 'smart'];

/** Matches cutie-core's defaults. */
export const DEFAULT_DELIVERY_OPTIONS: ResolvedDeliveryOptions = {
  showFeedback: true,
  showEvaluation: 'none',
  shuffleOverride: 'none',
  maxTries: 1,
  adaptiveRetryMessage: "That wasn't quite right. Tries remaining: {n}",
};

const STORAGE_KEY = 'delivery-options';

const pick = <T>(allowed: T[], value: unknown, fallback: T): T =>
  allowed.includes(value as T) ? value as T : fallback;

export function loadDeliveryOptions(): ResolvedDeliveryOptions {
  try {
    const stored: Partial<Record<keyof DeliveryOptions, unknown>> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      showFeedback: typeof stored.showFeedback === 'boolean' ? stored.showFeedback : DEFAULT_DELIVERY_OPTIONS.showFeedback,
      showEvaluation: pick(SHOW_EVALUATION_VALUES, stored.showEvaluation, DEFAULT_DELIVERY_OPTIONS.showEvaluation),
      shuffleOverride: pick(SHUFFLE_OVERRIDE_VALUES, stored.shuffleOverride, DEFAULT_DELIVERY_OPTIONS.shuffleOverride),
      maxTries: pick(MAX_TRIES_VALUES, stored.maxTries, DEFAULT_DELIVERY_OPTIONS.maxTries),
      adaptiveRetryMessage: typeof stored.adaptiveRetryMessage === 'string'
        ? stored.adaptiveRetryMessage
        : DEFAULT_DELIVERY_OPTIONS.adaptiveRetryMessage,
    };
  } catch {
    return DEFAULT_DELIVERY_OPTIONS;
  }
}

export function saveDeliveryOptions(options: ResolvedDeliveryOptions): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
}
