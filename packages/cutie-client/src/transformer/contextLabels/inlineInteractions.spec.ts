// spell-checker: ignore colspan
import { beforeEach, describe, expect, it } from 'vitest';
import { labelInlineInteractions } from './inlineInteractions.js';

let idCounter = 0;
const testIdGenerator = () => `s${++idCounter}`;

function resetIds() {
  idCounter = 0;
}

/** Build a DocumentFragment from an HTML string */
function fragmentFromHtml(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

/** Normalize whitespace for comparison (collapse runs, trim) */
function normalizeHtml(html: string): string {
  return html.replace(/\s+/g, ' ').trim();
}


describe('labelInlineInteractions', () => {
  beforeEach(() => {
    resetIds();
  });

  describe('Example 1: Simple text, single interaction', () => {
    it('wraps surrounding text in labeled spans and sets aria-labelledby', () => {
      const fragment = fragmentFromHtml(
        '<p>The year was <input class="cutie-text-entry-interaction"/>.</p>'
      );

      const result = labelInlineInteractions(fragment, testIdGenerator);
      expect(result).toBe(true);

      const p = fragment.querySelector('p')!;
      const input = p.querySelector('input')!;

      // Input should have an id and aria-labelledby
      expect(input.id).toBeTruthy();
      expect(input.getAttribute('aria-labelledby')).toBeTruthy();

      // Before span wraps "The year was "
      const spans = p.querySelectorAll('span[id]');
      const beforeSpan = spans[0]!;
      expect(normalizeHtml(beforeSpan.textContent!)).toContain('The year was');

      // After span wraps "."
      const afterSpan = spans[1]!;
      expect(afterSpan.textContent).toContain('.');

      // aria-labelledby should reference: before span, self, after span
      const labelledBy = input.getAttribute('aria-labelledby')!.split(' ');
      expect(labelledBy).toContain(beforeSpan.id);
      expect(labelledBy).toContain(input.id);
      expect(labelledBy).toContain(afterSpan.id);

      // No aria-describedby for single interaction
      expect(input.hasAttribute('aria-describedby')).toBe(false);
    });
  });

  describe('aria-hidden content', () => {
    it('never labels an interaction, and keeps its place in the DOM', () => {
      const fragment = fragmentFromHtml(
        '<p>The year was <span class="wrap"><input class="cutie-text-entry-interaction"/><span aria-hidden="true" class="hidden">Incorrect. 1066</span></span>.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const input = fragment.querySelector('input')!;
      const labelText = input.getAttribute('aria-labelledby')!.split(' ')
        .filter((id) => id !== input.id)
        .map((id) => fragment.getElementById(id)!.textContent)
        .join(' ');
      expect(normalizeHtml(labelText)).toContain('The year was');
      expect(labelText).not.toContain('Incorrect');

      // Still the input's next sibling, not moved into a context span
      expect(input.nextElementSibling!.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Example 2: Multiple interactions, shared region', () => {
    it('shares span between interactions and adds aria-describedby', () => {
      const fragment = fragmentFromHtml(
        '<p>The year was <input class="cutie-text-entry-interaction"/> and the city was <input class="cutie-text-entry-interaction"/>.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const p = fragment.querySelector('p')!;
      const inputs = p.querySelectorAll('input');
      expect(inputs.length).toBe(2);

      const input1 = inputs[0]!;
      const input2 = inputs[1]!;

      // Both should have aria-labelledby
      const labelledBy1 = input1.getAttribute('aria-labelledby')!.split(' ');
      const labelledBy2 = input2.getAttribute('aria-labelledby')!.split(' ');

      // The shared span " and the city was " should be referenced by both
      // Find all context spans (not description spans)
      const contextSpans = Array.from(p.querySelectorAll('span[id]')).filter(
        (s) => !s.classList.contains('cutie-sr-only')
      );
      expect(contextSpans.length).toBe(3); // before, shared, after

      const sharedSpan = contextSpans[1]!;
      expect(labelledBy1).toContain(sharedSpan.id);
      expect(labelledBy2).toContain(sharedSpan.id);

      // aria-describedby for positional info
      expect(input1.hasAttribute('aria-describedby')).toBe(true);
      expect(input2.hasAttribute('aria-describedby')).toBe(true);

      // Description spans should exist with "blank N of M"
      const descId1 = input1.getAttribute('aria-describedby')!;
      const descId2 = input2.getAttribute('aria-describedby')!;
      const descSpan1 = p.querySelector(`#${descId1}`)!;
      const descSpan2 = p.querySelector(`#${descId2}`)!;

      expect(descSpan1.textContent).toBe('blank 1 of 2');
      expect(descSpan2.textContent).toBe('blank 2 of 2');
      expect(descSpan1.classList.contains('cutie-sr-only')).toBe(true);
      expect(descSpan1.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Example 3: Formatting that does NOT cross boundary', () => {
    it('wraps whole inline element with surrounding text in one span', () => {
      const fragment = fragmentFromHtml(
        '<p>The <strong>Declaration of Independence</strong> was signed in <input class="cutie-text-entry-interaction"/>.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const p = fragment.querySelector('p')!;

      // The <strong> should be inside the before span along with surrounding text
      const contextSpans = Array.from(p.querySelectorAll('span[id]')).filter(
        (s) => !s.classList.contains('cutie-sr-only')
      );

      const beforeSpan = contextSpans[0]!;
      expect(beforeSpan.querySelector('strong')).not.toBeNull();
      expect(normalizeHtml(beforeSpan.textContent!)).toContain(
        'The Declaration of Independence was signed in'
      );
    });
  });

  describe('Example 4: Formatting containing the interaction', () => {
    it('recurses into inline element when it contains an interaction', () => {
      const fragment = fragmentFromHtml(
        '<p>The <strong>color is <input class="cutie-text-entry-interaction"/> and bright</strong>.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const p = fragment.querySelector('p')!;
      const strong = p.querySelector('strong')!;
      const input = p.querySelector('input')!;

      // "The " should be a span at <p> level
      const pSpans = Array.from(p.children).filter(
        (el) =>
          el.tagName === 'SPAN' &&
          el.hasAttribute('id') &&
          !el.classList.contains('cutie-sr-only')
      );
      const outerBeforeSpan = pSpans[0]!;
      expect(normalizeHtml(outerBeforeSpan.textContent!)).toBe('The');

      // "color is " should be a span inside <strong>
      const innerSpans = Array.from(strong.querySelectorAll('span[id]'));
      expect(innerSpans.length).toBeGreaterThanOrEqual(2);

      const innerBeforeSpan = innerSpans[0]!;
      expect(normalizeHtml(innerBeforeSpan.textContent!)).toContain('color is');

      const innerAfterSpan = innerSpans[1]!;
      expect(normalizeHtml(innerAfterSpan.textContent!)).toContain('and bright');

      // "." should be a span at <p> level after <strong>
      const outerAfterSpan = pSpans[pSpans.length - 1]!;
      expect(outerAfterSpan.textContent).toContain('.');

      // aria-labelledby should reference all surrounding spans
      const labelledBy = input.getAttribute('aria-labelledby')!.split(' ');
      expect(labelledBy).toContain(outerBeforeSpan.id);
      expect(labelledBy).toContain(innerBeforeSpan.id);
      expect(labelledBy).toContain(input.id);
      expect(labelledBy).toContain(innerAfterSpan.id);
      expect(labelledBy).toContain(outerAfterSpan.id);
    });
  });

  describe('Example 5: Sentence boundary in text', () => {
    it('splits text at sentence boundary and only labels with immediate sentence', () => {
      const fragment = fragmentFromHtml(
        '<p>First sentence. Second sentence has <input class="cutie-text-entry-interaction"/> in it.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const p = fragment.querySelector('p')!;
      const input = p.querySelector('input')!;

      const contextSpans = Array.from(p.querySelectorAll('span[id]')).filter(
        (s) => !s.classList.contains('cutie-sr-only')
      );

      // "First sentence. " is across a sentence boundary — orphan span unwrapped
      // Only 2 referenced spans remain: "Second sentence has " and " in it."
      expect(contextSpans.length).toBe(2);
      expect(normalizeHtml(contextSpans[0]!.textContent!)).toContain(
        'Second sentence has'
      );

      // "First sentence. " should still exist as plain text (unwrapped from span)
      expect(p.textContent).toContain('First sentence.');

      // Only the immediate sentence's spans should be in aria-labelledby
      const labelledBy = input.getAttribute('aria-labelledby')!.split(' ');
      expect(labelledBy).toContain(contextSpans[0]!.id);
      expect(labelledBy).toContain(input.id);
      expect(labelledBy).toContain(contextSpans[1]!.id);
    });
  });

  describe('Example 6: Sentence boundary inside formatting element', () => {
    it('recurses into formatting element and only labels with immediate sentence', () => {
      const fragment = fragmentFromHtml(
        '<p><em>First sent. Second sent</em> has <input class="cutie-text-entry-interaction"/>.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const p = fragment.querySelector('p')!;
      const em = p.querySelector('em')!;
      const input = p.querySelector('input')!;

      // Inside <em>, "First sent." is across a sentence boundary — orphan span unwrapped
      // Only "Second sent" remains as a span inside <em>
      const emSpans = em.querySelectorAll('span[id]');
      expect(emSpans.length).toBe(1);

      expect(emSpans[0]!.textContent).toContain('Second sent');

      // "First sent." should still exist as plain text inside <em>
      expect(em.textContent).toContain('First sent.');

      // " has " should be a span at <p> level
      const pLevelSpans = Array.from(p.children).filter(
        (el) =>
          el.tagName === 'SPAN' &&
          el.hasAttribute('id') &&
          !el.classList.contains('cutie-sr-only') &&
          el.parentElement === p
      );
      const hasSpan = pLevelSpans.find((s) =>
        normalizeHtml(s.textContent!).includes('has')
      );
      expect(hasSpan).toBeTruthy();

      // Only spans from the immediate sentence should be in aria-labelledby
      const labelledBy = input.getAttribute('aria-labelledby')!.split(' ');
      expect(labelledBy).toContain(emSpans[0]!.id);
      expect(labelledBy).toContain(hasSpan!.id);
      expect(labelledBy).toContain(input.id);
    });
  });

  describe('Example 7: MathML - atomic wrapping', () => {
    it('wraps math element atomically with surrounding text', () => {
      const fragment = fragmentFromHtml(
        '<p>Solve <math><mi>x</mi><mo>+</mo><mn>2</mn></math> = <input class="cutie-text-entry-interaction"/>.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const p = fragment.querySelector('p')!;

      // The math element should be inside a span along with surrounding text
      const contextSpans = Array.from(p.querySelectorAll(':scope > span[id]')).filter(
        (s) => !s.classList.contains('cutie-sr-only')
      );

      const beforeSpan = contextSpans[0]!;
      expect(beforeSpan.querySelector('math')).not.toBeNull();
      expect(beforeSpan.textContent).toContain('Solve');
    });
  });

  describe('Example 8: Mixed interaction types', () => {
    it('handles both select and input interactions', () => {
      const fragment = fragmentFromHtml(
        '<p>Choose <select class="cutie-inline-choice-interaction"><option>A</option></select> and type <input class="cutie-text-entry-interaction"/>.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const p = fragment.querySelector('p')!;
      const select = p.querySelector('select')!;
      const input = p.querySelector('input')!;

      // Both should have aria-labelledby
      expect(select.getAttribute('aria-labelledby')).toBeTruthy();
      expect(input.getAttribute('aria-labelledby')).toBeTruthy();

      // Both should have aria-describedby (2 interactions)
      expect(select.hasAttribute('aria-describedby')).toBe(true);
      expect(input.hasAttribute('aria-describedby')).toBe(true);

      // Description spans
      const descId1 = select.getAttribute('aria-describedby')!;
      const descId2 = input.getAttribute('aria-describedby')!;
      expect(p.querySelector(`#${descId1}`)!.textContent).toBe('blank 1 of 2');
      expect(p.querySelector(`#${descId2}`)!.textContent).toBe('blank 2 of 2');
    });
  });

  describe('Sentence boundaries limit label scope across interactions', () => {
    it('does not include spans past a sentence boundary in aria-labelledby', () => {
      // Reproduces bug: "signed in year [input1]. The document was adopted in [input2], PA."
      // input1's after-label should stop at "." and NOT include the next sentence.
      // input2's before-label should start at the next sentence, not reach back to input1's before.
      const fragment = fragmentFromHtml(
        '<p>The year was <input class="cutie-text-entry-interaction"/>. The city was <input class="cutie-text-entry-interaction"/>, Pennsylvania.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const p = fragment.querySelector('p')!;
      const inputs = p.querySelectorAll('input');
      const input1 = inputs[0]!;
      const input2 = inputs[1]!;

      const contextSpans = Array.from(p.querySelectorAll('span[id]')).filter(
        (s) => !s.classList.contains('cutie-sr-only')
      );

      // Expected spans:
      // s1: "The year was "
      // s2: ". " (sentence boundary — after input1)
      // s3: "The city was " (before input2)
      // s4: ", Pennsylvania." (after input2)

      const labelledBy1 = input1.getAttribute('aria-labelledby')!.split(' ');
      const labelledBy2 = input2.getAttribute('aria-labelledby')!.split(' ');

      // input1 should reference: "The year was", self, "."
      // It should NOT reference "The city was" (that's past the sentence boundary)
      expect(labelledBy1.length).toBe(3); // before + self + after(period)

      // input2 should reference: "The city was", self, ", Pennsylvania."
      // It should NOT reference "The year was" or "."
      expect(labelledBy2.length).toBe(3); // before + self + after

      // The spans referenced by input1 and input2 should not overlap
      const set1 = new Set(labelledBy1);
      const set2 = new Set(labelledBy2);
      // Remove self-references for comparison
      set1.delete(input1.id);
      set2.delete(input2.id);
      // The context span sets should be disjoint
      for (const id of set1) {
        expect(set2.has(id)).toBe(false);
      }

      // Verify the "." span is only in input1's label
      const periodSpan = contextSpans.find(
        (s) => normalizeHtml(s.textContent!) === '.'
      );
      expect(periodSpan).toBeTruthy();
      expect(labelledBy1).toContain(periodSpan!.id);
      expect(labelledBy2).not.toContain(periodSpan!.id);
    });

    it('limits labels to immediate context with 3+ interactions across sentences', () => {
      const fragment = fragmentFromHtml(
        '<p>Year <input class="cutie-text-entry-interaction"/>. City <input class="cutie-text-entry-interaction"/>. Count <input class="cutie-text-entry-interaction"/> total.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const inputs = fragment.querySelectorAll('input');
      const labelledBy1 = inputs[0]!.getAttribute('aria-labelledby')!.split(' ');
      const labelledBy2 = inputs[1]!.getAttribute('aria-labelledby')!.split(' ');
      const labelledBy3 = inputs[2]!.getAttribute('aria-labelledby')!.split(' ');

      // input1: "Year" + self + ". " = 3 parts
      expect(labelledBy1.length).toBe(3);
      // input2: "City" + self + ". " = 3 parts
      expect(labelledBy2.length).toBe(3);
      // input3: "Count" + self + "total." = 3 parts
      expect(labelledBy3.length).toBe(3);

      // No overlap between non-adjacent interactions
      const refs1 = new Set(labelledBy1);
      const refs3 = new Set(labelledBy3);
      refs1.delete(inputs[0]!.id);
      refs3.delete(inputs[2]!.id);
      for (const id of refs1) {
        expect(refs3.has(id)).toBe(false);
      }
    });
  });

  describe('Edge cases', () => {
    it('returns false when no interactions are found', () => {
      const fragment = fragmentFromHtml('<p>Just some text.</p>');
      const result = labelInlineInteractions(fragment, testIdGenerator);
      expect(result).toBe(false);
    });

    it('falls back to aria-label for bare interaction with no text', () => {
      const fragment = fragmentFromHtml(
        '<p><input class="cutie-text-entry-interaction"/></p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const input = fragment.querySelector('input')!;
      expect(input.getAttribute('aria-label')).toBe('blank');
      // Should not have aria-labelledby since there are no text spans
      expect(input.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('falls back to aria-label with positional info for multiple bare interactions', () => {
      const fragment = fragmentFromHtml(
        '<p><input class="cutie-text-entry-interaction"/><input class="cutie-text-entry-interaction"/></p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const inputs = fragment.querySelectorAll('input');
      expect(inputs[0]!.getAttribute('aria-label')).toBe('blank 1 of 2');
      expect(inputs[1]!.getAttribute('aria-label')).toBe('blank 2 of 2');
    });

    it('skips already-annotated interactions (has aria-labelledby)', () => {
      const fragment = fragmentFromHtml(
        '<p>Text <input class="cutie-text-entry-interaction" aria-labelledby="existing"/> more.</p>'
      );

      const result = labelInlineInteractions(fragment, testIdGenerator);
      expect(result).toBe(false);

      const input = fragment.querySelector('input')!;
      // Should not be modified
      expect(input.getAttribute('aria-labelledby')).toBe('existing');
    });

    it('does not wrap already-annotated interactions in a span', () => {
      const fragment = fragmentFromHtml(
        '<p>Before <input class="cutie-text-entry-interaction" aria-labelledby="existing"/> after <input class="cutie-text-entry-interaction"/>.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const p = fragment.querySelector('p')!;
      const inputs = p.querySelectorAll('input');
      const annotatedInput = inputs[0]!;
      const unannotatedInput = inputs[1]!;

      // The already-annotated interaction should remain a direct child of <p>, not wrapped
      expect(annotatedInput.parentElement).toBe(p);
      expect(annotatedInput.getAttribute('aria-labelledby')).toBe('existing');

      // The unannotated interaction should get annotated
      expect(unannotatedInput.getAttribute('aria-labelledby')).toBeTruthy();
    });

    it('treats <br> as a span boundary', () => {
      const fragment = fragmentFromHtml(
        '<p>Before break<br/>after break has <input class="cutie-text-entry-interaction"/>.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const p = fragment.querySelector('p')!;
      const input = p.querySelector('input')!;
      const labelledBy = input.getAttribute('aria-labelledby')!.split(' ');

      // "Before break" is across a region boundary (br), so it should NOT be
      // in the label. Only "after break has" and "." should be referenced.
      const contextSpans = Array.from(p.querySelectorAll('span[id]')).filter(
        (s) => !s.classList.contains('cutie-sr-only')
      );

      // "Before break" span should be unwrapped (orphan), leaving 2 context spans
      expect(contextSpans.length).toBe(2);
      expect(contextSpans[0]!.textContent).toContain('after break has');

      // The text "Before break" should still exist as plain text, not in a span
      expect(p.textContent).toContain('Before break');

      // aria-labelledby should not reference "Before break"
      expect(labelledBy.length).toBe(3); // before + self + after
    });

    it('skips whitespace-only groups', () => {
      const fragment = fragmentFromHtml(
        '<p>   <input class="cutie-text-entry-interaction"/>   </p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const p = fragment.querySelector('p')!;
      const input = p.querySelector('input')!;

      // No context spans should be created for whitespace-only groups
      const contextSpans = Array.from(p.querySelectorAll('span[id]')).filter(
        (s) => !s.classList.contains('cutie-sr-only')
      );
      expect(contextSpans.length).toBe(0);

      // Should fall back to aria-label
      expect(input.getAttribute('aria-label')).toBe('blank');
    });

    it('unwraps orphan context spans after last interaction', () => {
      const fragment = fragmentFromHtml(
        '<p><input class="cutie-text-entry-interaction"/> first. second. third.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const p = fragment.querySelector('p')!;
      const input = p.querySelector('input')!;

      // The input should have aria-labelledby referencing only the first segment after it
      const labelledBy = input.getAttribute('aria-labelledby')!.split(' ');

      // All context spans in the DOM should be referenced by some aria-labelledby
      const contextSpans = Array.from(p.querySelectorAll('span[id]')).filter(
        (s) => !s.classList.contains('cutie-sr-only')
      );
      for (const span of contextSpans) {
        expect(labelledBy).toContain(span.id);
      }

      // The text "second. third." should NOT be wrapped in spans (orphan spans unwrapped)
      // Only the first segment after the interaction should remain as a span
      expect(contextSpans.length).toBe(1);
    });

    it('handles interaction at start of block (no before text)', () => {
      const fragment = fragmentFromHtml(
        '<p><input class="cutie-text-entry-interaction"/> was the year.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const input = fragment.querySelector('input')!;
      const labelledBy = input.getAttribute('aria-labelledby')!.split(' ');

      // Should have self and after span
      expect(labelledBy).toContain(input.id);
      expect(labelledBy.length).toBeGreaterThanOrEqual(2);
    });

    it('handles interaction at end of block (no after text)', () => {
      const fragment = fragmentFromHtml(
        '<p>The year was <input class="cutie-text-entry-interaction"/></p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const input = fragment.querySelector('input')!;
      const labelledBy = input.getAttribute('aria-labelledby')!.split(' ');

      // Should have before span and self
      expect(labelledBy).toContain(input.id);
      expect(labelledBy.length).toBeGreaterThanOrEqual(2);
    });

    it('processes multiple block elements independently', () => {
      const fragment = fragmentFromHtml(
        '<p>First <input class="cutie-text-entry-interaction"/>.</p><p>Second <input class="cutie-text-entry-interaction"/>.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const inputs = fragment.querySelectorAll('input');
      expect(inputs.length).toBe(2);

      // Each should have its own aria-labelledby
      expect(inputs[0]!.getAttribute('aria-labelledby')).toBeTruthy();
      expect(inputs[1]!.getAttribute('aria-labelledby')).toBeTruthy();

      // Single interactions per block — no aria-describedby
      expect(inputs[0]!.hasAttribute('aria-describedby')).toBe(false);
      expect(inputs[1]!.hasAttribute('aria-describedby')).toBe(false);
    });

    it('handles img as atomic element', () => {
      const fragment = fragmentFromHtml(
        '<p>Look at <img alt="diagram" src="x.png"/> then answer <input class="cutie-text-entry-interaction"/>.</p>'
      );

      labelInlineInteractions(fragment, testIdGenerator);

      const p = fragment.querySelector('p')!;
      const input = p.querySelector('input')!;

      // img should be inside a span with surrounding text
      const contextSpans = Array.from(p.querySelectorAll(':scope > span[id]')).filter(
        (s) => !s.classList.contains('cutie-sr-only')
      );
      const beforeSpan = contextSpans[0]!;
      expect(beforeSpan.querySelector('img')).not.toBeNull();
      expect(input.getAttribute('aria-labelledby')).toBeTruthy();
    });
  });
});

describe('block elements beside an interaction', () => {
  beforeEach(() => {
    resetIds();
  });

  /** The text an interaction's aria-labelledby names, without the interaction itself */
  function labelText(fragment: DocumentFragment, input: Element): string {
    return input.getAttribute('aria-labelledby')!.split(' ')
      .filter((id) => id !== input.id)
      .map((id) => normalizeHtml(fragment.getElementById(id)!.textContent!))
      .join(' ');
  }

  it('leaves a heading before the interaction out of its label', () => {
    const fragment = fragmentFromHtml(
      '<h2>Vitals</h2> Enter the dose <input class="cutie-text-entry-interaction"/>'
    );

    labelInlineInteractions(fragment, testIdGenerator);

    expect(labelText(fragment, fragment.querySelector('input')!)).toBe('Enter the dose');
    expect(fragment.querySelector('h2')!.parentNode).toBe(fragment);
  });

  it('leaves a heading out inside a div', () => {
    const fragment = fragmentFromHtml(
      '<div><h2>Vitals</h2> Enter the dose <input class="cutie-text-entry-interaction"/></div>'
    );

    labelInlineInteractions(fragment, testIdGenerator);

    expect(labelText(fragment, fragment.querySelector('input')!)).toBe('Enter the dose');
    expect(fragment.querySelector('h2')!.parentElement!.tagName).toBe('DIV');
  });

  it('labels an interaction inside a heading from the heading text', () => {
    const fragment = fragmentFromHtml(
      '<h3>Dose: <input class="cutie-text-entry-interaction"/></h3>'
    );

    labelInlineInteractions(fragment, testIdGenerator);

    expect(labelText(fragment, fragment.querySelector('input')!)).toBe('Dose:');
  });

  it('leaves a list after the interaction out of its label', () => {
    const fragment = fragmentFromHtml(
      '<div>Dose <input class="cutie-text-entry-interaction"/><ul><li>Note</li></ul></div>'
    );

    labelInlineInteractions(fragment, testIdGenerator);

    expect(labelText(fragment, fragment.querySelector('input')!)).toBe('Dose');
    expect(fragment.querySelector('ul')!.parentElement!.tagName).toBe('DIV');
  });

  it('leaves a table after the interaction out of its label', () => {
    const fragment = fragmentFromHtml(
      'Dose <input class="cutie-text-entry-interaction"/><table><tr><td>Weight</td></tr></table>'
    );

    labelInlineInteractions(fragment, testIdGenerator);

    expect(labelText(fragment, fragment.querySelector('input')!)).toBe('Dose');
    expect(fragment.querySelector('table')!.parentNode).toBe(fragment);
  });

  it('keeps labels from carrying across a block between two interactions', () => {
    const fragment = fragmentFromHtml(
      '<div>Dose <input class="cutie-text-entry-interaction"/> mg<h2>Next</h2>Rate <input class="cutie-text-entry-interaction"/> per min</div>'
    );

    labelInlineInteractions(fragment, testIdGenerator);

    const [first, second] = Array.from(fragment.querySelectorAll('input'));
    expect(labelText(fragment, first!)).toBe('Dose mg');
    expect(labelText(fragment, second!)).toBe('Rate per min');
  });

  it('keeps labels from carrying across sibling paragraphs at the root', () => {
    const fragment = fragmentFromHtml(
      'Dose <input class="cutie-text-entry-interaction"/> mg<p>Aside</p>Rate <input class="cutie-text-entry-interaction"/> per min'
    );

    labelInlineInteractions(fragment, testIdGenerator);

    const [first, second] = Array.from(fragment.querySelectorAll('input'));
    expect(labelText(fragment, first!)).toBe('Dose mg');
    expect(labelText(fragment, second!)).toBe('Rate per min');
  });

  it('leaves a video before the interaction out of its label', () => {
    const fragment = fragmentFromHtml(
      '<div><video src="clip.mp4">Fallback text</video> Rate <input class="cutie-text-entry-interaction"/></div>'
    );

    labelInlineInteractions(fragment, testIdGenerator);

    expect(labelText(fragment, fragment.querySelector('input')!)).toBe('Rate');
    expect(fragment.querySelector('video')!.parentElement!.tagName).toBe('DIV');
  });
});

describe('interactions in table cells', () => {
  beforeEach(() => {
    resetIds();
  });

  const SELECT = '<select class="cutie-inline-choice-interaction"></select>';

  /** The text each id in an interaction's aria-labelledby names */
  function labelParts(fragment: DocumentFragment, el: Element): string[] {
    return el.getAttribute('aria-labelledby')!.split(' ')
      .map((id) => normalizeHtml(fragment.getElementById(id)!.textContent!));
  }

  function annotateTable(html: string): DocumentFragment {
    const fragment = fragmentFromHtml(html);
    labelInlineInteractions(fragment, testIdGenerator);
    return fragment;
  }

  it('labels an interaction by its row header then its column header', () => {
    const fragment = annotateTable(`<table>
      <caption>Findings</caption>
      <thead><tr><th scope="col">Finding</th><th scope="col">Admission</th><th scope="col">Status</th></tr></thead>
      <tbody>
        <tr><th scope="row">Temperature</th><td>39.2 °C</td><td>${SELECT}</td></tr>
        <tr><th scope="row">Respiratory rate</th><td>28/min</td><td>${SELECT}</td></tr>
      </tbody>
    </table>`);

    const [first, second] = Array.from(fragment.querySelectorAll('select'));
    expect(labelParts(fragment, first!)).toEqual(['Temperature', 'Status']);
    expect(labelParts(fragment, second!)).toEqual(['Respiratory rate', 'Status']);
    expect(first!.hasAttribute('aria-label')).toBe(false);
  });

  it('finds headers without scope attributes', () => {
    const fragment = annotateTable(`<table>
      <tr><th>Finding</th><th>Status</th></tr>
      <tr><th>Temperature</th><td>${SELECT}</td></tr>
    </table>`);

    expect(labelParts(fragment, fragment.querySelector('select')!)).toEqual(['Temperature', 'Status']);
  });

  it('labels by the column header alone when the row has none', () => {
    const fragment = annotateTable(`<table>
      <thead><tr><th>Finding</th><th>Status</th></tr></thead>
      <tbody><tr><td>Temperature</td><td>${SELECT}</td></tr></tbody>
    </table>`);

    expect(labelParts(fragment, fragment.querySelector('select')!)).toEqual(['Status']);
  });

  it('labels by the row header alone when the column has none', () => {
    const fragment = annotateTable(`<table>
      <tr><th scope="row">Temperature</th><td>${SELECT}</td></tr>
    </table>`);

    expect(labelParts(fragment, fragment.querySelector('select')!)).toEqual(['Temperature']);
  });

  it('skips headers with no text', () => {
    const fragment = annotateTable(`<table>
      <thead><tr><th>Finding</th><th></th></tr></thead>
      <tbody><tr><th scope="row">Temperature</th><td>${SELECT}</td></tr></tbody>
    </table>`);

    expect(labelParts(fragment, fragment.querySelector('select')!)).toEqual(['Temperature']);
  });

  it('uses the headers the cell names in its headers attribute', () => {
    const fragment = annotateTable(`<table>
      <tr><th id="status">Status</th><th id="temp">Temperature</th></tr>
      <tr><td headers="temp status">${SELECT}</td><td></td></tr>
    </table>`);

    const select = fragment.querySelector('select')!;
    expect(select.getAttribute('aria-labelledby')).toBe('temp status');
  });

  it('keeps an id a header already has', () => {
    const fragment = annotateTable(`<table>
      <tr><th id="status-header">Status</th></tr>
      <tr><td>${SELECT}</td></tr>
    </table>`);

    expect(fragment.querySelector('select')!.getAttribute('aria-labelledby')).toBe('status-header');
  });

  it('labels an interaction wrapped in a paragraph inside the cell', () => {
    const fragment = annotateTable(`<table>
      <thead><tr><th>Finding</th><th>Status</th></tr></thead>
      <tbody><tr><th scope="row">Temperature</th><td><p>${SELECT}</p></td></tr></tbody>
    </table>`);

    expect(labelParts(fragment, fragment.querySelector('select')!)).toEqual(['Temperature', 'Status']);
  });

  it('prefers text in the cell over the headers', () => {
    const fragment = annotateTable(`<table>
      <thead><tr><th>Finding</th><th>Order</th></tr></thead>
      <tbody><tr><th scope="row">Temperature</th><td>Give ${SELECT} now</td></tr></tbody>
    </table>`);

    const select = fragment.querySelector('select')!;
    const text = labelParts(fragment, select).filter((part) => part !== '');
    expect(text).toEqual(['Give', 'now']);
    expect(fragment.querySelectorAll('th[id]')).toHaveLength(0);
  });

  it('gives the positions of several interactions in one cell', () => {
    const fragment = annotateTable(`<table>
      <tr><th scope="row">Temperature</th><td>${SELECT}${SELECT}</td></tr>
    </table>`);

    const [first, second] = Array.from(fragment.querySelectorAll('select'));
    expect(labelParts(fragment, first!)).toEqual(['Temperature']);
    expect(labelParts(fragment, second!)).toEqual(['Temperature']);
    expect(fragment.getElementById(first!.getAttribute('aria-describedby')!)!.textContent).toBe('blank 1 of 2');
    expect(fragment.getElementById(second!.getAttribute('aria-describedby')!)!.textContent).toBe('blank 2 of 2');
  });

  it('falls back to "blank" in a table with spanned cells', () => {
    const fragment = annotateTable(`<table>
      <tr><th colspan="2">Status</th></tr>
      <tr><th scope="row">Temperature</th><td>${SELECT}</td></tr>
    </table>`);

    const select = fragment.querySelector('select')!;
    expect(select.hasAttribute('aria-labelledby')).toBe(false);
    expect(select.getAttribute('aria-label')).toBe('blank');
  });

  it('falls back to "blank" in a table with no headers', () => {
    const fragment = annotateTable(`<table><tr><td>Temperature</td><td>${SELECT}</td></tr></table>`);

    expect(fragment.querySelector('select')!.getAttribute('aria-label')).toBe('blank');
  });
});
