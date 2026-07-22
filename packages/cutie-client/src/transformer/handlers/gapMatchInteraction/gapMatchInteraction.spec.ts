import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemStateImpl } from '../../../state/itemState';
import { registry } from '../../registry';
import type { TransformContext } from '../../types';

// Side-effect import to register the handlers (includes gap handler)
import './index';

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
  itemState: ItemStateImpl,
  contextOverrides?: Partial<TransformContext>
): DocumentFragment {
  const interaction = doc.querySelector('qti-gap-match-interaction')!;

  const context: TransformContext = {
    itemState,
    // Mirror production: transformNode dispatches to a handler or preserves the
    // element via html-passthrough; transformChildren transforms each child via
    // transformNode. This keeps authored wrappers (e.g. qti-layout-row) intact.
    transformNode: (el: Element): DocumentFragment => {
      const frag = document.createDocumentFragment();
      const handler = registry.getAll().find((r) => r.handler.canHandle(el));
      if (handler) {
        frag.appendChild(handler.handler.transform(el, context));
      } else {
        const clone = document.createElement(el.tagName);
        for (const attr of Array.from(el.attributes)) {
          clone.setAttribute(attr.name, attr.value);
        }
        clone.appendChild(context.transformChildren!(el));
        frag.appendChild(clone);
      }
      return frag;
    },
    transformChildren: (el: Element): DocumentFragment => {
      const frag = document.createDocumentFragment();
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          frag.appendChild(context.transformNode!(child as Element));
        } else {
          frag.appendChild(child.cloneNode(true));
        }
      }
      return frag;
    },
    ...contextOverrides,
  };

  const handler = registry.getAll().find((r) => r.handler.canHandle(interaction));
  return handler!.handler.transform(interaction, context);
}

const BASIC_GAP_MATCH_QTI = `
  <qti-gap-match-interaction response-identifier="R1">
    <qti-gap-text identifier="C1" match-max="1">Choice 1</qti-gap-text>
    <qti-gap-text identifier="C2" match-max="1">Choice 2</qti-gap-text>
    <p>Fill in the <qti-gap identifier="G1"></qti-gap> and <qti-gap identifier="G2"></qti-gap></p>
  </qti-gap-match-interaction>
`;

describe('gapMatchInteraction', () => {
  let itemState: ItemStateImpl;

  beforeEach(() => {
    itemState = new ItemStateImpl();
  });

  describe('error handling', () => {
    it('renders error element when response-identifier is missing', () => {
      const doc = createQtiDocument(`
        <qti-gap-match-interaction>
          <qti-gap-text identifier="C1" match-max="1">Choice 1</qti-gap-text>
          <p>Fill in the <qti-gap identifier="G1"></qti-gap></p>
        </qti-gap-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('.cutie-error-display')).not.toBeNull();
      expect(container.querySelector('.cutie-gap-match-interaction')).toBeNull();
    });
  });

  describe('basic rendering', () => {
    it('creates container with choices and content areas', () => {
      const doc = createQtiDocument(BASIC_GAP_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const interaction = container.querySelector('.cutie-gap-match-interaction')!;
      expect(interaction).not.toBeNull();
      expect(interaction.getAttribute('data-response-identifier')).toBe('R1');
      expect(interaction.getAttribute('role')).toBe('group');

      const choicesContainer = container.querySelector('.cutie-gap-match-choices')!;
      expect(choicesContainer).not.toBeNull();
      expect(choicesContainer.getAttribute('role')).toBe('listbox');

      const choices = choicesContainer.querySelectorAll('.cutie-gap-text');
      expect(choices.length).toBe(2);
      expect(choices[0].textContent).toBe('Choice 1');
      expect(choices[1].textContent).toBe('Choice 2');

      const gaps = container.querySelectorAll('.cutie-gap');
      expect(gaps.length).toBe(2);

      const contentContainer = container.querySelector('.cutie-gap-match-content')!;
      expect(contentContainer).not.toBeNull();
    });
  });

  describe('constraint text rendering', () => {
    it('does not render constraint text when min-associations is absent', () => {
      const doc = createQtiDocument(BASIC_GAP_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('.cutie-constraint-text')).toBeNull();
    });

    it('renders "Fill at least N gap(s)." when min-associations > 0', () => {
      const doc = createQtiDocument(`
        <qti-gap-match-interaction response-identifier="R1" min-associations="2">
          <qti-gap-text identifier="C1" match-max="1">Choice 1</qti-gap-text>
          <qti-gap-text identifier="C2" match-max="1">Choice 2</qti-gap-text>
          <p>Fill in the <qti-gap identifier="G1"></qti-gap> and <qti-gap identifier="G2"></qti-gap></p>
        </qti-gap-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const constraintEl = container.querySelector('.cutie-constraint-text');
      expect(constraintEl).not.toBeNull();
      expect(constraintEl!.textContent).toBe('Fill at least 2 gaps.');
    });

    it('renders "Fill between N and M gaps." when both min and max set', () => {
      const doc = createQtiDocument(`
        <qti-gap-match-interaction response-identifier="R1" min-associations="1" max-associations="3">
          <qti-gap-text identifier="C1" match-max="1">Choice 1</qti-gap-text>
          <qti-gap-text identifier="C2" match-max="1">Choice 2</qti-gap-text>
          <p>Fill in the <qti-gap identifier="G1"></qti-gap> and <qti-gap identifier="G2"></qti-gap></p>
        </qti-gap-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const constraintEl = container.querySelector('.cutie-constraint-text');
      expect(constraintEl).not.toBeNull();
      expect(constraintEl!.textContent).toBe('Fill between 1 and 3 gaps.');
    });

    it('sets aria-describedby on container linking to constraint text', () => {
      const doc = createQtiDocument(`
        <qti-gap-match-interaction response-identifier="R1" min-associations="1">
          <qti-gap-text identifier="C1" match-max="1">Choice 1</qti-gap-text>
          <p>Fill in the <qti-gap identifier="G1"></qti-gap></p>
        </qti-gap-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const gapMatchContainer = container.querySelector('.cutie-gap-match-interaction')!;
      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(gapMatchContainer.getAttribute('aria-describedby')).toContain(constraintEl.id);
    });
  });

  describe('accessor validation', () => {
    it('returns valid:true when no min-associations constraint', () => {
      const doc = createQtiDocument(BASIC_GAP_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
    });

    it('returns valid:false when min-associations constraint is not met', () => {
      const doc = createQtiDocument(`
        <qti-gap-match-interaction response-identifier="R1" min-associations="1">
          <qti-gap-text identifier="C1" match-max="1">Choice 1</qti-gap-text>
          <p>Fill in the <qti-gap identifier="G1"></qti-gap></p>
        </qti-gap-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      // No gaps filled
      const result = itemState.collectAll();
      expect(result.valid).toBe(false);
      expect(result.invalidCount).toBe(1);
    });

    it('sets aria-invalid on container when invalid', () => {
      const doc = createQtiDocument(`
        <qti-gap-match-interaction response-identifier="R1" min-associations="1">
          <qti-gap-text identifier="C1" match-max="1">Choice 1</qti-gap-text>
          <p>Fill in the <qti-gap identifier="G1"></qti-gap></p>
        </qti-gap-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      itemState.collectAll();

      const gapMatchContainer = container.querySelector('.cutie-gap-match-interaction')!;
      expect(gapMatchContainer.getAttribute('aria-invalid')).toBe('true');

      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(constraintEl.classList.contains('cutie-constraint-error')).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('registers a cleanup callback via onCleanup', () => {
      const doc = createQtiDocument(BASIC_GAP_MATCH_QTI);
      const cleanupFn = vi.fn();

      transformInteraction(doc, itemState, {
        onCleanup: (cb) => cleanupFn(cb),
      });

      expect(cleanupFn).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('disabled state', () => {
    it('adds disabled class when interactions are disabled', () => {
      const doc = createQtiDocument(BASIC_GAP_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      itemState.setInteractionsEnabled(false);

      const gapMatchContainer = container.querySelector('.cutie-gap-match-interaction')!;
      expect(gapMatchContainer.classList.contains('cutie-gap-match-interaction--disabled')).toBe(true);
    });

    it('removes disabled class when interactions are re-enabled', () => {
      const doc = createQtiDocument(BASIC_GAP_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      itemState.setInteractionsEnabled(false);
      itemState.setInteractionsEnabled(true);

      const gapMatchContainer = container.querySelector('.cutie-gap-match-interaction')!;
      expect(gapMatchContainer.classList.contains('cutie-gap-match-interaction--disabled')).toBe(false);
    });
  });

  describe('QTI shared vocabulary', () => {
    it('passes source classes through to the container', () => {
      const doc = createQtiDocument(`
        <qti-gap-match-interaction response-identifier="R1" class="qti-choices-bottom">
          <qti-gap-text identifier="C1" match-max="1">Choice 1</qti-gap-text>
          <p>Fill in the <qti-gap identifier="G1"></qti-gap></p>
        </qti-gap-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const interaction = container.querySelector('.cutie-gap-match-interaction')!;
      expect(interaction.classList.contains('qti-choices-bottom')).toBe(true);
    });

    it('adds no QTI vocabulary classes to a plain interaction', () => {
      const doc = createQtiDocument(BASIC_GAP_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const interaction = container.querySelector('.cutie-gap-match-interaction')!;
      const hasQtiVocab = Array.from(interaction.classList).some((c) => c.startsWith('qti-'));
      expect(hasQtiVocab).toBe(false);
    });

    it('applies data-choices-container-width to the word bank', () => {
      const doc = createQtiDocument(`
        <qti-gap-match-interaction response-identifier="R1" data-choices-container-width="480">
          <qti-gap-text identifier="C1" match-max="1">Choice 1</qti-gap-text>
          <p>Fill in the <qti-gap identifier="G1"></qti-gap></p>
        </qti-gap-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const tray = container.querySelector('.cutie-gap-match-choices') as HTMLElement;
      expect(tray.style.width).toBe('480px');
    });

    it('ignores an invalid data-choices-container-width', () => {
      const doc = createQtiDocument(`
        <qti-gap-match-interaction response-identifier="R1" data-choices-container-width="wide">
          <qti-gap-text identifier="C1" match-max="1">Choice 1</qti-gap-text>
          <p>Fill in the <qti-gap identifier="G1"></qti-gap></p>
        </qti-gap-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const tray = container.querySelector('.cutie-gap-match-choices') as HTMLElement;
      expect(tray.style.width).toBe('');
    });
  });

  describe('author-declared layout columns', () => {
    // Content laid out with the QTI layout grid: each qti-layout-col holds one
    // match-group's gaps, so each column banks that group's choices.
    const LAYOUT_COLUMNS_QTI = `
      <qti-gap-match-interaction response-identifier="R1">
        <qti-gap-text identifier="ACT1" match-max="1" match-group="actions">Action 1</qti-gap-text>
        <qti-gap-text identifier="ACT2" match-max="1" match-group="actions">Action 2</qti-gap-text>
        <qti-gap-text identifier="PAR1" match-max="1" match-group="parameters">Parameter 1</qti-gap-text>
        <div class="qti-layout-row">
          <div class="qti-layout-col-6"><p>Actions<qti-gap identifier="GA1" match-group="actions"></qti-gap></p></div>
          <div class="qti-layout-col-6"><p>Parameters<qti-gap identifier="GP1" match-group="parameters"></qti-gap></p></div>
        </div>
      </qti-gap-match-interaction>
    `;

    function transformToContainer(qti: string): HTMLElement {
      const doc = createQtiDocument(qti);
      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      return container;
    }

    it('preserves the authored qti-layout-row wrapper around the columns', () => {
      const container = transformToContainer(LAYOUT_COLUMNS_QTI);

      const row = container.querySelector('.cutie-gap-match-content > .qti-layout-row');
      expect(row).not.toBeNull();
      expect(row!.querySelectorAll(':scope > .qti-layout-col-6').length).toBe(2);
    });

    it('injects a per-column bank into each layout column keyed by its gap group', () => {
      const container = transformToContainer(LAYOUT_COLUMNS_QTI);

      const columns = container.querySelectorAll('.qti-layout-col-6');
      expect(columns.length).toBe(2);
      columns.forEach((col) => {
        expect(col.classList.contains('cutie-gap-match-column')).toBe(true);
      });

      const actionsBank = columns[0].querySelector('.cutie-gap-match-choices--column')!;
      expect(actionsBank.getAttribute('data-match-group')).toBe('actions');
      const actionIds = Array.from(actionsBank.querySelectorAll('.cutie-gap-text')).map((b) =>
        b.getAttribute('data-identifier')
      );
      expect(actionIds).toEqual(['ACT1', 'ACT2']);

      const parametersBank = columns[1].querySelector('.cutie-gap-match-choices--column')!;
      expect(parametersBank.getAttribute('data-match-group')).toBe('parameters');
      const parameterIds = Array.from(parametersBank.querySelectorAll('.cutie-gap-text')).map((b) =>
        b.getAttribute('data-identifier')
      );
      expect(parameterIds).toEqual(['PAR1']);
    });

    it('does not render a shared tray when every choice is banked into a column', () => {
      const container = transformToContainer(LAYOUT_COLUMNS_QTI);

      const interaction = container.querySelector('.cutie-gap-match-interaction')!;
      expect(interaction.classList.contains('cutie-gap-match-interaction--shared-tray')).toBe(false);

      const banks = container.querySelectorAll('.cutie-gap-match-choices');
      expect(banks.length).toBe(2);
      banks.forEach((bank) =>
        expect(bank.classList.contains('cutie-gap-match-choices--column')).toBe(true)
      );
    });

    it('preserves each gap match-group so drops stay group-restricted', () => {
      const container = transformToContainer(LAYOUT_COLUMNS_QTI);

      const groups = Array.from(container.querySelectorAll('.cutie-gap')).map((g) =>
        g.getAttribute('data-match-group')
      );
      expect(groups).toEqual(['actions', 'parameters']);
    });

    it('renders a single shared tray with all choices when no layout grid is used', () => {
      const container = transformToContainer(BASIC_GAP_MATCH_QTI);

      const interaction = container.querySelector('.cutie-gap-match-interaction')!;
      expect(interaction.classList.contains('cutie-gap-match-interaction--shared-tray')).toBe(true);

      const banks = container.querySelectorAll('.cutie-gap-match-choices');
      expect(banks.length).toBe(1);
      expect(banks[0].querySelectorAll('.cutie-gap-text').length).toBe(2);
      expect(banks[0].querySelector('.cutie-gap-match-choices--column')).toBeNull();
    });

    it('banks a column only when its gaps share a single group, else uses a shared tray', () => {
      const container = transformToContainer(`
        <qti-gap-match-interaction response-identifier="R1">
          <qti-gap-text identifier="ACT1" match-max="1" match-group="actions">Action 1</qti-gap-text>
          <qti-gap-text identifier="PAR1" match-max="1" match-group="parameters">Parameter 1</qti-gap-text>
          <div class="qti-layout-row">
            <div class="qti-layout-col-12"><p>Mixed<qti-gap identifier="GA1" match-group="actions"></qti-gap><qti-gap identifier="GP1" match-group="parameters"></qti-gap></p></div>
          </div>
        </qti-gap-match-interaction>
      `);

      expect(container.querySelector('.cutie-gap-match-choices--column')).toBeNull();
      const interaction = container.querySelector('.cutie-gap-match-interaction')!;
      expect(interaction.classList.contains('cutie-gap-match-interaction--shared-tray')).toBe(true);
      const tray = container.querySelector('.cutie-gap-match-choices')!;
      expect(tray.querySelectorAll('.cutie-gap-text').length).toBe(2);
    });

    it('seeds exactly one tabbable choice per bank so Tab moves between banks', () => {
      const container = transformToContainer(LAYOUT_COLUMNS_QTI);

      const banks = container.querySelectorAll('.cutie-gap-match-choices--column');
      expect(banks.length).toBe(2);
      banks.forEach((bank) => {
        expect(bank.querySelectorAll('.cutie-gap-text[tabindex="0"]').length).toBe(1);
      });
    });

    it('keeps arrow-key navigation within a bank, wrapping instead of crossing', () => {
      const container = transformToContainer(LAYOUT_COLUMNS_QTI);
      document.body.appendChild(container);

      try {
        const act1 = container.querySelector<HTMLElement>('.cutie-gap-text[data-identifier="ACT1"]')!;
        const act2 = container.querySelector<HTMLElement>('.cutie-gap-text[data-identifier="ACT2"]')!;

        act1.focus();
        act1.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        expect(document.activeElement).toBe(act2);

        // Arrowing off the last choice wraps within the bank — never into the
        // parameters bank.
        act2.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        expect(document.activeElement).toBe(act1);
      } finally {
        container.remove();
      }
    });

    it('returns a picked-up choice when clicking the column bank background', () => {
      const container = transformToContainer(LAYOUT_COLUMNS_QTI);
      document.body.appendChild(container);

      try {
        const choiceBtn = container.querySelector<HTMLElement>('.cutie-gap-text[data-identifier="ACT1"]')!;
        const gap = container.querySelector<HTMLElement>('.cutie-gap[data-identifier="GA1"]')!;

        choiceBtn.click();
        gap.click();
        expect(gap.classList.contains('cutie-gap--filled')).toBe(true);

        // Pick the choice back up, then click the bank background to return it.
        gap.click();
        const bank = container.querySelector<HTMLElement>('.cutie-gap-match-choices--column')!;
        bank.click();
        expect(gap.classList.contains('cutie-gap--filled')).toBe(false);
      } finally {
        container.remove();
      }
    });
  });
});
