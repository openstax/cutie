/* spell-checker: ignore hottext radiogroup */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

// `.focus()` and `document.activeElement` only work for elements attached to
// the document, so arrow/focus tests attach the rendered container and clean up
// in an afterEach.
const attached: HTMLElement[] = [];
function attach(container: HTMLElement): HTMLElement {
  document.body.appendChild(container);
  attached.push(container);
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

  afterEach(() => {
    while (attached.length) attached.pop()!.remove();
  });

  describe('rendering', () => {
    it('renders a toggle button for each qti-hottext', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2">${passage}</qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);

      const buttons = container.querySelectorAll('.cutie-hottext');
      expect(buttons.length).toBe(4);
      // Rendered as inline <span> (not <button>) so it can flow as running text,
      // with the button role and a tab stop supplied explicitly.
      expect(buttons[0]!.tagName).toBe('SPAN');
      expect(buttons[0]!.getAttribute('role')).toBe('button');
      expect(buttons[0]!.getAttribute('tabindex')).toBe('0');
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
      expect(container.querySelector('.cutie-hottext')).toBeNull();
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
      const buttons = container.querySelectorAll<HTMLElement>('.cutie-hottext');

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
      const buttons = container.querySelectorAll<HTMLElement>('.cutie-hottext');

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

  describe('keyboard activation', () => {
    // Rendering as <span> means we lose the native button's Enter/Space
    // activation, so the handler wires those keys up itself.
    const press = (el: HTMLElement, key: string): boolean =>
      el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

    it('toggles a multi-select hottext on Enter', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2">${passage}</qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);
      const buttons = container.querySelectorAll<HTMLElement>('.cutie-hottext');

      press(buttons[1]!, 'Enter');
      expect(buttons[1]!.getAttribute('aria-pressed')).toBe('true');
      press(buttons[1]!, 'Enter');
      expect(buttons[1]!.getAttribute('aria-pressed')).toBe('false');
    });

    it('activates on Space and prevents the default page scroll', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2">${passage}</qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);
      const buttons = container.querySelectorAll<HTMLElement>('.cutie-hottext');

      const notCancelled = press(buttons[0]!, ' ');
      expect(buttons[0]!.getAttribute('aria-pressed')).toBe('true');
      expect(notCancelled).toBe(false); // preventDefault() was called
    });
  });

  describe('single-select behavior (radiogroup)', () => {
    it('exposes radiogroup + radio semantics instead of aria-pressed toggles', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="1">${passage}</qti-hottext-interaction>`,
        SINGLE_DECL
      );
      const container = render(doc, itemState);

      const group = container.querySelector('.cutie-hottext-interaction')!;
      expect(group.getAttribute('role')).toBe('radiogroup');

      const buttons = container.querySelectorAll<HTMLElement>('.cutie-hottext');
      for (const button of buttons) {
        expect(button.getAttribute('role')).toBe('radio');
        expect(button.getAttribute('aria-checked')).toBe('false');
        expect(button.hasAttribute('aria-pressed')).toBe(false);
      }
    });

    it('sets aria-required when min-choices >= 1', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="1" min-choices="1">${passage}</qti-hottext-interaction>`,
        SINGLE_DECL
      );
      const container = render(doc, itemState);
      const group = container.querySelector('.cutie-hottext-interaction')!;
      expect(group.getAttribute('aria-required')).toBe('true');
    });

    it('does not set aria-required without a minimum', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="1">${passage}</qti-hottext-interaction>`,
        SINGLE_DECL
      );
      const container = render(doc, itemState);
      const group = container.querySelector('.cutie-hottext-interaction')!;
      expect(group.hasAttribute('aria-required')).toBe(false);
    });

    it('clears siblings on selection and collects a scalar response', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="1">${passage}</qti-hottext-interaction>`,
        SINGLE_DECL
      );
      const container = render(doc, itemState);
      const buttons = container.querySelectorAll<HTMLElement>('.cutie-hottext');

      buttons[0]!.click();
      buttons[2]!.click();
      expect(buttons[0]!.getAttribute('aria-checked')).toBe('false');
      expect(buttons[2]!.getAttribute('aria-checked')).toBe('true');

      const result = itemState.collectAll();
      expect(result.responses).toEqual({ RESPONSE: 'C' });
    });

    it('does not deselect a radio when re-activated (no toggle-off)', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="1">${passage}</qti-hottext-interaction>`,
        SINGLE_DECL
      );
      const container = render(doc, itemState);
      const buttons = container.querySelectorAll<HTMLElement>('.cutie-hottext');

      buttons[2]!.click();
      buttons[2]!.click();
      expect(buttons[2]!.getAttribute('aria-checked')).toBe('true');
      expect(itemState.collectAll().responses).toEqual({ RESPONSE: 'C' });
    });

    it('keeps exactly one tab stop and moves it to the selection (roving tabindex)', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="1">${passage}</qti-hottext-interaction>`,
        SINGLE_DECL
      );
      const container = render(doc, itemState);
      const buttons = Array.from(
        container.querySelectorAll<HTMLElement>('.cutie-hottext')
      );

      const tabbable = () => buttons.filter((b) => b.getAttribute('tabindex') === '0');
      expect(tabbable()).toEqual([buttons[0]]);

      buttons[2]!.click();
      expect(tabbable()).toEqual([buttons[2]]);
    });

    it('moves focus and selection with arrow keys', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="1">${passage}</qti-hottext-interaction>`,
        SINGLE_DECL
      );
      const container = attach(render(doc, itemState));
      const buttons = container.querySelectorAll<HTMLElement>('.cutie-hottext');

      buttons[0]!.focus();
      buttons[0]!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      );
      expect(document.activeElement).toBe(buttons[1]);
      expect(buttons[1]!.getAttribute('aria-checked')).toBe('true');
      expect(itemState.collectAll().responses).toEqual({ RESPONSE: 'B' });

      buttons[1]!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
      );
      expect(document.activeElement).toBe(buttons[0]);
      expect(buttons[0]!.getAttribute('aria-checked')).toBe('true');
      expect(buttons[1]!.getAttribute('aria-checked')).toBe('false');
      expect(itemState.collectAll().responses).toEqual({ RESPONSE: 'A' });
    });

    it('applies a scalar default and makes the checked radio the tab stop', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="1">${passage}</qti-hottext-interaction>`,
        `<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
          <qti-default-value><qti-value>C</qti-value></qti-default-value>
        </qti-response-declaration>`
      );
      const container = render(doc, itemState);
      const buttons = Array.from(
        container.querySelectorAll<HTMLElement>('.cutie-hottext')
      );

      expect(buttons[2]!.getAttribute('aria-checked')).toBe('true');
      expect(buttons.filter((b) => b.getAttribute('tabindex') === '0')).toEqual([buttons[2]]);
      expect(itemState.collectAll().responses).toEqual({ RESPONSE: 'C' });
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
      const buttons = container.querySelectorAll<HTMLElement>('.cutie-hottext');
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
      const buttons = container.querySelectorAll<HTMLElement>('.cutie-hottext');
      expect(buttons[1]!.getAttribute('aria-pressed')).toBe('true');

      const result = itemState.collectAll();
      expect(result.responses).toEqual({ RESPONSE: ['B'] });
    });
  });

  describe('enabled state', () => {
    it('toggles aria-disabled and blocks activation when interactions are disabled', () => {
      const doc = createQtiDocument(
        `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2">${passage}</qti-hottext-interaction>`,
        MULTI_DECL
      );
      const container = render(doc, itemState);
      const buttons = container.querySelectorAll<HTMLElement>('.cutie-hottext');

      // A <span> has no native `disabled`; disabled state is conveyed via ARIA.
      itemState.setInteractionsEnabled(false);
      expect(buttons[0]!.getAttribute('aria-disabled')).toBe('true');

      // Activation is a no-op while disabled.
      buttons[0]!.click();
      expect(buttons[0]!.getAttribute('aria-pressed')).toBe('false');
      expect(itemState.collectAll().responses).toEqual({ RESPONSE: null });

      itemState.setInteractionsEnabled(true);
      expect(buttons[0]!.hasAttribute('aria-disabled')).toBe(false);

      buttons[0]!.click();
      expect(buttons[0]!.getAttribute('aria-pressed')).toBe('true');
    });
  });
});
