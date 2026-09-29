import type { DeliveryOptions } from '@openstax/cutie-core';

export type ResolvedDeliveryOptions = Required<DeliveryOptions>;

export const SHOW_EVALUATION_VALUES: ResolvedDeliveryOptions['showEvaluation'][] = ['none', 'correctness', 'correctResponse'];
export const SHUFFLE_OVERRIDE_VALUES: ResolvedDeliveryOptions['shuffleOverride'][] = ['none', 'shuffle', 'never'];

/** Matches cutie-core's defaults. */
export const DEFAULT_DELIVERY_OPTIONS: ResolvedDeliveryOptions = {
  showFeedback: true,
  showEvaluation: 'none',
  shuffleOverride: 'none',
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
    };
  } catch {
    return DEFAULT_DELIVERY_OPTIONS;
  }
}

export function saveDeliveryOptions(options: ResolvedDeliveryOptions): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
}
