import { describe, expect, it } from 'vitest';
import { createFeedbackIcon, isFeedbackType } from './feedbackIcons';
import type { FeedbackType } from './feedbackIcons';

describe('isFeedbackType', () => {
  it.each(['correct', 'incorrect', 'info'])('should return true for "%s"', (value) => {
    expect(isFeedbackType(value)).toBe(true);
  });

  it.each(['unknown', '', 'CORRECT', 'warning'])('should return false for "%s"', (value) => {
    expect(isFeedbackType(value)).toBe(false);
  });
});

describe('createFeedbackIcon', () => {
  it.each([
    ['correct', '#22c55e', 'Correct:'],
    ['incorrect', '#ef4444', 'Incorrect:'],
    ['info', '#4a90e2', 'Information:'],
  ] as [FeedbackType, string, string][])(
    'should create icon for "%s" with color %s and label "%s"',
    (type, color, label) => {
      const icon = createFeedbackIcon(type);

      expect(icon.tagName.toLowerCase()).toBe('span');
      expect(icon.className).toBe('cutie-feedback-icon');

      const svg = icon.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
      expect(svg?.getAttribute('class')).toBe('cutie-feedback-icon__svg');
      expect(svg?.getAttribute('fill')).toBe(color);
      expect(svg?.getAttribute('viewBox')).toBe('0 -960 960 960');

      const path = svg?.querySelector('path');
      expect(path).not.toBeNull();
      expect(path?.getAttribute('d')).toBeTruthy();

      const srText = icon.querySelector('.cutie-feedback-sr-text');
      expect(srText).not.toBeNull();
      expect(srText?.textContent).toBe(label);
    },
  );
});
