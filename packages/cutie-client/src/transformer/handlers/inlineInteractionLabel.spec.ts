import { describe, expect, it } from 'vitest';
import { buildInlineInteractionLabel } from './inlineInteractionLabel';

function createElement(tag: string, children: Element[] = []): Element {
  const el = document.createElement(tag);
  for (const child of children) {
    el.appendChild(child);
  }
  return el;
}

describe('buildInlineInteractionLabel', () => {
  it('returns "blank" for a single text-entry in a <p>', () => {
    const interaction = createElement('qti-text-entry-interaction');
    createElement('p', [interaction]);

    expect(buildInlineInteractionLabel(interaction)).toBe('blank');
  });

  it('returns "blank" for a single inline-choice in a <p>', () => {
    const interaction = createElement('qti-inline-choice-interaction');
    createElement('p', [interaction]);

    expect(buildInlineInteractionLabel(interaction)).toBe('blank');
  });

  it('returns ordinal labels for multiple text-entries in one <p>', () => {
    const a = createElement('qti-text-entry-interaction');
    const b = createElement('qti-text-entry-interaction');
    const c = createElement('qti-text-entry-interaction');
    createElement('p', [a, b, c]);

    expect(buildInlineInteractionLabel(a)).toBe('blank 1 of 3');
    expect(buildInlineInteractionLabel(b)).toBe('blank 2 of 3');
    expect(buildInlineInteractionLabel(c)).toBe('blank 3 of 3');
  });

  it('counts mixed interaction types together', () => {
    const choice = createElement('qti-inline-choice-interaction');
    const entry = createElement('qti-text-entry-interaction');
    createElement('p', [choice, entry]);

    expect(buildInlineInteractionLabel(choice)).toBe('blank 1 of 2');
    expect(buildInlineInteractionLabel(entry)).toBe('blank 2 of 2');
  });

  it('returns "blank" fallback when directly under qti-item-body', () => {
    const interaction = createElement('qti-text-entry-interaction');
    createElement('qti-item-body', [interaction]);

    expect(buildInlineInteractionLabel(interaction)).toBe('blank');
  });

  it('finds <p> as context parent when nested in <blockquote><p>', () => {
    const a = createElement('qti-text-entry-interaction');
    const b = createElement('qti-text-entry-interaction');
    const p = createElement('p', [a, b]);
    createElement('blockquote', [p]);

    expect(buildInlineInteractionLabel(a)).toBe('blank 1 of 2');
    expect(buildInlineInteractionLabel(b)).toBe('blank 2 of 2');
  });

  it('returns "blank" fallback when element has no parent', () => {
    const interaction = createElement('qti-text-entry-interaction');

    expect(buildInlineInteractionLabel(interaction)).toBe('blank');
  });

  it('scopes counting to nearest block ancestor', () => {
    const a = createElement('qti-text-entry-interaction');
    const b = createElement('qti-text-entry-interaction');
    const c = createElement('qti-text-entry-interaction');
    const p1 = createElement('p', [a, b]);
    const p2 = createElement('p', [c]);
    createElement('div', [p1, p2]);

    // a and b share a <p>, c is in a different <p>
    expect(buildInlineInteractionLabel(a)).toBe('blank 1 of 2');
    expect(buildInlineInteractionLabel(b)).toBe('blank 2 of 2');
    expect(buildInlineInteractionLabel(c)).toBe('blank');
  });
});
