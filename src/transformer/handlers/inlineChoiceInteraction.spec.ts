import { beforeEach, describe, expect, it } from 'vitest';
import { ItemStateImpl } from '../../state/itemState';
import { registry } from '../registry';
import type { TransformContext } from '../types';

// Side-effect import to register the handler
import './inlineChoiceInteraction';

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
  const interaction = doc.querySelector('qti-inline-choice-interaction')!;

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

describe('inlineChoiceInteraction validation', () => {
  let itemState: ItemStateImpl;

  beforeEach(() => {
    itemState = new ItemStateImpl();
  });

  describe('constraint rendering', () => {
    it('does not render indicator when not constrained', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
          <qti-inline-choice identifier="B">Beta</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('.cutie-required-indicator')).toBeNull();
    });

    it('renders indicator when required="true"', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1" required="true">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
          <qti-inline-choice identifier="B">Beta</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const indicator = container.querySelector('.cutie-required-indicator');
      expect(indicator).not.toBeNull();
      expect(indicator!.textContent).toBe('*');
      expect(indicator!.getAttribute('title')).toBe('Selection required');
    });

    it('renders indicator when min-choices >= 1', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1" min-choices="1">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
          <qti-inline-choice identifier="B">Beta</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('.cutie-required-indicator')).not.toBeNull();
    });

    it('sets aria-required="true" on select when constrained', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1" required="true">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
          <qti-inline-choice identifier="B">Beta</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const select = container.querySelector('select')!;
      expect(select.getAttribute('aria-required')).toBe('true');
    });
  });

  describe('accessor validation', () => {
    it('returns valid:true when unconstrained and no selection', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
          <qti-inline-choice identifier="B">Beta</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(result.responses).toEqual({ R1: null });
    });

    it('returns valid:false when constrained and no selection', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1" required="true">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
          <qti-inline-choice identifier="B">Beta</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const result = itemState.collectAll();
      expect(result.valid).toBe(false);
      expect(result.invalidCount).toBe(1);
    });

    it('returns valid:true when constrained and selection made', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1" required="true">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
          <qti-inline-choice identifier="B">Beta</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const select = container.querySelector('select')!;
      select.value = 'A';

      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(result.responses).toEqual({ R1: 'A' });
    });

    it('sets aria-invalid on select when invalid', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1" required="true">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
          <qti-inline-choice identifier="B">Beta</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      itemState.collectAll();

      const select = container.querySelector('select')!;
      expect(select.getAttribute('aria-invalid')).toBe('true');
    });

    it('clears error state when selection becomes valid', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1" required="true">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
          <qti-inline-choice identifier="B">Beta</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const select = container.querySelector('select')!;

      // First: invalid
      itemState.collectAll();
      expect(select.getAttribute('aria-invalid')).toBe('true');

      // Second: valid
      select.value = 'A';
      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(select.hasAttribute('aria-invalid')).toBe(false);
    });

    it('shows error state on indicator when invalid', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1" required="true">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
          <qti-inline-choice identifier="B">Beta</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      itemState.collectAll();

      const indicator = container.querySelector('.cutie-required-indicator')!;
      expect(indicator.classList.contains('cutie-constraint-error')).toBe(true);
    });
  });
});
