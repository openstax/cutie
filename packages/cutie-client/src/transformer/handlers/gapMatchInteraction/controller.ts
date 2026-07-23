import {
  announce,
  clearDropTargetHighlights,
  focusNext,
  focusPrev,
  highlightDropTargets,
} from '../../../utils';
import type { TransformContext } from '../../types';

/**
 * Controller for managing gap match interaction state and behavior.
 * Handles all drag/drop and keyboard interactions.
 */
export class GapMatchController {
  responseIdentifier: string;
  selectedChoice: string | null = null;
  selectedFromGap: string | null = null; // Track which gap the selection came from
  private draggedChoiceId: string | null = null; // Choice currently being dragged (native DnD)
  gapAssignments = new Map<string, string>(); // gap-id -> choice-id
  choiceUseCounts = new Map<string, number>();
  choiceMaxCounts = new Map<string, number>();
  choiceContents = new Map<string, string>();
  choiceElements = new Map<string, HTMLElement>();
  gapElements = new Map<string, HTMLElement>();
  choiceBanks: HTMLElement[];
  private context: TransformContext;
  container: HTMLElement;
  private enabled = true;
  private choiceMatchGroups = new Map<string, Set<string>>(); // choice-id -> set of group names
  private gapMatchGroups = new Map<string, Set<string>>(); // gap-id -> set of group names
  private documentClickHandler: (e: MouseEvent) => void;
  private maxAssociations: number;

  constructor(
    responseIdentifier: string,
    choiceBanks: HTMLElement[],
    context: TransformContext,
    container: HTMLElement,
    maxAssociations: number = 0
  ) {
    this.responseIdentifier = responseIdentifier;
    this.choiceBanks = choiceBanks;
    this.context = context;
    this.container = container;
    this.maxAssociations = maxAssociations;

    // Wire up the choice banks as drop targets for returning choices
    this.wireChoiceBankEvents();

    // Wire up document click to deselect when clicking outside valid targets
    this.documentClickHandler = (e: MouseEvent) => {
      if (!this.enabled || !this.selectedChoice) return;

      const target = e.target as HTMLElement;

      // Check if click is on a valid target (choice, gap, or a choice bank)
      const isChoice = target.closest('.cutie-gap-text');
      const isGap = target.closest('.cutie-gap');
      const isChoiceBank = this.choiceBanks.some((bank) => bank.contains(target));

      // If click is outside all valid targets, deselect
      if (!isChoice && !isGap && !isChoiceBank) {
        this.clearSelection();
      }
    };
    document.addEventListener('click', this.documentClickHandler);
    this.context.onCleanup?.(() => {
      document.removeEventListener('click', this.documentClickHandler);
    });
  }

  /**
   * The bank hosting a choice's button (its home word bank)
   */
  private bankFor(choiceId: string): HTMLElement | null {
    const element = this.choiceElements.get(choiceId);
    if (!element) return null;
    return this.choiceBanks.find((bank) => bank.contains(element)) ?? null;
  }

  /**
   * The ordered choices that share a bank with choiceId — the roving group for
   * arrow-key navigation. Each per-column bank is its own listbox, so arrow
   * keys stay within one bank while Tab moves between banks.
   */
  private bankChoices(choiceId: string): Map<string, HTMLElement> {
    const bank = this.bankFor(choiceId);
    if (!bank) return this.choiceElements;
    const scoped = new Map<string, HTMLElement>();
    for (const [id, element] of this.choiceElements) {
      if (bank.contains(element)) scoped.set(id, element);
    }
    return scoped;
  }

  /**
   * Seed roving tabindex so the first choice in each bank is tabbable
   * (tabindex="0") and the rest are not. Tab then moves between the banks while
   * arrow keys move within a bank.
   */
  seedChoiceRoving(): void {
    const seenBanks = new Set<HTMLElement | null>();
    for (const element of this.choiceElements.values()) {
      const bank = this.choiceBanks.find((b) => b.contains(element)) ?? null;
      const isFirstInBank = !seenBanks.has(bank);
      seenBanks.add(bank);
      element.setAttribute('tabindex', isFirstInBank ? '0' : '-1');
    }
  }

  /**
   * Wire up each choice bank to accept drops (return to word bank)
   */
  private wireChoiceBankEvents(): void {
    for (const bank of this.choiceBanks) {
      bank.addEventListener('dragover', (e) => {
        if (!this.enabled) return;
        // Only accept drops from filled gaps
        e.preventDefault();
        bank.classList.add('cutie-gap-match-choices--drag-over');
      });

      bank.addEventListener('dragleave', (e) => {
        // Only remove class if we're actually leaving the bank
        if (!bank.contains(e.relatedTarget as Node)) {
          bank.classList.remove('cutie-gap-match-choices--drag-over');
        }
      });

      bank.addEventListener('drop', (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        bank.classList.remove('cutie-gap-match-choices--drag-over');

        const data = e.dataTransfer?.getData('text/plain');
        if (data?.startsWith('gap:')) {
          // Dropping from a gap back to the word bank
          const gapId = data.slice(4);
          this.removeChoiceFromGap(gapId);
        }
      });

      // Click on word bank area (not on a choice) to return a selected choice
      bank.addEventListener('click', (e) => {
        if (!this.enabled) return;
        // Only handle clicks on bank background (including group sections), not on choices
        const target = e.target as HTMLElement;
        if (!target.closest('.cutie-gap-text') && this.selectedChoice && this.selectedFromGap) {
          this.removeChoiceFromGap(this.selectedFromGap);
          this.clearSelection();
        }
      });
    }
  }

  /**
   * Register a choice element with the controller
   */
  registerChoice(
    choiceId: string,
    element: HTMLElement,
    maxCount: number,
    content: string,
    matchGroups: string[]
  ): void {
    this.choiceElements.set(choiceId, element);
    this.choiceMaxCounts.set(choiceId, maxCount);
    this.choiceUseCounts.set(choiceId, 0);
    this.choiceContents.set(choiceId, content);

    if (matchGroups.length > 0) {
      this.choiceMatchGroups.set(choiceId, new Set(matchGroups));
    }

    this.wireChoiceEvents(choiceId, element);
  }

  /**
   * Register a gap element with the controller
   */
  registerGap(gapId: string, element: HTMLElement, matchGroups: string[]): void {
    this.gapElements.set(gapId, element);

    if (matchGroups.length > 0) {
      this.gapMatchGroups.set(gapId, new Set(matchGroups));
    }

    this.wireGapEvents(gapId, element);
  }

  /**
   * Wire up event listeners for a choice element
   */
  private wireChoiceEvents(choiceId: string, element: HTMLElement): void {
    // Click to select/deselect
    element.addEventListener('click', () => {
      if (!this.enabled) return;
      if (this.isChoiceExhausted(choiceId)) return;

      if (this.selectedChoice === choiceId && !this.selectedFromGap) {
        this.clearSelection();
      } else {
        this.selectChoice(choiceId, null);
      }
    });

    // Keyboard: Enter/Space to select, Escape to cancel
    element.addEventListener('keydown', (e) => {
      if (!this.enabled) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.isChoiceExhausted(choiceId)) return;

        if (this.selectedChoice === choiceId && !this.selectedFromGap) {
          this.clearSelection();
        } else {
          this.selectChoice(choiceId, null);
        }
      } else if (e.key === 'Escape') {
        this.clearSelection();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        focusNext(this.bankChoices(choiceId), choiceId);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        focusPrev(this.bankChoices(choiceId), choiceId);
      }
    });

    // Drag and drop
    element.addEventListener('dragstart', (e) => {
      if (!this.enabled) return;
      if (this.isChoiceExhausted(choiceId)) {
        e.preventDefault();
        return;
      }

      e.dataTransfer?.setData('text/plain', `choice:${choiceId}`);
      this.draggedChoiceId = choiceId;
      element.classList.add('cutie-gap-text--dragging');

      // Highlight valid drop targets
      highlightDropTargets(
        this.gapElements.values(),
        'cutie-gap--drop-target',
        (el) => {
          const gapId = el.getAttribute('data-identifier');
          return gapId ? this.canPlaceInGap(gapId, choiceId) : false;
        }
      );
    });

    element.addEventListener('dragend', () => {
      this.draggedChoiceId = null;
      element.classList.remove('cutie-gap-text--dragging');
      clearDropTargetHighlights(this.gapElements.values(), 'cutie-gap--drop-target');
    });
  }

  /**
   * Wire up event listeners for a gap element
   */
  private wireGapEvents(gapId: string, element: HTMLElement): void {
    // Click behavior depends on state
    element.addEventListener('click', () => {
      if (!this.enabled) return;

      const currentChoiceInGap = this.gapAssignments.get(gapId);

      if (this.selectedChoice) {
        // A choice is selected - try to place it
        if (this.canPlaceInGap(gapId, this.selectedChoice)) {
          // If clicking on the same gap the selection came from, just deselect
          if (this.selectedFromGap === gapId) {
            this.clearSelection();
          } else {
            this.placeChoiceInGap(gapId, this.selectedChoice);
            // If this was from another gap, remove from that gap
            if (this.selectedFromGap) {
              this.removeChoiceFromGap(this.selectedFromGap, true);
            }
            this.clearSelection();
          }
        }
      } else if (currentChoiceInGap) {
        // Gap has a choice and nothing is selected - pick it up
        this.selectChoice(currentChoiceInGap, gapId);
      }
    });

    // Keyboard: Enter/Space to place or pick up, Delete/Backspace to remove
    element.addEventListener('keydown', (e) => {
      if (!this.enabled) return;

      const currentChoiceInGap = this.gapAssignments.get(gapId);

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();

        if (this.selectedChoice) {
          if (this.canPlaceInGap(gapId, this.selectedChoice)) {
            if (this.selectedFromGap === gapId) {
              this.clearSelection();
            } else {
              this.placeChoiceInGap(gapId, this.selectedChoice);
              if (this.selectedFromGap) {
                this.removeChoiceFromGap(this.selectedFromGap, true);
              }
              this.clearSelection();
            }
          }
        } else if (currentChoiceInGap) {
          this.selectChoice(currentChoiceInGap, gapId);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (currentChoiceInGap) {
          this.removeChoiceFromGap(gapId);
        }
      } else if (e.key === 'Escape') {
        this.clearSelection();
      }
    });

    // Drag and drop - gaps can be dragged FROM when filled
    element.addEventListener('dragstart', (e) => {
      if (!this.enabled) return;

      const currentChoiceInGap = this.gapAssignments.get(gapId);
      if (!currentChoiceInGap) {
        e.preventDefault();
        return;
      }

      e.dataTransfer?.setData('text/plain', `gap:${gapId}`);
      this.draggedChoiceId = currentChoiceInGap;
      element.classList.add('cutie-gap--dragging');

      // Highlight valid drop targets (other gaps and the word bank)
      highlightDropTargets(
        this.gapElements.values(),
        'cutie-gap--drop-target',
        (el) => {
          const gapIdFromEl = el.getAttribute('data-identifier');
          return gapIdFromEl ? this.canPlaceInGap(gapIdFromEl, currentChoiceInGap) : false;
        }
      );
      this.bankFor(currentChoiceInGap)?.classList.add('cutie-gap-match-choices--drop-target');
    });

    element.addEventListener('dragend', () => {
      this.draggedChoiceId = null;
      element.classList.remove('cutie-gap--dragging');
      clearDropTargetHighlights(this.gapElements.values(), 'cutie-gap--drop-target');
      for (const bank of this.choiceBanks) {
        bank.classList.remove('cutie-gap-match-choices--drop-target');
        bank.classList.remove('cutie-gap-match-choices--drag-over');
      }
    });

    // Drag over - accept drops. Only signal droppable (preventDefault) and
    // light up this gap when the dragged choice is actually allowed here — the
    // same match-group restriction the persistent drop-target highlight uses.
    // getData is unavailable during dragover, so we rely on the choice tracked
    // at dragstart; when unknown (e.g. an external drag) fall back to allowing.
    element.addEventListener('dragover', (e) => {
      if (!this.enabled) return;

      const data = e.dataTransfer?.types.includes('text/plain');
      if (!data) return;

      if (this.draggedChoiceId && !this.canPlaceInGap(gapId, this.draggedChoiceId)) {
        return;
      }

      e.preventDefault();
      element.classList.add('cutie-gap--drag-over');
    });

    element.addEventListener('dragleave', () => {
      element.classList.remove('cutie-gap--drag-over');
    });

    element.addEventListener('drop', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      element.classList.remove('cutie-gap--drag-over');

      const data = e.dataTransfer?.getData('text/plain');
      if (!data) return;

      if (data.startsWith('choice:')) {
        // Dropping a choice from the word bank
        const choiceId = data.slice(7);
        if (this.canPlaceInGap(gapId, choiceId)) {
          this.placeChoiceInGap(gapId, choiceId);
        }
      } else if (data.startsWith('gap:')) {
        // Dropping from another gap
        const sourceGapId = data.slice(4);
        if (sourceGapId === gapId) return; // Same gap, ignore

        const choiceId = this.gapAssignments.get(sourceGapId);
        if (choiceId && this.canPlaceInGap(gapId, choiceId)) {
          this.removeChoiceFromGap(sourceGapId, true);
          this.placeChoiceInGap(gapId, choiceId);
        }
      }
    });
  }

  /**
   * Check if a choice can be placed in a gap (matchGroup compatibility)
   */
  private canPlaceInGap(gapId: string, choiceId: string): boolean {
    // If max-associations reached and this gap isn't already filled, can't place
    if (this.maxAssociations > 0
        && this.gapAssignments.size >= this.maxAssociations
        && !this.gapAssignments.has(gapId)) {
      return false;
    }

    const choiceGroups = this.choiceMatchGroups.get(choiceId);
    const gapGroups = this.gapMatchGroups.get(gapId);

    // If neither has groups, they're compatible
    if (!choiceGroups && !gapGroups) return true;

    // If only one has groups, they're not compatible
    if (!choiceGroups || !gapGroups) return false;

    // Check if they share at least one group
    for (const group of choiceGroups) {
      if (gapGroups.has(group)) return true;
    }
    return false;
  }

  /**
   * Select a choice for placement
   * @param choiceId The choice identifier
   * @param fromGapId If selecting from a filled gap, the gap identifier
   */
  selectChoice(choiceId: string, fromGapId: string | null): void {
    this.clearSelection();
    this.selectedChoice = choiceId;
    this.selectedFromGap = fromGapId;

    // Highlight the source element
    if (fromGapId) {
      const gapElement = this.gapElements.get(fromGapId);
      if (gapElement) {
        gapElement.classList.add('cutie-gap--selected');
      }
    } else {
      const element = this.choiceElements.get(choiceId);
      if (element) {
        element.classList.add('cutie-gap-text--selected');
        element.setAttribute('aria-pressed', 'true');
      }
    }

    // Highlight valid drop targets
    highlightDropTargets(
        this.gapElements.values(),
        'cutie-gap--drop-target',
        (el) => {
          const gapId = el.getAttribute('data-identifier');
          return gapId ? this.canPlaceInGap(gapId, choiceId) : false;
        }
      );

    // Show the choice's home bank as a drop target when moving from a gap
    if (fromGapId) {
      this.bankFor(choiceId)?.classList.add('cutie-gap-match-choices--drop-target');
    }

    // Make only the gaps that can accept this choice focusable, so keyboard and
    // screen-reader users Tab through the valid targets only — the same
    // match-group restriction the visual drop-target highlight uses. Invalid
    // gaps stay out of the tab order rather than silently rejecting Enter.
    let availableGaps = 0;
    for (const [gapId, gapElement] of this.gapElements) {
      const canPlace = this.canPlaceInGap(gapId, choiceId);
      gapElement.setAttribute('tabindex', canPlace ? '0' : '-1');
      if (canPlace) availableGaps++;
    }

    const content = this.choiceContents.get(choiceId) ?? '';
    const gapWord = availableGaps === 1 ? 'gap' : 'gaps';
    if (fromGapId) {
      announce(this.context,`${content} picked up from gap. ${availableGaps} ${gapWord} available. Move it to another gap, or return it to the word bank.`);
    } else {
      announce(this.context,`${content} selected. ${availableGaps} ${gapWord} available. Tab to a gap and press Enter to place it.`);
    }
  }

  /**
   * Clear the current selection
   */
  clearSelection(): void {
    if (this.selectedChoice) {
      // Clear highlighting from source
      if (this.selectedFromGap) {
        const gapElement = this.gapElements.get(this.selectedFromGap);
        if (gapElement) {
          gapElement.classList.remove('cutie-gap--selected');
        }
      } else {
        const element = this.choiceElements.get(this.selectedChoice);
        if (element) {
          element.classList.remove('cutie-gap-text--selected');
          element.setAttribute('aria-pressed', 'false');
        }
      }

      this.selectedChoice = null;
      this.selectedFromGap = null;

      // Clear drop target highlights
      clearDropTargetHighlights(this.gapElements.values(), 'cutie-gap--drop-target');
      for (const bank of this.choiceBanks) {
        bank.classList.remove('cutie-gap-match-choices--drop-target');
      }

      // Remove tabindex from gaps when no selection
      for (const gapElement of this.gapElements.values()) {
        gapElement.setAttribute('tabindex', '-1');
      }
    }
  }

  /**
   * Place a choice in a gap
   */
  placeChoiceInGap(gapId: string, choiceId: string): void {
    // If gap already has a choice, remove it first
    if (this.gapAssignments.has(gapId)) {
      this.removeChoiceFromGap(gapId, true);
    }

    // Enforce max-associations (0 means unlimited)
    if (this.maxAssociations > 0 && this.gapAssignments.size >= this.maxAssociations) {
      return;
    }

    // Update assignments and counts
    this.gapAssignments.set(gapId, choiceId);
    const currentCount = this.choiceUseCounts.get(choiceId) ?? 0;
    this.choiceUseCounts.set(choiceId, currentCount + 1);

    // Update gap visual state
    const gapElement = this.gapElements.get(gapId);
    if (gapElement) {
      gapElement.classList.add('cutie-gap--filled');
      gapElement.setAttribute('data-choice-identifier', choiceId);
      gapElement.setAttribute('draggable', 'true');

      const content = this.choiceContents.get(choiceId) ?? '';
      const gapIndex = Array.from(this.gapElements.keys()).indexOf(gapId) + 1;

      // Update ARIA label
      gapElement.setAttribute('aria-label', `Gap ${gapIndex}, contains: ${content}. Drag or click to move.`);

      // Update gap content
      const contentSpan = gapElement.querySelector('.cutie-gap-content');
      const placeholderSpan = gapElement.querySelector('.cutie-gap-placeholder');

      if (contentSpan && placeholderSpan) {
        contentSpan.textContent = content;
        (contentSpan as HTMLElement).style.display = '';
        (placeholderSpan as HTMLElement).style.display = 'none';
      }
    }

    // Update choice exhaustion state
    this.updateChoiceExhaustion(choiceId);

    const content = this.choiceContents.get(choiceId) ?? '';
    announce(this.context,`${content} placed in gap.`);
  }

  /**
   * Remove a choice from a gap
   */
  removeChoiceFromGap(gapId: string, silent = false): void {
    const choiceId = this.gapAssignments.get(gapId);
    if (!choiceId) return;

    // Update assignments and counts
    this.gapAssignments.delete(gapId);
    const currentCount = this.choiceUseCounts.get(choiceId) ?? 0;
    this.choiceUseCounts.set(choiceId, Math.max(0, currentCount - 1));

    // Update gap visual state
    const gapElement = this.gapElements.get(gapId);
    if (gapElement) {
      gapElement.classList.remove('cutie-gap--filled');
      gapElement.removeAttribute('data-choice-identifier');
      gapElement.setAttribute('draggable', 'false');

      const gapIndex = Array.from(this.gapElements.keys()).indexOf(gapId) + 1;
      gapElement.setAttribute('aria-label', `Gap ${gapIndex}, empty`);

      // Update gap content
      const contentSpan = gapElement.querySelector('.cutie-gap-content');
      const placeholderSpan = gapElement.querySelector('.cutie-gap-placeholder');

      if (contentSpan && placeholderSpan) {
        contentSpan.textContent = '';
        (contentSpan as HTMLElement).style.display = 'none';
        (placeholderSpan as HTMLElement).style.display = '';
      }
    }

    // Update choice exhaustion state
    this.updateChoiceExhaustion(choiceId);

    if (!silent) {
      const content = this.choiceContents.get(choiceId) ?? '';
      announce(this.context,`${content} returned to word bank.`);
    }
  }

  /**
   * Check if a choice has reached its matchMax limit
   */
  isChoiceExhausted(choiceId: string): boolean {
    const maxCount = this.choiceMaxCounts.get(choiceId) ?? 0;
    // matchMax=0 means unlimited
    if (maxCount === 0) return false;

    const currentCount = this.choiceUseCounts.get(choiceId) ?? 0;
    return currentCount >= maxCount;
  }

  /**
   * Update the visual exhaustion state of a choice
   */
  private updateChoiceExhaustion(choiceId: string): void {
    const element = this.choiceElements.get(choiceId);
    if (!element) return;

    if (this.isChoiceExhausted(choiceId)) {
      element.classList.add('cutie-gap-text--exhausted');
      element.setAttribute('aria-disabled', 'true');
      element.setAttribute('draggable', 'false');
    } else {
      element.classList.remove('cutie-gap-text--exhausted');
      element.setAttribute('aria-disabled', 'false');
      element.setAttribute('draggable', 'true');
    }
  }

  /**
   * Enable or disable the interaction
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    // Update container state
    if (enabled) {
      this.container.classList.remove('cutie-gap-match-interaction--disabled');
    } else {
      this.container.classList.add('cutie-gap-match-interaction--disabled');
    }

    // Update choice elements
    for (const [choiceId, element] of this.choiceElements) {
      if (enabled) {
        element.removeAttribute('disabled');
        element.setAttribute('draggable', this.isChoiceExhausted(choiceId) ? 'false' : 'true');
      } else {
        element.setAttribute('disabled', '');
        element.setAttribute('tabindex', '-1');
        element.setAttribute('draggable', 'false');
      }
    }

    // Re-seed roving tabindex per bank (one tabbable choice per listbox)
    if (enabled) {
      this.seedChoiceRoving();
    }

    // Update gap elements
    for (const [gapId, element] of this.gapElements) {
      if (enabled) {
        element.setAttribute('tabindex', '-1');
        // Restore draggable state based on whether gap is filled
        element.setAttribute('draggable', this.gapAssignments.has(gapId) ? 'true' : 'false');
      } else {
        element.setAttribute('tabindex', '-1');
        element.setAttribute('draggable', 'false');
      }
    }

    // Clear any selection when disabled
    if (!enabled) {
      this.clearSelection();
    }
  }

  /**
   * Get the current response as an array of directed pairs
   */
  getResponse(): string[] {
    const pairs: string[] = [];
    for (const [gapId, choiceId] of this.gapAssignments) {
      pairs.push(`${choiceId} ${gapId}`);
    }
    return pairs;
  }

  /**
   * Initialize from default values
   */
  initializeFromDefaults(defaults: string[]): void {
    for (const pair of defaults) {
      const [choiceId, gapId] = pair.split(' ');
      if (choiceId && gapId && this.gapElements.has(gapId) && this.choiceElements.has(choiceId)) {
        this.placeChoiceInGap(gapId, choiceId);
      }
    }
  }
}
