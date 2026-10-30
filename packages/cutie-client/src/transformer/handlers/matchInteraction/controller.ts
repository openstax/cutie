import { addAriaDescribedBy } from '../../../utils/aria.js';
import {
  announce,
  focusNext,
  focusPrev,
  initializeRovingTabindex,
  reportResponseChanges,
  updateRovingTabindex,
} from '../../../utils/index.js';
import type { TransformContext } from '../../types.js';
import { cloneLabel, parseDirectedPair } from '../evaluation/index.js';
import { type AssociableChoice, MatchAssociations, type Pair } from './associations.js';
import type { MatchView } from './presentation.js';

interface TargetSlots {
  container: HTMLElement;
  slots: HTMLElement[];
  // MatchAssociations.capacity, cached when the controller initializes
  capacity: number;
  describedBy: string[];
}

/** A source in hand: picked from a bank (fromSlot null) or out of a slot. */
interface Held {
  sourceId: string;
  fromSlot: HTMLElement | null;
}

/**
 * Controller for managing match interaction state and behavior.
 *
 * Sources sit in word banks (one shared bank, or one per target column) and
 * each target is a column header over a list of slots. A source is placed by
 * selecting or dragging it onto a slot; dropping onto a filled slot replaces
 * its occupant. Each column pre-allocates one slot per unit of its match-min,
 * and grows one empty slot at a time while its capacity allows.
 */
export class MatchController implements MatchView {
  readonly responseIdentifier: string;
  private context: TransformContext;
  private container: HTMLElement;

  // State
  private model: MatchAssociations;
  private enabled = true;

  // Each source's choice element in its word bank
  private sourceElements = new Map<string, HTMLElement>();

  private targets = new Map<string, TargetSlots>();
  private slotOccupant = new Map<HTMLElement, string>();
  private slotPositionLabel = new Map<HTMLElement, string>();
  private banks: HTMLElement[] = [];

  // The current selection, and the drag in progress. The drag is recorded by
  // this controller's own dragstart, so a drag that started anywhere else
  // (another interaction) is never accepted.
  private selection: Held | null = null;
  private drag: Held | null = null;

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
    this.model = new MatchAssociations(maxAssociations);

    // Document click handler to clear selection when clicking outside. Only
    // this interaction's own choices, slots, and banks count as inside, so a
    // click in another interaction clears this selection.
    this.documentClickHandler = (e: MouseEvent) => {
      if (!this.enabled || !this.selection) return;

      const target = e.target as HTMLElement;
      const inside = this.container.contains(target)
        && target.closest('.cutie-match-choice, .cutie-match-slot, .cutie-match-bank');

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
   * Register a source choice: its element sits in a word bank.
   */
  registerSource(choice: AssociableChoice, element: HTMLElement): void {
    this.model.addSource(choice);
    this.sourceElements.set(choice.id, element);
    this.wireSource(choice.id, element);
  }

  /**
   * Register a target column. Its header only labels the column and is never a
   * drop target; the controller draws the column's slots into slotsContainer.
   */
  registerTarget(choice: AssociableChoice, slotsContainer: HTMLElement): void {
    this.model.addTarget(choice);
    this.targets.set(choice.id, { container: slotsContainer, slots: [], capacity: 0, describedBy: [] });
  }

  /**
   * Register a word bank so dropping/clicking it returns a picked-up source.
   */
  registerBank(bankElement: HTMLElement): void {
    this.banks.push(bankElement);
    this.wireBankEvents(bankElement);
  }

  /**
   * Initialize the controller after all choices are registered: size each
   * column, draw its slots, and seed one tabbable source per bank.
   */
  initialize(): void {
    for (const [targetId, target] of this.targets) {
      target.capacity = this.model.capacity(targetId);
      this.syncSlots(targetId);
    }
    for (const sourceId of this.model.sourceIds) {
      this.updateExhaustionState(sourceId);
    }
    this.restoreRovingTabindex();
  }

  /**
   * Describe every slot of a target column (present and future) by an element,
   * e.g. the column's correct-answer key.
   */
  describeTarget(targetId: string, describedById: string): void {
    const target = this.targets.get(targetId);
    if (!target) return;
    target.describedBy.push(describedById);
    for (const slot of target.slots) {
      addAriaDescribedBy(slot, describedById);
    }
  }

  /**
   * The number of associations a choice currently has.
   */
  associationCount(choiceId: string): number {
    return this.model.associationCount(choiceId);
  }

  /**
   * The sources sharing a bank — the roving group for arrow-key navigation.
   */
  private getBankChoiceElements(bank: Element): Map<string, HTMLElement> {
    const scoped = new Map<string, HTMLElement>();
    for (const [choiceId, element] of this.sourceElements) {
      if (bank.contains(element)) scoped.set(choiceId, element);
    }
    return scoped;
  }

  private getRovingGroup(sourceId: string): Map<string, HTMLElement> {
    const bank = this.bankFor(sourceId);
    return bank ? this.getBankChoiceElements(bank) : new Map();
  }

  /** The word bank element hosting a source choice. */
  private bankFor(sourceId: string): HTMLElement | null {
    const el = this.sourceElements.get(sourceId);
    if (!el) return null;
    return this.banks.find((bank) => bank.contains(el)) ?? null;
  }

  /** Focus a source in its bank, making it the bank's tab stop. */
  private focusSource(sourceId: string): void {
    const element = this.sourceElements.get(sourceId);
    const bank = this.bankFor(sourceId);
    if (!element || !bank) return;
    updateRovingTabindex(this.getBankChoiceElements(bank), element);
    element.focus();
  }

  private restoreRovingTabindex(): void {
    for (const bank of this.banks) {
      initializeRovingTabindex(this.getBankChoiceElements(bank));
    }
  }

  private allSlots(): HTMLElement[] {
    return Array.from(this.targets.values(), (target) => target.slots).flat();
  }

  /**
   * Wire a source choice in a word bank: click/Enter selects it, arrows rove
   * within the bank, and it can be dragged onto a slot.
   */
  private wireSource(id: string, element: HTMLElement): void {
    const toggle = () => {
      if (this.model.isSourceExhausted(id)) return;
      if (this.selection?.sourceId === id && !this.selection.fromSlot) {
        this.clearSelection();
      } else {
        this.select(id, null);
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
          focusNext(this.getRovingGroup(id), id);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          focusPrev(this.getRovingGroup(id), id);
          break;
        case 'Escape':
          this.clearSelection();
          break;
      }
    });

    element.addEventListener('dragstart', (e) => {
      if (!this.enabled || this.model.isSourceExhausted(id)) {
        e.preventDefault();
        return;
      }
      e.dataTransfer?.setData('text/plain', `source:${id}`);
      element.classList.add('cutie-match-choice--dragging');
      this.select(id, null);
      this.drag = { sourceId: id, fromSlot: null };
    });

    element.addEventListener('dragend', () => {
      this.drag = null;
      element.classList.remove('cutie-match-choice--dragging');
      this.clearSelection();
    });
  }

  /**
   * Create and wire a slot: one unit of a target column's capacity. Empty: it
   * accepts a selected/dragged source. Filled: its source can be picked up,
   * removed, dragged, or replaced by dropping another source onto it.
   */
  private createSlot(targetId: string): HTMLElement {
    const slot = document.createElement('div');
    slot.className = 'cutie-match-slot';
    slot.setAttribute('role', 'button');
    slot.setAttribute('draggable', 'false');
    slot.setAttribute('data-target-id', targetId);
    this.resetSlotState(slot);

    const placeholder = document.createElement('span');
    placeholder.className = 'cutie-match-slot-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    slot.appendChild(placeholder);

    const content = document.createElement('span');
    content.className = 'cutie-match-slot-content';
    content.style.display = 'none';
    slot.appendChild(content);

    for (const id of this.targets.get(targetId)?.describedBy ?? []) {
      addAriaDescribedBy(slot, id);
    }

    this.wireSlotEvents(slot);
    return slot;
  }

  /**
   * Make a slot a working control (a tab stop) or an inert one: not focusable
   * at all, so a click can't strand focus on it, and aria-disabled, so it
   * isn't presented as a working button.
   */
  private setSlotActionable(slot: HTMLElement, actionable: boolean): void {
    if (actionable) {
      slot.setAttribute('tabindex', '0');
    } else {
      slot.removeAttribute('tabindex');
    }
    slot.setAttribute('aria-disabled', String(!actionable));
  }

  /**
   * A slot's state while nothing is selected: a filled slot is a working
   * control (pick up, remove); an empty one has nothing to do until a source is
   * in hand. Filled slots stay reachable while the interaction is disabled, so
   * the placed answers can still be reviewed, but are marked disabled.
   */
  private resetSlotState(slot: HTMLElement): void {
    const filled = this.slotOccupant.has(slot);
    this.setSlotActionable(slot, filled && this.enabled);
    if (filled && !this.enabled) slot.setAttribute('tabindex', '0');
  }

  private wireSlotEvents(slot: HTMLElement): void {
    const activate = () => {
      const occupant = this.slotOccupant.get(slot);
      if (this.selection) {
        const { sourceId, fromSlot } = this.selection;
        if (fromSlot === slot) {
          this.clearSelection();
          return;
        }
        if (this.placeInSlot(slot, sourceId, fromSlot)) {
          this.clearSelection();
        }
      } else if (occupant) {
        this.select(occupant, slot);
      }
    };

    slot.addEventListener('click', this.reportingEdits(() => {
      if (!this.enabled) return;
      activate();
    }));

    slot.addEventListener('keydown', this.reportingEdits((e: KeyboardEvent) => {
      if (!this.enabled) return;
      const occupant = this.slotOccupant.get(slot);
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (occupant) {
          this.removeFromSlot(slot);
          // Drop any selection too: it may be this very source, picked up.
          this.clearSelection();
          // The emptied slot is inert now; follow the source back to its bank.
          this.focusSource(occupant);
        }
      } else if (e.key === 'Escape') {
        const held = this.selection;
        this.clearSelection();
        // An empty slot is inert again; return focus to where the selection began.
        if (held && !slot.hasAttribute('tabindex')) {
          if (held.fromSlot) {
            held.fromSlot.focus();
          } else {
            this.focusSource(held.sourceId);
          }
        }
      }
    }));

    slot.addEventListener('dragstart', (e) => {
      if (!this.enabled) return;
      const occupant = this.slotOccupant.get(slot);
      if (!occupant) {
        e.preventDefault();
        return;
      }
      e.dataTransfer?.setData('text/plain', `source:${occupant}`);
      slot.classList.add('cutie-match-slot--dragging');
      this.select(occupant, slot);
      this.drag = { sourceId: occupant, fromSlot: slot };
    });

    slot.addEventListener('dragend', () => {
      this.drag = null;
      slot.classList.remove('cutie-match-slot--dragging');
      this.clearSelection();
    });

    slot.addEventListener('dragover', (e) => {
      if (!this.enabled) return;
      // Only signal droppable for this interaction's own drag, and only when the
      // dragged source is actually allowed here.
      const drag = this.drag;
      if (!drag || !this.canPlaceInSlot(slot, drag.sourceId, drag.fromSlot)) return;
      e.preventDefault();
      slot.classList.add('cutie-match-slot--drag-over');
    });

    slot.addEventListener('dragleave', () => {
      slot.classList.remove('cutie-match-slot--drag-over');
    });

    slot.addEventListener('drop', this.reportingEdits((e: DragEvent) => {
      if (!this.enabled) return;
      slot.classList.remove('cutie-match-slot--drag-over');

      // The drag is set up by our own dragstart; anything else isn't ours to place.
      if (!this.drag) return;
      e.preventDefault();

      const { sourceId, fromSlot } = this.drag;
      this.placeInSlot(slot, sourceId, fromSlot);
      this.clearSelection();
    }));
  }

  /**
   * Wire a word bank so a picked-up source can be returned to it (drop or click
   * on the bank background).
   */
  private wireBankEvents(bank: HTMLElement): void {
    bank.addEventListener('dragover', (e) => {
      if (!this.enabled) return;
      // Only accept returns of a source this interaction is dragging out of a slot.
      if (!this.drag?.fromSlot) return;
      e.preventDefault();
      bank.classList.add('cutie-match-bank--drag-over');
    });

    bank.addEventListener('dragleave', (e) => {
      if (!bank.contains(e.relatedTarget as Node)) {
        bank.classList.remove('cutie-match-bank--drag-over');
      }
    });

    bank.addEventListener('drop', this.reportingEdits((e: DragEvent) => {
      if (!this.enabled) return;
      bank.classList.remove('cutie-match-bank--drag-over');
      const fromSlot = this.drag?.fromSlot;
      if (!fromSlot) return;
      e.preventDefault();
      this.removeFromSlot(fromSlot);
    }));

    bank.addEventListener('click', this.reportingEdits((e: MouseEvent) => {
      if (!this.enabled) return;
      const target = e.target as HTMLElement;
      // Clicking the bank background (not a source) returns a picked-up source.
      if (!target.closest('.cutie-match-choice') && this.selection?.fromSlot) {
        this.removeFromSlot(this.selection.fromSlot);
        this.clearSelection();
      }
    }));
  }

  /**
   * Whether `sourceId` may be placed into `slot`: the complete precondition for
   * placeInSlot, covering match-group, the pair already being made, both
   * choices' match-max, and max-associations. `fromSlot` is the slot the source
   * is being moved out of, if any; a move frees that pairing first, as
   * replacing the slot's occupant frees the occupant's.
   */
  private canPlaceInSlot(slot: HTMLElement, sourceId: string, fromSlot: HTMLElement | null): boolean {
    const targetId = slot.getAttribute('data-target-id');
    if (!targetId) return false;

    const occupant = this.slotOccupant.get(slot);
    if (occupant === sourceId) return false; // already here

    const freed: Pair[] = [];
    if (occupant) freed.push({ sourceId: occupant, targetId });
    // Only a move if the source really is sitting in fromSlot.
    const fromTargetId = fromSlot?.getAttribute('data-target-id');
    if (fromSlot && fromTargetId && this.slotOccupant.get(fromSlot) === sourceId) {
      freed.push({ sourceId, targetId: fromTargetId });
    }

    return this.model.canAdd(sourceId, targetId, freed);
  }

  /**
   * Select a source for placement, highlighting the slots it may fill. `fromSlot`
   * is set when picking a placed source back up out of a slot.
   */
  private select(sourceId: string, fromSlot: HTMLElement | null): void {
    this.clearSelection();
    this.selection = { sourceId, fromSlot };

    if (fromSlot) {
      fromSlot.classList.add('cutie-match-slot--selected');
    } else {
      const el = this.sourceElements.get(sourceId);
      el?.classList.add('cutie-match-choice--selected');
      el?.setAttribute('aria-selected', 'true');
    }

    let available = 0;
    for (const slot of this.allSlots()) {
      const canPlace = this.canPlaceInSlot(slot, sourceId, fromSlot);
      if (canPlace) {
        slot.classList.add('cutie-match-slot--drop-target');
        available++;
      }
      // Keyboard users tab only through the slots that can accept this source
      // (and the one it was picked up from, which can be activated to cancel).
      this.setSlotActionable(slot, canPlace || slot === fromSlot);
    }

    // Returning a picked-up source: light its home bank as a target too.
    if (fromSlot) {
      this.bankFor(sourceId)?.classList.add('cutie-match-bank--drop-target');
    }

    const content = this.model.content(sourceId);
    const slots = available === 1 ? 'slot' : 'slots';
    announce(
      this.context,
      fromSlot
        ? `${content} picked up. ${available} ${slots} available. Move it to a slot, or return it to the word bank.`
        : `${content} selected. ${available} ${slots} available. Choose a slot to place it.`
    );
  }

  /**
   * Clear the current selection and its highlights.
   */
  clearSelection(): void {
    if (this.selection) {
      if (this.selection.fromSlot) {
        this.selection.fromSlot.classList.remove('cutie-match-slot--selected');
      } else {
        const el = this.sourceElements.get(this.selection.sourceId);
        el?.classList.remove('cutie-match-choice--selected');
        el?.setAttribute('aria-selected', 'false');
      }
      this.selection = null;
    }

    for (const slot of this.allSlots()) {
      slot.classList.remove('cutie-match-slot--drop-target');
      // Reset idle tab order: only filled slots are reachable when nothing is selected.
      this.resetSlotState(slot);
    }
    for (const bank of this.banks) {
      bank.classList.remove('cutie-match-bank--drop-target', 'cutie-match-bank--drag-over');
    }
  }

  /**
   * Place `sourceId` into `slot`, replacing any current occupant and freeing the
   * source's previous slot when moving. Returns whether it was placed; nothing
   * is changed when the placement isn't allowed.
   */
  private placeInSlot(slot: HTMLElement, sourceId: string, fromSlot: HTMLElement | null): boolean {
    const targetId = slot.getAttribute('data-target-id');
    if (!targetId || !this.canPlaceInSlot(slot, sourceId, fromSlot)) return false;

    // Free the source's previous slot (move) and the slot's occupant (replace)
    // before creating the new association. A move within the same column keeps
    // its pair as it is: only the slot changes, so the response doesn't. The
    // columns are resized once at the end, so neither slot is dropped while it
    // is still in use.
    const fromTargetId = fromSlot?.getAttribute('data-target-id') ?? null;
    const moving = !!fromSlot && this.slotOccupant.get(fromSlot) === sourceId;
    const keepsPair = moving && fromTargetId === targetId;
    if (fromSlot && keepsPair) {
      this.slotOccupant.delete(fromSlot);
      this.emptySlotVisual(fromSlot);
    } else if (fromSlot && moving) {
      this.vacate(fromSlot);
    }
    if (this.slotOccupant.has(slot)) {
      this.vacate(slot);
    }

    if (!keepsPair && !this.createAssociation(sourceId, targetId)) return false;

    this.slotOccupant.set(slot, sourceId);
    this.fillSlotVisual(slot, sourceId);
    this.syncSlots(targetId);
    if (fromTargetId && fromTargetId !== targetId) this.syncSlots(fromTargetId);

    announce(this.context, `${this.model.content(sourceId)} placed.`);
    return true;
  }

  /** Remove the source currently in `slot`, returning it to its bank. */
  private removeFromSlot(slot: HTMLElement): void {
    const sourceId = this.slotOccupant.get(slot);
    const targetId = slot.getAttribute('data-target-id');
    if (!sourceId || !targetId) return;

    this.vacate(slot);
    this.resetSlotState(slot);
    this.syncSlots(targetId);
    announce(this.context, `${this.model.content(sourceId)} returned to the word bank.`);
  }

  /** Empty a slot and remove its association, leaving the column's size alone. */
  private vacate(slot: HTMLElement): void {
    const sourceId = this.slotOccupant.get(slot);
    const targetId = slot.getAttribute('data-target-id');
    if (!sourceId || !targetId) return;

    this.slotOccupant.delete(slot);
    this.removeAssociation(sourceId, targetId);
    this.emptySlotVisual(slot);
  }

  /**
   * Resize a target column's slots: one per unit of its match-min, plus one
   * empty slot to grow into while it has capacity left and the interaction is
   * enabled (a disabled column has nothing to grow into, so it shows only its
   * required and filled slots). Surplus empty slots are removed from the end,
   * sparing the focused one; the slots are then renumbered and named after
   * their column.
   */
  private syncSlots(targetId: string): void {
    const target = this.targets.get(targetId);
    if (!target) return;

    const filled = target.slots.filter((slot) => this.slotOccupant.has(slot)).length;
    const desired = Math.max(
      Math.min(this.model.matchMin(targetId), target.capacity),
      Math.min(this.enabled ? filled + 1 : filled, target.capacity)
    );

    while (target.slots.length < desired) {
      const slot = this.createSlot(targetId);
      const last = target.slots[target.slots.length - 1];
      if (last) {
        last.after(slot);
      } else {
        target.container.prepend(slot);
      }
      target.slots.push(slot);
    }

    for (let i = target.slots.length - 1; i >= 0 && target.slots.length > desired; i--) {
      const slot = target.slots[i];
      if (this.slotOccupant.has(slot) || slot === document.activeElement) continue;
      slot.remove();
      target.slots.splice(i, 1);
      this.slotPositionLabel.delete(slot);
    }

    target.slots.forEach((slot, index) => {
      this.slotPositionLabel.set(slot, `${this.model.content(targetId)}, slot ${index + 1} of ${target.slots.length}`);
      this.updateSlotLabel(slot);
    });
  }

  /** Show `sourceId`'s content inside a filled slot. */
  private fillSlotVisual(slot: HTMLElement, sourceId: string): void {
    slot.classList.add('cutie-match-slot--filled');
    slot.setAttribute('data-source-id', sourceId);
    slot.setAttribute('draggable', 'true');
    this.resetSlotState(slot);
    this.updateSlotLabel(slot);

    const contentSpan = slot.querySelector('.cutie-match-slot-content') as HTMLElement | null;
    const placeholder = slot.querySelector('.cutie-match-slot-placeholder') as HTMLElement | null;
    if (contentSpan) {
      // Copy the bank choice's rendered label rather than its flattened text, so
      // rich content (math, images) reads the same in the slot as in the bank.
      const label = this.sourceElements.get(sourceId)?.querySelector('.cutie-match-choice-label');
      contentSpan.replaceChildren(...(label ? [cloneLabel(label)] : []));
      contentSpan.style.display = '';
    }
    if (placeholder) placeholder.style.display = 'none';
  }

  /**
   * Reset a slot to its empty look. Whether it can take focus is left to the caller:
   * the slot may still hold focus, and making it inert would drop that focus.
   */
  private emptySlotVisual(slot: HTMLElement): void {
    slot.classList.remove('cutie-match-slot--filled');
    slot.removeAttribute('data-source-id');
    slot.setAttribute('draggable', 'false');
    this.updateSlotLabel(slot);

    const contentSpan = slot.querySelector('.cutie-match-slot-content') as HTMLElement | null;
    const placeholder = slot.querySelector('.cutie-match-slot-placeholder') as HTMLElement | null;
    if (contentSpan) {
      contentSpan.replaceChildren();
      contentSpan.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = '';
  }

  /**
   * Name a slot by its position and occupant. The pick-up/remove hint is only
   * given while the interaction is enabled, when those keys do something.
   */
  private updateSlotLabel(slot: HTMLElement): void {
    const positionLabel = this.slotPositionLabel.get(slot) ?? 'Slot';
    const sourceId = this.slotOccupant.get(slot);
    if (!sourceId) {
      slot.setAttribute('aria-label', `${positionLabel}, empty`);
      return;
    }

    const content = this.model.content(sourceId);
    const hint = this.enabled ? ' Press Enter to pick up, or Backspace to remove.' : '';
    slot.setAttribute('aria-label', `${positionLabel}, contains ${content}.${hint}`);
  }

  /**
   * Create an association between a source and target choice.
   */
  private createAssociation(sourceId: string, targetId: string): boolean {
    if (!this.model.add(sourceId, targetId)) return false;
    this.updateExhaustionState(sourceId);
    return true;
  }

  private removeAssociation(sourceId: string, targetId: string): void {
    if (this.model.remove(sourceId, targetId)) this.updateExhaustionState(sourceId);
  }

  /**
   * Update the visual exhaustion state of a source choice.
   */
  private updateExhaustionState(sourceId: string): void {
    const element = this.sourceElements.get(sourceId);
    if (!element) return;

    const exhausted = this.model.isSourceExhausted(sourceId);
    element.classList.toggle('cutie-match-choice--exhausted', exhausted);
    element.setAttribute('aria-disabled', String(exhausted));
    element.setAttribute('draggable', String(this.enabled && !exhausted));
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

    for (const sourceId of this.model.sourceIds) {
      const element = this.sourceElements.get(sourceId);
      if (!element) continue;
      if (enabled) {
        element.removeAttribute('disabled');
      } else {
        element.setAttribute('disabled', '');
        element.setAttribute('tabindex', '-1');
      }
      this.updateExhaustionState(sourceId);
    }

    if (enabled) {
      this.restoreRovingTabindex();
    }

    // Grow or trim each column's spare empty slot to suit the new state.
    for (const targetId of this.model.targetIds) {
      this.syncSlots(targetId);
    }

    // Filled slots are only draggable while enabled, but stay reachable when
    // disabled so the placed answers can still be reviewed.
    for (const slot of this.allSlots()) {
      slot.setAttribute('draggable', enabled && this.slotOccupant.has(slot) ? 'true' : 'false');
      this.resetSlotState(slot);
      this.updateSlotLabel(slot);
    }
  }

  /**
   * Wrap a learner-event listener so any response change it causes is
   * reported once to the item state (see reportResponseChanges).
   */
  private reportingEdits<E extends Event>(listener: (event: E) => void): (event: E) => void {
    return reportResponseChanges(this.context, this.responseIdentifier, () => this.getResponse(), listener);
  }

  /**
   * Get the current response as an array of directed pairs.
   */
  getResponse(): string[] {
    return this.model.pairs();
  }

  /**
   * Initialize from default values: each pair fills the next empty slot of its
   * target column.
   */
  initializeFromDefaults(defaults: string[]): void {
    for (const value of defaults) {
      const pair = parseDirectedPair(value);
      if (!pair) continue;

      const slot = this.targets.get(pair.target)?.slots.find((s) => !this.slotOccupant.has(s));
      if (slot) this.placeInSlot(slot, pair.source, null);
    }
  }
}
