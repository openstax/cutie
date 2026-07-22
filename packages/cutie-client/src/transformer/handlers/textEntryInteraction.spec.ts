import { beforeEach, describe, expect, it } from 'vitest';
import { ItemStateImpl } from '../../state/itemState';
import { registry } from '../registry';
import type { TransformContext } from '../types';

// Side-effect import to register the handler
import './textEntryInteraction';

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
  const interaction = doc.querySelector('qti-text-entry-interaction')!;

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

describe('textEntryInteraction', () => {
  let itemState: ItemStateImpl;

  beforeEach(() => {
    itemState = new ItemStateImpl();
  });

  describe('missing response-identifier', () => {
    it('renders error element when response-identifier is absent', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('input')).toBeNull();
      expect(container.querySelector('.cutie-error-display')).not.toBeNull();
    });
  });

  describe('input type switching', () => {
    it('renders type="number" step="1" for integer base-type', () => {
      const doc = createQtiDocument(`
        <qti-response-declaration identifier="R1" cardinality="single" base-type="integer" />
        <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.type).toBe('number');
      expect(input.step).toBe('1');
    });

    it('renders type="number" step="any" for float base-type', () => {
      const doc = createQtiDocument(`
        <qti-response-declaration identifier="R1" cardinality="single" base-type="float" />
        <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.type).toBe('number');
      expect(input.step).toBe('any');
    });

    it('renders type="text" for string base-type', () => {
      const doc = createQtiDocument(`
        <qti-response-declaration identifier="R1" cardinality="single" base-type="string" />
        <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.type).toBe('text');
    });

    it('renders type="text" when no response declaration exists', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.type).toBe('text');
    });
  });

  describe('qti-input-width sizing', () => {
    it('sets width from qti-input-width-6 class', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" class="qti-input-width-6"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.style.width).toBe('8ch');
    });

    it('sets width from qti-input-width-72 class', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" class="qti-input-width-72"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.style.width).toBe('74ch');
    });

    it('extracts width class when mixed with other classes', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" class="foo qti-input-width-15 bar"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.style.width).toBe('17ch');
    });

    it('overrides expected-length when both are present', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" class="qti-input-width-20" expected-length="5"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.style.width).toBe('22ch');
    });

    it('falls back to expected-length when no width class', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" expected-length="5"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.style.width).toBe('7ch');
    });

    it('falls back to 10ch when neither width class nor expected-length', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.style.width).toBe('10ch');
    });
  });

  describe('expected-length sizing', () => {
    it('sets width based on expected-length attribute', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" expected-length="5"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.style.width).toBe('7ch');
    });

    it('defaults to 10ch when expected-length is absent', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.style.width).toBe('10ch');
    });
  });

  describe('default value', () => {
    it('pre-populates input from qti-default-value', () => {
      const doc = createQtiDocument(`
        <qti-response-declaration identifier="R1" cardinality="single" base-type="string">
          <qti-default-value>
            <qti-value>hello</qti-value>
          </qti-default-value>
        </qti-response-declaration>
        <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.value).toBe('hello');
    });
  });

  describe('response accessor', () => {
    it('trims whitespace from response value', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      input.value = '  trimmed  ';

      const result = itemState.collectAll();
      expect(result.responses.R1).toBe('trimmed');
    });

    it('returns null for empty string', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      input.value = '';

      const result = itemState.collectAll();
      expect(result.responses.R1).toBeNull();
    });

    it('returns null for whitespace-only input', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      input.value = '   ';

      const result = itemState.collectAll();
      expect(result.responses.R1).toBeNull();
    });
  });

  describe('disabled state', () => {
    it('disables input when interactions are disabled', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.disabled).toBe(false);

      itemState.setInteractionsEnabled(false);
      expect(input.disabled).toBe(true);
    });

    it('re-enables input when interactions are re-enabled', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction>
      `);

      itemState.setInteractionsEnabled(false);
      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.disabled).toBe(true);

      itemState.setInteractionsEnabled(true);
      expect(input.disabled).toBe(false);
    });
  });

  describe('placeholder-text', () => {
    it('sets placeholder from placeholder-text attribute', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" placeholder-text="Enter answer"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.placeholder).toBe('Enter answer');
    });

    it('has no placeholder when attribute is absent', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      expect(input.placeholder).toBe('');
    });
  });

  describe('constraint rendering', () => {
    it('does not render indicator when pattern-mask is absent', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1">
        </qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('.cutie-required-indicator')).toBeNull();
    });

    it('renders indicator when pattern-mask is present', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" pattern-mask="^\\d+$">
        </qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const indicator = container.querySelector('.cutie-required-indicator');
      expect(indicator).not.toBeNull();
      expect(indicator!.textContent).toBe('*');
    });

    it('uses custom data-patternmask-message as indicator title', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" pattern-mask="^\\d+$" data-patternmask-message="Enter a number">
        </qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const indicator = container.querySelector('.cutie-required-indicator')!;
      expect(indicator.getAttribute('title')).toBe('Enter a number');
    });

    it('uses default "Required format" title when no custom message', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" pattern-mask="^\\d+$">
        </qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const indicator = container.querySelector('.cutie-required-indicator')!;
      expect(indicator.getAttribute('title')).toBe('Required format');
    });
  });

  describe('accessor validation', () => {
    it('returns valid:true when no pattern-mask constraint', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1">
        </qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
    });

    it('returns valid:true when response matches pattern', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" pattern-mask="^\\d+$">
        </qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      input.value = '42';

      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(result.responses).toEqual({ R1: '42' });
    });

    it('returns valid:false when response does not match pattern', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" pattern-mask="^\\d+$">
        </qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      input.value = 'abc';

      const result = itemState.collectAll();
      expect(result.valid).toBe(false);
      expect(result.invalidCount).toBe(1);
    });

    it('validates empty string against pattern', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" pattern-mask="^\\d+$">
        </qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      // Empty string doesn't match ^\\d+$ (requires at least one digit)
      const result = itemState.collectAll();
      expect(result.valid).toBe(false);
    });

    it('validates empty string as valid if pattern allows it', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" pattern-mask="^\\d*$">
        </qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      // Empty string matches ^\\d*$ (zero or more digits)
      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
    });

    it('sets aria-invalid on input when invalid', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" pattern-mask="^\\d+$">
        </qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      input.value = 'abc';
      itemState.collectAll();

      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('clears error state when input becomes valid', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" pattern-mask="^\\d+$">
        </qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;

      // First: invalid
      input.value = 'abc';
      itemState.collectAll();
      expect(input.getAttribute('aria-invalid')).toBe('true');

      // Second: valid
      input.value = '42';
      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('shows error state on indicator when invalid', () => {
      const doc = createQtiDocument(`
        <qti-text-entry-interaction response-identifier="R1" pattern-mask="^\\d+$">
        </qti-text-entry-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const input = container.querySelector('input')!;
      input.value = 'abc';
      itemState.collectAll();

      const indicator = container.querySelector('.cutie-required-indicator')!;
      expect(indicator.classList.contains('cutie-constraint-error')).toBe(true);
    });
  });
});
