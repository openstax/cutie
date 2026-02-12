import { beforeEach, describe, expect, it } from 'vitest';
import { ItemStateImpl } from '../../state/itemState';
import { registry } from '../registry';
import type { TransformContext } from '../types';

// Side-effect import to register the handler
import './choiceInteraction';

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
  const interaction = doc.querySelector('qti-choice-interaction')!;

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

describe('choiceInteraction validation', () => {
  let itemState: ItemStateImpl;

  beforeEach(() => {
    itemState = new ItemStateImpl();
  });

  describe('constraint text rendering', () => {
    it('renders constraint text for multi-select with min-choices', () => {
      const doc = createQtiDocument(`
        <qti-choice-interaction response-identifier="R1" max-choices="3" min-choices="2">
          <qti-simple-choice identifier="A">A</qti-simple-choice>
          <qti-simple-choice identifier="B">B</qti-simple-choice>
          <qti-simple-choice identifier="C">C</qti-simple-choice>
        </qti-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const constraintEl = container.querySelector('.qti-constraint-text');
      expect(constraintEl).not.toBeNull();
      expect(constraintEl!.textContent).toBe('Select between 2 and 3 choices.');
    });

    it('renders "at least N" text when only min-choices is set (max-choices=0)', () => {
      const doc = createQtiDocument(`
        <qti-choice-interaction response-identifier="R1" max-choices="0" min-choices="2">
          <qti-simple-choice identifier="A">A</qti-simple-choice>
          <qti-simple-choice identifier="B">B</qti-simple-choice>
          <qti-simple-choice identifier="C">C</qti-simple-choice>
        </qti-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const constraintEl = container.querySelector('.qti-constraint-text');
      expect(constraintEl).not.toBeNull();
      expect(constraintEl!.textContent).toBe('Select at least 2 choices.');
    });

    it('renders "Select up to N" text for multi-select with max-only (no min-choices)', () => {
      const doc = createQtiDocument(`
        <qti-choice-interaction response-identifier="R1" max-choices="2">
          <qti-simple-choice identifier="A">A</qti-simple-choice>
          <qti-simple-choice identifier="B">B</qti-simple-choice>
          <qti-simple-choice identifier="C">C</qti-simple-choice>
        </qti-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const constraintEl = container.querySelector('.qti-constraint-text');
      expect(constraintEl).not.toBeNull();
      expect(constraintEl!.textContent).toBe('Select up to 2 choices.');
    });

    it('renders "Select an answer." for single-select with min-choices', () => {
      const doc = createQtiDocument(`
        <qti-choice-interaction response-identifier="R1" max-choices="1" min-choices="1">
          <qti-simple-choice identifier="A">A</qti-simple-choice>
          <qti-simple-choice identifier="B">B</qti-simple-choice>
        </qti-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const constraintEl = container.querySelector('.qti-constraint-text');
      expect(constraintEl).not.toBeNull();
      expect(constraintEl!.textContent).toBe('Select an answer.');
    });

    it('does not render constraint text for single-select without min-choices', () => {
      const doc = createQtiDocument(`
        <qti-choice-interaction response-identifier="R1" max-choices="1">
          <qti-simple-choice identifier="A">A</qti-simple-choice>
          <qti-simple-choice identifier="B">B</qti-simple-choice>
        </qti-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('.qti-constraint-text')).toBeNull();
    });

    it('sets aria-describedby on fieldset linking to constraint text', () => {
      const doc = createQtiDocument(`
        <qti-choice-interaction response-identifier="R1" max-choices="3" min-choices="2">
          <qti-simple-choice identifier="A">A</qti-simple-choice>
          <qti-simple-choice identifier="B">B</qti-simple-choice>
          <qti-simple-choice identifier="C">C</qti-simple-choice>
        </qti-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const fieldset = container.querySelector('fieldset')!;
      const constraintEl = container.querySelector('.qti-constraint-text')!;
      expect(fieldset.getAttribute('aria-describedby')).toBe(constraintEl.id);
    });
  });

  describe('accessor validation', () => {
    it('returns valid:true when enough choices are selected', () => {
      const doc = createQtiDocument(`
        <qti-choice-interaction response-identifier="R1" max-choices="3" min-choices="2">
          <qti-simple-choice identifier="A">A</qti-simple-choice>
          <qti-simple-choice identifier="B">B</qti-simple-choice>
          <qti-simple-choice identifier="C">C</qti-simple-choice>
        </qti-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      // Check two checkboxes
      const inputs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      inputs[0]!.checked = true;
      inputs[1]!.checked = true;

      const result = itemState.collectAll();
      expect(result).toEqual({ R1: ['A', 'B'] });
    });

    it('returns undefined from collectAll when too few selected', () => {
      const doc = createQtiDocument(`
        <qti-choice-interaction response-identifier="R1" max-choices="3" min-choices="2">
          <qti-simple-choice identifier="A">A</qti-simple-choice>
          <qti-simple-choice identifier="B">B</qti-simple-choice>
          <qti-simple-choice identifier="C">C</qti-simple-choice>
        </qti-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      // Only check one
      const inputs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      inputs[0]!.checked = true;

      const result = itemState.collectAll();
      expect(result).toBeUndefined();
    });

    it('sets aria-invalid and error class on constraint text when invalid', () => {
      const doc = createQtiDocument(`
        <qti-choice-interaction response-identifier="R1" max-choices="3" min-choices="2">
          <qti-simple-choice identifier="A">A</qti-simple-choice>
          <qti-simple-choice identifier="B">B</qti-simple-choice>
          <qti-simple-choice identifier="C">C</qti-simple-choice>
        </qti-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      // Only check one (below min-choices of 2)
      const inputs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      inputs[0]!.checked = true;

      itemState.collectAll();

      const fieldset = container.querySelector('fieldset')!;
      expect(fieldset.getAttribute('aria-invalid')).toBe('true');

      const constraintEl = container.querySelector('.qti-constraint-text')!;
      expect(constraintEl.classList.contains('qti-constraint-error')).toBe(true);
    });

    it('clears error state when selections become valid', () => {
      const doc = createQtiDocument(`
        <qti-choice-interaction response-identifier="R1" max-choices="3" min-choices="2">
          <qti-simple-choice identifier="A">A</qti-simple-choice>
          <qti-simple-choice identifier="B">B</qti-simple-choice>
          <qti-simple-choice identifier="C">C</qti-simple-choice>
        </qti-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const inputs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      const fieldset = container.querySelector('fieldset')!;

      // First: invalid (one checked, min is 2)
      inputs[0]!.checked = true;
      itemState.collectAll();
      expect(fieldset.getAttribute('aria-invalid')).toBe('true');

      // Second: valid (two checked)
      inputs[1]!.checked = true;
      const result = itemState.collectAll();
      expect(result).toEqual({ R1: ['A', 'B'] });
      expect(fieldset.hasAttribute('aria-invalid')).toBe(false);
    });

    it('sets error state on single-select constraint text when no answer selected', () => {
      const doc = createQtiDocument(`
        <qti-choice-interaction response-identifier="R1" max-choices="1" min-choices="1">
          <qti-simple-choice identifier="A">A</qti-simple-choice>
          <qti-simple-choice identifier="B">B</qti-simple-choice>
        </qti-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      // No selection — should be invalid
      itemState.collectAll();

      const fieldset = container.querySelector('fieldset')!;
      expect(fieldset.getAttribute('aria-invalid')).toBe('true');

      const constraintEl = container.querySelector('.qti-constraint-text')!;
      expect(constraintEl.classList.contains('qti-constraint-error')).toBe(true);
    });

    it('returns valid:true when no min-choices constraint', () => {
      const doc = createQtiDocument(`
        <qti-choice-interaction response-identifier="R1" max-choices="2">
          <qti-simple-choice identifier="A">A</qti-simple-choice>
          <qti-simple-choice identifier="B">B</qti-simple-choice>
        </qti-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      // No selections — should still be valid (no min constraint)
      const result = itemState.collectAll();
      expect(result).toEqual({ R1: null });
    });
  });
});
