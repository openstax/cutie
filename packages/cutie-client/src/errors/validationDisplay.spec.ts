import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createConstraintMessage, createInlineRequiredIndicator } from './validationDisplay';

describe('createConstraintMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function textSpan(element: HTMLElement): HTMLElement {
    return element.querySelector('span')!;
  }

  it('re-announces identical text via a clear/restore cycle', () => {
    const { element, setText } = createConstraintMessage('c1', 'Select at least 2 choices.');
    const span = textSpan(element);

    setText('Select at least 2 choices.');
    expect(span.textContent).toBe('Select at least 2 choices.');

    vi.advanceTimersToNextTimer();
    expect(span.textContent).toBe('');

    vi.advanceTimersToNextTimer();
    expect(span.textContent).toBe('Select at least 2 choices.');
  });

  it('does not schedule a clear/restore cycle when the text actually changes', () => {
    const { element, setText } = createConstraintMessage('c1', 'Select at least 2 choices.');
    const span = textSpan(element);

    setText('Too many selected.');
    expect(span.textContent).toBe('Too many selected.');

    vi.advanceTimersByTime(1000);
    expect(span.textContent).toBe('Too many selected.');
  });

  it('setError(true) alone forces a re-announcement of the current text', () => {
    const { element, setError } = createConstraintMessage('c1', 'Select at least 2 choices.');
    const span = textSpan(element);

    setError(true);
    expect(span.textContent).toBe('Select at least 2 choices.');

    vi.advanceTimersToNextTimer();
    expect(span.textContent).toBe('');

    vi.advanceTimersToNextTimer();
    expect(span.textContent).toBe('Select at least 2 choices.');
  });

  it('setError(false) does not schedule a re-announcement', () => {
    const { element, setError } = createConstraintMessage('c1', 'Select at least 2 choices.');
    const span = textSpan(element);

    setError(false);
    vi.advanceTimersByTime(1000);
    expect(span.textContent).toBe('Select at least 2 choices.');
  });
});

describe('createInlineRequiredIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the visible glyph static while text/error updates flow through a hidden announcer', () => {
    const { element, setText, setError } = createInlineRequiredIndicator('i1', 'Selection required');
    const glyph = element.querySelector('.cutie-required-indicator-glyph')!;
    const announcer = element.querySelector('span:not(.cutie-required-indicator-glyph)')!;

    expect(glyph.textContent).toBe('*');
    expect(element.title).toBe('Selection required');
    expect(element.getAttribute('aria-label')).toBe('Selection required');

    setText('Required format');
    expect(glyph.textContent).toBe('*');
    expect(element.title).toBe('Required format');
    expect(element.getAttribute('aria-label')).toBe('Required format');
    expect(announcer.textContent).toBe('Required format');

    setError(true);
    expect(glyph.textContent).toBe('*');

    vi.advanceTimersToNextTimer();
    expect(announcer.textContent).toBe('');

    vi.advanceTimersToNextTimer();
    expect(announcer.textContent).toBe('Required format');
    expect(glyph.textContent).toBe('*');
  });
});
