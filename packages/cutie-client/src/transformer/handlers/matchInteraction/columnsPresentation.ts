// cspell:ignore subgrid
import type { TransformContext } from '../../types.js';
import { cloneLabel, createCorrectAnswer } from '../evaluation/index.js';
import { choiceLabelId, type MatchChoice, renderChoiceContent } from './choices.js';
import { MatchController } from './controller.js';
import type { DirectedPair, MatchPresentation, PresentationInput } from './presentation.js';

/**
 * Plan one word bank per target column, or return null to bank every source
 * together. Per-column banks are used when the sources' match-groups partition
 * them into the target columns: every source names exactly one target
 * identifier, and every target is named by at least one source.
 */
function planColumnBanks(
  sources: MatchChoice[],
  targets: MatchChoice[]
): Map<string, MatchChoice[]> | null {
  const banks = new Map<string, MatchChoice[]>();
  for (const target of targets) {
    banks.set(target.choice.id, []);
  }

  for (const source of sources) {
    const groups = source.choice.matchGroups;
    const bank = groups.length === 1 ? banks.get(groups[0]) : undefined;
    if (!bank) return null;
    bank.push(source);
  }

  for (const bank of banks.values()) {
    if (bank.length === 0) return null;
  }

  return banks;
}

/**
 * Draw the interaction as word banks over target columns of slots.
 */
export function createColumns(input: PresentationInput): MatchPresentation {
  const { container, context, responseIdentifier, maxAssociations, sources, targets } = input;
  const controller = new MatchController(responseIdentifier, context, container, maxAssociations);
  const columnBanks = planColumnBanks(sources, targets);
  container.classList.add(
    columnBanks ? 'cutie-match-interaction--column-banks' : 'cutie-match-interaction--shared-bank'
  );

  // The bank(s) come before the target slots in the DOM because the QTI
  // vocabulary asks for choices to be presented before targets to assistive
  // technology; qti-choices-* only repositions them visually.
  const body = document.createElement('div');
  body.className = 'cutie-match-body';
  if (!columnBanks) {
    body.appendChild(createBank(sources, { label: 'Available choices' }, controller, context));
  }

  const columnsRow = document.createElement('div');
  columnsRow.className = 'cutie-match-columns';
  for (const target of targets) {
    columnsRow.appendChild(createColumn(target, columnBanks, controller, context, responseIdentifier));
  }
  body.appendChild(columnsRow);
  container.appendChild(body);

  return {
    controller,
    drawKey: (pairs) => drawKey(container, pairs, controller, responseIdentifier),
    // The key only shows the correct response
    clearResponseMarks: () => {},
  };
}

/**
 * Create a word bank (a listbox) of source choices, named either by a
 * referenced element (aria-labelledby — e.g. its column's header) or a
 * literal string, and register its sources with the controller.
 */
function createBank(
  sources: MatchChoice[],
  naming: { label: string } | { labelledBy: string },
  controller: MatchController,
  context: TransformContext
): HTMLElement {
  const bank = document.createElement('div');
  bank.className = 'cutie-match-bank';
  bank.setAttribute('role', 'listbox');
  if ('labelledBy' in naming) {
    bank.setAttribute('aria-labelledby', naming.labelledBy);
  } else {
    bank.setAttribute('aria-label', naming.label);
  }

  for (const source of sources) {
    bank.appendChild(createSourceChoice(source, controller, context));
  }

  controller.registerBank(bank);
  return bank;
}

/**
 * Create a source choice and register it with the controller. The
 * controller seeds its tabindex once every bank is built.
 */
function createSourceChoice(
  source: MatchChoice,
  controller: MatchController,
  context: TransformContext
): HTMLElement {
  const { id, matchMax } = source.choice;

  const choiceDiv = document.createElement('div');
  choiceDiv.className = 'cutie-match-choice';
  choiceDiv.setAttribute('role', 'option');
  choiceDiv.setAttribute('aria-selected', 'false');
  choiceDiv.setAttribute('data-identifier', id);
  choiceDiv.setAttribute('data-match-max', String(matchMax));
  choiceDiv.setAttribute('tabindex', '-1');
  choiceDiv.setAttribute('draggable', 'true');

  const labelSpan = document.createElement('span');
  labelSpan.className = 'cutie-match-choice-label';
  labelSpan.appendChild(renderChoiceContent(source, context));
  choiceDiv.appendChild(labelSpan);

  controller.registerSource(source.choice, choiceDiv);

  return choiceDiv;
}

/**
 * Create a target column: its own bank of sources when the banks are per
 * column, then a plain header over the slots the controller draws.
 */
function createColumn(
  target: MatchChoice,
  columnBanks: Map<string, MatchChoice[]> | null,
  controller: MatchController,
  context: TransformContext,
  responseIdentifier: string
): HTMLElement {
  const targetId = target.choice.id;

  const column = document.createElement('div');
  column.className = 'cutie-match-column';
  column.setAttribute('data-target-id', targetId);

  // Header + slots share the target grid area so qti-choices-* positioning
  // places them together opposite the bank.
  const targetArea = document.createElement('div');
  targetArea.className = 'cutie-match-target';

  const header = document.createElement('div');
  header.className = 'cutie-match-target-header';
  const labelId = choiceLabelId(responseIdentifier, targetId);
  header.id = labelId;
  header.appendChild(renderChoiceContent(target, context));
  targetArea.appendChild(header);

  const slots = document.createElement('div');
  slots.className = 'cutie-match-slots';
  slots.setAttribute('role', 'group');
  slots.setAttribute('aria-labelledby', labelId);
  targetArea.appendChild(slots);

  controller.registerTarget(target.choice, slots);

  const bankSources = columnBanks?.get(targetId);
  if (bankSources) {
    const bank = createBank(bankSources, { labelledBy: labelId }, controller, context);
    bank.setAttribute('data-target-id', targetId);
    column.appendChild(bank);
  }
  column.appendChild(targetArea);

  return column;
}

/**
 * The correct-answer key: under each column's slots, the sources that belong
 * there, by their displayed labels — like the per-gap key of a gap match.
 * Every slot of the column is described by the key.
 */
function drawKey(
  container: HTMLElement,
  pairs: DirectedPair[],
  controller: MatchController,
  responseIdentifier: string
): void {
  const choices = new Map<string, HTMLElement>();
  for (const choice of container.querySelectorAll<HTMLElement>('.cutie-match-choice')) {
    const id = choice.getAttribute('data-identifier');
    if (id) choices.set(id, choice);
  }

  const correctByTarget = new Map<string, string[]>();
  for (const { source, target } of pairs) {
    correctByTarget.set(target, [...(correctByTarget.get(target) ?? []), source]);
  }

  for (const column of container.querySelectorAll<HTMLElement>('.cutie-match-column')) {
    const targetId = column.getAttribute('data-target-id');
    const sourceIds = targetId ? correctByTarget.get(targetId) : undefined;
    const slots = column.querySelector<HTMLElement>('.cutie-match-slots');
    if (!targetId || !sourceIds || !slots) continue;

    const content = document.createDocumentFragment();
    sourceIds.forEach((id, index) => {
      if (index > 0) content.append(', ');
      const label = choices.get(id)?.querySelector('.cutie-match-choice-label');
      content.append(label ? cloneLabel(label) : id);
    });

    const answer = createCorrectAnswer(content);
    answer.id = `evaluation-${responseIdentifier}-${targetId}`;
    // Inside the slots' grid row: the column's subgrid has no row of its own for it
    slots.append(answer);
    controller.describeTarget(targetId, answer.id);
  }
}
