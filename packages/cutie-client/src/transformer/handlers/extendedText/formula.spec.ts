import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemStateImpl } from '../../../state/itemState';
import { registry } from '../../registry';
import type { TransformContext } from '../../types';

// Mock MathLive to resolve with a minimal mock
vi.mock('./mathFieldLoader', () => ({
  loadMathLive: () => Promise.resolve({
    MathfieldElement: class extends HTMLElement {},
  }),
}));

// Side-effect import to register the handler
import './formula';

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
      expect(mathField.getAttribute('placeholder')).toBe('\\text{Enter a formula (e.g., }5x\\text{ or }\\frac{1}{2}\\text{)}');
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
    it('disables math-field when interactions are disabled', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);

      itemState.setInteractionState('disabled');
      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForMathField();

      const mathField = container.querySelector('.cutie-formula-field') as HTMLElement & { disabled: boolean };
      expect(mathField.disabled).toBe(true);
    });
  });

  describe('read-only response', () => {
    it('renders the formula statically in place of the math-field', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);
      const defaultValue = doc.createElement('qti-default-value');
      defaultValue.appendChild(doc.createElement('qti-value')).textContent = '\\frac{1}{2}';
      doc.querySelector('qti-response-declaration')!.appendChild(defaultValue);

      itemState.setInteractionState('readonly');
      const container = document.createElement('div');
      container.appendChild(transformInteraction(doc, itemState));

      expect(container.querySelector<HTMLElement>('.cutie-formula-field-wrapper')!.hidden).toBe(true);
      const math = container.querySelector('.cutie-read-only-response math-div')!;
      expect(math.textContent).toBe('\\frac{1}{2}');
    });

    it('notes that there is no response', () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1">
        </qti-extended-text-interaction>
      `);

      itemState.setInteractionState('readonly');
      const container = document.createElement('div');
      container.appendChild(transformInteraction(doc, itemState));

      expect(container.querySelector('.cutie-read-only-response')!.textContent).toBe('No response.');
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

    it('clears error state on input once the value becomes valid', async () => {
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      await waitForMathField();

      const mathField = container.querySelector('.cutie-formula-field') as HTMLElement & { value: string };
      const constraintEl = container.querySelector('.cutie-constraint-text')!;

      itemState.collectAll();
      expect(mathField.getAttribute('aria-invalid')).toBe('true');

      mathField.value = 'x+1';
      mathField.dispatchEvent(new Event('input'));

      expect(mathField.hasAttribute('aria-invalid')).toBe(false);
      expect(constraintEl.classList.contains('cutie-constraint-error')).toBe(false);
    });
  });

  describe('response change reporting', () => {
    it('reports every input with the raw value and no validation UI', async () => {
      const onResponseChange = vi.fn();
      const state = new ItemStateImpl(undefined, { onResponseChange });
      const doc = createQtiDocument(`
        <qti-extended-text-interaction response-identifier="R1" min-strings="1">
        </qti-extended-text-interaction>
      `);

      const container = document.createElement('div');
      container.appendChild(transformInteraction(doc, state));
      await waitForMathField();
      expect(onResponseChange).not.toHaveBeenCalled();

      const mathField = container.querySelector('.cutie-formula-field') as HTMLElement & { value: string };
      mathField.value = 'x';
      mathField.dispatchEvent(new Event('input'));
      mathField.value = '';
      mathField.dispatchEvent(new Event('input'));

      expect(onResponseChange).toHaveBeenCalledTimes(2);
      expect(onResponseChange.mock.calls.map((c) => c[0])).toEqual([{ R1: 'x' }, { R1: null }]);
      expect(mathField.hasAttribute('aria-invalid')).toBe(false);
      expect(container.querySelector('.cutie-constraint-error')).toBeNull();
    });
  });
});

describe('formulaInteraction evaluation', () => {
  let itemState: ItemStateImpl;

  beforeEach(() => {
    itemState = new ItemStateImpl();
  });

  function render(interactionAttrs: string, declaration: string): HTMLElement {
    const doc = new DOMParser().parseFromString(`
      <html><body>
        <qti-response-declaration identifier="R1" base-type="string" cardinality="single" data-response-type="formula">
          ${declaration}
        </qti-response-declaration>
        <qti-item-body>
          <qti-extended-text-interaction response-identifier="R1" ${interactionAttrs}></qti-extended-text-interaction>
        </qti-item-body>
      </body></html>
    `, 'text/html');
    const container = document.createElement('div');
    container.appendChild(transformInteraction(doc, itemState));
    return container;
  }

  it('renders nothing when there is no verdict or correct response', async () => {
    const container = render('', '');
    await waitForMathField();
    expect(container.querySelector('.cutie-evaluation')).toBeNull();
  });

  it('describes the verdict in the constraint text and shows the correct LaTeX in a math-span, linked to the math field', async () => {
    const container = render(
      'data-cutie-evaluation="incorrect"',
      '<qti-correct-response><qti-value>\\frac{1}{2}</qti-value></qti-correct-response>',
    );
    await waitForMathField();
    expect(container.querySelector('.cutie-verdict')).toBeNull();
    expect(container.querySelector('#constraint-R1')!.textContent).toBe('Incorrect response');
    const summary = container.querySelector('.cutie-evaluation')!;
    expect(summary.querySelector('math-span')!.textContent).toBe('\\frac{1}{2}');
    expect(container.querySelector('math-field')!.getAttribute('aria-describedby')).toContain(summary.id);
  });
});
