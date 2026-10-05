import {
  announce,
  clearDropTargetHighlights,
  focusNext,
  focusPrev,
  highlightDropTargets,
  updateRovingTabindex,
} from '../../../utils';
import type { TransformContext } from '../../types';

interface ChoiceData {
  id: string;
  set: 'source' | 'target';
  element: HTMLElement;
  matchMax: number;
  content: string;
  connectedIds: Set<string>;
  // Grouped (bowtie) mode: the identifiers of the opposite-set choices this
  // choice may associate with. Empty/absent = unrestricted (classic match).
  matchGroups: Set<string>;
}

/**
 * Controller for managing match interaction state and behavior.
 * Handles click-to-connect, drag-and-drop, and keyboard interactions.
 *
 * Two presentations share this controller:
 *  - Classic two-set match: both sets are choice boxes; selecting one and then
 *    one from the other set connects them, shown as chips.
 *  - Grouped (bowtie) mode: sources live in per-column word banks and each
 *    column is a plain HEADER plus a fixed row of gap boxes. The gaps are the
 *    only drop targets (the header is just a label); a source drops into a gap,
 *    and dropping onto a filled gap replaces its occupant — mirroring
 *    gap-match. No chips are drawn under a placed source.
 */
export class MatchController {
  readonly responseIdentifier: string;
  private context: TransformContext;
  private container: HTMLElement;
  private maxAssociations: number;

  // State
  private associations = new Set<string>(); // "sourceId targetId" pairs
  // Unified selection state: selecting a choice or chip is the same thing
  // The only difference is whether there's an existing association to remove first
  private selection: {
    originId: string;
    originSet: 'source' | 'target';
    existingAssociation?: { sourceId: string; targetId: string };
  } | null = null;
  private enabled = true;

  // Grouped (bowtie) mode: sources are banked per column and each column is a
  // header + gap boxes. Off by default (classic two-set match).
  private grouped = false;

  // Choice data - unified storage
  private choices = new Map<string, ChoiceData>();
  private sourceIds: string[] = [];
  private targetIds: string[] = [];

  // Grouped-mode gap state: the gap elements, which source each holds, the
  // banks (return targets), the current source selection, and the source being
  // dragged (so dragover can validate before the drop's dataTransfer is read).
  private groupedGaps: HTMLElement[] = [];
  private gapOccupant = new Map<HTMLElement, string>();
  private groupedBanks: HTMLElement[] = [];
  private groupedSel: { sourceId: string; fromGap: HTMLElement | null } | null = null;
  private draggedSourceId: string | null = null;

  // Track pending chip drag for drop-outside-to-remove behavior (classic mode)
  private pendingChipDrag: { sourceId: string; targetId: string } | null = null;

  // Document click handler reference for cleanup
  private documentClickHandler: (e: MouseEvent) => void;

  constructor(
    responseIdentifier: string,
    context: TransformContext,
    container: HTMLElement,
    maxAssociations: number = 0
  ) {
    this.responseIdentifier = responseIdentifier;
    this.context = context;
    this.container = container;
    this.maxAssociations = maxAssociations;

    // Document click handler to clear selection when clicking outside
    this.documentClickHandler = (e: MouseEvent) => {
      if (!this.enabled) return;
      if (!this.selection && !this.groupedSel) return;

      const target = e.target as HTMLElement;
      const inside = target.closest(
        '.cutie-match-choice, .cutie-match-chip, .cutie-match-gap, .cutie-match-bank'
      );

      if (!inside) {
        this.clearSelection();
      }
    };
    document.addEventListener('click', this.documentClickHandler);
    this.context.onCleanup?.(() => {
      document.removeEventListener('click', this.documentClickHandler);
    });
  }

  /**
   * Initialize the controller after all choices are registered.
   */
  initialize(_sourceSetElement?: HTMLElement, _targetSetElement?: HTMLElement): void {
    // Grouped gaps are built by the handler; nothing to do here.
  }

  /**
   * Enable grouped (bowtie) mode. In this mode sources are banked per column,
   * arrow keys stay within a bank, and the column gaps are the drop targets.
   */
  enableGroupedMode(): void {
    this.grouped = true;
  }

  /**
   * Register a choice with the controller. In grouped mode this is only used for
   * the source choices; targets are registered via registerGroupedTarget.
   */
  registerChoice(
    id: string,
    set: 'source' | 'target',
    element: HTMLElement,
    matchMax: number,
    content: string,
    matchGroups: string[] = []
  ): void {
    const choiceData: ChoiceData = {
      id,
      set,
      element,
      matchMax,
      content,
      connectedIds: new Set(),
      matchGroups: new Set(matchGroups),
    };

    this.choices.set(id, choiceData);
    (set === 'source' ? this.sourceIds : this.targetIds).push(id);

    if (this.grouped) {
      // Only sources reach this path in grouped mode.
      this.wireGroupedSource(choiceData);
    } else {
      this.wireChoiceEvents(choiceData);
    }
  }

  /**
   * Grouped mode: register a target column. Its element is the plain header,
   * which only labels the column and is never a drop target — the gaps are.
   */
  registerGroupedTarget(
    targetId: string,
    headerElement: HTMLElement,
    matchMax: number,
    content: string
  ): void {
    this.choices.set(targetId, {
      id: targetId,
      set: 'target',
      element: headerElement,
      matchMax,
      content,
      connectedIds: new Set(),
      matchGroups: new Set(),
    });
    this.targetIds.push(targetId);
  }

  /**
   * Grouped mode: register one gap (drop slot) belonging to a target column.
   */
  registerGroupedGap(gapElement: HTMLElement, targetId: string): void {
    gapElement.setAttribute('data-target-id', targetId);
    gapElement.setAttribute('data-gap-id', String(this.groupedGaps.length));
    this.groupedGaps.push(gapElement);
    this.wireGapEvents(gapElement);
  }

  /**
   * Grouped mode: register a word bank so dropping/clicking it returns a
   * picked-up source to the bank.
   */
  registerGroupedBank(bankElement: HTMLElement): void {
    this.groupedBanks.push(bankElement);
    this.wireBankEvents(bankElement);
  }

  /**
   * Whether a source→target association is allowed by match-group. A choice
   * with no groups is unrestricted; where a side declares groups, it must name
   * the other choice's identifier. Sources carry their target column's id.
   */
  private groupsAllow(sourceId: string, targetId: string): boolean {
    const sourceGroups = this.choices.get(sourceId)?.matchGroups;
    const targetGroups = this.choices.get(targetId)?.matchGroups;

    if (!sourceGroups?.size && !targetGroups?.size) return true;
    if (sourceGroups?.size && !sourceGroups.has(targetId)) return false;
    if (targetGroups?.size && !targetGroups.has(sourceId)) return false;
    return true;
  }

  /**
   * The ordered choices sharing the roving group of `id` — used for arrow-key
   * navigation. In grouped mode a source's group is its bank; otherwise the
   * group is the whole set.
   */
  private getRovingGroup(id: string, set: 'source' | 'target'): Map<string, HTMLElement> {
    if (this.grouped && set === 'source') {
      const bank = this.choices.get(id)?.element.closest('.cutie-match-bank');
      if (bank) {
        const scoped = new Map<string, HTMLElement>();
        for (const choiceId of this.sourceIds) {
          const choice = this.choices.get(choiceId);
          if (choice && bank.contains(choice.element)) scoped.set(choiceId, choice.element);
        }
        return scoped;
      }
    }
    return this.getChoiceElementsInSet(set);
  }

  // ---------------------------------------------------------------------------
  // Grouped (bowtie) mode: source + gap + bank wiring
  // ---------------------------------------------------------------------------

  /**
   * Wire a source choice in a word bank: click/Enter selects it, arrows rove
   * within the bank, and it can be dragged into a gap.
   */
  private wireGroupedSource(choice: ChoiceData): void {
    const { id, element } = choice;

    const toggle = () => {
      if (this.isChoiceExhausted(id)) return;
      if (this.groupedSel?.sourceId === id && !this.groupedSel.fromGap) {
        this.clearSelection();
      } else {
        this.selectGroupedSource(id, null);
      }
    };

    element.addEventListener('click', () => {
      if (!this.enabled) return;
      toggle();
    });

    element.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          toggle();
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          focusNext(this.getRovingGroup(id, 'source'), id);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          focusPrev(this.getRovingGroup(id, 'source'), id);
          break;
        case 'Escape':
          this.clearSelection();
          break;
      }
    });

    element.addEventListener('dragstart', (e) => {
      if (!this.enabled || this.isChoiceExhausted(id)) {
        e.preventDefault();
        return;
      }
      e.dataTransfer?.setData('text/plain', `source:${id}`);
      this.draggedSourceId = id;
      element.classList.add('cutie-match-choice--dragging');
      this.selectGroupedSource(id, null);
    });

    element.addEventListener('dragend', () => {
      this.draggedSourceId = null;
      element.classList.remove('cutie-match-choice--dragging');
      this.clearSelection();
    });
  }

  /**
   * Wire a gap (the column's drop slot). Empty: accepts a selected/dragged
   * source. Filled: can be picked up, removed, dragged, or replaced by dropping
   * another source onto it.
   */
  private wireGapEvents(gap: HTMLElement): void {
    const activate = () => {
      const occupant = this.gapOccupant.get(gap);
      if (this.groupedSel) {
        const { sourceId, fromGap } = this.groupedSel;
        if (fromGap === gap) {
          this.clearSelection();
          return;
        }
        if (this.canPlaceInGap(gap, sourceId, fromGap)) {
          this.placeInGap(gap, sourceId, fromGap);
          this.clearSelection();
        }
      } else if (occupant) {
        this.selectGroupedSource(occupant, gap);
      }
    };

    gap.addEventListener('click', (e) => {
      if (!this.enabled) return;
      e.stopPropagation();
      activate();
    });

    gap.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      const occupant = this.gapOccupant.get(gap);
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (occupant) {
          this.removeFromGap(gap);
          gap.focus();
        }
      } else if (e.key === 'Escape') {
        this.clearSelection();
      }
    });

    gap.addEventListener('dragstart', (e) => {
      if (!this.enabled) return;
      const occupant = this.gapOccupant.get(gap);
      if (!occupant) {
        e.preventDefault();
        return;
      }
      e.dataTransfer?.setData('text/plain', `gap:${gap.getAttribute('data-gap-id')}`);
      this.draggedSourceId = occupant;
      gap.classList.add('cutie-match-gap--dragging');
      this.selectGroupedSource(occupant, gap);
    });

    gap.addEventListener('dragend', () => {
      this.draggedSourceId = null;
      gap.classList.remove('cutie-match-gap--dragging');
      this.clearSelection();
    });

    gap.addEventListener('dragover', (e) => {
      if (!this.enabled) return;
      if (!e.dataTransfer?.types.includes('text/plain')) return;
      // Only signal droppable when the dragged source is actually allowed here.
      if (this.draggedSourceId
        && !this.canPlaceInGap(gap, this.draggedSourceId, this.draggedFromGap())) {
        return;
      }
      e.preventDefault();
      gap.classList.add('cutie-match-gap--drag-over');
    });

    gap.addEventListener('dragleave', () => {
      gap.classList.remove('cutie-match-gap--drag-over');
    });

    gap.addEventListener('drop', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      gap.classList.remove('cutie-match-gap--drag-over');

      const data = e.dataTransfer?.getData('text/plain') ?? '';
      if (data.startsWith('source:')) {
        const sourceId = data.slice('source:'.length);
        if (this.canPlaceInGap(gap, sourceId, null)) {
          this.placeInGap(gap, sourceId, null);
        }
      } else if (data.startsWith('gap:')) {
        const fromGap = this.groupedGaps[Number(data.slice('gap:'.length))];
        if (fromGap && fromGap !== gap) {
          const sourceId = this.gapOccupant.get(fromGap);
          if (sourceId && this.canPlaceInGap(gap, sourceId, fromGap)) {
            this.placeInGap(gap, sourceId, fromGap);
          }
        }
      }
      this.clearSelection();
    });
  }

  /** The gap the currently dragged source was picked up from, if any. */
  private draggedFromGap(): HTMLElement | null {
    if (!this.draggedSourceId) return null;
    for (const [gap, sourceId] of this.gapOccupant) {
      if (sourceId === this.draggedSourceId) return gap;
    }
    return null;
  }

  /**
   * Wire a word bank so a picked-up source can be returned to it (drop or click
   * on the bank background).
   */
  private wireBankEvents(bank: HTMLElement): void {
    bank.addEventListener('dragover', (e) => {
      if (!this.enabled) return;
      if (!e.dataTransfer?.types.includes('text/plain')) return;
      // Only accept returns of a source currently sitting in a gap.
      if (!this.draggedFromGap()) return;
      e.preventDefault();
      bank.classList.add('cutie-match-bank--drag-over');
    });

    bank.addEventListener('dragleave', (e) => {
      if (!bank.contains(e.relatedTarget as Node)) {
        bank.classList.remove('cutie-match-bank--drag-over');
      }
    });

    bank.addEventListener('drop', (e) => {
      if (!this.enabled) return;
      bank.classList.remove('cutie-match-bank--drag-over');
      const data = e.dataTransfer?.getData('text/plain') ?? '';
      if (data.startsWith('gap:')) {
        e.preventDefault();
        const fromGap = this.groupedGaps[Number(data.slice('gap:'.length))];
        if (fromGap) this.removeFromGap(fromGap);
      }
    });

    bank.addEventListener('click', (e) => {
      if (!this.enabled) return;
      const target = e.target as HTMLElement;
      // Clicking the bank background (not a source) returns a picked-up source.
      if (!target.closest('.cutie-match-choice') && this.groupedSel?.fromGap) {
        this.removeFromGap(this.groupedSel.fromGap);
        this.clearSelection();
      }
    });
  }

  /**
   * Whether `sourceId` may be placed into `gap`, accounting for match-group,
   * max-associations, and the source's match-max. `fromGap` is the gap the
   * source is being moved from (which frees a slot), if any.
   */
  private canPlaceInGap(gap: HTMLElement, sourceId: string, fromGap: HTMLElement | null): boolean {
    const targetId = gap.getAttribute('data-target-id');
    if (!targetId) return false;
    if (!this.groupsAllow(sourceId, targetId)) return false;

    const occupant = this.gapOccupant.get(gap);
    if (occupant === sourceId) return false; // already here

    // A placement adds a net association only when the gap is empty and we are
    // not moving the source out of another gap.
    const addsAssociation = !occupant && !fromGap;
    if (addsAssociation && this.maxAssociations > 0
      && this.associations.size >= this.maxAssociations) {
      return false;
    }

    // The source gains a use unless it's just moving between gaps.
    const source = this.choices.get(sourceId);
    if (!fromGap && source && source.matchMax > 0
      && source.connectedIds.size >= source.matchMax) {
      return false;
    }

    return true;
  }

  /**
   * Select a source for placement, highlighting the gaps it may fill. `fromGap`
   * is set when picking a placed source back up out of a gap.
   */
  private selectGroupedSource(sourceId: string, fromGap: HTMLElement | null): void {
    this.clearSelection();
    this.groupedSel = { sourceId, fromGap };

    if (fromGap) {
      fromGap.classList.add('cutie-match-gap--selected');
    } else {
      const el = this.choices.get(sourceId)?.element;
      el?.classList.add('cutie-match-choice--selected');
      el?.setAttribute('aria-selected', 'true');
    }

    let available = 0;
    for (const gap of this.groupedGaps) {
      const canPlace = this.canPlaceInGap(gap, sourceId, fromGap);
      if (canPlace) {
        gap.classList.add('cutie-match-gap--drop-target');
        available++;
      }
      // Keyboard users tab only through the gaps that can accept this source.
      gap.setAttribute('tabindex', canPlace ? '0' : '-1');
    }

    // Returning a picked-up source: light its home bank as a target too.
    if (fromGap) {
      this.bankFor(sourceId)?.classList.add('cutie-match-bank--drop-target');
    }

    const content = this.choices.get(sourceId)?.content ?? '';
    const slots = available === 1 ? 'gap' : 'gaps';
    announce(
      this.context,
      fromGap
        ? `${content} picked up. ${available} ${slots} available. Move it to a gap, or return it to the word bank.`
        : `${content} selected. ${available} ${slots} available. Choose a gap to place it.`
    );
  }

  /** The word bank element hosting a source choice. */
  private bankFor(sourceId: string): HTMLElement | null {
    const el = this.choices.get(sourceId)?.element;
    if (!el) return null;
    return this.groupedBanks.find((bank) => bank.contains(el)) ?? null;
  }

  /**
   * Place `sourceId` into `gap`, replacing any current occupant and freeing the
   * source's previous gap when moving.
   */
  private placeInGap(gap: HTMLElement, sourceId: string, fromGap: HTMLElement | null): void {
    const targetId = gap.getAttribute('data-target-id');
    if (!targetId) return;

    const occupant = this.gapOccupant.get(gap);
    if (occupant === sourceId) return;

    // Free the source's previous gap (move) and the target gap's occupant
    // (replace) before creating the new association.
    if (fromGap && fromGap !== gap && this.gapOccupant.get(fromGap) === sourceId) {
      this.removeFromGap(fromGap, true);
    }
    if (occupant) {
      this.removeFromGap(gap, true);
    }

    if (this.createAssociation(sourceId, targetId)) {
      this.gapOccupant.set(gap, sourceId);
      this.fillGapVisual(gap, sourceId);
      announce(this.context, `${this.choices.get(sourceId)?.content ?? ''} placed.`);
    }
  }

  /** Remove the source currently in `gap`, returning it to its bank. */
  private removeFromGap(gap: HTMLElement, silent = false): void {
    const sourceId = this.gapOccupant.get(gap);
    const targetId = gap.getAttribute('data-target-id');
    if (!sourceId || !targetId) return;

    this.gapOccupant.delete(gap);
    this.removeAssociation(sourceId, targetId, true);
    this.emptyGapVisual(gap);

    if (!silent) {
      announce(this.context, `${this.choices.get(sourceId)?.content ?? ''} returned to the word bank.`);
    }
  }

  /** Show `sourceId`'s content inside a filled gap. */
  private fillGapVisual(gap: HTMLElement, sourceId: string): void {
    const content = this.choices.get(sourceId)?.content ?? '';
    gap.classList.add('cutie-match-gap--filled');
    gap.setAttribute('data-source-id', sourceId);
    gap.setAttribute('draggable', 'true');
    gap.setAttribute('tabindex', '0');
    gap.setAttribute('aria-label', `Contains ${content}. Press Enter to pick up, or Backspace to remove.`);

    const contentSpan = gap.querySelector('.cutie-match-gap-content') as HTMLElement | null;
    const placeholder = gap.querySelector('.cutie-match-gap-placeholder') as HTMLElement | null;
    if (contentSpan) {
      contentSpan.textContent = content;
      contentSpan.style.display = '';
    }
    if (placeholder) placeholder.style.display = 'none';
  }

  /** Reset a gap to its empty state. */
  private emptyGapVisual(gap: HTMLElement): void {
    gap.classList.remove('cutie-match-gap--filled');
    gap.removeAttribute('data-source-id');
    gap.setAttribute('draggable', 'false');
    gap.setAttribute('tabindex', '-1');
    gap.setAttribute('aria-label', 'Gap, empty');

    const contentSpan = gap.querySelector('.cutie-match-gap-content') as HTMLElement | null;
    const placeholder = gap.querySelector('.cutie-match-gap-placeholder') as HTMLElement | null;
    if (contentSpan) {
      contentSpan.textContent = '';
      contentSpan.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = '';
  }

  // ---------------------------------------------------------------------------
  // Classic two-set mode: choice + chip wiring
  // ---------------------------------------------------------------------------

  /**
   * Wire up event listeners for a choice element (classic two-set mode).
   */
  private wireChoiceEvents(choice: ChoiceData): void {
    const { id, set, element } = choice;

    // Click to select/connect
    element.addEventListener('click', (e) => {
      if (!this.enabled) return;
      // Ignore clicks on chips
      if ((e.target as HTMLElement).closest('.cutie-match-chip')) return;

      this.handleChoiceClick(id);
    });

    // Keyboard navigation
    element.addEventListener('keydown', (e) => {
      if (!this.enabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.handleChoiceClick(id);
          break;

        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          focusNext(this.getRovingGroup(id, set), id);
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          focusPrev(this.getRovingGroup(id, set), id);
          break;

        case 'Tab': {
          const targetSet = e.shiftKey ? 'source' : 'target';
          if ((set === 'source' && !e.shiftKey) || (set === 'target' && e.shiftKey)) {
            if (this.focusFirstInSet(targetSet)) {
              e.preventDefault();
            }
          }
          break;
        }

        case 'Escape':
          this.clearSelection();
          break;
      }
    });

    // Drag and drop
    element.addEventListener('dragstart', (e) => {
      if (!this.enabled) return;
      if (this.isChoiceExhausted(id)) {
        e.preventDefault();
        return;
      }

      // Select the choice (highlights valid drop targets)
      this.select(id);

      e.dataTransfer?.setData('text/plain', `${set}:${id}`);
      element.classList.add('cutie-match-choice--dragging');
    });

    element.addEventListener('dragend', () => {
      element.classList.remove('cutie-match-choice--dragging');
      this.clearSelection();
    });

    // Drop target
    element.addEventListener('dragover', (e) => {
      if (!this.enabled) return;

      const data = e.dataTransfer?.types.includes('text/plain');
      if (!data) return;

      e.preventDefault();
      element.classList.add('cutie-match-choice--drag-over');
    });

    element.addEventListener('dragleave', () => {
      element.classList.remove('cutie-match-choice--drag-over');
    });

    element.addEventListener('drop', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      element.classList.remove('cutie-match-choice--drag-over');

      // Selection is already set up by dragstart - let handleChoiceClick complete the action
      if (!this.selection) return;

      // For chip drags, mark as handled so dragend doesn't remove the association
      this.pendingChipDrag = null;

      this.handleChoiceClick(id);
    });
  }

  /**
   * Handle click on a choice (classic two-set mode).
   */
  private handleChoiceClick(choiceId: string): void {
    const choice = this.choices.get(choiceId);
    if (!choice) return;

    // Unified handling for both choice and chip selection
    if (this.selection) {
      const { originId, originSet, existingAssociation } = this.selection;
      const oppositeSet = originSet === 'source' ? 'target' : 'source';

      if (choice.set === oppositeSet) {
        // Clicked on the opposite set - create (or move) association
        if (existingAssociation) {
          const oldConnectedId = originSet === 'source'
            ? existingAssociation.targetId
            : existingAssociation.sourceId;

          if (choiceId === oldConnectedId) {
            // Clicked on the same connected item - just clear selection (do nothing)
            this.clearSelection();
            return;
          } else {
            // Clicked on a different item - move the association. Only free the
            // old pairing if the new one is actually placeable (group-compatible
            // and within match-max), so a disallowed target can't strand it.
            const newSourceId = originSet === 'source' ? originId : choiceId;
            const newTargetId = originSet === 'source' ? choiceId : originId;

            if (this.groupsAllow(newSourceId, newTargetId) && this.canAcceptAssociation(choiceId)) {
              this.removeAssociation(existingAssociation.sourceId, existingAssociation.targetId);
              this.createAssociation(newSourceId, newTargetId);
            }
          }
        } else {
          // No existing association - create new
          const sourceId = originSet === 'source' ? originId : choiceId;
          const targetId = originSet === 'source' ? choiceId : originId;

          if (this.canCreateAssociation(sourceId, targetId)) {
            this.createAssociation(sourceId, targetId);
          }
        }
        this.clearSelection();
        return;
      } else {
        // Clicked on same set - clear selection and continue to potentially select the new choice
        this.clearSelection();
      }
    }

    if (this.isChoiceExhausted(choiceId)) return;

    // Select this choice (no existing association)
    this.select(choiceId);
  }

  /**
   * Unified selection: select a choice (optionally with an existing association to replace).
   */
  private select(
    originId: string,
    existingAssociation?: { sourceId: string; targetId: string },
    chipElement?: HTMLElement
  ): void {
    this.clearSelection();

    const choice = this.choices.get(originId);
    if (!choice) return;

    this.selection = { originId, originSet: choice.set, existingAssociation };

    choice.element.classList.add('cutie-match-choice--selected');
    choice.element.setAttribute('aria-selected', 'true');

    // If selecting via chip, also highlight the chip
    if (chipElement) {
      chipElement.classList.add('cutie-match-chip--selected');
    }

    // Highlight valid targets in the opposite set
    const oppositeSet = choice.set === 'source' ? 'target' : 'source';
    const connectedId = existingAssociation
      ? (choice.set === 'source' ? existingAssociation.targetId : existingAssociation.sourceId)
      : null;

    highlightDropTargets(
      this.getChoiceElementsArray(oppositeSet),
      'cutie-match-choice--drop-target',
      (el) => {
        const elId = el.getAttribute('data-identifier');
        if (!elId) return false;

        // Don't highlight the current connected item (clicking it just clears selection now)
        if (elId === connectedId) return false;

        // For a move operation, we need to check if the new partner can accept
        // (the original choice's count will be freed when we remove the old
        // association) and that it is group-compatible with the origin.
        if (existingAssociation) {
          const sourceId = choice.set === 'source' ? originId : elId;
          const targetId = choice.set === 'source' ? elId : originId;
          return this.groupsAllow(sourceId, targetId) && this.canAcceptAssociation(elId);
        }

        // For a fresh selection, check full association validity
        const sourceId = choice.set === 'source' ? originId : elId;
        const targetId = choice.set === 'source' ? elId : originId;
        return this.canCreateAssociation(sourceId, targetId);
      }
    );

    if (existingAssociation) {
      announce(
        this.context,
        `${choice.content} selected. Click again or press backspace to remove. Click another item to move.`
      );
    } else {
      announce(this.context, `${choice.content} selected. Choose an item from the other set to create an association.`);
    }
  }

  /**
   * Clear the current selection (both classic and grouped).
   */
  clearSelection(): void {
    if (this.selection) {
      const choice = this.choices.get(this.selection.originId);
      if (choice) {
        choice.element.classList.remove('cutie-match-choice--selected');
        choice.element.setAttribute('aria-selected', 'false');
      }
      this.selection = null;
    }

    // Clear all chip highlight styling
    for (const chip of this.container.querySelectorAll('.cutie-match-chip--selected')) {
      chip.classList.remove('cutie-match-chip--selected');
    }

    clearDropTargetHighlights(
      this.getAllChoiceElements(),
      'cutie-match-choice--drop-target'
    );

    // Grouped selection + gap/bank highlights.
    if (this.groupedSel) {
      if (this.groupedSel.fromGap) {
        this.groupedSel.fromGap.classList.remove('cutie-match-gap--selected');
      } else {
        const el = this.choices.get(this.groupedSel.sourceId)?.element;
        el?.classList.remove('cutie-match-choice--selected');
        el?.setAttribute('aria-selected', 'false');
      }
      this.groupedSel = null;
    }

    for (const gap of this.groupedGaps) {
      gap.classList.remove('cutie-match-gap--drop-target');
      // Reset idle tab order: only filled gaps are reachable when nothing is selected.
      gap.setAttribute('tabindex', this.gapOccupant.has(gap) ? '0' : '-1');
    }
    for (const bank of this.groupedBanks) {
      bank.classList.remove('cutie-match-bank--drop-target', 'cutie-match-bank--drag-over');
    }
  }

  /**
   * Check if an association can be created.
   */
  private canCreateAssociation(sourceId: string, targetId: string): boolean {
    const key = `${sourceId} ${targetId}`;

    // Check if association already exists
    if (this.associations.has(key)) return false;

    // Check match-group restriction (grouped/bowtie mode)
    if (!this.groupsAllow(sourceId, targetId)) return false;

    // Check max-associations
    if (this.maxAssociations > 0 && this.associations.size >= this.maxAssociations) {
      return false;
    }

    // Check match-max for source
    const sourceChoice = this.choices.get(sourceId);
    if (sourceChoice && sourceChoice.matchMax > 0) {
      if (sourceChoice.connectedIds.size >= sourceChoice.matchMax) return false;
    }

    // Check match-max for target
    const targetChoice = this.choices.get(targetId);
    if (targetChoice && targetChoice.matchMax > 0) {
      if (targetChoice.connectedIds.size >= targetChoice.matchMax) return false;
    }

    return true;
  }

  /**
   * Check if a choice can accept a new association (used when moving).
   * Only checks the choice's own matchMax, not the partner's (partner will be freed).
   */
  private canAcceptAssociation(choiceId: string): boolean {
    const choice = this.choices.get(choiceId);

    if (!choice || choice.matchMax === 0) return true;

    return choice.connectedIds.size < choice.matchMax;
  }

  /**
   * Create an association between a source and target choice.
   */
  createAssociation(sourceId: string, targetId: string): boolean {
    const key = `${sourceId} ${targetId}`;

    if (this.associations.has(key)) return false;

    // Verify we can create this association
    if (!this.canCreateAssociation(sourceId, targetId)) {
      return false;
    }

    this.associations.add(key);

    // Update connectedIds on both choices
    const sourceChoice = this.choices.get(sourceId);
    const targetChoice = this.choices.get(targetId);
    sourceChoice?.connectedIds.add(targetId);
    targetChoice?.connectedIds.add(sourceId);

    // Classic mode draws chips; grouped mode manages gap visuals itself.
    if (!this.grouped) {
      this.updateChips(sourceId);
      this.updateChips(targetId);
    }

    // Update exhaustion state
    this.updateExhaustionState(sourceId);
    this.updateExhaustionState(targetId);

    if (sourceChoice && targetChoice && !this.grouped) {
      announce(this.context, `${sourceChoice.content} connected to ${targetChoice.content}.`);
    }

    return true;
  }

  /**
   * Remove an association. Grouped mode announces via gap place/remove, so it
   * passes `silent` to avoid double messaging.
   */
  removeAssociation(sourceId: string, targetId: string, silent = false): void {
    const key = `${sourceId} ${targetId}`;

    if (!this.associations.has(key)) return;

    this.associations.delete(key);

    // Update connectedIds on both choices
    const sourceChoice = this.choices.get(sourceId);
    const targetChoice = this.choices.get(targetId);
    sourceChoice?.connectedIds.delete(targetId);
    targetChoice?.connectedIds.delete(sourceId);

    // Classic mode draws chips; grouped mode manages gap visuals itself.
    if (!this.grouped) {
      this.updateChips(sourceId);
      this.updateChips(targetId);
    }

    // Update exhaustion state
    this.updateExhaustionState(sourceId);
    this.updateExhaustionState(targetId);

    if (sourceChoice && targetChoice && !silent) {
      announce(this.context, `Connection between ${sourceChoice.content} and ${targetChoice.content} removed.`);
    }
  }

  /**
   * Update chips displayed for a choice element (classic two-set mode).
   * Chips are siblings of the choice (in the wrapper), not children.
   */
  private updateChips(choiceId: string): void {
    const choice = this.choices.get(choiceId);
    if (!choice) return;

    // Chips container is a sibling in the wrapper, not inside the choice element
    const wrapper = choice.element.parentElement;
    const chipsContainer = wrapper?.querySelector('.cutie-match-choice-chips');
    if (!chipsContainer) return;

    // Clear existing chips
    chipsContainer.innerHTML = '';

    for (const connectedId of choice.connectedIds) {
      const chip = this.buildChip(choice, choiceId, connectedId);
      if (chip) chipsContainer.appendChild(chip);
    }
  }

  /**
   * Build a chip representing the association between `choice` and `connectedId`
   * (a choice from the opposite set). The chip is selectable, removable, and
   * draggable, mirroring the choice interactions.
   */
  private buildChip(
    choice: ChoiceData,
    choiceId: string,
    connectedId: string
  ): HTMLButtonElement | null {
    const connectedChoice = this.choices.get(connectedId);
    if (!connectedChoice) return null;

    const sourceId = choice.set === 'source' ? choiceId : connectedId;
    const targetId = choice.set === 'source' ? connectedId : choiceId;
    const existingAssociation = { sourceId, targetId };

    // The chip represents connectedId (from the opposite set)
    const connectedSet = connectedChoice.set;

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'cutie-match-chip';
    chip.setAttribute('data-source-id', sourceId);
    chip.setAttribute('data-target-id', targetId);
    chip.setAttribute('data-connected-id', connectedId);
    chip.setAttribute('draggable', 'true');
    chip.setAttribute('aria-label', `${connectedChoice.content}. Click to select, then click the connected item or press backspace to remove.`);
    chip.textContent = connectedChoice.content;

    // Click to select chip - selecting the chip means selecting what it represents (connectedId)
    // Tap-again-to-remove: if this chip's association is already selected, remove it
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.enabled) return;

      if (this.selection?.existingAssociation?.sourceId === sourceId
        && this.selection?.existingAssociation?.targetId === targetId) {
        this.clearSelection();
        this.removeAssociation(sourceId, targetId);
        choice.element.focus();
        return;
      }

      this.select(connectedId, existingAssociation, chip);
    });

    // Keyboard support for chip
    chip.addEventListener('keydown', (e) => {
      if (!this.enabled) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();

        // Tap-again-to-remove: if this chip's association is already selected, remove it
        if (this.selection?.existingAssociation?.sourceId === sourceId
          && this.selection?.existingAssociation?.targetId === targetId) {
          this.clearSelection();
          this.removeAssociation(sourceId, targetId);
          choice.element.focus();
          return;
        }

        this.select(connectedId, existingAssociation, chip);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        this.removeAssociation(sourceId, targetId);
        // Return focus to the choice element
        choice.element.focus();
      } else if (e.key === 'Escape') {
        this.clearSelection();
        choice.element.focus();
      }
    });

    // Drag support - select the chip and set up drag data
    chip.addEventListener('dragstart', (e) => {
      if (!this.enabled) {
        e.preventDefault();
        return;
      }

      // Select the chip (highlights valid drop targets)
      this.select(connectedId, existingAssociation, chip);

      // Track this drag so we can remove the association if dropped outside
      this.pendingChipDrag = { sourceId, targetId };

      e.dataTransfer?.setData('text/plain', `chip:${sourceId}:${targetId}:${connectedSet}`);
      e.dataTransfer!.effectAllowed = 'move';
      chip.classList.add('cutie-match-chip--dragging');
    });

    chip.addEventListener('dragend', () => {
      chip.classList.remove('cutie-match-chip--dragging');
      this.clearSelection();

      // If pendingChipDrag is still set, the drop wasn't handled - remove the association
      if (this.pendingChipDrag) {
        const { sourceId: pendingSourceId, targetId: pendingTargetId } = this.pendingChipDrag;
        this.pendingChipDrag = null;
        this.removeAssociation(pendingSourceId, pendingTargetId);
      }
    });

    return chip;
  }

  /**
   * Check if a choice has reached its match-max limit.
   */
  private isChoiceExhausted(choiceId: string): boolean {
    return !this.canAcceptAssociation(choiceId);
  }

  /**
   * Update the visual exhaustion state of a choice. Grouped target headers are
   * plain labels, so only sources (and classic choices) are updated.
   */
  private updateExhaustionState(choiceId: string): void {
    const choice = this.choices.get(choiceId);
    if (!choice) return;
    if (this.grouped && choice.set === 'target') return;

    if (this.isChoiceExhausted(choiceId)) {
      choice.element.classList.add('cutie-match-choice--exhausted');
      choice.element.setAttribute('aria-disabled', 'true');
      choice.element.setAttribute('draggable', 'false');
    } else {
      choice.element.classList.remove('cutie-match-choice--exhausted');
      choice.element.setAttribute('aria-disabled', 'false');
      choice.element.setAttribute('draggable', 'true');
    }
  }

  /**
   * Focus the first choice in a set and update roving tabindex.
   * Returns true if focus was moved, false if the set is empty.
   */
  private focusFirstInSet(set: 'source' | 'target'): boolean {
    const ids = set === 'source' ? this.sourceIds : this.targetIds;
    const firstChoice = ids[0] ? this.choices.get(ids[0]) : undefined;
    if (firstChoice) {
      updateRovingTabindex(this.getChoiceElementsInSet(set), firstChoice.element);
      firstChoice.element.focus();
      return true;
    }
    return false;
  }

  /**
   * Get choice elements for a set (for roving tabindex navigation).
   */
  private getChoiceElementsInSet(set: 'source' | 'target'): Map<string, HTMLElement> {
    const ids = set === 'source' ? this.sourceIds : this.targetIds;
    const map = new Map<string, HTMLElement>();
    for (const id of ids) {
      const choice = this.choices.get(id);
      if (choice) map.set(id, choice.element);
    }
    return map;
  }

  /**
   * Get all choice elements in a set as an array.
   */
  private getChoiceElementsArray(set: 'source' | 'target'): HTMLElement[] {
    const ids = set === 'source' ? this.sourceIds : this.targetIds;
    const elements: HTMLElement[] = [];
    for (const id of ids) {
      const choice = this.choices.get(id);
      if (choice) elements.push(choice.element);
    }
    return elements;
  }

  /**
   * Get all choice elements from both sets.
   */
  private getAllChoiceElements(): HTMLElement[] {
    return [...this.getChoiceElementsArray('source'), ...this.getChoiceElementsArray('target')];
  }

  /**
   * Enable or disable the interaction.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (enabled) {
      this.container.classList.remove('cutie-match-interaction--disabled');
    } else {
      this.container.classList.add('cutie-match-interaction--disabled');
      this.clearSelection();
    }

    // Update all choice elements (grouped target headers are not interactive).
    for (const choice of this.choices.values()) {
      if (this.grouped && choice.set === 'target') continue;
      if (enabled) {
        choice.element.removeAttribute('disabled');
        if (!this.isChoiceExhausted(choice.id)) {
          choice.element.setAttribute('draggable', 'true');
        }
      } else {
        choice.element.setAttribute('disabled', '');
        choice.element.setAttribute('draggable', 'false');
      }
    }

    // Grouped gaps: filled gaps stay draggable/reachable while enabled.
    for (const gap of this.groupedGaps) {
      const filled = this.gapOccupant.has(gap);
      gap.setAttribute('draggable', enabled && filled ? 'true' : 'false');
      gap.setAttribute('tabindex', enabled && filled ? '0' : '-1');
    }
  }

  /**
   * Get the current response as an array of directed pairs.
   */
  getResponse(): string[] {
    return Array.from(this.associations);
  }

  /**
   * Initialize from default values.
   */
  initializeFromDefaults(defaults: string[]): void {
    for (const pair of defaults) {
      const [sourceId, targetId] = pair.split(' ');
      if (!sourceId || !targetId) continue;

      if (this.grouped) {
        // Place into the first empty gap belonging to this target column.
        const gap = this.groupedGaps.find(
          (g) => g.getAttribute('data-target-id') === targetId && !this.gapOccupant.has(g)
        );
        if (gap && this.canPlaceInGap(gap, sourceId, null)) {
          this.placeInGap(gap, sourceId, null);
        }
      } else {
        this.createAssociation(sourceId, targetId);
      }
    }
  }
}
