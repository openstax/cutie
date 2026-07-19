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
    transformChildren: (el: Element) => {
      const frag = document.createDocumentFragment();
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const childEl = child as Element;
          const handler = registry.getAll().find((r) => r.handler.canHandle(childEl));
          if (handler) {
            frag.appendChild(handler.handler.transform(childEl, context));
          } else {
            frag.appendChild(child.cloneNode(true));
          }
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

    it('adds no vocabulary classes to a plain interaction', () => {
      const doc = createQtiDocument(BASIC_GAP_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const interaction = container.querySelector('.cutie-gap-match-interaction')!;
      expect(interaction.className).toBe('cutie-gap-match-interaction');
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

  describe('derived match-group grouping', () => {
    // Every choice has exactly one group AND the blocks partition the gaps
    // by group -> blocks render as columns with per-group choice banks.
    const GROUPED_BLOCKS_QTI = `
      <qti-gap-match-interaction response-identifier="R1">
        <qti-gap-text identifier="ACT1" match-max="1" match-group="actions">Action 1</qti-gap-text>
        <qti-gap-text identifier="ACT2" match-max="1" match-group="actions">Action 2</qti-gap-text>
        <qti-gap-text identifier="PAR1" match-max="1" match-group="parameters">Parameter 1</qti-gap-text>
        <p>Actions<qti-gap identifier="GA1" match-group="actions"></qti-gap></p>
        <p>Parameters<qti-gap identifier="GP1" match-group="parameters"></qti-gap></p>
      </qti-gap-match-interaction>
    `;

    // Every choice has exactly one group but the gaps share one block ->
    // the shared tray clusters into sections; content flows normally.
    const GROUPED_INLINE_QTI = `
      <qti-gap-match-interaction response-identifier="R1">
        <qti-gap-text identifier="ACT1" match-max="1" match-group="actions">Action 1</qti-gap-text>
        <qti-gap-text identifier="ACT2" match-max="1" match-group="actions">Action 2</qti-gap-text>
        <qti-gap-text identifier="PAR1" match-max="1" match-group="parameters">Parameter 1</qti-gap-text>
        <p>Do <qti-gap identifier="GA1" match-group="actions"></qti-gap> then monitor <qti-gap identifier="GP1" match-group="parameters"></qti-gap></p>
      </qti-gap-match-interaction>
    `;

    function transformToContainer(qti: string): HTMLElement {
      const doc = createQtiDocument(qti);
      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      return container;
    }

    function expectPlainPresentation(container: HTMLElement): void {
      const tray = container.querySelector('.cutie-gap-match-choices')!;
      expect(tray.classList.contains('cutie-gap-match-choices--grouped')).toBe(false);
      expect(container.querySelectorAll('.cutie-gap-match-choice-group').length).toBe(0);
      expect(container.querySelectorAll('.cutie-match-group-block').length).toBe(0);
    }

    it('renders content blocks as group columns with per-group banks', () => {
      const container = transformToContainer(GROUPED_BLOCKS_QTI);

      const content = container.querySelector('.cutie-gap-match-content')!;
      expect(content.classList.contains('cutie-gap-match-content--grouped')).toBe(true);

      const blocks = content.querySelectorAll('.cutie-match-group-block');
      expect(blocks.length).toBe(2);
      expect(blocks[0].getAttribute('data-match-group')).toBe('actions');
      expect(blocks[1].getAttribute('data-match-group')).toBe('parameters');

      // Each block keeps its own gap and banks its own group's choices.
      expect(blocks[0].querySelectorAll('.cutie-gap').length).toBe(1);
      const actionIds = Array.from(
        blocks[0].querySelectorAll('.cutie-gap-match-choices--bank .cutie-gap-text')
      ).map((btn) => btn.getAttribute('data-identifier'));
      expect(actionIds).toEqual(['ACT1', 'ACT2']);
      const parameterIds = Array.from(
        blocks[1].querySelectorAll('.cutie-gap-match-choices--bank .cutie-gap-text')
      ).map((btn) => btn.getAttribute('data-identifier'));
      expect(parameterIds).toEqual(['PAR1']);

      // No shared tray outside the columns.
      const interaction = container.querySelector('.cutie-gap-match-interaction')!;
      const topLevelTrays = Array.from(interaction.children).filter((child) =>
        child.classList.contains('cutie-gap-match-choices')
      );
      expect(topLevelTrays.length).toBe(0);
    });

    it('clusters the shared tray into group sections when gaps stay inline', () => {
      const container = transformToContainer(GROUPED_INLINE_QTI);

      const tray = container.querySelector('.cutie-gap-match-choices')!;
      expect(tray.classList.contains('cutie-gap-match-choices--grouped')).toBe(true);

      const sections = tray.querySelectorAll('.cutie-gap-match-choice-group');
      expect(sections.length).toBe(2);
      expect(sections[0].getAttribute('data-match-group')).toBe('actions');
      expect(sections[0].getAttribute('role')).toBe('group');
      expect(sections[0].querySelectorAll('.cutie-gap-text').length).toBe(2);
      expect(sections[1].getAttribute('data-match-group')).toBe('parameters');
      expect(sections[1].querySelectorAll('.cutie-gap-text').length).toBe(1);

      expect(container.querySelectorAll('.cutie-match-group-block').length).toBe(0);
    });

    it('preserves each gap match-group so drops stay group-restricted', () => {
      const container = transformToContainer(GROUPED_BLOCKS_QTI);

      const gaps = container.querySelectorAll('.cutie-gap');
      const groups = Array.from(gaps).map((g) => g.getAttribute('data-match-group'));
      expect(groups).toEqual(['actions', 'parameters']);
    });

    it('falls back to the plain tray when no match groups are declared', () => {
      expectPlainPresentation(transformToContainer(BASIC_GAP_MATCH_QTI));
    });

    it('falls back when a choice declares multiple match groups', () => {
      expectPlainPresentation(transformToContainer(`
        <qti-gap-match-interaction response-identifier="R1">
          <qti-gap-text identifier="ACT1" match-max="1" match-group="actions parameters">Action 1</qti-gap-text>
          <qti-gap-text identifier="PAR1" match-max="1" match-group="parameters">Parameter 1</qti-gap-text>
          <p>Actions<qti-gap identifier="GA1" match-group="actions"></qti-gap></p>
          <p>Parameters<qti-gap identifier="GP1" match-group="parameters"></qti-gap></p>
        </qti-gap-match-interaction>
      `));
    });

    it('falls back when only one distinct group is declared', () => {
      expectPlainPresentation(transformToContainer(`
        <qti-gap-match-interaction response-identifier="R1">
          <qti-gap-text identifier="ACT1" match-max="1" match-group="actions">Action 1</qti-gap-text>
          <qti-gap-text identifier="ACT2" match-max="1" match-group="actions">Action 2</qti-gap-text>
          <p>Actions<qti-gap identifier="GA1" match-group="actions"></qti-gap></p>
        </qti-gap-match-interaction>
      `));
    });

    it('falls back when a choice group has no matching gap', () => {
      expectPlainPresentation(transformToContainer(`
        <qti-gap-match-interaction response-identifier="R1">
          <qti-gap-text identifier="ACT1" match-max="1" match-group="actions">Action 1</qti-gap-text>
          <qti-gap-text identifier="OTH1" match-max="1" match-group="other">Other 1</qti-gap-text>
          <p>Actions<qti-gap identifier="GA1" match-group="actions"></qti-gap></p>
        </qti-gap-match-interaction>
      `));
    });

    it('keeps content in normal flow when a block mixes groups', () => {
      const container = transformToContainer(`
        <qti-gap-match-interaction response-identifier="R1">
          <qti-gap-text identifier="ACT1" match-max="1" match-group="actions">Action 1</qti-gap-text>
          <qti-gap-text identifier="PAR1" match-max="1" match-group="parameters">Parameter 1</qti-gap-text>
          <p>Mixed<qti-gap identifier="GA1" match-group="actions"></qti-gap><qti-gap identifier="GP1" match-group="parameters"></qti-gap></p>
          <p>Parameters<qti-gap identifier="GP2" match-group="parameters"></qti-gap></p>
        </qti-gap-match-interaction>
      `);

      // The tray still clusters, but no block columns are derived.
      const tray = container.querySelector('.cutie-gap-match-choices')!;
      expect(tray.classList.contains('cutie-gap-match-choices--grouped')).toBe(true);
      expect(container.querySelectorAll('.cutie-match-group-block').length).toBe(0);
    });

    it('returns a picked-up choice when clicking the bank background', () => {
      const container = transformToContainer(GROUPED_INLINE_QTI);
      document.body.appendChild(container);

      try {
        const choiceBtn = container.querySelector<HTMLElement>('.cutie-gap-text[data-identifier="ACT1"]')!;
        const gap = container.querySelector<HTMLElement>('.cutie-gap[data-identifier="GA1"]')!;

        choiceBtn.click();
        gap.click();
        expect(gap.classList.contains('cutie-gap--filled')).toBe(true);

        // Pick the choice back up, then click the section background to return it.
        gap.click();
        const section = container.querySelector<HTMLElement>('.cutie-gap-match-choice-group')!;
        section.click();
        expect(gap.classList.contains('cutie-gap--filled')).toBe(false);
      } finally {
        container.remove();
      }
    });
  });
});
