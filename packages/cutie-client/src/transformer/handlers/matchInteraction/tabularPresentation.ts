// cspell:ignore overlines
import { prependAriaLabelledBy, removeAriaLabelledBy } from '../../../utils/aria.js';
import type { TransformContext } from '../../types.js';
import { createCorrectAnswerOverline, createIncorrectAnswerOverline } from '../evaluation/index.js';
import { choiceLabelId, renderChoiceContent } from './choices.js';
import type { DirectedPair, MatchPresentation, PresentationInput } from './presentation.js';
import { TabularMatchController } from './tabularController.js';

/**
 * A header cell, its content wrapped so qti-header-hidden can hide it
 * visually while it still names the cells.
 */
function createHeader(content: Node, scope: 'row' | 'col', id?: string): HTMLTableCellElement {
  const header = document.createElement('th');
  header.scope = scope;
  if (id) header.id = id;
  const wrapper = document.createElement('span');
  wrapper.className = 'cutie-match-table-header-content';
  wrapper.appendChild(content);
  header.appendChild(wrapper);
  return header;
}

/**
 * Draw the interaction as a table (qti-match-tabular): the first match set's
 * choices are the row headers, the second's the column headers, and each
 * cell holds the input for its row→column pair. qti-header-hidden hides the
 * column headers visually (they still name each cell's input), and
 * data-first-column-header is the text of the top-left header cell.
 */
export function createTable(input: PresentationInput): MatchPresentation {
  const { element, container, context, responseIdentifier, maxAssociations, sources, targets } = input;
  const controller = new TabularMatchController(responseIdentifier, context, container, maxAssociations);
  container.classList.add('cutie-match-interaction--tabular');
  const labelId = (choiceId: string) => choiceLabelId(responseIdentifier, choiceId);

  const table = document.createElement('table');
  table.className = 'cutie-match-table';

  const headerRow = document.createElement('tr');
  const firstColumnHeader = element.getAttribute('data-first-column-header');
  if (firstColumnHeader) {
    const corner = createHeader(document.createTextNode(firstColumnHeader), 'col');
    corner.className = 'cutie-match-table-corner';
    headerRow.appendChild(corner);
  } else {
    headerRow.appendChild(document.createElement('td'));
  }
  for (const target of targets) {
    controller.registerTarget(target.choice);
    headerRow.appendChild(createHeader(renderChoiceContent(target, context), 'col', labelId(target.choice.id)));
  }
  table.createTHead().appendChild(headerRow);

  const tbody = table.createTBody();
  let cellIndex = 0;
  for (const source of sources) {
    const sourceId = source.choice.id;
    controller.registerSource(source.choice);

    const row = tbody.insertRow();
    row.appendChild(createHeader(renderChoiceContent(source, context), 'row', labelId(sourceId)));
    for (const target of targets) {
      const cellInput = document.createElement('input');
      cellInput.type = controller.isRadioRow(sourceId) ? 'radio' : 'checkbox';
      cellInput.name = `match-${responseIdentifier}-${sourceId}`;
      cellInput.value = `${sourceId} ${target.choice.id}`;
      cellInput.setAttribute('aria-labelledby', `${labelId(sourceId)} ${labelId(target.choice.id)}`);

      // Read only as the input's description, while the cell can't be chosen
      const reason = document.createElement('span');
      reason.id = `cutie-match-reason-${responseIdentifier}-${cellIndex++}`;
      reason.hidden = true;

      // The label makes the whole cell clickable; the input is named by its headers
      const cell = document.createElement('label');
      cell.className = 'cutie-match-cell';
      cell.append(cellInput, reason);
      row.insertCell().appendChild(cell);

      controller.registerCell(sourceId, target.choice.id, cellInput, reason);
    }
  }

  const scroller = document.createElement('div');
  scroller.className = 'cutie-match-table-scroll';
  scroller.appendChild(table);
  container.appendChild(scroller);
  makeScrollable(scroller, container, context);

  return {
    controller,
    drawKey: (pairs) => drawKey(table, pairs, responseIdentifier),
    clearResponseMarks: () => clearIncorrectMarks(table),
  };
}

/**
 * Wide tables scroll rather than overflow the item. While the table overflows,
 * the scroll container is a named region in the tab order, so it can be
 * scrolled from the keyboard even when its inputs can't take focus (when the
 * response is read-only).
 */
function makeScrollable(scroller: HTMLElement, container: HTMLElement, context: TransformContext): void {
  if (typeof ResizeObserver === 'undefined') return;

  const update = () => {
    if (scroller.scrollWidth > scroller.clientWidth) {
      scroller.setAttribute('tabindex', '0');
      scroller.setAttribute('role', 'region');
      // Named like the interaction: by its prompt, or its fallback label
      const labelledBy = container.getAttribute('aria-labelledby');
      if (labelledBy) {
        scroller.setAttribute('aria-labelledby', labelledBy);
      } else {
        scroller.setAttribute('aria-label', container.getAttribute('aria-label') ?? '');
      }
    } else {
      for (const attribute of ['tabindex', 'role', 'aria-labelledby', 'aria-label']) {
        scroller.removeAttribute(attribute);
      }
    }
  };

  const observer = new ResizeObserver(update);
  observer.observe(scroller);
  observer.observe(scroller.firstElementChild!);
  context.onCleanup?.(() => observer.disconnect());
}

/**
 * The correct-answer key of a table, as in a choice interaction: above each
 * cell of the correct response, the "correct answer" overline, and above
 * each selected cell that isn't, the "incorrect answer" overline. Every cell
 * gets the overline's slot, so the inputs stay level whichever cells are
 * marked. The overline is hidden from the accessibility tree and comes first
 * in the input's name instead ("Correct answer <row> <column>"), so it isn't
 * read twice.
 */
function drawKey(table: HTMLTableElement, pairs: DirectedPair[], responseIdentifier: string): void {
  const correct = new Set(pairs.map(({ source, target }) => `${source} ${target}`));
  table.classList.add('cutie-match-table--evaluated');

  table.querySelectorAll<HTMLElement>('.cutie-match-cell').forEach((cell, index) => {
    const input = cell.querySelector('input');
    if (!input) return;

    const slot = document.createElement('span');
    slot.className = 'cutie-match-cell-overline';
    cell.prepend(slot);

    let overline: HTMLElement | null = null;
    if (correct.has(input.value)) {
      overline = createCorrectAnswerOverline();
    } else if (correct.size > 0 && input.checked) {
      overline = createIncorrectAnswerOverline();
    }
    if (!overline) return;

    overline.id = `evaluation-${responseIdentifier}-cell-${index}`;
    overline.setAttribute('aria-hidden', 'true');
    slot.appendChild(overline);
    prependAriaLabelledBy(input, overline.id);
  });
}

/**
 * Remove the "incorrect answer" overlines, which describe the response, and
 * their place in the inputs' names.
 */
function clearIncorrectMarks(table: HTMLTableElement): void {
  for (const mark of table.querySelectorAll('.cutie-correct-answer-overline--incorrect')) {
    const input = mark.closest('.cutie-match-cell')?.querySelector('input');
    if (input) removeAriaLabelledBy(input, mark.id);
    mark.remove();
  }
}
