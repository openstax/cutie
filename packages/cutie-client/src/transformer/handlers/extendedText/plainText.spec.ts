import { beforeEach, describe, expect, it } from 'vitest';
import { ItemStateImpl } from '../../../state/itemState';
import { registry } from '../../registry';
import type { TransformContext } from '../../types';

// Side-effect import to register the handler
import './plainText';

function createQtiDocument(interactionHtml: string): Document {
  const html = `
    <html>
      <body>
        <qti-item-body>${interactionHtml}</qti-item-body>
      </body>
    </html>
  `;
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

function transformInteraction(
  doc: Document,
  itemState: ItemStateImpl
): DocumentFragment {
  const interaction = doc.querySelector('qti-extended-text-interaction')!;

  const context: TransformContext = {
    itemState,
    transformChildren: (el: Element) => {
      const frag = document.createDocumentFragment();
      for (const child of Array.from(el.childNodes)) {
        frag.appendChild(child.cloneNode(true));
      }
      return frag;
    },
  };

  const handler = registry.getAll().find((r) => r.handler.canHandle(interaction));
  return handler!.handler.transform(interaction, context);
}

describe('extendedTextInteraction', () => {
  let itemState: ItemStateImpl;

  beforeEach(() => {
    itemState = new ItemStateImpl();
  });

  describe('missing response-identifier', () => {
    it('renders error element when response-identifier is absent', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction></qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('textarea')).toBeNull();
      expect(container.querySelector('.cutie-error-display')).not.toBeNull();
    });
  });

  describe('textarea rendering', () => {
    it('renders textarea with correct class and data-response-identifier', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="RESPONSE">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      expect(textarea).not.toBeNull();
      expect(textarea.className).toBe('cutie-extended-text-response');
      expect(textarea.getAttribute('data-response-identifier')).toBe('RESPONSE');
    });
  });

  describe('qti-prompt rendering', () => {
    it('renders prompt div with correct id and links textarea via aria-labelledby', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
          <qti-prompt>Describe your answer</qti-prompt>
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const promptDiv = container.querySelector('.cutie-prompt')!;
      expect(promptDiv).not.toBeNull();
      expect(promptDiv.id).toBe('prompt-R1');
      expect(promptDiv.textContent).toContain('Describe your answer');

      const textarea = container.querySelector('textarea')!;
      expect(textarea.getAttribute('aria-labelledby')).toBe('prompt-R1');
    });

    it('sets aria-label fallback when no prompt is present', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      expect(textarea.getAttribute('aria-label')).toBe('Response input');
      expect(textarea.hasAttribute('aria-labelledby')).toBe(false);
    });
  });

  describe('expected-lines sizing', () => {
    it('sets minHeight based on expected-lines attribute', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" expected-lines="10">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      expect(textarea.style.minHeight).toBe('14em');
    });

    it('enforces a minimum of 3em for small line counts', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" expected-lines="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      expect(textarea.style.minHeight).toBe('3em');
    });
  });

  describe('default value', () => {
    it('pre-populates textarea from qti-default-value', () => {
      const doc = createQtiDocument(`
        <qti-response-declaration identifier="R1" cardinality="single" base-type="string">
          <qti-default-value>
            <qti-value>Pre-filled text</qti-value>
          </qti-default-value>
        </qti-response-declaration>
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      expect(textarea.value).toBe('Pre-filled text');
    });
  });

  describe('response accessor', () => {
    it('trims whitespace from response value', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = '  hello world  ';

      const result = itemState.collectAll();
      expect(result.responses).toEqual({ R1: 'hello world' });
    });

    it('returns null for empty string', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = '';

      const result = itemState.collectAll();
      expect(result.responses).toEqual({ R1: null });
    });

    it('returns null for whitespace-only input', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = '   \n\t  ';

      const result = itemState.collectAll();
      expect(result.responses).toEqual({ R1: null });
    });
  });

  describe('disabled state', () => {
    it('disables textarea when interactions are disabled', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      expect(textarea.disabled).toBe(false);

      itemState.setInteractionsEnabled(false);
      expect(textarea.disabled).toBe(true);

      itemState.setInteractionsEnabled(true);
      expect(textarea.disabled).toBe(false);
    });
  });

  describe('placeholder-text', () => {
    it('sets textarea placeholder from placeholder-text attribute', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" placeholder-text="Type your answer here...">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      expect(textarea.placeholder).toBe('Type your answer here...');
    });

    it('does not set placeholder when placeholder-text is absent', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      expect(textarea.placeholder).toBe('');
    });
  });

  describe('constraint text rendering', () => {
    it('does not render constraint text when min-strings is absent', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('.cutie-constraint-text')).toBeNull();
    });

    it('does not render constraint text when min-strings="0"', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="0">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('.cutie-constraint-text')).toBeNull();
    });

    it('renders "Enter a response." when min-strings="1"', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const constraintEl = container.querySelector('.cutie-constraint-text');
      expect(constraintEl).not.toBeNull();
      expect(constraintEl!.textContent).toBe('Enter a response.');
    });

    it('renders "Enter at least N responses." when min-strings > 1', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="3">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const constraintEl = container.querySelector('.cutie-constraint-text');
      expect(constraintEl).not.toBeNull();
      expect(constraintEl!.textContent).toBe('Enter at least 3 responses.');
    });

    it('sets aria-describedby on textarea linking to constraint text', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(textarea.getAttribute('aria-describedby')).toBe(constraintEl.id);
    });
  });

  describe('accessor validation', () => {
    it('returns valid:true when min-strings is absent', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(result.responses).toEqual({ R1: null });
    });

    it('returns valid:true when min-strings constraint is met', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'Some response';

      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(result.responses).toEqual({ R1: 'Some response' });
    });

    it('returns valid:false when min-strings constraint is not met', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const result = itemState.collectAll();
      expect(result.valid).toBe(false);
      expect(result.invalidCount).toBe(1);
    });

    it('sets aria-invalid and error class when invalid', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      itemState.collectAll();

      const textarea = container.querySelector('textarea')!;
      expect(textarea.getAttribute('aria-invalid')).toBe('true');

      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(constraintEl.classList.contains('cutie-constraint-error')).toBe(true);
    });

    it('clears error state when response becomes valid', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;

      // First: invalid (empty)
      itemState.collectAll();
      expect(textarea.getAttribute('aria-invalid')).toBe('true');

      // Second: valid (has content)
      textarea.value = 'Response';
      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(textarea.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('clearing errors on input', () => {
    it('clears error when min-strings violation is resolved by typing', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      const constraintEl = container.querySelector('.cutie-constraint-text')!;

      // Trigger validation error
      itemState.collectAll();
      expect(textarea.getAttribute('aria-invalid')).toBe('true');
      expect(constraintEl.classList.contains('cutie-constraint-error')).toBe(true);

      // User types valid content — error clears
      textarea.value = 'hello';
      textarea.dispatchEvent(new Event('input'));
      expect(textarea.hasAttribute('aria-invalid')).toBe(false);
      expect(constraintEl.classList.contains('cutie-constraint-error')).toBe(false);
    });

    it('keeps error when min-strings violation is not resolved', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;

      // Trigger validation error
      itemState.collectAll();
      expect(textarea.getAttribute('aria-invalid')).toBe('true');

      // User types only whitespace — still invalid
      textarea.value = '   ';
      textarea.dispatchEvent(new Event('input'));
      expect(textarea.getAttribute('aria-invalid')).toBe('true');
    });

    it('clears error when pattern-mask violation is resolved', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" pattern-mask="^\\d+$">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'abc';

      // Trigger validation error
      itemState.collectAll();
      expect(textarea.getAttribute('aria-invalid')).toBe('true');

      // Still invalid — different non-matching text
      textarea.value = 'xyz';
      textarea.dispatchEvent(new Event('input'));
      expect(textarea.getAttribute('aria-invalid')).toBe('true');

      // Now valid
      textarea.value = '123';
      textarea.dispatchEvent(new Event('input'));
      expect(textarea.hasAttribute('aria-invalid')).toBe(false);
    });

    it('clears error when max-characters violation is resolved', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" data-max-characters="10">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'way too long for the limit';

      // Trigger validation error
      itemState.collectAll();
      expect(textarea.getAttribute('aria-invalid')).toBe('true');

      // Still over limit
      textarea.value = 'still too long';
      textarea.dispatchEvent(new Event('input'));
      expect(textarea.getAttribute('aria-invalid')).toBe('true');

      // Now under limit
      textarea.value = 'short';
      textarea.dispatchEvent(new Event('input'));
      expect(textarea.hasAttribute('aria-invalid')).toBe(false);
    });

    it('clears error when min-characters violation is resolved', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" data-min-characters="5">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'hi';

      // Trigger validation error
      itemState.collectAll();
      expect(textarea.getAttribute('aria-invalid')).toBe('true');

      // Still under minimum
      textarea.value = 'hey';
      textarea.dispatchEvent(new Event('input'));
      expect(textarea.getAttribute('aria-invalid')).toBe('true');

      // Now meets minimum
      textarea.value = 'hello';
      textarea.dispatchEvent(new Event('input'));
      expect(textarea.hasAttribute('aria-invalid')).toBe(false);
    });

    it('resets constraint text to initial message when error clears', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          min-strings="1" pattern-mask="^\\d+$"
          data-patternmask-message="Numbers only">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      const constraintEl = container.querySelector('.cutie-constraint-text')!;

      // Initial text is the min-strings message
      expect(constraintEl.textContent).toBe('Enter a response.');

      // Empty submit → min-strings error
      itemState.collectAll();
      expect(constraintEl.textContent).toBe('Enter a response.');

      // Non-matching input → pattern error
      textarea.value = 'abc';
      textarea.dispatchEvent(new Event('input'));
      expect(constraintEl.textContent).toBe('Numbers only');

      // Valid input → resets to initial neutral text
      textarea.value = '123';
      textarea.dispatchEvent(new Event('input'));
      expect(constraintEl.textContent).toBe('Enter a response.');
      expect(constraintEl.classList.contains('cutie-constraint-error')).toBe(false);
    });

    it('does not run validation when no prior error exists', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'hello';
      textarea.dispatchEvent(new Event('input'));

      expect(textarea.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('height-lines vocab classes', () => {
    it('forwards source classes to container', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" class="qti-height-lines-3">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const interactionDiv = container.querySelector('.cutie-extended-text-interaction')!;
      expect(interactionDiv.classList.contains('qti-height-lines-3')).toBe(true);
    });

    it('forwards qti-height-lines-6 class', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" class="qti-height-lines-6">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const interactionDiv = container.querySelector('.cutie-extended-text-interaction')!;
      expect(interactionDiv.classList.contains('qti-height-lines-6')).toBe(true);
    });

    it('forwards qti-height-lines-15 class', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" class="qti-height-lines-15">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const interactionDiv = container.querySelector('.cutie-extended-text-interaction')!;
      expect(interactionDiv.classList.contains('qti-height-lines-15')).toBe(true);
    });
  });

  describe('character counter', () => {
    it('does not render counter when expected-length is absent (even with counter class)', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" class="qti-counter-up">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('.cutie-character-counter')).toBeNull();
    });

    it('does not render counter when no counter class (even with expected-length)', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" expected-length="200">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('.cutie-character-counter')).toBeNull();
    });

    it('counter-up renders with initial "0 / 200 suggested characters"', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          expected-length="200" class="qti-counter-up">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const counter = container.querySelector('.cutie-character-counter')!;
      expect(counter).not.toBeNull();
      expect(counter.textContent).toBe('0 / 200 suggested characters');
    });

    it('counter-down renders with initial "200 suggested characters remaining"', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          expected-length="200" class="qti-counter-down">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const counter = container.querySelector('.cutie-character-counter')!;
      expect(counter).not.toBeNull();
      expect(counter.textContent).toBe('200 suggested characters remaining');
    });

    it('counter-up updates on textarea input event', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          expected-length="200" class="qti-counter-up">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'hello';
      textarea.dispatchEvent(new Event('input'));

      const counter = container.querySelector('.cutie-character-counter')!;
      expect(counter.textContent).toBe('5 / 200 suggested characters');
    });

    it('counter-down updates on textarea input event', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          expected-length="200" class="qti-counter-down">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'hello';
      textarea.dispatchEvent(new Event('input'));

      const counter = container.querySelector('.cutie-character-counter')!;
      expect(counter.textContent).toBe('195 suggested characters remaining');
    });

    it('counter-down shows over-limit text and cutie-counter-over class', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          expected-length="5" class="qti-counter-down">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'hello world';
      textarea.dispatchEvent(new Event('input'));

      const counter = container.querySelector('.cutie-character-counter')!;
      expect(counter.textContent).toBe('6 characters over suggested size');
      expect(counter.classList.contains('cutie-counter-over')).toBe(true);
    });

    it('has aria-live="polite" and aria-atomic="true"', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          expected-length="200" class="qti-counter-up">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const counter = container.querySelector('.cutie-character-counter')!;
      expect(counter.getAttribute('aria-live')).toBe('polite');
      expect(counter.getAttribute('aria-atomic')).toBe('true');
    });

    it('initializes counter with default value length', () => {
      const doc = createQtiDocument(`
        <qti-response-declaration identifier="R1" cardinality="single" base-type="string">
          <qti-default-value>
            <qti-value>Pre-filled</qti-value>
          </qti-default-value>
        </qti-response-declaration>
        <qti-extended-text-interaction response-identifier="R1"
          expected-length="200" class="qti-counter-up">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const counter = container.querySelector('.cutie-character-counter')!;
      expect(counter.textContent).toBe('10 / 200 suggested characters');
    });

    it('DOM order: textarea > footer with constraint + counter', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          expected-length="200" class="qti-counter-up" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const interaction = container.querySelector('.cutie-extended-text-interaction')!;
      const children = Array.from(interaction.children);
      const textareaIdx = children.findIndex(c => c.tagName === 'TEXTAREA');
      const footerIdx = children.findIndex(c => c.classList.contains('cutie-interaction-footer'));

      expect(textareaIdx).toBeLessThan(footerIdx);

      // Inside the footer: constraint first (left), counter second (right)
      const footer = interaction.querySelector('.cutie-interaction-footer')!;
      const footerChildren = Array.from(footer.children);
      const constraintIdx = footerChildren.findIndex(c => c.classList.contains('cutie-constraint-text'));
      const counterIdx = footerChildren.findIndex(c => c.classList.contains('cutie-character-counter'));

      expect(constraintIdx).toBeLessThan(counterIdx);
    });
  });

  describe('data-max-characters', () => {
    it('shows counter with hard-limit wording (no "suggested")', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          data-max-characters="200" class="qti-counter-down">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const counter = container.querySelector('.cutie-character-counter')!;
      expect(counter).not.toBeNull();
      expect(counter.textContent).toBe('200 characters remaining');
    });

    it('defaults to counter-down when no counter class specified', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          data-max-characters="200">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const counter = container.querySelector('.cutie-character-counter')!;
      expect(counter).not.toBeNull();
      expect(counter.textContent).toBe('200 characters remaining');
    });

    it('respects explicit qti-counter-up class with max-characters', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          data-max-characters="200" class="qti-counter-up">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const counter = container.querySelector('.cutie-character-counter')!;
      expect(counter.textContent).toBe('0 / 200 characters');
    });

    it('shows hard-limit over-limit text', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          data-max-characters="5" class="qti-counter-down">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'hello world';
      textarea.dispatchEvent(new Event('input'));

      const counter = container.querySelector('.cutie-character-counter')!;
      expect(counter.textContent).toBe('6 characters over limit');
      expect(counter.classList.contains('cutie-counter-over')).toBe(true);
    });

    it('returns valid:false when over limit', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          data-max-characters="5">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'hello world';

      const result = itemState.collectAll();
      expect(result.valid).toBe(false);
    });

    it('sets aria-invalid and constraint error when over limit', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          data-max-characters="5">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'hello world';

      itemState.collectAll();

      expect(textarea.getAttribute('aria-invalid')).toBe('true');

      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(constraintEl.classList.contains('cutie-constraint-error')).toBe(true);
      expect(constraintEl.textContent).toBe('Maximum 5 characters allowed');
    });

    it('clears error when under limit again', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          data-max-characters="20">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;

      // Over limit
      textarea.value = 'this is way too many characters for the limit';
      itemState.collectAll();
      expect(textarea.getAttribute('aria-invalid')).toBe('true');

      // Under limit
      textarea.value = 'short';
      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(textarea.hasAttribute('aria-invalid')).toBe(false);
    });

    it('takes precedence over expected-length for counter', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          expected-length="500" data-max-characters="200" class="qti-counter-down">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const counter = container.querySelector('.cutie-character-counter')!;
      // Should use max-characters (200) with hard-limit wording, not expected-length (500)
      expect(counter.textContent).toBe('200 characters remaining');
    });

    it('returns valid:true when at exactly the limit', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          data-max-characters="5">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'hello';

      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
    });

    it('creates constraint element for max-characters even without min-strings', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          data-max-characters="100">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const constraintEl = container.querySelector('.cutie-constraint-text');
      expect(constraintEl).not.toBeNull();
      expect(constraintEl!.textContent).toBe('Maximum 100 characters allowed');
    });
  });

  describe('pattern-mask rendering', () => {
    it('creates constraint message when pattern-mask is present (no min-strings)', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" pattern-mask="^\\d+$">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const constraintEl = container.querySelector('.cutie-constraint-text');
      expect(constraintEl).not.toBeNull();
      expect(constraintEl!.textContent).toBe('Required format');
    });

    it('uses custom data-patternmask-message text', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          pattern-mask="^\\d+$"
          data-patternmask-message="Enter only digits">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const constraintEl = container.querySelector('.cutie-constraint-text');
      expect(constraintEl!.textContent).toBe('Enter only digits');
    });

    it('sets aria-describedby on textarea linking to constraint', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" pattern-mask="^\\d+$">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(textarea.getAttribute('aria-describedby')).toBe(constraintEl.id);
    });
  });

  describe('pattern-mask validation', () => {
    it('returns valid:true when value matches pattern', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" pattern-mask="^\\d+$">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = '12345';

      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(result.responses).toEqual({ R1: '12345' });
    });

    it('returns valid:false when value does not match pattern', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" pattern-mask="^\\d+$">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'abc';

      const result = itemState.collectAll();
      expect(result.valid).toBe(false);
    });

    it('sets aria-invalid on textarea when pattern does not match', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" pattern-mask="^\\d+$">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'abc';

      itemState.collectAll();
      expect(textarea.getAttribute('aria-invalid')).toBe('true');
    });

    it('clears error on re-validation when pattern matches', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" pattern-mask="^\\d+$">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;

      // First: invalid
      textarea.value = 'abc';
      itemState.collectAll();
      expect(textarea.getAttribute('aria-invalid')).toBe('true');

      // Second: valid
      textarea.value = '123';
      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(textarea.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('data-min-characters', () => {
    it('creates constraint element with min-characters text', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" data-min-characters="50">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const constraintEl = container.querySelector('.cutie-constraint-text');
      expect(constraintEl).not.toBeNull();
      expect(constraintEl!.textContent).toBe('Write at least 50 characters');
    });

    it('returns valid:false when empty (implies required)', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" data-min-characters="10">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const result = itemState.collectAll();
      expect(result.valid).toBe(false);
      expect(result.responses).toEqual({ R1: null });
    });

    it('returns valid:false when non-empty but under limit', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" data-min-characters="20">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'short';

      const result = itemState.collectAll();
      expect(result.valid).toBe(false);
      expect(result.responses).toEqual({ R1: 'short' });
    });

    it('sets aria-invalid and constraint error when under limit', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" data-min-characters="20">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'short';

      itemState.collectAll();

      expect(textarea.getAttribute('aria-invalid')).toBe('true');
      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(constraintEl.classList.contains('cutie-constraint-error')).toBe(true);
      expect(constraintEl.textContent).toBe('Write at least 20 characters');
    });

    it('returns valid:true when at exactly the minimum', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" data-min-characters="5">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'hello';

      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
    });

    it('returns valid:true when over the minimum', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" data-min-characters="5">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'hello world';

      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
    });

    it('clears error when text meets minimum on re-validation', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" data-min-characters="5">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;

      // Under limit
      textarea.value = 'hi';
      itemState.collectAll();
      expect(textarea.getAttribute('aria-invalid')).toBe('true');

      // Meets limit
      textarea.value = 'hello';
      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(textarea.hasAttribute('aria-invalid')).toBe(false);
    });

    it('shows min-strings error when empty with both min-strings and min-characters', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          min-strings="1" data-min-characters="20">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      itemState.collectAll();

      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(constraintEl.textContent).toBe('Enter a response.');
    });

    it('works with data-max-characters: both constraints enforced independently', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          data-min-characters="5" data-max-characters="20">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;

      // Too short
      textarea.value = 'hi';
      let result = itemState.collectAll();
      expect(result.valid).toBe(false);

      // In range
      textarea.value = 'hello world';
      result = itemState.collectAll();
      expect(result.valid).toBe(true);

      // Too long
      textarea.value = 'this is way too many characters for the limit';
      result = itemState.collectAll();
      expect(result.valid).toBe(false);
    });
  });

  describe('combined min-strings + pattern-mask', () => {
    it('shows min-strings error when input is empty', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          min-strings="1" pattern-mask="^\\d+$">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      itemState.collectAll();

      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(constraintEl.textContent).toBe('Enter a response.');
      expect(constraintEl.classList.contains('cutie-constraint-error')).toBe(true);
    });

    it('shows pattern-mask error when non-empty but wrong format', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          min-strings="1" pattern-mask="^\\d+$"
          data-patternmask-message="Numbers only">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      textarea.value = 'abc';

      itemState.collectAll();

      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(constraintEl.textContent).toBe('Numbers only');
      expect(constraintEl.classList.contains('cutie-constraint-error')).toBe(true);
    });

    it('swaps constraint text dynamically between errors', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1"
          min-strings="1" pattern-mask="^\\d+$"
          data-patternmask-message="Numbers only">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const textarea = container.querySelector('textarea')!;
      const constraintEl = container.querySelector('.cutie-constraint-text')!;

      // Empty → min-strings error
      itemState.collectAll();
      expect(constraintEl.textContent).toBe('Enter a response.');

      // Non-empty invalid → pattern error
      textarea.value = 'abc';
      itemState.collectAll();
      expect(constraintEl.textContent).toBe('Numbers only');

      // Valid → no error
      textarea.value = '123';
      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(constraintEl.classList.contains('cutie-constraint-error')).toBe(false);
    });
  });
});
