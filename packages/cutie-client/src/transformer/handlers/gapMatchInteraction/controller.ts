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
  gapAssignments = new Map<string, string>(); // gap-id -> choice-id
  choiceUseCounts = new Map<string, number>();
  choiceMaxCounts = new Map<string, number>();
  choiceContents = new Map<string, string>();
  choiceElements = new Map<string, HTMLElement>();
  gapElements = new Map<string, HTMLElement>();
  choicesContainer: HTMLElement;
  private context: TransformContext;
  container: HTMLElement;
  private enabled = true;
  private choiceMatchGroups = new Map<string, Set<string>>(); // choice-id -> set of group names
  private gapMatchGroups = new Map<string, Set<string>>(); // gap-id -> set of group names
  private documentClickHandler: (e: MouseEvent) => void;
  private maxAssociations: number;

  constructor(
    responseIdentifier: string,
    choicesContainer: HTMLElement,
    context: TransformContext,
    container: HTMLElement,
    maxAssociations: number = 0
  ) {
    this.responseIdentifier = responseIdentifier;
    this.choicesContainer = choicesContainer;
    this.context = context;
    this.container = container;
    this.maxAssociations = maxAssociations;

    // Wire up the choices container as a drop target for returning choices
    this.wireChoicesContainerEvents();

    // Wire up document click to deselect when clicking outside valid targets
    this.documentClickHandler = (e: MouseEvent) => {
      if (!this.enabled || !this.selectedChoice) return;

      const target = e.target as HTMLElement;

      // Check if click is on a valid target (choice, gap, or choices container)
      const isChoice = target.closest('.cutie-gap-text');
      const isGap = target.closest('.cutie-gap');
      const isChoicesContainer = target === this.choicesContainer;

      // If click is outside all valid targets, deselect
      if (!isChoice && !isGap && !isChoicesContainer) {
        this.clearSelection();
      }
    };
    document.addEventListener('click', this.documentClickHandler);
    this.context.onCleanup?.(() => {
      document.removeEventListener('click', this.documentClickHandler);
    });
  }

  /**
   * Wire up the choices container to accept drops (return to word bank)
   */
  private wireChoicesContainerEvents(): void {
    this.choicesContainer.addEventListener('dragover', (e) => {
      if (!this.enabled) return;
      // Only accept drops from filled gaps
      e.preventDefault();
      this.choicesContainer.classList.add('cutie-gap-match-choices--drag-over');
    });

    this.choicesContainer.addEventListener('dragleave', (e) => {
      // Only remove class if we're actually leaving the container
      if (!this.choicesContainer.contains(e.relatedTarget as Node)) {
        this.choicesContainer.classList.remove('cutie-gap-match-choices--drag-over');
      }
    });

    this.choicesContainer.addEventListener('drop', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      this.choicesContainer.classList.remove('cutie-gap-match-choices--drag-over');

      const data = e.dataTransfer?.getData('text/plain');
      if (data?.startsWith('gap:')) {
        // Dropping from a gap back to word bank
        const gapId = data.slice(4);
        this.removeChoiceFromGap(gapId);
      }
    });

    // Click on word bank area (not on a choice) to return a selected choice
    this.choicesContainer.addEventListener('click', (e) => {
      if (!this.enabled) return;
      // Only handle clicks directly on the container, not on choices
      if (e.target === this.choicesContainer && this.selectedChoice && this.selectedFromGap) {
        this.removeChoiceFromGap(this.selectedFromGap);
        this.clearSelection();
      }
    });
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
        focusNext(this.choiceElements, choiceId);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        focusPrev(this.choiceElements, choiceId);
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
      this.choicesContainer.classList.add('cutie-gap-match-choices--drop-target');
    });

    element.addEventListener('dragend', () => {
      element.classList.remove('cutie-gap--dragging');
      clearDropTargetHighlights(this.gapElements.values(), 'cutie-gap--drop-target');
      this.choicesContainer.classList.remove('cutie-gap-match-choices--drop-target');
      this.choicesContainer.classList.remove('cutie-gap-match-choices--drag-over');
    });

    // Drag over - accept drops
    element.addEventListener('dragover', (e) => {
      if (!this.enabled) return;

      const data = e.dataTransfer?.types.includes('text/plain');
      if (!data) return;

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

    // Show word bank as drop target when moving from a gap
    if (fromGapId) {
      this.choicesContainer.classList.add('cutie-gap-match-choices--drop-target');
    }

    // Make gaps focusable when a choice is selected
    for (const gapElement of this.gapElements.values()) {
      gapElement.setAttribute('tabindex', '0');
    }

    const content = this.choiceContents.get(choiceId) ?? '';
    if (fromGapId) {
      announce(this.context,`${content} picked up from gap. Click on another gap to move it, or click the word bank to return it.`);
    } else {
      announce(this.context,`${content} selected. Click or press Enter on a gap to place it.`);
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
      this.choicesContainer.classList.remove('cutie-gap-match-choices--drop-target');

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
        element.setAttribute('tabindex', element === this.choiceElements.values().next().value ? '0' : '-1');
        element.setAttribute('draggable', this.isChoiceExhausted(choiceId) ? 'false' : 'true');
      } else {
        element.setAttribute('disabled', '');
        element.setAttribute('tabindex', '-1');
        element.setAttribute('draggable', 'false');
      }
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
