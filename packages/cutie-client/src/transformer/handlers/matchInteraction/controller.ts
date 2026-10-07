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
 *    column is a plain HEADER plus a fixed row of slot boxes. The slots are the
 *    only drop targets (the header is just a label); a source drops into a slot,
 *    and dropping onto a filled slot replaces its occupant — mirroring
 *    gap-match, but without chips under a placed source.
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
  // header + slot boxes. Off by default (classic two-set match).
  private grouped = false;

  // Choice data - unified storage
  private choices = new Map<string, ChoiceData>();
  private sourceIds: string[] = [];
  private targetIds: string[] = [];

  // Grouped-mode slot state: the slot elements, which source each holds, the
  // banks (return targets), the current source selection, and the source being
  // dragged (so dragover can validate before the drop's dataTransfer is read).
  private groupedSlots: HTMLElement[] = [];
  private slotOccupant = new Map<HTMLElement, string>();
  private slotEmptyLabel = new Map<HTMLElement, string>();
  private groupedBanks: HTMLElement[] = [];
  private groupedSel: { sourceId: string; fromSlot: HTMLElement | null } | null = null;
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
        '.cutie-match-choice, .cutie-match-chip, .cutie-match-slot, .cutie-match-bank'
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
    // Grouped slots are built by the handler; nothing to do here.
  }

  /**
   * Enable grouped (bowtie) mode. In this mode sources are banked per column,
   * arrow keys stay within a bank, and the column slots are the drop targets.
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
   * which only labels the column and is never a drop target — the slots are.
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
   * Grouped mode: register one slot (a unit of the target's capacity) in a target column.
   * `position` is 1-based within the column's `count` slots.
   */
  registerGroupedSlot(slotElement: HTMLElement, targetId: string, position: number, count: number): void {
    slotElement.setAttribute('data-target-id', targetId);
    slotElement.setAttribute('data-slot-id', String(this.groupedSlots.length));
    this.groupedSlots.push(slotElement);
    const emptyLabel = `Slot ${position} of ${count}, empty`;
    this.slotEmptyLabel.set(slotElement, emptyLabel);
    slotElement.setAttribute('aria-label', emptyLabel);
    this.wireSlotEvents(slotElement);
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
  // Grouped (bowtie) mode: source + slot + bank wiring
  // ---------------------------------------------------------------------------

  /**
   * Wire a source choice in a word bank: click/Enter selects it, arrows rove
   * within the bank, and it can be dragged into a slot.
   */
  private wireGroupedSource(choice: ChoiceData): void {
    const { id, element } = choice;

    const toggle = () => {
      if (this.isChoiceExhausted(id)) return;
      if (this.groupedSel?.sourceId === id && !this.groupedSel.fromSlot) {
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
   * Wire a slot (one unit of the column target's capacity). Empty: accepts a selected/dragged
   * source. Filled: can be picked up, removed, dragged, or replaced by dropping
   * another source onto it.
   */
  private wireSlotEvents(slot: HTMLElement): void {
    const activate = () => {
      const occupant = this.slotOccupant.get(slot);
      if (this.groupedSel) {
        const { sourceId, fromSlot } = this.groupedSel;
        if (fromSlot === slot) {
          this.clearSelection();
          return;
        }
        if (this.canPlaceInSlot(slot, sourceId, fromSlot)) {
          this.placeInSlot(slot, sourceId, fromSlot);
          this.clearSelection();
        }
      } else if (occupant) {
        this.selectGroupedSource(occupant, slot);
      }
    };

    slot.addEventListener('click', (e) => {
      if (!this.enabled) return;
      e.stopPropagation();
      activate();
    });

    slot.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      const occupant = this.slotOccupant.get(slot);
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (occupant) {
          this.removeFromSlot(slot);
          slot.focus();
        }
      } else if (e.key === 'Escape') {
        this.clearSelection();
      }
    });

    slot.addEventListener('dragstart', (e) => {
      if (!this.enabled) return;
      const occupant = this.slotOccupant.get(slot);
      if (!occupant) {
        e.preventDefault();
        return;
      }
      e.dataTransfer?.setData('text/plain', `slot:${slot.getAttribute('data-slot-id')}`);
      this.draggedSourceId = occupant;
      slot.classList.add('cutie-match-slot--dragging');
      this.selectGroupedSource(occupant, slot);
    });

    slot.addEventListener('dragend', () => {
      this.draggedSourceId = null;
      slot.classList.remove('cutie-match-slot--dragging');
      this.clearSelection();
    });

    slot.addEventListener('dragover', (e) => {
      if (!this.enabled) return;
      if (!e.dataTransfer?.types.includes('text/plain')) return;
      // Only signal droppable when the dragged source is actually allowed here.
      if (this.draggedSourceId
        && !this.canPlaceInSlot(slot, this.draggedSourceId, this.draggedFromSlot())) {
        return;
      }
      e.preventDefault();
      slot.classList.add('cutie-match-slot--drag-over');
    });

    slot.addEventListener('dragleave', () => {
      slot.classList.remove('cutie-match-slot--drag-over');
    });

    slot.addEventListener('drop', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      slot.classList.remove('cutie-match-slot--drag-over');

      const data = e.dataTransfer?.getData('text/plain') ?? '';
      if (data.startsWith('source:')) {
        const sourceId = data.slice('source:'.length);
        if (this.canPlaceInSlot(slot, sourceId, null)) {
          this.placeInSlot(slot, sourceId, null);
        }
      } else if (data.startsWith('slot:')) {
        const fromSlot = this.groupedSlots[Number(data.slice('slot:'.length))];
        if (fromSlot && fromSlot !== slot) {
          const sourceId = this.slotOccupant.get(fromSlot);
          if (sourceId && this.canPlaceInSlot(slot, sourceId, fromSlot)) {
            this.placeInSlot(slot, sourceId, fromSlot);
          }
        }
      }
      this.clearSelection();
    });
  }

  /** The slot the currently dragged source was picked up from, if any. */
  private draggedFromSlot(): HTMLElement | null {
    if (!this.draggedSourceId) return null;
    for (const [slot, sourceId] of this.slotOccupant) {
      if (sourceId === this.draggedSourceId) return slot;
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
      // Only accept returns of a source currently sitting in a slot.
      if (!this.draggedFromSlot()) return;
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
      if (data.startsWith('slot:')) {
        e.preventDefault();
        const fromSlot = this.groupedSlots[Number(data.slice('slot:'.length))];
        if (fromSlot) this.removeFromSlot(fromSlot);
      }
    });

    bank.addEventListener('click', (e) => {
      if (!this.enabled) return;
      const target = e.target as HTMLElement;
      // Clicking the bank background (not a source) returns a picked-up source.
      if (!target.closest('.cutie-match-choice') && this.groupedSel?.fromSlot) {
        this.removeFromSlot(this.groupedSel.fromSlot);
        this.clearSelection();
      }
    });
  }

  /**
   * Whether `sourceId` may be placed into `slot`, accounting for match-group,
   * max-associations, and the source's match-max. `fromSlot` is the slot the
   * source is being moved from (which frees a slot), if any.
   */
  private canPlaceInSlot(slot: HTMLElement, sourceId: string, fromSlot: HTMLElement | null): boolean {
    const targetId = slot.getAttribute('data-target-id');
    if (!targetId) return false;
    if (!this.groupsAllow(sourceId, targetId)) return false;

    const occupant = this.slotOccupant.get(slot);
    if (occupant === sourceId) return false; // already here

    // A placement adds a net association only when the slot is empty and we are
    // not moving the source out of another slot.
    const addsAssociation = !occupant && !fromSlot;
    if (addsAssociation && this.maxAssociations > 0
      && this.associations.size >= this.maxAssociations) {
      return false;
    }

    // The source gains a use unless it's just moving between slots.
    const source = this.choices.get(sourceId);
    if (!fromSlot && source && source.matchMax > 0
      && source.connectedIds.size >= source.matchMax) {
      return false;
    }

    return true;
  }

  /**
   * Select a source for placement, highlighting the slots it may fill. `fromSlot`
   * is set when picking a placed source back up out of a slot.
   */
  private selectGroupedSource(sourceId: string, fromSlot: HTMLElement | null): void {
    this.clearSelection();
    this.groupedSel = { sourceId, fromSlot };

    if (fromSlot) {
      fromSlot.classList.add('cutie-match-slot--selected');
    } else {
      const el = this.choices.get(sourceId)?.element;
      el?.classList.add('cutie-match-choice--selected');
      el?.setAttribute('aria-selected', 'true');
    }

    let available = 0;
    for (const slot of this.groupedSlots) {
      const canPlace = this.canPlaceInSlot(slot, sourceId, fromSlot);
      if (canPlace) {
        slot.classList.add('cutie-match-slot--drop-target');
        available++;
      }
      // Keyboard users tab only through the slots that can accept this source.
      slot.setAttribute('tabindex', canPlace ? '0' : '-1');
    }

    // Returning a picked-up source: light its home bank as a target too.
    if (fromSlot) {
      this.bankFor(sourceId)?.classList.add('cutie-match-bank--drop-target');
    }

    const content = this.choices.get(sourceId)?.content ?? '';
    const slots = available === 1 ? 'slot' : 'slots';
    announce(
      this.context,
      fromSlot
        ? `${content} picked up. ${available} ${slots} available. Move it to a slot, or return it to the word bank.`
        : `${content} selected. ${available} ${slots} available. Choose a slot to place it.`
    );
  }

  /** The word bank element hosting a source choice. */
  private bankFor(sourceId: string): HTMLElement | null {
    const el = this.choices.get(sourceId)?.element;
    if (!el) return null;
    return this.groupedBanks.find((bank) => bank.contains(el)) ?? null;
  }

  /**
   * Place `sourceId` into `slot`, replacing any current occupant and freeing the
   * source's previous slot when moving.
   */
  private placeInSlot(slot: HTMLElement, sourceId: string, fromSlot: HTMLElement | null): void {
    const targetId = slot.getAttribute('data-target-id');
    if (!targetId) return;

    const occupant = this.slotOccupant.get(slot);
    if (occupant === sourceId) return;

    // Free the source's previous slot (move) and the target slot's occupant
    // (replace) before creating the new association.
    if (fromSlot && fromSlot !== slot && this.slotOccupant.get(fromSlot) === sourceId) {
      this.removeFromSlot(fromSlot, true);
    }
    if (occupant) {
      this.removeFromSlot(slot, true);
    }

    if (this.createAssociation(sourceId, targetId)) {
      this.slotOccupant.set(slot, sourceId);
      this.fillSlotVisual(slot, sourceId);
      announce(this.context, `${this.choices.get(sourceId)?.content ?? ''} placed.`);
    }
  }

  /** Remove the source currently in `slot`, returning it to its bank. */
  private removeFromSlot(slot: HTMLElement, silent = false): void {
    const sourceId = this.slotOccupant.get(slot);
    const targetId = slot.getAttribute('data-target-id');
    if (!sourceId || !targetId) return;

    this.slotOccupant.delete(slot);
    this.removeAssociation(sourceId, targetId, true);
    this.emptySlotVisual(slot);

    if (!silent) {
      announce(this.context, `${this.choices.get(sourceId)?.content ?? ''} returned to the word bank.`);
    }
  }

  /** Show `sourceId`'s content inside a filled slot. */
  private fillSlotVisual(slot: HTMLElement, sourceId: string): void {
    const content = this.choices.get(sourceId)?.content ?? '';
    slot.classList.add('cutie-match-slot--filled');
    slot.setAttribute('data-source-id', sourceId);
    slot.setAttribute('draggable', 'true');
    slot.setAttribute('tabindex', '0');
    slot.setAttribute('aria-label', `Contains ${content}. Press Enter to pick up, or Backspace to remove.`);

    const contentSpan = slot.querySelector('.cutie-match-slot-content') as HTMLElement | null;
    const placeholder = slot.querySelector('.cutie-match-slot-placeholder') as HTMLElement | null;
    if (contentSpan) {
      contentSpan.textContent = content;
      contentSpan.style.display = '';
    }
    if (placeholder) placeholder.style.display = 'none';
  }

  /** Reset a slot to its empty state. */
  private emptySlotVisual(slot: HTMLElement): void {
    slot.classList.remove('cutie-match-slot--filled');
    slot.removeAttribute('data-source-id');
    slot.setAttribute('draggable', 'false');
    slot.setAttribute('tabindex', '-1');
    slot.setAttribute('aria-label', this.slotEmptyLabel.get(slot) ?? 'Slot, empty');

    const contentSpan = slot.querySelector('.cutie-match-slot-content') as HTMLElement | null;
    const placeholder = slot.querySelector('.cutie-match-slot-placeholder') as HTMLElement | null;
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

    // Grouped selection + slot/bank highlights.
    if (this.groupedSel) {
      if (this.groupedSel.fromSlot) {
        this.groupedSel.fromSlot.classList.remove('cutie-match-slot--selected');
      } else {
        const el = this.choices.get(this.groupedSel.sourceId)?.element;
        el?.classList.remove('cutie-match-choice--selected');
        el?.setAttribute('aria-selected', 'false');
      }
      this.groupedSel = null;
    }

    for (const slot of this.groupedSlots) {
      slot.classList.remove('cutie-match-slot--drop-target');
      // Reset idle tab order: only filled slots are reachable when nothing is selected.
      slot.setAttribute('tabindex', this.slotOccupant.has(slot) ? '0' : '-1');
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

    // Classic mode draws chips; grouped mode manages slot visuals itself.
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
   * Remove an association. Grouped mode announces via slot place/remove, so it
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

    // Classic mode draws chips; grouped mode manages slot visuals itself.
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
        choice.element.setAttribute('tabindex', "-1");
      }
    }

    // Grouped slots: filled slots stay draggable/reachable while enabled.
    for (const slot of this.groupedSlots) {
      const filled = this.slotOccupant.has(slot);
      slot.setAttribute('draggable', enabled && filled ? 'true' : 'false');
      slot.setAttribute('tabindex', enabled && filled ? '0' : '-1');
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
        // Place into the first empty slot belonging to this target column.
        const slot = this.groupedSlots.find(
          (g) => g.getAttribute('data-target-id') === targetId && !this.slotOccupant.has(g)
        );
        if (slot && this.canPlaceInSlot(slot, sourceId, null)) {
          this.placeInSlot(slot, sourceId, null);
        }
      } else {
        this.createAssociation(sourceId, targetId);
      }
    }
  }
}
