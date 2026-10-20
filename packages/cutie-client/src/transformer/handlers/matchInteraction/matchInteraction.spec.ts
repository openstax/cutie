// cspell:ignore distractors
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemStateImpl } from '../../../state/itemState.js';
import { registry } from '../../registry.js';
import type { TransformContext } from '../../types.js';

// Side-effect import to register the handler
import './index.js';

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
  const interaction = doc.querySelector('qti-match-interaction')!;

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

const BASIC_MATCH_QTI = `
  <qti-match-interaction response-identifier="R1" max-associations="4">
    <qti-simple-match-set>
      <qti-simple-associable-choice identifier="S1" match-max="1">Source 1</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="S2" match-max="1">Source 2</qti-simple-associable-choice>
    </qti-simple-match-set>
    <qti-simple-match-set>
      <qti-simple-associable-choice identifier="T1" match-max="1">Target 1</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="T2" match-max="1">Target 2</qti-simple-associable-choice>
    </qti-simple-match-set>
  </qti-match-interaction>
`;

// A bowtie: source choices carry match-group naming their target column, so
// the handler renders one column per target with a per-group source bank.
const GROUPED_BOWTIE_QTI = `
  <qti-match-interaction response-identifier="RB">
    <qti-simple-match-set>
      <qti-simple-associable-choice identifier="ACT1" match-max="1" match-group="T_ACTIONS">Action 1</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="ACT2" match-max="1" match-group="T_ACTIONS">Action 2</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="COND1" match-max="1" match-group="T_CONDITION">Condition 1</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="COND2" match-max="1" match-group="T_CONDITION">Condition 2</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="PAR1" match-max="1" match-group="T_PARAMS">Parameter 1</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="PAR2" match-max="1" match-group="T_PARAMS">Parameter 2</qti-simple-associable-choice>
    </qti-simple-match-set>
    <qti-simple-match-set>
      <qti-simple-associable-choice identifier="T_ACTIONS" match-max="2" fixed="true">Actions to Take</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="T_CONDITION" match-max="1" fixed="true">Condition</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="T_PARAMS" match-max="2" fixed="true">Parameters to Monitor</qti-simple-associable-choice>
    </qti-simple-match-set>
  </qti-match-interaction>
`;

describe('matchInteraction validation', () => {
  let itemState: ItemStateImpl;

  beforeEach(() => {
    itemState = new ItemStateImpl();
  });

  describe('constraint text rendering', () => {
    it('does not render constraint text when min-associations is absent', () => {
      const doc = createQtiDocument(BASIC_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('.cutie-constraint-text')).toBeNull();
    });

    it('renders "Make at least N match(es)." when min-associations > 0', () => {
      const doc = createQtiDocument(`
        <qti-match-interaction response-identifier="R1" max-associations="4" min-associations="2">
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="S1" match-max="1">Source 1</qti-simple-associable-choice>
            <qti-simple-associable-choice identifier="S2" match-max="1">Source 2</qti-simple-associable-choice>
          </qti-simple-match-set>
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="T1" match-max="1">Target 1</qti-simple-associable-choice>
            <qti-simple-associable-choice identifier="T2" match-max="1">Target 2</qti-simple-associable-choice>
          </qti-simple-match-set>
        </qti-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const constraintEl = container.querySelector('.cutie-constraint-text');
      expect(constraintEl).not.toBeNull();
      expect(constraintEl!.textContent).toBe('Make between 2 and 4 matches.');
    });

    it('renders "Make at least 1 match." for min-associations="1" and no max', () => {
      const doc = createQtiDocument(`
        <qti-match-interaction response-identifier="R1" max-associations="0" min-associations="1">
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="S1" match-max="1">Source 1</qti-simple-associable-choice>
          </qti-simple-match-set>
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="T1" match-max="1">Target 1</qti-simple-associable-choice>
          </qti-simple-match-set>
        </qti-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const constraintEl = container.querySelector('.cutie-constraint-text');
      expect(constraintEl).not.toBeNull();
      expect(constraintEl!.textContent).toBe('Make at least 1 match.');
    });

    it('sets aria-describedby on container linking to constraint text', () => {
      const doc = createQtiDocument(`
        <qti-match-interaction response-identifier="R1" max-associations="4" min-associations="1">
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="S1" match-max="1">Source 1</qti-simple-associable-choice>
          </qti-simple-match-set>
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="T1" match-max="1">Target 1</qti-simple-associable-choice>
          </qti-simple-match-set>
        </qti-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const matchContainer = container.querySelector('.cutie-match-interaction')!;
      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(matchContainer.getAttribute('aria-describedby')).toContain(constraintEl.id);
    });
  });

  describe('error handling', () => {
    it('renders error when response-identifier is missing', () => {
      const doc = createQtiDocument(`
        <qti-match-interaction>
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="S1" match-max="1">Source 1</qti-simple-associable-choice>
          </qti-simple-match-set>
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="T1" match-max="1">Target 1</qti-simple-associable-choice>
          </qti-simple-match-set>
        </qti-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      expect(container.querySelector('.cutie-error-display')).not.toBeNull();
      expect(container.querySelector('.cutie-match-interaction')).toBeNull();
    });
  });

  describe('basic rendering', () => {
    it('creates container with correct structure and two match sets', () => {
      const doc = createQtiDocument(BASIC_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const matchContainer = container.querySelector('.cutie-match-interaction')!;
      expect(matchContainer).not.toBeNull();
      expect(matchContainer.getAttribute('role')).toBe('group');

      const layout = container.querySelector('.cutie-match-layout')!;
      expect(layout).not.toBeNull();
      expect(layout.classList.contains('cutie-match-source-left')).toBe(true);

      const matchSets = container.querySelectorAll('.cutie-match-set');
      expect(matchSets.length).toBe(2);

      const choices = container.querySelectorAll('.cutie-match-choice');
      expect(choices.length).toBe(4);
    });
  });

  describe('orientation', () => {
    it('defaults to cutie-match-source-left when no class specified', () => {
      const doc = createQtiDocument(BASIC_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const layout = container.querySelector('.cutie-match-layout')!;
      expect(layout.classList.contains('cutie-match-source-left')).toBe(true);
    });

    it('reads qti-match-source-right from class attribute', () => {
      const doc = createQtiDocument(`
        <qti-match-interaction response-identifier="R1" class="qti-match-source-right" max-associations="4">
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="S1" match-max="1">Source 1</qti-simple-associable-choice>
          </qti-simple-match-set>
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="T1" match-max="1">Target 1</qti-simple-associable-choice>
          </qti-simple-match-set>
        </qti-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const layout = container.querySelector('.cutie-match-layout')!;
      expect(layout.classList.contains('cutie-match-source-right')).toBe(true);
      expect(layout.classList.contains('cutie-match-source-left')).toBe(false);
    });

    it('reads qti-match-source-top from class attribute', () => {
      const doc = createQtiDocument(`
        <qti-match-interaction response-identifier="R1" class="qti-match-source-top" max-associations="4">
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="S1" match-max="1">Source 1</qti-simple-associable-choice>
          </qti-simple-match-set>
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="T1" match-max="1">Target 1</qti-simple-associable-choice>
          </qti-simple-match-set>
        </qti-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const layout = container.querySelector('.cutie-match-layout')!;
      expect(layout.classList.contains('cutie-match-source-top')).toBe(true);
    });

    it('reads qti-match-source-bottom from class attribute', () => {
      const doc = createQtiDocument(`
        <qti-match-interaction response-identifier="R1" class="qti-match-source-bottom" max-associations="4">
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="S1" match-max="1">Source 1</qti-simple-associable-choice>
          </qti-simple-match-set>
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="T1" match-max="1">Target 1</qti-simple-associable-choice>
          </qti-simple-match-set>
        </qti-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const layout = container.querySelector('.cutie-match-layout')!;
      expect(layout.classList.contains('cutie-match-source-bottom')).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('initializes choices with aria-selected="false"', () => {
      const doc = createQtiDocument(BASIC_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const choices = container.querySelectorAll('.cutie-match-choice');
      for (const choice of choices) {
        expect(choice.getAttribute('aria-selected')).toBe('false');
      }
    });
  });

  describe('cleanup', () => {
    it('registers a cleanup callback via onCleanup', () => {
      const doc = createQtiDocument(BASIC_MATCH_QTI);
      const cleanupFn = vi.fn();

      transformInteraction(doc, itemState, {
        onCleanup: (cb) => cleanupFn(cb),
      });

      expect(cleanupFn).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('disabled state', () => {
    it('adds disabled class when interactions are disabled', () => {
      const doc = createQtiDocument(BASIC_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      itemState.setInteractionState('disabled');

      const matchContainer = container.querySelector('.cutie-match-interaction')!;
      expect(matchContainer.classList.contains('cutie-match-interaction--disabled')).toBe(true);
    });

    it('removes disabled class when interactions are re-enabled', () => {
      const doc = createQtiDocument(BASIC_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      itemState.setInteractionState('disabled');
      itemState.setInteractionState('enabled');

      const matchContainer = container.querySelector('.cutie-match-interaction')!;
      expect(matchContainer.classList.contains('cutie-match-interaction--disabled')).toBe(false);
    });

    it('restores one tabbable choice per set when interactions are re-enabled', () => {
      const doc = createQtiDocument(BASIC_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const tabbableIn = (set: string) =>
        Array.from(container.querySelectorAll(`.cutie-match-set--${set} .cutie-match-choice`))
          .filter((c) => c.getAttribute('tabindex') === '0')
          .map((c) => c.getAttribute('data-identifier'));

      itemState.setInteractionState('disabled');
      expect(tabbableIn('source')).toEqual([]);
      expect(tabbableIn('target')).toEqual([]);

      itemState.setInteractionState('enabled');
      expect(tabbableIn('source')).toEqual(['S1']);
      expect(tabbableIn('target')).toEqual(['T1']);
    });
  });

  describe('moving an association via its chip', () => {
    // L allows two pairs, so it can share M with D and still accept more.
    const MOVE_QTI = `
      <qti-match-interaction response-identifier="R1" max-associations="4">
        <qti-simple-match-set>
          <qti-simple-associable-choice identifier="C" match-max="1">Capulet</qti-simple-associable-choice>
          <qti-simple-associable-choice identifier="D" match-max="1">Demetrius</qti-simple-associable-choice>
          <qti-simple-associable-choice identifier="L" match-max="2">Lysander</qti-simple-associable-choice>
        </qti-simple-match-set>
        <qti-simple-match-set>
          <qti-simple-associable-choice identifier="M" match-max="4">Midsummer</qti-simple-associable-choice>
          <qti-simple-associable-choice identifier="R" match-max="4">Romeo</qti-simple-associable-choice>
        </qti-simple-match-set>
      </qti-match-interaction>
    `;

    const renderWithTwoPairsOnM = (): HTMLElement => {
      const container = document.createElement('div');
      container.appendChild(transformInteraction(createQtiDocument(MOVE_QTI), itemState));
      const click = (id: string) =>
        (container.querySelector(`.cutie-match-choice[data-identifier="${id}"]`) as HTMLElement).click();
      click('D');
      click('M');
      click('L');
      click('M');
      // Select the M chip under D: moving M's end of the D-M pair.
      (container.querySelector('.cutie-match-chip[data-source-id="D"][data-connected-id="M"]') as HTMLElement).click();
      return container;
    };

    const choiceEl = (container: HTMLElement, id: string) =>
      container.querySelector(`.cutie-match-choice[data-identifier="${id}"]`) as HTMLElement;

    it('moves the pair to a new partner that can accept it', () => {
      const container = renderWithTwoPairsOnM();

      expect(choiceEl(container, 'C').classList.contains('cutie-match-choice--drop-target')).toBe(true);
      choiceEl(container, 'C').click();

      expect(itemState.collectAll().responses['R1']).toEqual(['L M', 'C M']);
    });

    it('does not offer or apply a move onto a pair that already exists', () => {
      const container = renderWithTwoPairsOnM();

      // L has room (1 of 2), but L-M already exists.
      expect(choiceEl(container, 'L').classList.contains('cutie-match-choice--drop-target')).toBe(false);
      choiceEl(container, 'L').click();

      expect(itemState.collectAll().responses['R1']).toEqual(['D M', 'L M']);
    });
  });

  describe('accessor validation', () => {
    it('returns valid:true when no min-associations constraint', () => {
      const doc = createQtiDocument(BASIC_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      const result = itemState.collectAll();
      expect(result.valid).toBe(true);
    });

    it('returns valid:false when min-associations constraint is not met', () => {
      const doc = createQtiDocument(`
        <qti-match-interaction response-identifier="R1" max-associations="4" min-associations="1">
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="S1" match-max="1">Source 1</qti-simple-associable-choice>
          </qti-simple-match-set>
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="T1" match-max="1">Target 1</qti-simple-associable-choice>
          </qti-simple-match-set>
        </qti-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      // No associations made
      const result = itemState.collectAll();
      expect(result.valid).toBe(false);
      expect(result.invalidCount).toBe(1);
    });

    it('sets aria-invalid on container when invalid', () => {
      const doc = createQtiDocument(`
        <qti-match-interaction response-identifier="R1" max-associations="4" min-associations="1">
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="S1" match-max="1">Source 1</qti-simple-associable-choice>
          </qti-simple-match-set>
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="T1" match-max="1">Target 1</qti-simple-associable-choice>
          </qti-simple-match-set>
        </qti-match-interaction>
      `);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      itemState.collectAll();

      const matchContainer = container.querySelector('.cutie-match-interaction')!;
      expect(matchContainer.getAttribute('aria-invalid')).toBe('true');

      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(constraintEl.classList.contains('cutie-constraint-error')).toBe(true);
    });
  });

  describe('grouped bowtie layout', () => {
    const renderGrouped = (qti = GROUPED_BOWTIE_QTI): HTMLElement => {
      const fragment = transformInteraction(createQtiDocument(qti), itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);
      return container;
    };

    it('renders one column per target with a per-group bank, not the two-set layout', () => {
      const container = renderGrouped();

      const matchContainer = container.querySelector('.cutie-match-interaction')!;
      expect(matchContainer.classList.contains('cutie-match-interaction--grouped')).toBe(true);
      expect(container.querySelector('.cutie-match-layout')).toBeNull();

      const columns = container.querySelectorAll('.cutie-match-column');
      expect(columns.length).toBe(3);

      const groups = Array.from(container.querySelectorAll('.cutie-match-bank')).map((b) =>
        b.getAttribute('data-match-group')
      );
      expect(groups).toEqual(['T_ACTIONS', 'T_CONDITION', 'T_PARAMS']);
    });

    it('banks only the sources whose match-group names that column', () => {
      const container = renderGrouped();

      const idsIn = (group: string): (string | null)[] =>
        Array.from(
          container.querySelectorAll(
            `.cutie-match-bank[data-match-group="${group}"] .cutie-match-choice`
          )
        ).map((c) => c.getAttribute('data-identifier'));

      expect(idsIn('T_ACTIONS')).toEqual(['ACT1', 'ACT2']);
      expect(idsIn('T_CONDITION')).toEqual(['COND1', 'COND2']);
      expect(idsIn('T_PARAMS')).toEqual(['PAR1', 'PAR2']);
    });

    const sourceEl = (container: HTMLElement, id: string) =>
      container.querySelector(
        `.cutie-match-bank .cutie-match-choice[data-identifier="${id}"]`
      ) as HTMLElement;
    const slotsFor = (container: HTMLElement, targetId: string) =>
      container.querySelectorAll<HTMLElement>(`.cutie-match-slot[data-target-id="${targetId}"]`);

    it('renders a plain header labelling its bank, not a drop slot', () => {
      const container = renderGrouped();

      const header = container.querySelector('#cutie-match-label-RB-T_ACTIONS')!;
      expect(header.classList.contains('cutie-match-target-header')).toBe(true);
      expect(header.textContent).toBe('Actions to Take');
      // The header is not a droppable choice box.
      expect(header.classList.contains('cutie-match-choice')).toBe(false);

      const bank = container.querySelector('.cutie-match-bank[data-match-group="T_ACTIONS"]')!;
      expect(bank.getAttribute('aria-labelledby')).toBe(header.id);
    });

    it('seeds one tabbable choice per bank for roving tabindex', () => {
      const container = renderGrouped();

      for (const bank of container.querySelectorAll('.cutie-match-bank')) {
        const choices = bank.querySelectorAll('.cutie-match-choice');
        expect(choices[0].getAttribute('tabindex')).toBe('0');
        for (let i = 1; i < choices.length; i++) {
          expect(choices[i].getAttribute('tabindex')).toBe('-1');
        }
      }
    });

    it('restores one tabbable choice per bank when interactions are re-enabled', () => {
      const container = renderGrouped();

      const tabbablePerBank = () =>
        Array.from(container.querySelectorAll('.cutie-match-bank')).map((bank) =>
          Array.from(bank.querySelectorAll('.cutie-match-choice'))
            .filter((c) => c.getAttribute('tabindex') === '0')
            .map((c) => c.getAttribute('data-identifier'))
        );

      itemState.setInteractionState('disabled');
      expect(tabbablePerBank()).toEqual([[], [], []]);

      itemState.setInteractionState('enabled');
      expect(tabbablePerBank()).toEqual([['ACT1'], ['COND1'], ['PAR1']]);
    });

    it('makes only the selected source’s column slots tabbable drop targets', () => {
      const container = renderGrouped();

      sourceEl(container, 'ACT1').click();

      // The source's own column slots become reachable and highlighted...
      for (const slot of slotsFor(container, 'T_ACTIONS')) {
        expect(slot.getAttribute('tabindex')).toBe('0');
        expect(slot.classList.contains('cutie-match-slot--drop-target')).toBe(true);
      }
      // ...while other columns' slots stay out of the tab order.
      for (const slot of slotsFor(container, 'T_CONDITION')) {
        expect(slot.getAttribute('tabindex')).toBe('-1');
        expect(slot.classList.contains('cutie-match-slot--drop-target')).toBe(false);
      }
    });

    it('allows a source to associate only with its own column', () => {
      const container = renderGrouped();

      // Same-group placement is created.
      sourceEl(container, 'ACT1').click();
      slotsFor(container, 'T_ACTIONS')[0].click();
      expect(itemState.collectAll().responses['RB']).toContain('ACT1 T_ACTIONS');

      // A cross-group source can't be placed in the wrong column's slot.
      sourceEl(container, 'COND1').click();
      slotsFor(container, 'T_ACTIONS')[1].click();
      const response = itemState.collectAll().responses['RB'] as string[];
      expect(response).not.toContain('COND1 T_ACTIONS');
      expect(response).toEqual(['ACT1 T_ACTIONS']);
    });

    it('replaces the occupant when a source is placed on a filled slot', () => {
      const container = renderGrouped();

      // Condition has a single slot (match-max="1").
      sourceEl(container, 'COND1').click();
      slotsFor(container, 'T_CONDITION')[0].click();
      expect(itemState.collectAll().responses['RB']).toEqual(['COND1 T_CONDITION']);

      // Placing COND2 onto the filled slot replaces COND1.
      sourceEl(container, 'COND2').click();
      slotsFor(container, 'T_CONDITION')[0].click();
      expect(itemState.collectAll().responses['RB']).toEqual(['COND2 T_CONDITION']);
    });

    it('passes the qti-choices-* class through to the container', () => {
      const container = renderGrouped(
        GROUPED_BOWTIE_QTI.replace(
          'response-identifier="RB"',
          'response-identifier="RB" class="qti-choices-top"'
        )
      );

      const matchContainer = container.querySelector('.cutie-match-interaction')!;
      expect(matchContainer.classList.contains('qti-choices-top')).toBe(true);
      expect(matchContainer.classList.contains('cutie-match-interaction--grouped')).toBe(true);
    });

    it('draws one empty slot per unit of target capacity (match-max)', () => {
      const container = renderGrouped();

      // Slot count mirrors each target's match-max (Actions 2, Condition 1, Params 2).
      expect(slotsFor(container, 'T_ACTIONS').length).toBe(2);
      expect(slotsFor(container, 'T_CONDITION').length).toBe(1);
      expect(slotsFor(container, 'T_PARAMS').length).toBe(2);

      // All slots start empty — no association has been made yet.
      for (const slot of slotsFor(container, 'T_ACTIONS')) {
        expect(slot.classList.contains('cutie-match-slot--filled')).toBe(false);
      }
    });

    it('fills a slot when a source is placed and leaves the rest open', () => {
      const container = renderGrouped();

      sourceEl(container, 'ACT1').click();
      slotsFor(container, 'T_ACTIONS')[0].click();

      const slots = slotsFor(container, 'T_ACTIONS');
      expect(slots.length).toBe(2);
      expect(slots[0].classList.contains('cutie-match-slot--filled')).toBe(true);
      expect(slots[0].querySelector('.cutie-match-slot-content')!.textContent).toBe('Action 1');
      expect(slots[1].classList.contains('cutie-match-slot--filled')).toBe(false);
    });

    it('keeps the slot position in its accessible name whether empty or filled', () => {
      const container = renderGrouped();
      const slot = slotsFor(container, 'T_ACTIONS')[1];
      expect(slot.getAttribute('aria-label')).toBe('Slot 2 of 2, empty');

      sourceEl(container, 'ACT1').click();
      slot.click();
      expect(slot.getAttribute('aria-label')).toMatch(/^Slot 2 of 2, contains Action 1\./);

      slot.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
      expect(slot.getAttribute('aria-label')).toBe('Slot 2 of 2, empty');
    });

    it('returns a placed source to the bank when its slot is emptied', () => {
      const container = renderGrouped();

      sourceEl(container, 'ACT1').click();
      const slot = slotsFor(container, 'T_ACTIONS')[0];
      slot.click();
      expect(itemState.collectAll().responses['RB']).toContain('ACT1 T_ACTIONS');

      // Backspace on the filled slot removes the association.
      slot.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
      expect(itemState.collectAll().responses['RB']).toBeNull();
      expect(slot.classList.contains('cutie-match-slot--filled')).toBe(false);
    });

    it('presents each bank before its target slots in the DOM', () => {
      const container = renderGrouped();

      for (const column of container.querySelectorAll('.cutie-match-column')) {
        expect(column.firstElementChild!.classList.contains('cutie-match-bank')).toBe(true);
        expect(column.lastElementChild!.querySelector('.cutie-match-slots')).not.toBeNull();
      }
    });

    it('uses a source at most once, whatever its match-max', () => {
      const container = renderGrouped(
        GROUPED_BOWTIE_QTI.replace('identifier="ACT1" match-max="1"', 'identifier="ACT1" match-max="0"')
      );
      const [first, second] = slotsFor(container, 'T_ACTIONS');

      sourceEl(container, 'ACT1').click();
      first.click();
      sourceEl(container, 'ACT2').click();
      second.click();
      expect(sourceEl(container, 'ACT1').getAttribute('aria-disabled')).toBe('true');

      // Placing ACT1 again must not evict ACT2 from the other slot.
      sourceEl(container, 'ACT1').click();
      second.click();
      expect(itemState.collectAll().responses['RB']).toEqual(['ACT1 T_ACTIONS', 'ACT2 T_ACTIONS']);
      expect(second.getAttribute('data-source-id')).toBe('ACT2');
    });

    it('moves a placed source to another slot in its column', () => {
      const container = renderGrouped();
      const [first, second] = slotsFor(container, 'T_ACTIONS');

      sourceEl(container, 'ACT1').click();
      first.click();
      first.click(); // pick it back up
      second.click();

      expect(first.classList.contains('cutie-match-slot--filled')).toBe(false);
      expect(second.getAttribute('data-source-id')).toBe('ACT1');
      expect(itemState.collectAll().responses['RB']).toEqual(['ACT1 T_ACTIONS']);
    });

    describe('drag and drop', () => {
      const drag = (el: HTMLElement, type: string, payload = ''): void => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'dataTransfer', {
          value: { types: ['text/plain'], setData: () => {}, getData: () => payload },
        });
        el.dispatchEvent(event);
      };

      it('places a source dragged from its own bank', () => {
        const container = renderGrouped();
        const source = sourceEl(container, 'ACT1');

        drag(source, 'dragstart');
        drag(slotsFor(container, 'T_ACTIONS')[0], 'drop');
        drag(source, 'dragend');

        expect(itemState.collectAll().responses['RB']).toEqual(['ACT1 T_ACTIONS']);
      });

      it('returns a source dragged from its slot onto the bank', () => {
        const container = renderGrouped();
        const slot = slotsFor(container, 'T_ACTIONS')[0];
        sourceEl(container, 'ACT1').click();
        slot.click();

        drag(slot, 'dragstart');
        drag(container.querySelector<HTMLElement>('.cutie-match-bank[data-match-group="T_ACTIONS"]')!, 'drop');
        drag(slot, 'dragend');

        expect(itemState.collectAll().responses['RB']).toBeNull();
      });

      it('ignores a drop that did not start in this interaction', () => {
        const container = renderGrouped();
        const [first, second] = slotsFor(container, 'T_ACTIONS');
        sourceEl(container, 'ACT1').click();
        first.click();

        // Payloads another match interaction on the page could carry.
        drag(second, 'drop', 'source:ACT2');
        drag(second, 'drop', 'slot:0');

        expect(second.classList.contains('cutie-match-slot--filled')).toBe(false);
        expect(itemState.collectAll().responses['RB']).toEqual(['ACT1 T_ACTIONS']);
      });
    });

    it('clears the selection when a picked-up source is removed with Backspace', () => {
      const container = renderGrouped();
      const [first, second] = slotsFor(container, 'T_ACTIONS');
      sourceEl(container, 'ACT1').click();
      first.click();

      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(first.classList.contains('cutie-match-slot--selected')).toBe(true);
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));

      expect(first.classList.contains('cutie-match-slot--selected')).toBe(false);
      expect(second.classList.contains('cutie-match-slot--drop-target')).toBe(false);

      // Nothing is still held, so activating another slot places nothing.
      second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(itemState.collectAll().responses['RB']).toBeNull();
    });

    it('shows the source’s rich content, not its flattened text, in a filled slot', () => {
      const container = renderGrouped(
        GROUPED_BOWTIE_QTI.replace('>Action 1<', '><img src="a.png" alt="Diagram A"><')
      );
      const slot = slotsFor(container, 'T_ACTIONS')[0];

      sourceEl(container, 'ACT1').click();
      slot.click();

      expect(slot.querySelector('.cutie-match-slot-content img')!.getAttribute('alt')).toBe('Diagram A');
      expect(slot.getAttribute('aria-label')).toMatch(/^Slot 1 of 2, contains Diagram A\./);
      // The bank keeps its own copy.
      expect(sourceEl(container, 'ACT1').querySelector('img')).not.toBeNull();
    });

    it('keeps placed answers reachable but inert when interactions are disabled', () => {
      const container = renderGrouped();
      const [filled, empty] = slotsFor(container, 'T_ACTIONS');
      sourceEl(container, 'ACT1').click();
      filled.click();

      itemState.setInteractionState('disabled');
      expect(filled.getAttribute('tabindex')).toBe('0');
      expect(filled.getAttribute('aria-disabled')).toBe('true');
      expect(filled.getAttribute('draggable')).toBe('false');
      expect(filled.getAttribute('aria-label')).toBe('Slot 1 of 2, contains Action 1.');
      expect(empty.getAttribute('tabindex')).toBe('-1');

      itemState.setInteractionState('enabled');
      expect(filled.getAttribute('aria-disabled')).toBe('false');
      expect(filled.getAttribute('draggable')).toBe('true');
      expect(filled.getAttribute('aria-label')).toMatch(/Press Enter to pick up/);
    });

    it('derives slot count from max-associations when the target is unbounded (match-max=0)', () => {
      const container = renderGrouped(`
        <qti-match-interaction response-identifier="RB" max-associations="1">
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="S1" match-max="1" match-group="T1">S1</qti-simple-associable-choice>
            <qti-simple-associable-choice identifier="S2" match-max="1" match-group="T1">S2</qti-simple-associable-choice>
          </qti-simple-match-set>
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="T1" match-max="0">Bucket</qti-simple-associable-choice>
          </qti-simple-match-set>
        </qti-match-interaction>
      `);

      // match-max=0 is unbounded, so capacity falls back to max-associations (1).
      expect(slotsFor(container, 'T1').length).toBe(1);
    });

    it('still renders the classic two-set layout when no match-group is present', () => {
      const container = renderGrouped(BASIC_MATCH_QTI);

      expect(container.querySelector('.cutie-match-layout')).not.toBeNull();
      expect(container.querySelector('.cutie-match-columns')).toBeNull();
      const matchContainer = container.querySelector('.cutie-match-interaction')!;
      expect(matchContainer.classList.contains('cutie-match-interaction--grouped')).toBe(false);
    });

    it('banks distractors beyond the target capacity (more sources than slots)', () => {
      const container = renderGrouped(
        GROUPED_BOWTIE_QTI.replace(
          '<qti-simple-associable-choice identifier="COND1"',
          '<qti-simple-associable-choice identifier="ACT3" match-max="1" match-group="T_ACTIONS">Action 3</qti-simple-associable-choice>\n<qti-simple-associable-choice identifier="COND1"'
        )
      );

      expect(slotsFor(container, 'T_ACTIONS').length).toBe(2);
      expect(
        container.querySelectorAll('.cutie-match-bank[data-match-group="T_ACTIONS"] .cutie-match-choice').length
      ).toBe(3);
    });

    describe('with other interactions on the page', () => {
      // Document click handlers only see clicks on attached elements.
      const attached: HTMLElement[] = [];
      const renderAttached = (qti = GROUPED_BOWTIE_QTI): HTMLElement => {
        const container = renderGrouped(qti);
        document.body.appendChild(container);
        attached.push(container);
        return container;
      };
      afterEach(() => {
        attached.splice(0).forEach((el) => el.remove());
      });

      const isSelected = (container: HTMLElement, id: string) =>
        sourceEl(container, id).classList.contains('cutie-match-choice--selected');

      it('lets slot clicks reach document click handlers', () => {
        const container = renderAttached();
        const onDocumentClick = vi.fn();
        document.addEventListener('click', onDocumentClick);

        slotsFor(container, 'T_ACTIONS')[0].click();
        document.removeEventListener('click', onDocumentClick);

        expect(onDocumentClick).toHaveBeenCalledTimes(1);
      });

      it('clears the selection when a slot in another bowtie is clicked', () => {
        const a = renderAttached();
        const b = renderAttached(GROUPED_BOWTIE_QTI.replace('response-identifier="RB"', 'response-identifier="RB2"'));
        sourceEl(a, 'ACT1').click();

        slotsFor(b, 'T_ACTIONS')[0].click();

        expect(isSelected(a, 'ACT1')).toBe(false);
        expect(slotsFor(a, 'T_ACTIONS')[0].classList.contains('cutie-match-slot--drop-target')).toBe(false);
      });

      it('keeps the selection when its own slot or bank is clicked', () => {
        const container = renderAttached();
        sourceEl(container, 'ACT1').click();

        // A slot that can't take ACT1 leaves the selection in place.
        slotsFor(container, 'T_CONDITION')[0].click();
        container.querySelector<HTMLElement>('.cutie-match-bank[data-match-group="T_ACTIONS"]')!.click();

        expect(isSelected(container, 'ACT1')).toBe(true);
      });
    });

    describe('falls back to the classic layout when the match-groups are not a bowtie', () => {
      const expectClassic = (container: HTMLElement): void => {
        expect(container.querySelector('.cutie-match-columns')).toBeNull();
        expect(container.querySelector('.cutie-match-layout')).not.toBeNull();
        // Every source is still rendered — none are dropped.
        expect(
          container.querySelectorAll('.cutie-match-set--source .cutie-match-choice').length
        ).toBe(6);
      };

      it('when a source has no match-group', () => {
        const container = renderGrouped(
          GROUPED_BOWTIE_QTI.replace(' match-group="T_CONDITION">Condition 2', '>Condition 2')
        );
        expectClassic(container);
        expect(container.querySelector('[data-identifier="COND2"]')).not.toBeNull();
      });

      it('when a source names a target that does not exist', () => {
        const container = renderGrouped(
          GROUPED_BOWTIE_QTI.replace('match-group="T_CONDITION">Condition 2', 'match-group="T_NOPE">Condition 2')
        );
        expectClassic(container);
      });

      it('when a source names more than one target', () => {
        const container = renderGrouped(
          GROUPED_BOWTIE_QTI.replace(
            'match-group="T_CONDITION">Condition 2',
            'match-group="T_CONDITION T_PARAMS">Condition 2'
          )
        );
        expectClassic(container);
      });

      it('when a target is named by no source', () => {
        const container = renderGrouped(
          GROUPED_BOWTIE_QTI.replace(
            /(<\/qti-simple-match-set>\s*<\/qti-match-interaction>)/,
            '<qti-simple-associable-choice identifier="T_EXTRA" match-max="1">Extra</qti-simple-associable-choice>$1'
          )
        );
        expect(container.querySelector('[data-identifier="T_EXTRA"]')).not.toBeNull();
        expectClassic(container);
      });

      it('when a target has more slots than sources to fill them', () => {
        const container = renderGrouped(
          GROUPED_BOWTIE_QTI.replace('identifier="T_CONDITION" match-max="1"', 'identifier="T_CONDITION" match-max="3"')
        );
        expectClassic(container);
      });

      it('when a target’s own match-group excludes a source in its bank', () => {
        const container = renderGrouped(
          GROUPED_BOWTIE_QTI.replace(
            'identifier="T_CONDITION" match-max="1"',
            'identifier="T_CONDITION" match-max="1" match-group="COND1"'
          )
        );
        expectClassic(container);

        // The target's restriction is enforced there.
        const choice = (id: string) =>
          container.querySelector<HTMLElement>(`.cutie-match-choice[data-identifier="${id}"]`)!;
        choice('COND2').click();
        choice('T_CONDITION').click();
        expect(itemState.collectAll().responses['RB']).toBeNull();
      });

      it('but not when a target’s own match-group names its whole bank', () => {
        const container = renderGrouped(
          GROUPED_BOWTIE_QTI.replace(
            'identifier="T_CONDITION" match-max="1"',
            'identifier="T_CONDITION" match-max="1" match-group="COND1 COND2"'
          )
        );
        expect(container.querySelector('.cutie-match-columns')).not.toBeNull();
      });

      // Actions 2 + Condition 1 + Parameters 2 = 5 slots.
      const withMaxAssociations = (max: number): HTMLElement =>
        renderGrouped(
          GROUPED_BOWTIE_QTI.replace(
            'response-identifier="RB"',
            `response-identifier="RB" max-associations="${max}"`
          )
        );

      it('when max-associations allows fewer associations than there are slots', () => {
        expectClassic(withMaxAssociations(4));
      });

      it('but not when max-associations covers every slot', () => {
        const container = withMaxAssociations(5);
        expect(container.querySelector('.cutie-match-columns')).not.toBeNull();
        expect(container.querySelector('.cutie-match-layout')).toBeNull();
      });

      it('still enforces match-group restrictions on the classic layout', () => {
        const container = renderGrouped(
          GROUPED_BOWTIE_QTI.replace(' match-group="T_CONDITION">Condition 2', '>Condition 2')
        );
        const choice = (id: string) =>
          container.querySelector<HTMLElement>(`.cutie-match-choice[data-identifier="${id}"]`)!;

        // ACT1 is restricted to T_ACTIONS, so pairing it with T_CONDITION is refused.
        choice('ACT1').click();
        choice('T_CONDITION').click();
        expect(itemState.collectAll().responses['RB']).toBeNull();

        // COND2 has no match-group, so it may pair with any target.
        choice('COND2').click();
        choice('T_PARAMS').click();
        expect(itemState.collectAll().responses['RB']).toEqual(['COND2 T_PARAMS']);
      });
    });
  });
});

describe('matchInteraction evaluation', () => {
  let itemState: ItemStateImpl;

  beforeEach(() => {
    itemState = new ItemStateImpl();
  });

  function render(interactionAttrs: string, declaration: string): HTMLElement {
    const doc = createQtiDocument(`
      <qti-response-declaration identifier="R1" cardinality="multiple" base-type="directedPair">
        ${declaration}
      </qti-response-declaration>
      ${BASIC_MATCH_QTI.replace('response-identifier="R1"', `response-identifier="R1" ${interactionAttrs}`)}
    `);
    const container = document.createElement('div');
    container.appendChild(transformInteraction(doc, itemState));
    return container;
  }

  const choice = (container: HTMLElement, id: string) =>
    container.querySelector<HTMLElement>(`.cutie-match-choice[data-identifier="${id}"]`)!;
  const keyOf = (container: HTMLElement, id: string) =>
    choice(container, id).parentElement!.querySelector('.cutie-correct-answer');

  it('renders nothing when there is no verdict or correct response', () => {
    const container = render('', '<qti-default-value><qti-value>S1 T1</qti-value></qti-default-value>');
    expect(container.querySelector('.cutie-correct-answer')).toBeNull();
    expect(container.querySelector('.cutie-evaluated')).toBeNull();
    // The rail is reserved regardless, so evaluation shifts nothing
    expect(container.querySelector('.cutie-match-interaction')!.classList.contains('cutie-status-rail')).toBe(true);
  });

  it('describes the response in the constraint text, announced with the group', () => {
    const container = render('data-cutie-evaluation="correct"', '');
    const group = container.querySelector('.cutie-match-interaction')!;
    expect(container.querySelector('.cutie-verdict')).toBeNull();
    expect(container.querySelector('#constraint-R1')!.textContent).toBe('Correct response');
    expect(group.getAttribute('aria-describedby')).toContain('constraint-R1');
    expect(group.classList.contains('cutie-evaluated--correct')).toBe(true);
  });

  it('shows each choice its correct partners, reciprocally, by displayed labels', () => {
    const container = render(
      'data-cutie-evaluation="partial"',
      `<qti-default-value><qti-value>S1 T2</qti-value></qti-default-value>
       <qti-correct-response><qti-value>S1 T1</qti-value><qti-value>S2 T1</qti-value></qti-correct-response>`,
    );
    expect(keyOf(container, 'S1')!.textContent).toBe('Correct answer: Target 1');
    expect(keyOf(container, 'S2')!.textContent).toBe('Correct answer: Target 1');
    // A choice matched with several shows them all
    expect(keyOf(container, 'T1')!.textContent).toBe('Correct answer: Source 1, Source 2');
    // No correct partner, no key
    expect(keyOf(container, 'T2')).toBeNull();
  });

  it('places the key between the choice and its chips, describing the choice', () => {
    const container = render(
      'data-cutie-evaluation="incorrect"',
      '<qti-correct-response><qti-value>S1 T1</qti-value></qti-correct-response>',
    );
    const source = choice(container, 'S1');
    const key = source.nextElementSibling!;
    expect(key.classList.contains('cutie-correct-answer')).toBe(true);
    expect(key.nextElementSibling!.classList.contains('cutie-match-choice-chips')).toBe(true);
    expect(source.getAttribute('aria-describedby')).toContain(key.id);
  });

  describe('grouped bowtie layout', () => {
    const renderGrouped = (): HTMLElement => {
      const doc = createQtiDocument(`
        <qti-response-declaration identifier="RB" cardinality="multiple" base-type="directedPair">
          <qti-correct-response>
            <qti-value>ACT1 T_ACTIONS</qti-value>
            <qti-value>ACT2 T_ACTIONS</qti-value>
            <qti-value>COND1 T_CONDITION</qti-value>
            <qti-value>PAR2 T_PARAMS</qti-value>
          </qti-correct-response>
        </qti-response-declaration>
        ${GROUPED_BOWTIE_QTI.replace('response-identifier="RB"', 'response-identifier="RB" data-cutie-evaluation="incorrect"')}
      `);
      const container = document.createElement('div');
      container.appendChild(transformInteraction(doc, itemState));
      return container;
    };
    const column = (container: HTMLElement, targetId: string) =>
      container.querySelector<HTMLElement>(`.cutie-match-column[data-match-group="${targetId}"]`)!;

    it('shows each column the sources that belong in its slots, by displayed labels', () => {
      const container = renderGrouped();
      const keyText = (targetId: string) =>
        column(container, targetId).querySelector('.cutie-correct-answer')!.textContent;

      expect(keyText('T_ACTIONS')).toBe('Correct answer: Action 1, Action 2');
      expect(keyText('T_CONDITION')).toBe('Correct answer: Condition 1');
      expect(keyText('T_PARAMS')).toBe('Correct answer: Parameter 2');
    });

    it('places the key under the last slot, describing each slot of the column', () => {
      const container = renderGrouped();
      const slots = column(container, 'T_ACTIONS').querySelector('.cutie-match-slots')!;
      const key = slots.lastElementChild!;

      expect(key.classList.contains('cutie-correct-answer')).toBe(true);
      expect(key.previousElementSibling!.classList.contains('cutie-match-slot')).toBe(true);
      const slotElements = slots.querySelectorAll('.cutie-match-slot');
      expect(slotElements).toHaveLength(2);
      for (const slot of slotElements) {
        expect(slot.getAttribute('aria-describedby')).toContain(key.id);
      }
    });

    it('gives the bank sources no key of their own', () => {
      const container = renderGrouped();
      for (const bank of container.querySelectorAll('.cutie-match-bank')) {
        expect(bank.querySelector('.cutie-correct-answer')).toBeNull();
      }
      expect(container.querySelectorAll('.cutie-correct-answer')).toHaveLength(3);
    });
  });
});
