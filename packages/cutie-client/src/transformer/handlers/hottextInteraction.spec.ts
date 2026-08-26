/* spell-checker: ignore hottext */
import { beforeEach, describe, expect, it } from 'vitest';
import { ItemStateImpl } from '../../state/itemState';
import { registry } from '../registry';
import type { TransformContext } from '../types';

// Side-effect import to register both handlers (hottext + hottext-interaction)
import './hottextInteraction';

function createQtiDocument(interactionHtml: string, responseDeclaration = ''): Document {
  const html = `
    <html>
      <body>
        ${responseDeclaration}
        <qti-item-body>${interactionHtml}</qti-item-body>
      </body>
    </html>
  `;
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

/**
 * Build a transformChildren that routes element children through the registry
 * so the HottextHandler runs and the parent can find [data-hottext-identifier].
 * Elements without a handler are shallow-cloned and their children recursed,
 * mirroring the real transformer's passthrough behavior.
 */
function makeTransformChildren(context: TransformContext): (el: Element) => DocumentFragment {
  const transform = (el: Element): DocumentFragment => {
    const frag = document.createDocumentFragment();
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const child = node as Element;
        const handler = registry.getAll().find((r) => r.handler.canHandle(child));
        if (handler) {
          frag.appendChild(handler.handler.transform(child, context));
        } else {
          const clone = child.cloneNode(false) as Element;
          clone.appendChild(transform(child));
          frag.appendChild(clone);
        }
      } else {
        frag.appendChild(node.cloneNode(true));
      }
    }
    return frag;
  };
  return transform;
}

function transformInteraction(doc: Document, itemState: ItemStateImpl): DocumentFragment {
  const interaction = doc.querySelector('qti-hottext-interaction')!;

  const context: TransformContext = { itemState };
  context.transformChildren = makeTransformChildren(context);

  const handler = registry.getAll().find((r) => r.handler.canHandle(interaction));
  return handler!.handler.transform(interaction, context);
}

function render(doc: Document, itemState: ItemStateImpl): HTMLElement {
  const fragment = transformInteraction(doc, itemState);
  const container = document.createElement('div');
  container.appendChild(fragment);
  return container;
}

const MULTI_DECL = `
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier"></qti-response-declaration>
`;
const SINGLE_DECL = `
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"></qti-response-declaration>
`;

const passage = `
  <p>
    Alpha <qti-hottext identifier="A">Item A</qti-hottext>
    beta <qti-hottext identifier="B">Item B</qti-hottext>
    gamma <qti-hottext identifier="C">Item C</qti-hottext>
    delta <qti-hottext identifier="D">Item D</qti-hottext>.
  </p>
`;

describe('hottextInteraction', () => {
  let itemState: ItemStateImpl;

  beforeEach(() => {
    itemState = new ItemStateImpl();
  });

  describe('rendering', () => {
    it('renders a toggle button for each qti-hottext', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2">${passage}</qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);

      const buttons = container.querySelectorAll('button.cutie-hottext');
      expect(buttons.length).toBe(4);
      expect(buttons[0]!.getAttribute('data-hottext-identifier')).toBe('A');
      expect(buttons[0]!.getAttribute('aria-pressed')).toBe('false');
      expect(buttons[0]!.textContent).toContain('Item A');
    });

    it('renders an error when response-identifier is missing', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction max-choices="2">${passage}</qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);

      expect(container.querySelector('.cutie-error-display')).not.toBeNull();
      expect(container.querySelector('button.cutie-hottext')).toBeNull();
    });

    it('renders an error span for a qti-hottext missing its identifier', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2">
          <p>Text <qti-hottext>no id</qti-hottext> more.</p>
        </qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);

      expect(container.querySelector('.cutie-hottext--error')).not.toBeNull();
    });

    it('renders the prompt and labels the group', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2">
          <qti-prompt>Pick the items.</qti-prompt>
          ${passage}
        </qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);

      const group = container.querySelector('.cutie-hottext-interaction')!;
      const prompt = container.querySelector('.cutie-prompt')!;
      expect(prompt.textContent).toContain('Pick the items.');
      expect(group.getAttribute('aria-labelledby')).toBe(prompt.id);
    });

    it('gives the group a fallback accessible name when there is no prompt', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2">${passage}</qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);

      const group = container.querySelector('.cutie-hottext-interaction')!;
      expect(group.getAttribute('aria-labelledby')).toBeNull();
      expect(group.getAttribute('aria-label')).toBe('Hottext interaction');
    });
  });

  describe('multi-select behavior', () => {
    it('toggles aria-pressed on click and collects an array response', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2" min-choices="1">${passage}</qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);
      const buttons = container.querySelectorAll<HTMLButtonElement>('button.cutie-hottext');

      buttons[1]!.click();
      buttons[2]!.click();
      expect(buttons[1]!.getAttribute('aria-pressed')).toBe('true');
      expect(buttons[2]!.getAttribute('aria-pressed')).toBe('true');

      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(result.responses).toEqual({ RESPONSE: ['B', 'C'] });
    });

    it('blocks selection beyond max-choices and keeps the response at max', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2">${passage}</qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);
      const buttons = container.querySelectorAll<HTMLButtonElement>('button.cutie-hottext');

      buttons[0]!.click();
      buttons[1]!.click();
      buttons[2]!.click(); // blocked — already at max of 2

      expect(buttons[2]!.getAttribute('aria-pressed')).toBe('false');
      const result = itemState.collectAll();
      expect(result.responses).toEqual({ RESPONSE: ['A', 'B'] });
    });

    it('returns null response when nothing is selected', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2">${passage}</qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);
      // no selection
      expect(container).toBeTruthy();

      const result = itemState.collectAll();
      expect(result.responses).toEqual({ RESPONSE: null });
      expect(result.valid).toBe(true);
    });
  });

  describe('single-select behavior', () => {
    it('clears siblings on selection and collects a scalar response', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="1">${passage}</qti-hottext-interaction>`,
        SINGLE_DECL
      );
      const container = render(doc, itemState);
      const buttons = container.querySelectorAll<HTMLButtonElement>('button.cutie-hottext');

      buttons[0]!.click();
      buttons[2]!.click();
      expect(buttons[0]!.getAttribute('aria-pressed')).toBe('false');
      expect(buttons[2]!.getAttribute('aria-pressed')).toBe('true');

      const result = itemState.collectAll();
      expect(result.responses).toEqual({ RESPONSE: 'C' });
    });
  });

  describe('constraint text', () => {
    it('renders "between" text for a min/max range', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="3" min-choices="2">${passage}</qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);
      const constraint = container.querySelector('.cutie-constraint-text');
      expect(constraint!.textContent).toBe('Select between 2 and 3 items.');
    });

    it('renders "up to" text for max only', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2">${passage}</qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);
      const constraint = container.querySelector('.cutie-constraint-text');
      expect(constraint!.textContent).toBe('Select up to 2 items.');
    });

    it('renders no constraint text for single-select without a minimum', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="1">${passage}</qti-hottext-interaction>`,
        SINGLE_DECL
      );
      const container = render(doc, itemState);
      expect(container.querySelector('.cutie-constraint-text')).toBeNull();
    });
  });

  describe('validity', () => {
    it('is invalid and flags aria-invalid when below min-choices', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2" min-choices="1">${passage}</qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);

      const result = itemState.collectAll();
      expect(result.valid).toBe(false);
      expect(result.invalidCount).toBe(1);

      const group = container.querySelector('.cutie-hottext-interaction')!;
      expect(group.getAttribute('aria-invalid')).toBe('true');
      const constraint = container.querySelector('.cutie-constraint-text')!;
      expect(constraint.classList.contains('cutie-constraint-error')).toBe(true);
    });

    it('clears the error once the minimum is met', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2" min-choices="1">${passage}</qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);
      const buttons = container.querySelectorAll<HTMLButtonElement>('button.cutie-hottext');
      const group = container.querySelector('.cutie-hottext-interaction')!;

      itemState.collectAll();
      expect(group.getAttribute('aria-invalid')).toBe('true');

      buttons[1]!.click();
      expect(group.hasAttribute('aria-invalid')).toBe(false);

      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
      expect(result.responses).toEqual({ RESPONSE: ['B'] });
    });

    it('applies default selections from the response declaration', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2">${passage}</qti-hottext-interaction>`,
        `<qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
          <qti-default-value><qti-value>B</qti-value></qti-default-value>
        </qti-response-declaration>`
      );
      const container = render(doc, itemState);
      const buttons = container.querySelectorAll<HTMLButtonElement>('button.cutie-hottext');
      expect(buttons[1]!.getAttribute('aria-pressed')).toBe('true');

      const result = itemState.collectAll();
      expect(result.responses).toEqual({ RESPONSE: ['B'] });
    });
  });

  describe('enabled state', () => {
    it('disables buttons when interactions are disabled', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2">${passage}</qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);
      const buttons = container.querySelectorAll<HTMLButtonElement>('button.cutie-hottext');

      itemState.setInteractionsEnabled(false);
      expect(buttons[0]!.disabled).toBe(true);

      itemState.setInteractionsEnabled(true);
      expect(buttons[0]!.disabled).toBe(false);
    });
  });
});
