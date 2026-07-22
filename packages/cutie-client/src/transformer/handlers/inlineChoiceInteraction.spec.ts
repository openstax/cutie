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

describe('inlineChoiceInteraction', () => {
  let itemState: ItemStateImpl;

  beforeEach(() => {
    itemState = new ItemStateImpl();
  });

  describe('missing response-identifier', () => {
    it('renders error element when response-identifier is absent', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction>
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('select')).toBeNull();
      expect(container.querySelector('.cutie-error-display')).not.toBeNull();
    });
  });

  describe('select rendering', () => {
    it('renders a select with correct class and data attribute', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
          <qti-inline-choice identifier="B">Beta</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const select = container.querySelector('select')!;
      expect(select).not.toBeNull();
      expect(select.className).toBe('cutie-inline-choice-interaction');
      expect(select.dataset.responseIdentifier).toBe('R1');
    });

    it('creates option elements from qti-inline-choice children', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
          <qti-inline-choice identifier="B">Beta</qti-inline-choice>
          <qti-inline-choice identifier="C">Gamma</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const options = container.querySelectorAll('option');
      // placeholder + 3 choices
      expect(options.length).toBe(4);
      expect(options[1].value).toBe('A');
      expect(options[1].textContent).toBe('Alpha');
      expect(options[2].value).toBe('B');
      expect(options[2].textContent).toBe('Beta');
      expect(options[3].value).toBe('C');
      expect(options[3].textContent).toBe('Gamma');
    });
  });

  describe('placeholder option', () => {
    it('has accessible prompt text and is disabled/hidden', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const placeholder = container.querySelector('option')!;
      expect(placeholder.value).toBe('');
      expect(placeholder.textContent).toBe('Select\u2026');
      expect(placeholder.disabled).toBe(true);
      expect(placeholder.hidden).toBe(true);
    });
  });

  describe('default value', () => {
    it('pre-populates select from qti-default-value', () => {
      const doc = createQtiDocument(`
        <qti-response-declaration identifier="R1" cardinality="single" base-type="identifier">
          <qti-default-value>
            <qti-value>B</qti-value>
          </qti-default-value>
        </qti-response-declaration>
        <qti-inline-choice-interaction response-identifier="R1">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
          <qti-inline-choice identifier="B">Beta</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const select = container.querySelector('select')!;
      expect(select.value).toBe('B');
    });
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

    it('uses data-min-selections-message as indicator title', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1" required="true"
          data-min-selections-message="Please choose an answer">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
          <qti-inline-choice identifier="B">Beta</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const indicator = container.querySelector('.cutie-required-indicator');
      expect(indicator!.getAttribute('title')).toBe('Please choose an answer');
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

    it('clears error immediately on user selection without collectAll', () => {
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

      // Trigger invalid state
      itemState.collectAll();
      expect(select.getAttribute('aria-invalid')).toBe('true');

      const indicator = container.querySelector('.cutie-required-indicator')!;
      expect(indicator.classList.contains('cutie-constraint-error')).toBe(true);

      // User makes a selection — error should clear without collectAll
      select.value = 'A';
      select.dispatchEvent(new Event('change'));

      expect(select.hasAttribute('aria-invalid')).toBe(false);
      expect(indicator.classList.contains('cutie-constraint-error')).toBe(false);
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

  describe('qti-input-width sizing', () => {
    it('sets width from qti-input-width-6 class', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1" class="qti-input-width-6">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const select = container.querySelector('select')!;
      expect(select.style.width).toBe('10ch');
      expect(select.style.minWidth).toBe('0');
    });

    it('sets width from qti-input-width-72 class', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1" class="qti-input-width-72">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const select = container.querySelector('select')!;
      expect(select.style.width).toBe('76ch');
    });

    it('does not set inline width when no class is present', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const select = container.querySelector('select')!;
      expect(select.style.width).toBe('');
    });

    it('parses width when mixed with other classes', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1" class="foo qti-input-width-15 bar">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const select = container.querySelector('select')!;
      expect(select.style.width).toBe('19ch');
    });
  });

  describe('data-prompt', () => {
    it('uses data-prompt as placeholder text', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1" data-prompt="Choose one">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const placeholder = container.querySelector('option')!;
      expect(placeholder.textContent).toBe('Choose one');
    });

    it('defaults to "Select\u2026" when data-prompt is absent', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const placeholder = container.querySelector('option')!;
      expect(placeholder.textContent).toBe('Select\u2026');
    });
  });

  describe('disabled state', () => {
    it('disables select when interactions are disabled', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const select = container.querySelector('select')!;
      expect(select.disabled).toBe(false);

      itemState.setInteractionsEnabled(false);
      expect(select.disabled).toBe(true);
    });

    it('re-enables select when interactions are re-enabled', () => {
      const doc = createQtiDocument(`
        <qti-inline-choice-interaction response-identifier="R1">
          <qti-inline-choice identifier="A">Alpha</qti-inline-choice>
        </qti-inline-choice-interaction>
      `);

      itemState.setInteractionsEnabled(false);
      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const select = container.querySelector('select')!;
      expect(select.disabled).toBe(true);

      itemState.setInteractionsEnabled(true);
      expect(select.disabled).toBe(false);
    });
  });
});
