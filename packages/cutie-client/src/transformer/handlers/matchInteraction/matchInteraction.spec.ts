// cspell:ignore distractors Prospero
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemStateImpl } from '../../../state/itemState.js';
import { announce } from '../../../utils/liveRegion.js';
import { registry } from '../../registry.js';
import type { TransformContext } from '../../types.js';

// Side-effect import to register the handler
import './index.js';

vi.mock('../../../utils/liveRegion.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../utils/liveRegion.js')>()),
  announce: vi.fn(),
}));

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

// The spec's Shakespeare example: every source shares one bank, and each play
// may take up to four characters.
const SHARED_BANK_QTI = `
  <qti-match-interaction response-identifier="R1" max-associations="4">
    <qti-simple-match-set>
      <qti-simple-associable-choice identifier="C" match-max="1">Capulet</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="D" match-max="1">Demetrius</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="L" match-max="1">Lysander</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="P" match-max="1">Prospero</qti-simple-associable-choice>
    </qti-simple-match-set>
    <qti-simple-match-set>
      <qti-simple-associable-choice identifier="M" match-max="4">Midsummer</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="R" match-max="4">Romeo</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="T" match-max="4">Tempest</qti-simple-associable-choice>
    </qti-simple-match-set>
  </qti-match-interaction>
`;

// A bowtie: source choices carry match-group naming their target column, so
// each column gets its own bank; each target's match-min pre-allocates its slots.
const BOWTIE_QTI = `
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
      <qti-simple-associable-choice identifier="T_ACTIONS" match-min="2" match-max="2" fixed="true">Actions to Take</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="T_CONDITION" match-min="1" match-max="1" fixed="true">Condition</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="T_PARAMS" match-min="2" match-max="2" fixed="true">Parameters to Monitor</qti-simple-associable-choice>
    </qti-simple-match-set>
  </qti-match-interaction>
`;

const sourceEl = (container: HTMLElement, id: string) =>
  container.querySelector(`.cutie-match-bank .cutie-match-choice[data-identifier="${id}"]`) as HTMLElement;
const slotsFor = (container: HTMLElement, targetId: string) =>
  Array.from(container.querySelectorAll<HTMLElement>(`.cutie-match-slot[data-target-id="${targetId}"]`));
const isFilled = (slot: HTMLElement) => slot.classList.contains('cutie-match-slot--filled');

/** Place a source in the first empty slot of a target column. */
const place = (container: HTMLElement, sourceId: string, targetId: string): void => {
  sourceEl(container, sourceId).click();
  slotsFor(container, targetId).find((slot) => !isFilled(slot))!.click();
};

describe('matchInteraction', () => {
  let itemState: ItemStateImpl;

  beforeEach(() => {
    itemState = new ItemStateImpl();
  });

  const render = (qti: string): HTMLElement => {
    const container = document.createElement('div');
    container.appendChild(transformInteraction(createQtiDocument(qti), itemState));
    return container;
  };
  const response = () => itemState.collectAll().responses[
    Object.keys(itemState.collectAll().responses)[0]
  ];

  describe('constraint text rendering', () => {
    it('does not render constraint text when min-associations is absent', () => {
      const container = render(BASIC_MATCH_QTI);
      expect(container.querySelector('.cutie-constraint-text')).toBeNull();
    });

    it('renders "Make between N and M matches." when min-associations > 0 and max differs', () => {
      const container = render(BASIC_MATCH_QTI.replace('max-associations="4"', 'max-associations="4" min-associations="2"'));
      expect(container.querySelector('.cutie-constraint-text')!.textContent).toBe('Make between 2 and 4 matches.');
    });

    it('renders "Make at least 1 match." for min-associations="1" and no max', () => {
      const container = render(BASIC_MATCH_QTI.replace('max-associations="4"', 'max-associations="0" min-associations="1"'));
      expect(container.querySelector('.cutie-constraint-text')!.textContent).toBe('Make at least 1 match.');
    });

    it('describes each choice’s match-min, exact when it equals match-max', () => {
      const container = render(BOWTIE_QTI.replace(
        'identifier="T_PARAMS" match-min="2" match-max="2"',
        'identifier="T_PARAMS" match-min="1" match-max="2"'
      ));
      expect(container.querySelector('.cutie-constraint-text')!.textContent).toBe(
        'Make 2 matches for Actions to Take. Make 1 match for Condition. Make at least 1 match for Parameters to Monitor.'
      );
    });

    it('sets aria-describedby on container linking to constraint text', () => {
      const container = render(BASIC_MATCH_QTI.replace('max-associations="4"', 'max-associations="4" min-associations="1"'));
      const matchContainer = container.querySelector('.cutie-match-interaction')!;
      const constraintEl = container.querySelector('.cutie-constraint-text')!;
      expect(matchContainer.getAttribute('aria-describedby')).toContain(constraintEl.id);
    });
  });

  describe('error handling', () => {
    it('renders error when response-identifier is missing', () => {
      const container = render(BASIC_MATCH_QTI.replace(' response-identifier="R1"', ''));
      expect(container.querySelector('.cutie-error-display')).not.toBeNull();
      expect(container.querySelector('.cutie-match-interaction')).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('registers a cleanup callback via onCleanup', () => {
      const cleanupFn = vi.fn();
      transformInteraction(createQtiDocument(BASIC_MATCH_QTI), itemState, {
        onCleanup: (cb) => cleanupFn(cb),
      });
      expect(cleanupFn).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('disabled state', () => {
    it('toggles the disabled class with the interaction state', () => {
      const container = render(BASIC_MATCH_QTI);
      const matchContainer = container.querySelector('.cutie-match-interaction')!;

      itemState.setInteractionState('disabled');
      expect(matchContainer.classList.contains('cutie-match-interaction--disabled')).toBe(true);

      itemState.setInteractionState('enabled');
      expect(matchContainer.classList.contains('cutie-match-interaction--disabled')).toBe(false);
    });
  });

  describe('accessor validation', () => {
    it('returns valid:true when there are no constraints', () => {
      render(BASIC_MATCH_QTI);
      expect(itemState.collectAll().valid).toBe(true);
    });

    it('returns valid:false and flags the container when min-associations is not met', () => {
      const container = render(BASIC_MATCH_QTI.replace('max-associations="4"', 'max-associations="4" min-associations="1"'));

      const result = itemState.collectAll();
      expect(result.valid).toBe(false);
      expect(result.invalidCount).toBe(1);
      expect(container.querySelector('.cutie-match-interaction')!.getAttribute('aria-invalid')).toBe('true');
      expect(container.querySelector('.cutie-constraint-text')!.classList.contains('cutie-constraint-error')).toBe(true);
    });

    it('is invalid until every target has its match-min associations', () => {
      const container = render(BOWTIE_QTI);

      place(container, 'ACT1', 'T_ACTIONS');
      place(container, 'COND1', 'T_CONDITION');
      place(container, 'PAR1', 'T_PARAMS');
      place(container, 'PAR2', 'T_PARAMS');
      expect(itemState.collectAll().valid).toBe(false);

      place(container, 'ACT2', 'T_ACTIONS');
      expect(itemState.collectAll().valid).toBe(true);
    });

    it('announces only the requirements still unmet', () => {
      const container = render(BOWTIE_QTI);
      place(container, 'ACT1', 'T_ACTIONS');
      place(container, 'ACT2', 'T_ACTIONS');
      place(container, 'PAR1', 'T_PARAMS');
      vi.mocked(announce).mockClear();

      itemState.collectAll();

      expect(announce).toHaveBeenCalledWith(
        expect.anything(),
        'Make 1 match for Condition. Make 2 matches for Parameters to Monitor.',
        'assertive'
      );
      // The constraint text keeps every requirement as a hint
      expect(container.querySelector('.cutie-constraint-text')!.textContent).toBe(
        'Make 2 matches for Actions to Take. Make 1 match for Condition. Make 2 matches for Parameters to Monitor.'
      );
    });

    it('applies match-min to sources too', () => {
      const container = render(BASIC_MATCH_QTI.replace('identifier="S1" match-max="1"', 'identifier="S1" match-min="1" match-max="1"'));
      expect(itemState.collectAll().valid).toBe(false);

      place(container, 'S1', 'T1');
      expect(itemState.collectAll().valid).toBe(true);
    });
  });

  describe('shared bank', () => {
    it('banks every source together before one column per target', () => {
      const container = render(SHARED_BANK_QTI);

      const matchContainer = container.querySelector('.cutie-match-interaction')!;
      expect(matchContainer.classList.contains('cutie-match-interaction--shared-bank')).toBe(true);

      const body = container.querySelector('.cutie-match-body')!;
      const bank = body.firstElementChild!;
      expect(bank.classList.contains('cutie-match-bank')).toBe(true);
      expect(bank.getAttribute('aria-label')).toBe('Available choices');
      expect(Array.from(bank.querySelectorAll('.cutie-match-choice'), (c) => c.getAttribute('data-identifier')))
        .toEqual(['C', 'D', 'L', 'P']);

      expect(body.lastElementChild!.classList.contains('cutie-match-columns')).toBe(true);
      expect(Array.from(container.querySelectorAll('.cutie-match-target-header'), (h) => h.textContent))
        .toEqual(['Midsummer', 'Romeo', 'Tempest']);
      // Targets are column headers, never choices
      expect(container.querySelectorAll('.cutie-match-choice')).toHaveLength(4);
    });

    it('initializes choices with aria-selected="false" and one tabbable choice', () => {
      const container = render(SHARED_BANK_QTI);
      const choices = Array.from(container.querySelectorAll('.cutie-match-choice'));
      expect(choices.every((c) => c.getAttribute('aria-selected') === 'false')).toBe(true);
      expect(choices.map((c) => c.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1']);
    });

    it('restores one tabbable choice when interactions are re-enabled', () => {
      const container = render(SHARED_BANK_QTI);
      const tabbable = () => Array.from(container.querySelectorAll('.cutie-match-choice'))
        .filter((c) => c.getAttribute('tabindex') === '0')
        .map((c) => c.getAttribute('data-identifier'));

      itemState.setInteractionState('disabled');
      expect(tabbable()).toEqual([]);

      itemState.setInteractionState('enabled');
      expect(tabbable()).toEqual(['C']);
    });

    it('starts each column with one empty slot when it has no match-min', () => {
      const container = render(SHARED_BANK_QTI);
      for (const target of ['M', 'R', 'T']) {
        expect(slotsFor(container, target)).toHaveLength(1);
        expect(isFilled(slotsFor(container, target)[0])).toBe(false);
      }
    });

    it('grows one empty slot at a time as a column fills', () => {
      const container = render(SHARED_BANK_QTI);

      place(container, 'D', 'M');
      expect(slotsFor(container, 'M').map(isFilled)).toEqual([true, false]);

      place(container, 'L', 'M');
      expect(slotsFor(container, 'M').map(isFilled)).toEqual([true, true, false]);
      expect(response()).toEqual(['D M', 'L M']);
    });

    it('shrinks back to one empty slot when a placed source is removed', () => {
      const container = render(SHARED_BANK_QTI);
      place(container, 'D', 'M');
      place(container, 'L', 'M');

      const first = slotsFor(container, 'M')[0];
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));

      expect(slotsFor(container, 'M').map(isFilled)).toEqual([false, true]);
      expect(response()).toEqual(['L M']);
    });

    it('stops growing at the column’s capacity', () => {
      // R may take only two; max-associations would allow more.
      const container = render(SHARED_BANK_QTI.replace('identifier="R" match-max="4"', 'identifier="R" match-max="2"'));
      place(container, 'C', 'R');
      place(container, 'D', 'R');
      expect(slotsFor(container, 'R').map(isFilled)).toEqual([true, true]);
    });

    it('caps an unbounded column (match-max=0) by max-associations', () => {
      const container = render(SHARED_BANK_QTI
        .replace('identifier="M" match-max="4"', 'identifier="M" match-max="0"')
        .replace('max-associations="4"', 'max-associations="2"'));
      place(container, 'C', 'M');
      place(container, 'D', 'M');
      expect(slotsFor(container, 'M').map(isFilled)).toEqual([true, true]);
    });

    it('caps a column by the sources allowed to pair with it', () => {
      const container = render(SHARED_BANK_QTI.replace('max-associations="4"', 'max-associations="0"'));
      for (const id of ['C', 'D', 'L', 'P']) place(container, id, 'T');
      expect(slotsFor(container, 'T').map(isFilled)).toEqual([true, true, true, true]);
    });

    it('pre-allocates a slot per unit of match-min, then grows past it', () => {
      const container = render(SHARED_BANK_QTI.replace('identifier="M" match-max="4"', 'identifier="M" match-min="2" match-max="4"'));
      expect(slotsFor(container, 'M').map(isFilled)).toEqual([false, false]);

      place(container, 'C', 'M');
      expect(slotsFor(container, 'M').map(isFilled)).toEqual([true, false]);
      place(container, 'D', 'M');
      expect(slotsFor(container, 'M').map(isFilled)).toEqual([true, true, false]);
    });

    it('keeps a reusable source in the bank until its match-max is used up', () => {
      const container = render(SHARED_BANK_QTI.replace('identifier="C" match-max="1"', 'identifier="C" match-max="2"'));
      const capulet = sourceEl(container, 'C');

      place(container, 'C', 'R');
      expect(capulet.getAttribute('aria-disabled')).toBe('false');

      place(container, 'C', 'M');
      expect(capulet.getAttribute('aria-disabled')).toBe('true');
      expect(response()).toEqual(['C R', 'C M']);
    });

    it('does not offer a column a source is already paired with', () => {
      const container = render(SHARED_BANK_QTI.replace('identifier="C" match-max="1"', 'identifier="C" match-max="0"'));
      place(container, 'C', 'R');

      sourceEl(container, 'C').click();
      expect(slotsFor(container, 'R').some((slot) => slot.classList.contains('cutie-match-slot--drop-target'))).toBe(false);
      expect(slotsFor(container, 'M')[0].classList.contains('cutie-match-slot--drop-target')).toBe(true);
    });

    it('greys out a source once it is paired with every column it may join', () => {
      const container = render(SHARED_BANK_QTI.replace(
        'identifier="C" match-max="1"',
        'identifier="C" match-max="0" match-group="R T"'
      ));
      place(container, 'C', 'R');
      expect(sourceEl(container, 'C').getAttribute('aria-disabled')).toBe('false');
      place(container, 'C', 'T');
      expect(sourceEl(container, 'C').getAttribute('aria-disabled')).toBe('true');
    });

    it('enforces match-group restrictions', () => {
      // C may join R or T, not M; D has no match-group, so it may join any column.
      const container = render(SHARED_BANK_QTI.replace('identifier="C" match-max="1"', 'identifier="C" match-max="1" match-group="R T"'));

      place(container, 'C', 'M');
      expect(response()).toBeNull();

      place(container, 'D', 'M');
      expect(response()).toEqual(['D M']);
    });

    it('enforces a target’s own match-group', () => {
      const container = render(SHARED_BANK_QTI.replace('identifier="M" match-max="4"', 'identifier="M" match-max="4" match-group="D L"'));

      place(container, 'C', 'M');
      expect(response()).toBeNull();
      place(container, 'D', 'M');
      expect(response()).toEqual(['D M']);
    });

    it('refuses a placement beyond max-associations', () => {
      const container = render(SHARED_BANK_QTI.replace('max-associations="4"', 'max-associations="1"'));
      place(container, 'C', 'R');

      sourceEl(container, 'D').click();
      expect(slotsFor(container, 'M')[0].classList.contains('cutie-match-slot--drop-target')).toBe(false);
      slotsFor(container, 'M')[0].click();
      expect(response()).toEqual(['C R']);
    });

    it('reports no edit when a source moves to another slot in its column', () => {
      const container = render(SHARED_BANK_QTI);
      place(container, 'D', 'M');
      place(container, 'L', 'M');
      const notify = vi.spyOn(itemState, 'notifyResponseChange');

      const [first, , spare] = slotsFor(container, 'M');
      first.click(); // pick D back up
      spare.click(); // and move it to the column's empty slot

      expect(spare.getAttribute('data-source-id')).toBe('D');
      expect(response()).toEqual(['D M', 'L M']);
      expect(notify).not.toHaveBeenCalled();
    });

    it('reports the displaced pair when a source moves onto a filled slot in its column', () => {
      const container = render(SHARED_BANK_QTI);
      place(container, 'D', 'M');
      place(container, 'L', 'M');
      const notify = vi.spyOn(itemState, 'notifyResponseChange');

      const [first, second] = slotsFor(container, 'M');
      first.click(); // pick D back up
      second.click(); // and drop it on L, displacing L

      expect(second.getAttribute('data-source-id')).toBe('D');
      expect(response()).toEqual(['D M']);
      expect(notify).toHaveBeenCalledTimes(1);
    });

    it('moves a placed source to another column', () => {
      const container = render(SHARED_BANK_QTI);
      place(container, 'C', 'R');

      slotsFor(container, 'R')[0].click(); // pick it back up
      slotsFor(container, 'M')[0].click();

      expect(response()).toEqual(['C M']);
      expect(slotsFor(container, 'R').map(isFilled)).toEqual([false]);
    });

    it('names each slot after its column', () => {
      const container = render(SHARED_BANK_QTI);
      expect(slotsFor(container, 'T')[0].getAttribute('aria-label')).toBe('Tempest, slot 1 of 1, empty');
    });

    it('drops the spare empty slot while disabled, and restores it when re-enabled', () => {
      const container = render(SHARED_BANK_QTI.replace('identifier="M" match-max="4"', 'identifier="M" match-min="2" match-max="4"'));
      place(container, 'C', 'R');
      place(container, 'D', 'M');
      place(container, 'L', 'M');

      itemState.setInteractionState('disabled');
      expect(slotsFor(container, 'R').map(isFilled)).toEqual([true]);
      expect(slotsFor(container, 'M').map(isFilled)).toEqual([true, true]);
      // A column with nothing placed keeps no slots at all
      expect(slotsFor(container, 'T')).toHaveLength(0);
      expect(slotsFor(container, 'R')[0].getAttribute('aria-label')).toBe('Romeo, slot 1 of 1, contains Capulet.');

      itemState.setInteractionState('enabled');
      expect(slotsFor(container, 'R').map(isFilled)).toEqual([true, false]);
      expect(slotsFor(container, 'M').map(isFilled)).toEqual([true, true, false]);
      expect(slotsFor(container, 'T').map(isFilled)).toEqual([false]);
    });

    it('keeps the required slots while disabled', () => {
      const container = render(SHARED_BANK_QTI.replace('identifier="M" match-max="4"', 'identifier="M" match-min="2" match-max="4"'));
      itemState.setInteractionState('disabled');
      expect(slotsFor(container, 'M').map(isFilled)).toEqual([false, false]);
    });

    it('fills slots from default values', () => {
      const container = render(`
        <qti-response-declaration identifier="R1" cardinality="multiple" base-type="directedPair">
          <qti-default-value><qti-value>C R</qti-value><qti-value>D M</qti-value></qti-default-value>
        </qti-response-declaration>
        ${SHARED_BANK_QTI}
      `);
      expect(slotsFor(container, 'R')[0].getAttribute('data-source-id')).toBe('C');
      expect(slotsFor(container, 'M')[0].getAttribute('data-source-id')).toBe('D');
      expect(response()).toEqual(['C R', 'D M']);
    });

    it('passes the qti-choices-* class through to the container', () => {
      const container = render(SHARED_BANK_QTI.replace('response-identifier="R1"', 'response-identifier="R1" class="qti-choices-left"'));
      expect(container.querySelector('.cutie-match-interaction')!.classList.contains('qti-choices-left')).toBe(true);
    });

    it('returns a picked-up source when the bank background is clicked', () => {
      const container = render(SHARED_BANK_QTI);
      place(container, 'C', 'R');

      slotsFor(container, 'R')[0].click();
      container.querySelector<HTMLElement>('.cutie-match-bank')!.click();

      expect(response()).toBeNull();
    });
  });

  describe('column banks (bowtie)', () => {
    it('renders one column per target with its own bank', () => {
      const container = render(BOWTIE_QTI);

      const matchContainer = container.querySelector('.cutie-match-interaction')!;
      expect(matchContainer.classList.contains('cutie-match-interaction--column-banks')).toBe(true);
      expect(container.querySelector('.cutie-match-body > .cutie-match-bank')).toBeNull();

      expect(Array.from(container.querySelectorAll('.cutie-match-column > .cutie-match-bank'), (b) => b.getAttribute('data-target-id')))
        .toEqual(['T_ACTIONS', 'T_CONDITION', 'T_PARAMS']);
    });

    it('banks only the sources whose match-group names that column', () => {
      const container = render(BOWTIE_QTI);
      const idsIn = (targetId: string) => Array.from(
        container.querySelectorAll(`.cutie-match-bank[data-target-id="${targetId}"] .cutie-match-choice`),
        (c) => c.getAttribute('data-identifier')
      );

      expect(idsIn('T_ACTIONS')).toEqual(['ACT1', 'ACT2']);
      expect(idsIn('T_CONDITION')).toEqual(['COND1', 'COND2']);
      expect(idsIn('T_PARAMS')).toEqual(['PAR1', 'PAR2']);
    });

    it('labels each bank by its column’s plain header', () => {
      const container = render(BOWTIE_QTI);

      const header = container.querySelector('#cutie-match-label-RB-T_ACTIONS')!;
      expect(header.classList.contains('cutie-match-target-header')).toBe(true);
      expect(header.textContent).toBe('Actions to Take');

      const bank = container.querySelector('.cutie-match-bank[data-target-id="T_ACTIONS"]')!;
      expect(bank.getAttribute('aria-labelledby')).toBe(header.id);
    });

    it('presents each bank before its target slots in the DOM', () => {
      const container = render(BOWTIE_QTI);
      for (const column of container.querySelectorAll('.cutie-match-column')) {
        expect(column.firstElementChild!.classList.contains('cutie-match-bank')).toBe(true);
        expect(column.lastElementChild!.querySelector('.cutie-match-slots')).not.toBeNull();
      }
    });

    it('seeds and restores one tabbable choice per bank', () => {
      const container = render(BOWTIE_QTI);
      const tabbablePerBank = () =>
        Array.from(container.querySelectorAll('.cutie-match-bank')).map((bank) =>
          Array.from(bank.querySelectorAll('.cutie-match-choice'))
            .filter((c) => c.getAttribute('tabindex') === '0')
            .map((c) => c.getAttribute('data-identifier'))
        );

      expect(tabbablePerBank()).toEqual([['ACT1'], ['COND1'], ['PAR1']]);

      itemState.setInteractionState('disabled');
      expect(tabbablePerBank()).toEqual([[], [], []]);

      itemState.setInteractionState('enabled');
      expect(tabbablePerBank()).toEqual([['ACT1'], ['COND1'], ['PAR1']]);
    });

    it('pre-allocates one slot per unit of each target’s match-min', () => {
      const container = render(BOWTIE_QTI);
      expect(slotsFor(container, 'T_ACTIONS')).toHaveLength(2);
      expect(slotsFor(container, 'T_CONDITION')).toHaveLength(1);
      expect(slotsFor(container, 'T_PARAMS')).toHaveLength(2);
      expect(slotsFor(container, 'T_ACTIONS').some(isFilled)).toBe(false);
    });

    it('keeps empty slots inert, and out of focus, until a source is in hand', () => {
      const container = render(BOWTIE_QTI);
      const [empty] = slotsFor(container, 'T_ACTIONS');
      expect(empty.hasAttribute('tabindex')).toBe(false);
      expect(empty.getAttribute('aria-disabled')).toBe('true');

      place(container, 'ACT1', 'T_ACTIONS');
      expect(empty.getAttribute('tabindex')).toBe('0');
      expect(empty.getAttribute('aria-disabled')).toBe('false');
    });

    it('makes only the selected source’s column slots tabbable drop targets', () => {
      const container = render(BOWTIE_QTI);
      sourceEl(container, 'ACT1').click();

      for (const slot of slotsFor(container, 'T_ACTIONS')) {
        expect(slot.getAttribute('tabindex')).toBe('0');
        expect(slot.classList.contains('cutie-match-slot--drop-target')).toBe(true);
      }
      for (const slot of slotsFor(container, 'T_CONDITION')) {
        expect(slot.hasAttribute('tabindex')).toBe(false);
        expect(slot.getAttribute('aria-disabled')).toBe('true');
        expect(slot.classList.contains('cutie-match-slot--drop-target')).toBe(false);
      }
    });

    it('allows a source to associate only with its own column', () => {
      const container = render(BOWTIE_QTI);

      place(container, 'ACT1', 'T_ACTIONS');
      sourceEl(container, 'COND1').click();
      slotsFor(container, 'T_ACTIONS')[1].click();

      expect(response()).toEqual(['ACT1 T_ACTIONS']);
    });

    it('fills a slot when a source is placed and leaves the rest open', () => {
      const container = render(BOWTIE_QTI);
      place(container, 'ACT1', 'T_ACTIONS');

      const slots = slotsFor(container, 'T_ACTIONS');
      expect(slots.map(isFilled)).toEqual([true, false]);
      expect(slots[0].querySelector('.cutie-match-slot-content')!.textContent).toBe('Action 1');
    });

    it('replaces the occupant when a source is placed on a filled slot', () => {
      const container = render(BOWTIE_QTI);
      place(container, 'COND1', 'T_CONDITION');

      sourceEl(container, 'COND2').click();
      slotsFor(container, 'T_CONDITION')[0].click();

      expect(response()).toEqual(['COND2 T_CONDITION']);
    });

    it('uses a source up once it is paired with its only column, whatever its match-max', () => {
      const container = render(BOWTIE_QTI.replace('identifier="ACT1" match-max="1"', 'identifier="ACT1" match-max="0"'));
      const [first, second] = slotsFor(container, 'T_ACTIONS');

      place(container, 'ACT1', 'T_ACTIONS');
      place(container, 'ACT2', 'T_ACTIONS');
      expect(sourceEl(container, 'ACT1').getAttribute('aria-disabled')).toBe('true');

      // Placing ACT1 again must not evict ACT2 from the other slot.
      sourceEl(container, 'ACT1').click();
      second.click();
      expect(response()).toEqual(['ACT1 T_ACTIONS', 'ACT2 T_ACTIONS']);
      expect(first.getAttribute('data-source-id')).toBe('ACT1');
      expect(second.getAttribute('data-source-id')).toBe('ACT2');
    });

    it('moves a placed source to another slot in its column', () => {
      const container = render(BOWTIE_QTI);
      const [first, second] = slotsFor(container, 'T_ACTIONS');

      place(container, 'ACT1', 'T_ACTIONS');
      first.click(); // pick it back up
      second.click();

      expect(isFilled(first)).toBe(false);
      expect(second.getAttribute('data-source-id')).toBe('ACT1');
      expect(response()).toEqual(['ACT1 T_ACTIONS']);
    });

    it('keeps the slot position in its accessible name whether empty or filled', () => {
      const container = render(BOWTIE_QTI);
      const slot = slotsFor(container, 'T_ACTIONS')[1];
      expect(slot.getAttribute('aria-label')).toBe('Actions to Take, slot 2 of 2, empty');

      sourceEl(container, 'ACT1').click();
      slot.click();
      expect(slot.getAttribute('aria-label')).toMatch(/^Actions to Take, slot 2 of 2, contains Action 1\./);

      slot.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
      expect(slot.getAttribute('aria-label')).toBe('Actions to Take, slot 2 of 2, empty');
      expect(response()).toBeNull();
    });

    it('clears the selection when a picked-up source is removed with Backspace', () => {
      const container = render(BOWTIE_QTI);
      const [first, second] = slotsFor(container, 'T_ACTIONS');
      place(container, 'ACT1', 'T_ACTIONS');

      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(first.classList.contains('cutie-match-slot--selected')).toBe(true);
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));

      expect(first.classList.contains('cutie-match-slot--selected')).toBe(false);
      expect(second.classList.contains('cutie-match-slot--drop-target')).toBe(false);

      // Nothing is still held, so activating another slot places nothing.
      second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(response()).toBeNull();
    });

    it('shows the source’s rich content, not its flattened text, in a filled slot', () => {
      const container = render(BOWTIE_QTI.replace('>Action 1<', '><img src="a.png" alt="Diagram A"><'));
      const slot = slotsFor(container, 'T_ACTIONS')[0];
      place(container, 'ACT1', 'T_ACTIONS');

      expect(slot.querySelector('.cutie-match-slot-content img')!.getAttribute('alt')).toBe('Diagram A');
      expect(slot.getAttribute('aria-label')).toMatch(/^Actions to Take, slot 1 of 2, contains Diagram A\./);
      // The bank keeps its own copy.
      expect(sourceEl(container, 'ACT1').querySelector('img')).not.toBeNull();
    });

    it('names choices by their text and their images’ alt text together', () => {
      const container = render(BOWTIE_QTI
        .replace('>Actions to Take<', '><img src="lung.png" alt="Lung diagram"> Region<')
        .replace('>Action 1<', '>Inspect <img src="a.png" alt="the airway"> first<'));
      place(container, 'ACT1', 'T_ACTIONS');

      expect(slotsFor(container, 'T_ACTIONS')[0].getAttribute('aria-label'))
        .toMatch(/^Lung diagram Region, slot 1 of 2, contains Inspect the airway first\./);
      expect(container.querySelector('.cutie-constraint-text')!.textContent)
        .toContain('Make 2 matches for Lung diagram Region.');
    });

    it('keeps placed answers reachable but inert when interactions are disabled', () => {
      const container = render(BOWTIE_QTI);
      const [filled, empty] = slotsFor(container, 'T_ACTIONS');
      place(container, 'ACT1', 'T_ACTIONS');

      itemState.setInteractionState('disabled');
      expect(filled.getAttribute('tabindex')).toBe('0');
      expect(filled.getAttribute('aria-disabled')).toBe('true');
      expect(filled.getAttribute('draggable')).toBe('false');
      expect(filled.getAttribute('aria-label')).toBe('Actions to Take, slot 1 of 2, contains Action 1.');
      expect(empty.hasAttribute('tabindex')).toBe(false);
      expect(empty.getAttribute('aria-disabled')).toBe('true');

      itemState.setInteractionState('enabled');
      expect(filled.getAttribute('aria-disabled')).toBe('false');
      expect(filled.getAttribute('draggable')).toBe('true');
      expect(filled.getAttribute('aria-label')).toMatch(/Press Enter to pick up/);
    });

    it('banks distractors beyond the target capacity', () => {
      const container = render(BOWTIE_QTI.replace(
        '<qti-simple-associable-choice identifier="COND1"',
        '<qti-simple-associable-choice identifier="ACT3" match-max="1" match-group="T_ACTIONS">Action 3</qti-simple-associable-choice>\n<qti-simple-associable-choice identifier="COND1"'
      ));

      expect(slotsFor(container, 'T_ACTIONS')).toHaveLength(2);
      expect(container.querySelectorAll('.cutie-match-bank[data-target-id="T_ACTIONS"] .cutie-match-choice')).toHaveLength(3);
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
        const container = render(BOWTIE_QTI);
        const source = sourceEl(container, 'ACT1');

        drag(source, 'dragstart');
        drag(slotsFor(container, 'T_ACTIONS')[0], 'drop');
        drag(source, 'dragend');

        expect(response()).toEqual(['ACT1 T_ACTIONS']);
      });

      it('returns a source dragged from its slot onto the bank', () => {
        const container = render(BOWTIE_QTI);
        const slot = slotsFor(container, 'T_ACTIONS')[0];
        place(container, 'ACT1', 'T_ACTIONS');

        drag(slot, 'dragstart');
        drag(container.querySelector<HTMLElement>('.cutie-match-bank[data-target-id="T_ACTIONS"]')!, 'drop');
        drag(slot, 'dragend');

        expect(response()).toBeNull();
      });

      it('ignores a drop that did not start in this interaction', () => {
        const container = render(BOWTIE_QTI);
        const [, second] = slotsFor(container, 'T_ACTIONS');
        place(container, 'ACT1', 'T_ACTIONS');

        // Payloads another match interaction on the page could carry.
        drag(second, 'drop', 'source:ACT2');
        drag(second, 'drop', 'slot:0');

        expect(isFilled(second)).toBe(false);
        expect(response()).toEqual(['ACT1 T_ACTIONS']);
      });
    });

    describe('with other interactions on the page', () => {
      // Document click handlers only see clicks on attached elements.
      const attached: HTMLElement[] = [];
      const renderAttached = (qti = BOWTIE_QTI): HTMLElement => {
        const container = render(qti);
        document.body.appendChild(container);
        attached.push(container);
        return container;
      };
      afterEach(() => {
        attached.splice(0).forEach((el) => el.remove());
      });

      const isSelected = (container: HTMLElement, id: string) =>
        sourceEl(container, id).classList.contains('cutie-match-choice--selected');

      it('returns focus to the source in its bank when its slot is emptied with Backspace', () => {
        const container = renderAttached();
        place(container, 'ACT2', 'T_ACTIONS');
        const [slot] = slotsFor(container, 'T_ACTIONS');
        slot.focus();

        slot.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));

        expect(document.activeElement).toBe(sourceEl(container, 'ACT2'));
        expect(sourceEl(container, 'ACT2').getAttribute('tabindex')).toBe('0');
        expect(sourceEl(container, 'ACT1').getAttribute('tabindex')).toBe('-1');
      });

      it('returns focus to the selected source when Escape is pressed on an empty slot', () => {
        const container = renderAttached();
        sourceEl(container, 'ACT1').click();
        const [slot] = slotsFor(container, 'T_ACTIONS');
        slot.focus();

        slot.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(slot.hasAttribute('tabindex')).toBe(false);
        expect(document.activeElement).toBe(sourceEl(container, 'ACT1'));
      });

      it('lets slot clicks reach document click handlers', () => {
        const container = renderAttached();
        const onDocumentClick = vi.fn();
        document.addEventListener('click', onDocumentClick);

        slotsFor(container, 'T_ACTIONS')[0].click();
        document.removeEventListener('click', onDocumentClick);

        expect(onDocumentClick).toHaveBeenCalledTimes(1);
      });

      it('clears the selection when a choice or slot in another interaction is clicked', () => {
        const a = renderAttached();
        const b = renderAttached(BOWTIE_QTI.replace('response-identifier="RB"', 'response-identifier="RB2"'));

        sourceEl(a, 'ACT1').click();
        slotsFor(b, 'T_ACTIONS')[0].click();
        expect(isSelected(a, 'ACT1')).toBe(false);
        expect(slotsFor(a, 'T_ACTIONS')[0].classList.contains('cutie-match-slot--drop-target')).toBe(false);

        sourceEl(a, 'ACT1').click();
        sourceEl(b, 'ACT2').click();
        expect(isSelected(a, 'ACT1')).toBe(false);
      });

      it('keeps the selection when its own slot or bank is clicked', () => {
        const container = renderAttached();
        sourceEl(container, 'ACT1').click();

        // A slot that can't take ACT1 leaves the selection in place.
        slotsFor(container, 'T_CONDITION')[0].click();
        container.querySelector<HTMLElement>('.cutie-match-bank[data-target-id="T_ACTIONS"]')!.click();

        expect(isSelected(container, 'ACT1')).toBe(true);
      });
    });

    describe('shares one bank when the match-groups do not partition the sources', () => {
      const expectShared = (container: HTMLElement): void => {
        expect(container.querySelector('.cutie-match-interaction--shared-bank')).not.toBeNull();
        expect(container.querySelectorAll('.cutie-match-bank')).toHaveLength(1);
        // Every source is still rendered — none are dropped.
        expect(container.querySelectorAll('.cutie-match-bank .cutie-match-choice')).toHaveLength(6);
      };

      it('when a source has no match-group', () => {
        expectShared(render(BOWTIE_QTI.replace(' match-group="T_CONDITION">Condition 2', '>Condition 2')));
      });

      it('when a source names a target that does not exist', () => {
        expectShared(render(BOWTIE_QTI.replace('match-group="T_CONDITION">Condition 2', 'match-group="T_NOPE">Condition 2')));
      });

      it('when a source names more than one target', () => {
        expectShared(render(BOWTIE_QTI.replace(
          'match-group="T_CONDITION">Condition 2',
          'match-group="T_CONDITION T_PARAMS">Condition 2'
        )));
      });

      it('when a target is named by no source', () => {
        const container = render(BOWTIE_QTI.replace(
          /(<\/qti-simple-match-set>\s*<\/qti-match-interaction>)/,
          '<qti-simple-associable-choice identifier="T_EXTRA" match-max="1">Extra</qti-simple-associable-choice>$1'
        ));
        expectShared(container);
        expect(container.querySelector('.cutie-match-column[data-target-id="T_EXTRA"]')).not.toBeNull();
      });
    });
  });
});

describe('matchInteraction evaluation', () => {
  let itemState: ItemStateImpl;

  beforeEach(() => {
    itemState = new ItemStateImpl();
  });

  function render(interaction: string, interactionAttrs: string, declaration: string): HTMLElement {
    const responseIdentifier = /response-identifier="(\w+)"/.exec(interaction)![1];
    const doc = createQtiDocument(`
      <qti-response-declaration identifier="${responseIdentifier}" cardinality="multiple" base-type="directedPair">
        ${declaration}
      </qti-response-declaration>
      ${interaction.replace(
        `response-identifier="${responseIdentifier}"`,
        `response-identifier="${responseIdentifier}" ${interactionAttrs}`
      )}
    `);
    const container = document.createElement('div');
    container.appendChild(transformInteraction(doc, itemState));
    return container;
  }

  const column = (container: HTMLElement, targetId: string) =>
    container.querySelector<HTMLElement>(`.cutie-match-column[data-target-id="${targetId}"]`)!;
  const keyText = (container: HTMLElement, targetId: string) =>
    column(container, targetId).querySelector('.cutie-correct-answer')?.textContent ?? null;

  it('renders nothing when there is no verdict or correct response', () => {
    const container = render(BASIC_MATCH_QTI, '', '<qti-default-value><qti-value>S1 T1</qti-value></qti-default-value>');
    expect(container.querySelector('.cutie-correct-answer')).toBeNull();
    expect(container.querySelector('.cutie-evaluated')).toBeNull();
    // The rail is reserved regardless, so evaluation shifts nothing
    expect(container.querySelector('.cutie-match-interaction')!.classList.contains('cutie-status-rail')).toBe(true);
  });

  it('describes the response in the constraint text, announced with the group', () => {
    const container = render(BASIC_MATCH_QTI, 'data-cutie-evaluation="correct"', '');
    const group = container.querySelector('.cutie-match-interaction')!;
    expect(container.querySelector('.cutie-verdict')).toBeNull();
    expect(container.querySelector('#constraint-R1')!.textContent).toBe('Correct response');
    expect(group.getAttribute('aria-describedby')).toContain('constraint-R1');
    expect(group.classList.contains('cutie-evaluated--correct')).toBe(true);
  });

  it('shows each column the sources that belong in it, by displayed labels', () => {
    const container = render(
      BASIC_MATCH_QTI,
      'data-cutie-evaluation="partial"',
      `<qti-default-value><qti-value>S1 T2</qti-value></qti-default-value>
       <qti-correct-response><qti-value>S1 T1</qti-value><qti-value>S2 T1</qti-value></qti-correct-response>`,
    );
    expect(keyText(container, 'T1')).toBe('Correct answer: Source 1, Source 2');
    // No correct partner, no key
    expect(keyText(container, 'T2')).toBeNull();
    // Sources carry no key of their own
    expect(container.querySelector('.cutie-match-bank .cutie-correct-answer')).toBeNull();
  });

  it('places the key under the last slot, describing every slot of the column', () => {
    const container = render(
      BOWTIE_QTI,
      'data-cutie-evaluation="incorrect"',
      `<qti-correct-response>
         <qti-value>ACT1 T_ACTIONS</qti-value>
         <qti-value>ACT2 T_ACTIONS</qti-value>
         <qti-value>COND1 T_CONDITION</qti-value>
         <qti-value>PAR2 T_PARAMS</qti-value>
       </qti-correct-response>`,
    );
    expect(keyText(container, 'T_ACTIONS')).toBe('Correct answer: Action 1, Action 2');
    expect(keyText(container, 'T_CONDITION')).toBe('Correct answer: Condition 1');
    expect(keyText(container, 'T_PARAMS')).toBe('Correct answer: Parameter 2');
    expect(container.querySelectorAll('.cutie-correct-answer')).toHaveLength(3);

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

  it('describes slots a column grows after the key is drawn', () => {
    const container = render(
      SHARED_BANK_QTI,
      'data-cutie-evaluation="incorrect"',
      '<qti-correct-response><qti-value>C R</qti-value></qti-correct-response>',
    );
    place(container, 'D', 'R');

    const slots = slotsFor(container, 'R');
    expect(slots).toHaveLength(2);
    for (const slot of slots) {
      expect(slot.getAttribute('aria-describedby')).toContain('evaluation-R1-R');
    }
    // New slots go before the key
    expect(column(container, 'R').querySelector('.cutie-match-slots')!.lastElementChild!
      .classList.contains('cutie-correct-answer')).toBe(true);
  });
});
