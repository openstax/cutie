import { addAriaDescribedBy, removeAriaDescribedBy } from '../../../utils/aria.js';
import { announce, reportResponseChanges } from '../../../utils/index.js';
import type { TransformContext } from '../../types.js';
import { parseDirectedPair } from '../evaluation/index.js';
import { type AddBlocker, type AssociableChoice, MatchAssociations } from './associations.js';
import type { MatchView } from './presentation.js';

interface Cell {
  sourceId: string;
  targetId: string;
  input: HTMLInputElement;
  // Hidden text describing why the cell can't be chosen, while it can't
  reason: HTMLElement;
}

/**
 * Controller for a match interaction drawn as a table (qti-match-tabular).
 *
 * Each source is a row and each target a column; each cell is a native input
 * for its row→column pair. A row whose source has a match-max of 1 is a radio
 * group, so choosing a cell replaces the row's pair; any other row is a set of
 * checkboxes.
 *
 * A cell the association rules exclude (match-group, a full row or column,
 * max-associations) stays focusable but is aria-disabled, described by the
 * reason, and refuses to be chosen. While the interaction is disabled, every
 * input is natively disabled instead.
 */
export class TabularMatchController implements MatchView {
  readonly responseIdentifier: string;
  private context: TransformContext;
  private container: HTMLElement;

  private model: MatchAssociations;
  private enabled = true;

  // Each cell, by its "sourceId targetId" pair
  private cells = new Map<string, Cell>();

  constructor(
    responseIdentifier: string,
    context: TransformContext,
    container: HTMLElement,
    maxAssociations: number = 0
  ) {
    this.responseIdentifier = responseIdentifier;
    this.context = context;
    this.container = container;
    this.model = new MatchAssociations(maxAssociations);
  }

  registerSource(choice: AssociableChoice): void {
    this.model.addSource(choice);
  }

  registerTarget(choice: AssociableChoice): void {
    this.model.addTarget(choice);
  }

  /**
   * Register the input of a row→column cell, and the hidden element its reason
   * for being unavailable is written to.
   */
  registerCell(sourceId: string, targetId: string, input: HTMLInputElement, reason: HTMLElement): void {
    const cell = { sourceId, targetId, input, reason };
    this.cells.set(`${sourceId} ${targetId}`, cell);

    // An unavailable cell's click is cancelled, so the input never changes
    input.addEventListener('click', (e) => {
      if (input.getAttribute('aria-disabled') !== 'true') return;
      e.preventDefault();
      announce(this.context, reason.textContent ?? '');
    });

    input.addEventListener('change', reportResponseChanges(
      this.context, this.responseIdentifier, () => this.getResponse(), () => {
        if (input.checked) {
          this.choose(sourceId, targetId);
        } else {
          this.model.remove(sourceId, targetId);
        }
        // Draw the model back onto the cells: a refused choice is unchecked again
        this.syncCells();
      }
    ));
  }

  /**
   * Initialize the controller after all cells are registered.
   */
  initialize(): void {
    this.syncCells();
  }

  /** Whether a source's row is a radio group: one pair at most. */
  isRadioRow(sourceId: string): boolean {
    return this.model.matchMax(sourceId) === 1;
  }

  /**
   * What stops a cell from being chosen, or null if it can be. Choosing a cell
   * in a radio row replaces the row's pair, so that pair is freed first.
   */
  private blocker(sourceId: string, targetId: string): AddBlocker | null {
    const freed = this.isRadioRow(sourceId) ? this.model.pairsOf(sourceId) : [];
    return this.model.blocker(sourceId, targetId, freed);
  }

  /** Associate a cell's pair, replacing the row's pair in a radio row. */
  private choose(sourceId: string, targetId: string): void {
    if (this.model.has(sourceId, targetId) || this.blocker(sourceId, targetId) !== null) return;
    if (this.isRadioRow(sourceId)) {
      for (const { targetId: other } of this.model.pairsOf(sourceId)) {
        this.model.remove(sourceId, other);
      }
    }
    this.model.add(sourceId, targetId);
  }

  /** Why a cell can't be chosen, to describe it to the learner. */
  private describeBlocker(blocker: AddBlocker, sourceId: string, targetId: string): string {
    switch (blocker) {
      case 'group':
        return `${this.model.content(sourceId)} can't be matched with ${this.model.content(targetId)}.`;
      case 'source-full':
        return `${this.model.content(sourceId)} already has its maximum number of matches.`;
      case 'target-full':
        return `${this.model.content(targetId)} already has its maximum number of matches.`;
      case 'max-associations':
        return 'The maximum number of matches has been made.';
      default:
        return 'Unavailable.';
    }
  }

  /**
   * Draw the associations onto the cells: each is checked when its pair is
   * made; disabled while the interaction is; and otherwise aria-disabled, with
   * its reason, when it can't be chosen.
   */
  private syncCells(): void {
    for (const { sourceId, targetId, input, reason } of this.cells.values()) {
      const made = this.model.has(sourceId, targetId);
      input.checked = made;
      input.disabled = !this.enabled;

      const blocker = this.enabled && !made ? this.blocker(sourceId, targetId) : null;
      if (blocker) {
        input.setAttribute('aria-disabled', 'true');
        reason.textContent = this.describeBlocker(blocker, sourceId, targetId);
        addAriaDescribedBy(input, reason.id);
      } else {
        input.removeAttribute('aria-disabled');
        reason.textContent = '';
        removeAriaDescribedBy(input, reason.id);
      }
    }
  }

  /**
   * The number of associations a choice currently has.
   */
  associationCount(choiceId: string): number {
    return this.model.associationCount(choiceId);
  }

  /**
   * Enable or disable the interaction.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.container.classList.toggle('cutie-match-interaction--disabled', !enabled);
    this.syncCells();
  }

  /**
   * Get the current response as an array of directed pairs.
   */
  getResponse(): string[] {
    return this.model.pairs();
  }

  /**
   * Initialize from default values: each pair is chosen as if its cell were.
   */
  initializeFromDefaults(defaults: string[]): void {
    for (const value of defaults) {
      const pair = parseDirectedPair(value);
      if (pair && this.cells.has(`${pair.source} ${pair.target}`)) this.choose(pair.source, pair.target);
    }
    this.syncCells();
  }
}
