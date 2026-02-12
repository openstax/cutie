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

describe('textEntryInteraction validation', () => {
  let itemState: ItemStateImpl;

  beforeEach(() => {
    itemState = new ItemStateImpl();
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
