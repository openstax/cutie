import { describe, expect, it } from 'vitest';
import { createInlineRequiredIndicator } from './validationDisplay';

describe('createInlineRequiredIndicator', () => {
  it('is aria-hidden so it is not read twice by screen readers', () => {
    // The message reaches AT users once, via aria-describedby on the input
    // (a node directly referenced that way still contributes its text to
    // the computed description even while hidden) — this span must stay
    // out of the standalone accessibility tree, or VoiceOver's linear
    // navigation stops on it as its own node and re-reads the same text.
    const indicator = createInlineRequiredIndicator('constraint-R1', 'Selection required');
    expect(indicator.element.getAttribute('aria-hidden')).toBe('true');
  });

  it('stays aria-hidden after setError(true)', () => {
    const indicator = createInlineRequiredIndicator('constraint-R1', 'Selection required');
    indicator.setError(true);
    expect(indicator.element.getAttribute('aria-hidden')).toBe('true');
  });

  it('stays aria-hidden after setError(false)', () => {
    const indicator = createInlineRequiredIndicator('constraint-R1', 'Selection required');
    indicator.setError(true);
    indicator.setError(false);
    expect(indicator.element.getAttribute('aria-hidden')).toBe('true');
  });
});
