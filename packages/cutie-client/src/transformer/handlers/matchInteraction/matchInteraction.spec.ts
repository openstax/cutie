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

    it('renders the target as a slot carrying its match-max, labelling its bank', () => {
      const container = renderGrouped();

      const slot = container.querySelector('.cutie-match-slot[data-identifier="T_ACTIONS"]')!;
      expect(slot.getAttribute('data-match-max')).toBe('2');

      const bank = container.querySelector('.cutie-match-bank[data-match-group="T_ACTIONS"]')!;
      const labelledBy = bank.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      expect(container.querySelector(`#${labelledBy}`)!.textContent).toBe('Actions to Take');
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

    it('allows a source to associate only with its own column', () => {
      const container = renderGrouped();

      const source = (id: string) =>
        container.querySelector(`.cutie-match-bank .cutie-match-choice[data-identifier="${id}"]`) as HTMLElement;
      const slot = (id: string) =>
        container.querySelector(`.cutie-match-slot[data-identifier="${id}"]`) as HTMLElement;

      // Same-group association is created.
      source('ACT1').click();
      slot('T_ACTIONS').click();
      expect(itemState.collectAll().responses['RB']).toContain('ACT1 T_ACTIONS');

      // Cross-group association is rejected — the wrong column can't accept it.
      source('COND1').click();
      slot('T_ACTIONS').click();
      const response = itemState.collectAll().responses['RB'] as string[];
      expect(response).not.toContain('COND1 T_ACTIONS');
      expect(response).toEqual(['ACT1 T_ACTIONS']);
    });

    it('caps a column at its slot match-max', () => {
      const container = renderGrouped();

      const source = (id: string) =>
        container.querySelector(`.cutie-match-bank .cutie-match-choice[data-identifier="${id}"]`) as HTMLElement;
      const slot = (id: string) =>
        container.querySelector(`.cutie-match-slot[data-identifier="${id}"]`) as HTMLElement;

      source('COND1').click();
      slot('T_CONDITION').click();
      source('COND2').click();
      slot('T_CONDITION').click();

      // Condition accepts only one (match-max="1").
      const response = itemState.collectAll().responses['RB'] as string[];
      expect(response).toEqual(['COND1 T_CONDITION']);
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

    it('still renders the classic two-set layout when no match-group is present', () => {
      const container = renderGrouped(BASIC_MATCH_QTI);

      expect(container.querySelector('.cutie-match-layout')).not.toBeNull();
      expect(container.querySelector('.cutie-match-columns')).toBeNull();
      const matchContainer = container.querySelector('.cutie-match-interaction')!;
      expect(matchContainer.classList.contains('cutie-match-interaction--grouped')).toBe(false);
    });
  });
});
