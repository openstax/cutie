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

// Two distinct match-group values, one gap each — shaped like the gap-match
// rationale "dyad" example item.
const GROUPED_GAP_MATCH_DYAD_QTI = `
  <qti-gap-match-interaction response-identifier="R1">
    <qti-gap-text identifier="A1" match-max="1" match-group="cause">Cause A</qti-gap-text>
    <qti-gap-text identifier="A2" match-max="1" match-group="cause">Cause B</qti-gap-text>
    <qti-gap-text identifier="A3" match-max="1" match-group="cause">Cause C</qti-gap-text>
    <qti-gap-text identifier="B1" match-max="1" match-group="effect">Effect A</qti-gap-text>
    <qti-gap-text identifier="B2" match-max="1" match-group="effect">Effect B</qti-gap-text>
    <qti-gap-text identifier="B3" match-max="1" match-group="effect">Effect C</qti-gap-text>
    <p>Fill in <qti-gap identifier="GC" match-group="cause"></qti-gap> and <qti-gap identifier="GE" match-group="effect"></qti-gap></p>
  </qti-gap-match-interaction>
`;

// Two distinct match-group values, one group spanning two gaps — shaped like
// the gap-match rationale "triad" example item.
const GROUPED_GAP_MATCH_TRIAD_QTI = `
  <qti-gap-match-interaction response-identifier="R1">
    <qti-gap-text identifier="A1" match-max="1" match-group="cause">Cause A</qti-gap-text>
    <qti-gap-text identifier="A2" match-max="1" match-group="cause">Cause B</qti-gap-text>
    <qti-gap-text identifier="A3" match-max="1" match-group="cause">Cause C</qti-gap-text>
    <qti-gap-text identifier="B1" match-max="1" match-group="effects">Effect A</qti-gap-text>
    <qti-gap-text identifier="B2" match-max="1" match-group="effects">Effect B</qti-gap-text>
    <qti-gap-text identifier="B3" match-max="1" match-group="effects">Effect C</qti-gap-text>
    <qti-gap-text identifier="B4" match-max="1" match-group="effects">Effect D</qti-gap-text>
    <p>Fill in <qti-gap identifier="GC" match-group="cause"></qti-gap>, <qti-gap identifier="GE1" match-group="effects"></qti-gap>, and <qti-gap identifier="GE2" match-group="effects"></qti-gap></p>
  </qti-gap-match-interaction>
`;

// One grouped choice mixed with ungrouped choices — the ungrouped choices
// should still form their own visual bucket.
const MIXED_GROUP_GAP_MATCH_QTI = `
  <qti-gap-match-interaction response-identifier="R1">
    <qti-gap-text identifier="A1" match-max="1" match-group="a">Grouped A</qti-gap-text>
    <qti-gap-text identifier="U1" match-max="1">Ungrouped A</qti-gap-text>
    <qti-gap-text identifier="U2" match-max="1">Ungrouped B</qti-gap-text>
    <p>Fill in <qti-gap identifier="G1" match-group="a"></qti-gap> and <qti-gap identifier="G2"></qti-gap></p>
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

  describe('grouped word banks (match-group)', () => {
    it('splits choices into per-group containers for a dyad-shaped item', () => {
      const doc = createQtiDocument(GROUPED_GAP_MATCH_DYAD_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const choicesContainer = container.querySelector('.cutie-gap-match-choices')!;
      expect(choicesContainer.getAttribute('role')).toBe('group');
      expect(choicesContainer.classList.contains('cutie-gap-match-choices--grouped')).toBe(true);

      const groups = choicesContainer.querySelectorAll('.cutie-gap-match-choices-group');
      expect(groups.length).toBe(2);

      expect(groups[0]!.getAttribute('role')).toBe('listbox');
      expect(groups[0]!.getAttribute('aria-label')).toBe('Word bank 1');
      expect(groups[1]!.getAttribute('aria-label')).toBe('Word bank 2');

      const group1Choices = Array.from(groups[0]!.querySelectorAll('.cutie-gap-text')).map((el) =>
        el.getAttribute('data-identifier')
      );
      expect(group1Choices).toEqual(['A1', 'A2', 'A3']);

      const group2Choices = Array.from(groups[1]!.querySelectorAll('.cutie-gap-text')).map((el) =>
        el.getAttribute('data-identifier')
      );
      expect(group2Choices).toEqual(['B1', 'B2', 'B3']);
    });

    it('splits choices into per-group containers for a triad-shaped item (one group spanning two gaps)', () => {
      const doc = createQtiDocument(GROUPED_GAP_MATCH_TRIAD_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const groups = container.querySelectorAll('.cutie-gap-match-choices-group');
      expect(groups.length).toBe(2);
      expect(groups[0]!.querySelectorAll('.cutie-gap-text').length).toBe(3);
      expect(groups[1]!.querySelectorAll('.cutie-gap-text').length).toBe(4);

      const gaps = container.querySelectorAll('.cutie-gap');
      expect(gaps.length).toBe(3);
    });

    it('treats ungrouped choices as their own bucket when mixed with a grouped choice', () => {
      const doc = createQtiDocument(MIXED_GROUP_GAP_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const groups = container.querySelectorAll('.cutie-gap-match-choices-group');
      expect(groups.length).toBe(2);

      const group1Choices = Array.from(groups[0]!.querySelectorAll('.cutie-gap-text')).map((el) =>
        el.getAttribute('data-identifier')
      );
      expect(group1Choices).toEqual(['A1']);

      const group2Choices = Array.from(groups[1]!.querySelectorAll('.cutie-gap-text')).map((el) =>
        el.getAttribute('data-identifier')
      );
      expect(group2Choices).toEqual(['U1', 'U2']);
    });

    it('keeps a single flat container (no grouping) when zero or one distinct match-group is present', () => {
      const doc = createQtiDocument(BASIC_GAP_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const choicesContainer = container.querySelector('.cutie-gap-match-choices')!;
      expect(choicesContainer.getAttribute('role')).toBe('listbox');
      expect(choicesContainer.classList.contains('cutie-gap-match-choices--grouped')).toBe(false);
      expect(container.querySelectorAll('.cutie-gap-match-choices-group').length).toBe(0);

      // Choice buttons remain direct children of the flat container, exactly as before
      const directChildren = Array.from(choicesContainer.children).filter((el) =>
        el.classList.contains('cutie-gap-text')
      );
      expect(directChildren.length).toBe(2);
    });

    it('still places a choice from a non-first group into its gap correctly', () => {
      const doc = createQtiDocument(GROUPED_GAP_MATCH_DYAD_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const effectChoice = container.querySelector('[data-identifier="B2"]') as HTMLElement;
      const effectGap = container.querySelector('[data-identifier="GE"]') as HTMLElement;

      effectChoice.click();
      effectGap.click();

      const response = itemState.getResponse('R1') as string[];
      expect(response).toContain('B2 GE');
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
});
