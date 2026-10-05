import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemStateImpl } from '../../../state/itemState';
import { registry } from '../../registry';
import type { TransformContext } from '../../types';

// Side-effect import to register the handler
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

      itemState.setInteractionsEnabled(false);

      const matchContainer = container.querySelector('.cutie-match-interaction')!;
      expect(matchContainer.classList.contains('cutie-match-interaction--disabled')).toBe(true);
    });

    it('removes disabled class when interactions are re-enabled', () => {
      const doc = createQtiDocument(BASIC_MATCH_QTI);

      const fragment = transformInteraction(doc, itemState);
      const container = document.createElement('div');
      container.appendChild(fragment);

      itemState.setInteractionsEnabled(false);
      itemState.setInteractionsEnabled(true);

      const matchContainer = container.querySelector('.cutie-match-interaction')!;
      expect(matchContainer.classList.contains('cutie-match-interaction--disabled')).toBe(false);
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
    const gapsFor = (container: HTMLElement, targetId: string) =>
      container.querySelectorAll<HTMLElement>(`.cutie-match-gap[data-target-id="${targetId}"]`);

    it('renders a plain header labelling its bank, not a drop slot', () => {
      const container = renderGrouped();

      const header = container.querySelector('#cutie-match-label-RB-T_ACTIONS')!;
      expect(header.classList.contains('cutie-match-slot-header')).toBe(true);
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

    it('makes only the selected source’s column gaps tabbable drop targets', () => {
      const container = renderGrouped();

      sourceEl(container, 'ACT1').click();

      // The source's own column gaps become reachable and highlighted...
      for (const gap of gapsFor(container, 'T_ACTIONS')) {
        expect(gap.getAttribute('tabindex')).toBe('0');
        expect(gap.classList.contains('cutie-match-gap--drop-target')).toBe(true);
      }
      // ...while other columns' gaps stay out of the tab order.
      for (const gap of gapsFor(container, 'T_CONDITION')) {
        expect(gap.getAttribute('tabindex')).toBe('-1');
        expect(gap.classList.contains('cutie-match-gap--drop-target')).toBe(false);
      }
    });

    it('allows a source to associate only with its own column', () => {
      const container = renderGrouped();

      // Same-group placement is created.
      sourceEl(container, 'ACT1').click();
      gapsFor(container, 'T_ACTIONS')[0].click();
      expect(itemState.collectAll().responses['RB']).toContain('ACT1 T_ACTIONS');

      // A cross-group source can't be placed in the wrong column's gap.
      sourceEl(container, 'COND1').click();
      gapsFor(container, 'T_ACTIONS')[1].click();
      const response = itemState.collectAll().responses['RB'] as string[];
      expect(response).not.toContain('COND1 T_ACTIONS');
      expect(response).toEqual(['ACT1 T_ACTIONS']);
    });

    it('replaces the occupant when a source is placed on a filled gap', () => {
      const container = renderGrouped();

      // Condition has a single gap (match-max="1").
      sourceEl(container, 'COND1').click();
      gapsFor(container, 'T_CONDITION')[0].click();
      expect(itemState.collectAll().responses['RB']).toEqual(['COND1 T_CONDITION']);

      // Placing COND2 onto the filled gap replaces COND1.
      sourceEl(container, 'COND2').click();
      gapsFor(container, 'T_CONDITION')[0].click();
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

    it('draws one empty gap per unit of slot capacity (match-max)', () => {
      const container = renderGrouped();

      // Gap count mirrors each slot's match-max (Actions 2, Condition 1, Params 2).
      expect(gapsFor(container, 'T_ACTIONS').length).toBe(2);
      expect(gapsFor(container, 'T_CONDITION').length).toBe(1);
      expect(gapsFor(container, 'T_PARAMS').length).toBe(2);

      // All gaps start empty — no association has been made yet.
      for (const gap of gapsFor(container, 'T_ACTIONS')) {
        expect(gap.classList.contains('cutie-match-gap--filled')).toBe(false);
      }
    });

    it('fills a gap when a source is placed and leaves the rest open', () => {
      const container = renderGrouped();

      sourceEl(container, 'ACT1').click();
      gapsFor(container, 'T_ACTIONS')[0].click();

      const gaps = gapsFor(container, 'T_ACTIONS');
      expect(gaps.length).toBe(2);
      expect(gaps[0].classList.contains('cutie-match-gap--filled')).toBe(true);
      expect(gaps[0].querySelector('.cutie-match-gap-content')!.textContent).toBe('Action 1');
      expect(gaps[1].classList.contains('cutie-match-gap--filled')).toBe(false);
    });

    it('returns a placed source to the bank when its gap is emptied', () => {
      const container = renderGrouped();

      sourceEl(container, 'ACT1').click();
      const gap = gapsFor(container, 'T_ACTIONS')[0];
      gap.click();
      expect(itemState.collectAll().responses['RB']).toContain('ACT1 T_ACTIONS');

      // Backspace on the filled gap removes the association.
      gap.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
      expect(itemState.collectAll().responses['RB']).toBeNull();
      expect(gap.classList.contains('cutie-match-gap--filled')).toBe(false);
    });

    it('derives gap count from max-associations when the slot is unbounded (match-max=0)', () => {
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
      expect(gapsFor(container, 'T1').length).toBe(1);
    });

    it('still renders the classic two-set layout when no match-group is present', () => {
      const container = renderGrouped(BASIC_MATCH_QTI);

      expect(container.querySelector('.cutie-match-layout')).not.toBeNull();
      expect(container.querySelector('.cutie-match-columns')).toBeNull();
      const matchContainer = container.querySelector('.cutie-match-interaction')!;
      expect(matchContainer.classList.contains('cutie-match-interaction--grouped')).toBe(false);
    });
  });
});
