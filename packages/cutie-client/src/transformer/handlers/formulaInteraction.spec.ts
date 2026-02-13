import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemStateImpl } from '../../state/itemState';
import { registry } from '../registry';
import type { TransformContext } from '../types';

// Mock MathLive to resolve with a minimal mock
vi.mock('./mathFieldLoader', () => ({
  loadMathLive: () => Promise.resolve({
    MathfieldElement: class extends HTMLElement {},
  }),
}));

// Side-effect import to register the handler
import './formulaInteraction';

function createQtiDocument(interactionHtml: string): Document {
  const html = `
    <html>
      <body>
        <qti-response-declaration identifier="R1" base-type="string" cardinality="single" data-response-type="formula" />
        <qti-item-body>${interactionHtml}</qti-item-body>
      </body>
    </html>
  `;
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

function transformInteraction(
  doc: Document,
  itemState: ItemStateImpl,
  contextOverrides?: Partial<TransformContext>
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
    ...contextOverrides,
  };

  const handler = registry.getAll().find((r) => r.handler.canHandle(interaction));
  return handler!.handler.transform(interaction, context);
}

/** Wait for async MathLive loading to settle */
async function waitForMathField(): Promise<void> {
  await vi.waitFor(() => {}, { timeout: 50 });
  // Allow microtask queue to flush
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('formulaInteraction', () => {
  let itemState: ItemStateImpl;

  beforeEach(() => {
    itemState = new ItemStateImpl();
  });

  describe('constraint text rendering', () => {
    it('does not render constraint text when min-strings is absent', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForMathField();

      expect(container.querySelector('.cutie-constraint-text')).toBeNull();
    });

    it('renders constraint text when min-strings="1"', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForMathField();

      const constraintEl = container.querySelector('.cutie-constraint-text');
      expect(constraintEl).not.toBeNull();
      expect(constraintEl!.textContent).toBe('Enter a response.');
    });

    it('sets aria-describedby on math-field linking to constraint text', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForMathField();

      const mathField = container.querySelector('.cutie-formula-field')!;
      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(mathField.getAttribute('aria-describedby')).toContain(constraintEl.id);
    });
  });

  describe('placeholder-text attribute', () => {
    it('uses custom placeholder-text on math-field', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" placeholder-text="Type your formula here">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForMathField();

      const mathField = container.querySelector('.cutie-formula-field')!;
      expect(mathField.getAttribute('placeholder')).toBe('Type your formula here');
    });

    it('uses default placeholder when placeholder-text is absent', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForMathField();

      const mathField = container.querySelector('.cutie-formula-field')!;
      expect(mathField.getAttribute('placeholder')).toBe('Enter LaTeX formula (e.g., 5x or \\frac{1}{2})');
    });
  });

  describe('error handling', () => {
    it('renders error element when response-identifier is missing', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction>
        </qti-extended-text-interaction>
      `);

      // Without response-identifier, canHandle returns false,
      // so we call transform directly to test the error path
      const interaction = doc.querySelector('qti-extended-text-interaction')!;
      // Remove the attribute to ensure it's missing
      interaction.removeAttribute('response-identifier');

      const handler = registry.getAll().find((r) => r.name === 'formula-interaction');
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

      const fragment = handler!.handler.transform(interaction, context);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('.cutie-error-display')).not.toBeNull();
    });
  });

  describe('disabled state', () => {
    it('disables math-field when interactionsEnabled is false', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);

      itemState.setInteractionsEnabled(false);
      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForMathField();

      const mathField = container.querySelector('.cutie-formula-field') as HTMLElement & { disabled: boolean };
      expect(mathField.disabled).toBe(true);
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
    });

    it('returns valid:false when min-strings constraint is not met', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      // currentValue starts empty, so constraint is not met
      const result = itemState.collectAll();
      expect(result.valid).toBe(false);
      expect(result.invalidCount).toBe(1);
    });

    it('sets error class on constraint text when invalid', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForMathField();

      itemState.collectAll();

      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(constraintEl.classList.contains('cutie-constraint-error')).toBe(true);
    });
  });
});
