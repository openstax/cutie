import {
  announce,
  clearDropTargetHighlights,
  focusNext,
  focusPrev,
  highlightDropTargets,
  updateRovingTabindex,
} from '../../../utils';

interface ChoiceData {
  id: string;
  set: 'source' | 'target';
  element: HTMLElement;
  matchMax: number;
  content: string;
}

/**
 * Controller for managing match interaction state and behavior.
 * Handles click-to-connect, drag-and-drop, and keyboard interactions.
 */
export class MatchController {
  readonly responseIdentifier: string;
  private liveRegion: HTMLElement;
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

  // Choice data
  private sourceChoices = new Map<string, ChoiceData>();
  private targetChoices = new Map<string, ChoiceData>();
  private choiceUseCounts = new Map<string, number>();

  // Track pending chip drag for drop-outside-to-remove behavior
  private pendingChipDrag: { sourceId: string; targetId: string } | null = null;

  // Document click handler reference for cleanup
  private documentClickHandler: (e: MouseEvent) => void;

  constructor(
    responseIdentifier: string,
    liveRegion: HTMLElement,
    container: HTMLElement,
    maxAssociations: number = 0
  ) {
    this.responseIdentifier = responseIdentifier;
    this.liveRegion = liveRegion;
    this.container = container;
    this.maxAssociations = maxAssociations;

    // Document click handler to clear selection when clicking outside
    this.documentClickHandler = (e: MouseEvent) => {
      if (!this.enabled || !this.selection) return;

      const target = e.target as HTMLElement;
      const isChoice = target.closest('.qti-match-choice');
      const isChip = target.closest('.qti-match-chip');

      if (!isChoice && !isChip) {
        this.clearSelection();
      }
    };
    document.addEventListener('click', this.documentClickHandler);
  }

  /**
   * Initialize the controller after all choices are registered.
   */
  initialize(_sourceSetElement: HTMLElement, _targetSetElement: HTMLElement): void {
    // Currently no initialization needed after choices are registered.
    // Set elements are tracked via individual choice registrations.
  }

  /**
   * Register a choice with the controller.
   */
  registerChoice(
    id: string,
    set: 'source' | 'target',
    element: HTMLElement,
    matchMax: number,
    content: string
  ): void {
    const choiceData: ChoiceData = { id, set, element, matchMax, content };

    if (set === 'source') {
      this.sourceChoices.set(id, choiceData);
    } else {
      this.targetChoices.set(id, choiceData);
    }

    this.choiceUseCounts.set(id, 0);
    this.wireChoiceEvents(choiceData);
  }

  /**
   * Wire up event listeners for a choice element.
   */
  private wireChoiceEvents(choice: ChoiceData): void {
    const { id, set, element } = choice;

    // Click to select/connect
    element.addEventListener('click', (e) => {
      if (!this.enabled) return;
      // Ignore clicks on chips
      if ((e.target as HTMLElement).closest('.qti-match-chip')) return;

      this.handleChoiceClick(id, set);
    });

    // Keyboard navigation
    element.addEventListener('keydown', (e) => {
      if (!this.enabled) return;

      const choices = set === 'source' ? this.sourceChoices : this.targetChoices;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.handleChoiceClick(id, set);
          break;

        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          focusNext(this.getElementMap(choices), id);
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          focusPrev(this.getElementMap(choices), id);
          break;

        case 'Tab':
          // Allow default tab behavior but handle set switching
          if (!e.shiftKey && set === 'source') {
            // Focus first item in target set
            const firstTarget = this.targetChoices.values().next().value;
            if (firstTarget) {
              e.preventDefault();
              updateRovingTabindex(this.getElementMap(this.targetChoices), firstTarget.element);
              firstTarget.element.focus();
            }
          } else if (e.shiftKey && set === 'target') {
            // Focus first item in source set
            const firstSource = this.sourceChoices.values().next().value;
            if (firstSource) {
              e.preventDefault();
              updateRovingTabindex(this.getElementMap(this.sourceChoices), firstSource.element);
              firstSource.element.focus();
            }
          }
          break;

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

      e.dataTransfer?.setData('text/plain', `${set}:${id}`);
      element.classList.add('qti-match-choice--dragging');

      // Highlight valid drop targets (opposite set)
      const targetSet = set === 'source' ? this.targetChoices : this.sourceChoices;
      highlightDropTargets(
        this.getElements(targetSet),
        'qti-match-choice--drop-target',
        (el) => {
          const targetId = el.getAttribute('data-identifier');
          return targetId ? this.canCreateAssociation(id, targetId, set) : false;
        }
      );
    });

    element.addEventListener('dragend', () => {
      element.classList.remove('qti-match-choice--dragging');
      clearDropTargetHighlights(
        [...this.getElements(this.sourceChoices), ...this.getElements(this.targetChoices)],
        'qti-match-choice--drop-target'
      );
    });

    // Drop target
    element.addEventListener('dragover', (e) => {
      if (!this.enabled) return;

      const data = e.dataTransfer?.types.includes('text/plain');
      if (!data) return;

      e.preventDefault();
      element.classList.add('qti-match-choice--drag-over');
    });

    element.addEventListener('dragleave', () => {
      element.classList.remove('qti-match-choice--drag-over');
    });

    element.addEventListener('drop', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      element.classList.remove('qti-match-choice--drag-over');

      const data = e.dataTransfer?.getData('text/plain');
      if (!data) return;

      // Handle chip drops (for moving associations)
      if (data.startsWith('chip:')) {
        // Mark the chip drag as handled so dragend doesn't remove the association
        this.pendingChipDrag = null;

        const parts = data.split(':');
        const chipSourceId = parts[1];
        const chipTargetId = parts[2];
        // chipFromSet is what the chip REPRESENTS (connectedSet), not where it lives
        const chipFromSet = parts[3] as 'source' | 'target';

        // Chip can only be dropped on the opposite set from what it represents
        if (chipFromSet === set) return;

        // The chip's old parent was in the opposite set from what it represents
        const oldParentId = chipFromSet === 'source' ? chipTargetId : chipSourceId;

        if (id === oldParentId) {
          // Dropped on the same parent - do nothing (keep the association as is)
          return;
        }

        // Dropped on a different choice - move the association
        this.removeAssociation(chipSourceId, chipTargetId);

        // Create new association: connectedId stays, parent changes to drop target
        const connectedId = chipFromSet === 'source' ? chipSourceId : chipTargetId;
        const newSourceId = chipFromSet === 'source' ? connectedId : id;
        const newTargetId = chipFromSet === 'source' ? id : connectedId;

        // Use canAcceptAssociation since the origin is being freed
        if (this.canAcceptAssociation(id, set)) {
          this.createAssociation(newSourceId, newTargetId);
        }
        return;
      }

      const [draggedSet, draggedId] = data.split(':');

      // Only allow drops from the opposite set
      if (draggedSet === set) return;

      const sourceId = draggedSet === 'source' ? draggedId : id;
      const targetId = draggedSet === 'source' ? id : draggedId;

      if (this.canCreateAssociation(sourceId, targetId, 'source')) {
        this.createAssociation(sourceId, targetId);
      }
    });
  }

  /**
   * Handle click on a choice.
   */
  private handleChoiceClick(id: string, set: 'source' | 'target'): void {
    // Unified handling for both choice and chip selection
    if (this.selection) {
      const { originId, originSet, existingAssociation } = this.selection;
      const oppositeSet = originSet === 'source' ? 'target' : 'source';

      if (set === oppositeSet) {
        // Clicked on the opposite set - create (or move) association
        if (existingAssociation) {
          const oldConnectedId = originSet === 'source'
            ? existingAssociation.targetId
            : existingAssociation.sourceId;

          if (id === oldConnectedId) {
            // Clicked on the same connected item - just clear selection (do nothing)
            this.clearSelection();
            return;
          } else {
            // Clicked on a different item - move the association
            this.removeAssociation(existingAssociation.sourceId, existingAssociation.targetId);

            const newSourceId = originSet === 'source' ? originId : id;
            const newTargetId = originSet === 'source' ? id : originId;

            // Use canAcceptAssociation since the origin is being freed
            if (this.canAcceptAssociation(id, set)) {
              this.createAssociation(newSourceId, newTargetId);
            }
          }
        } else {
          // No existing association - create new
          const sourceId = originSet === 'source' ? originId : id;
          const targetId = originSet === 'source' ? id : originId;

          if (this.canCreateAssociation(sourceId, targetId, originSet)) {
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

    if (this.isChoiceExhausted(id)) return;

    // Select this choice (no existing association)
    this.select(id, set);
  }

  /**
   * Unified selection: select a choice (optionally with an existing association to replace).
   */
  private select(
    originId: string,
    originSet: 'source' | 'target',
    existingAssociation?: { sourceId: string; targetId: string },
    chipElement?: HTMLElement
  ): void {
    this.clearSelection();

    this.selection = { originId, originSet, existingAssociation };

    const choices = originSet === 'source' ? this.sourceChoices : this.targetChoices;
    const choice = choices.get(originId);

    if (choice) {
      choice.element.classList.add('qti-match-choice--selected');

      // If selecting via chip, also highlight the chip
      if (chipElement) {
        chipElement.classList.add('qti-match-chip--selected');
      }

      // Highlight valid targets in the opposite set
      const oppositeSet = originSet === 'source' ? this.targetChoices : this.sourceChoices;
      const connectedId = existingAssociation
        ? (originSet === 'source' ? existingAssociation.targetId : existingAssociation.sourceId)
        : null;

      highlightDropTargets(
        this.getElements(oppositeSet),
        'qti-match-choice--drop-target',
        (el) => {
          const elId = el.getAttribute('data-identifier');
          if (!elId) return false;

          // Don't highlight the current connected item (clicking it just clears selection now)
          if (elId === connectedId) return false;

          // For a move operation, we need to check if the new partner can accept
          // (the original choice's count will be freed when we remove the old association)
          if (existingAssociation) {
            return this.canAcceptAssociation(elId, originSet === 'source' ? 'target' : 'source');
          }

          // For a fresh selection, check full association validity
          const sourceId = originSet === 'source' ? originId : elId;
          const targetId = originSet === 'source' ? elId : originId;
          return this.canCreateAssociation(sourceId, targetId, originSet);
        }
      );

      if (existingAssociation) {
        announce(
          this.liveRegion,
          `${choice.content} selected. Click another item to move, or press backspace to remove.`
        );
      } else {
        announce(this.liveRegion, `${choice.content} selected. Choose an item from the other set to create an association.`);
      }
    }
  }

  /**
   * Clear the current selection.
   */
  clearSelection(): void {
    if (this.selection) {
      const choices = this.selection.originSet === 'source' ? this.sourceChoices : this.targetChoices;
      const choice = choices.get(this.selection.originId);

      if (choice) {
        choice.element.classList.remove('qti-match-choice--selected');
      }

      this.selection = null;
    }

    // Clear all chip highlight styling
    const allChips = this.container.querySelectorAll('.qti-match-chip--selected');
    for (const chip of allChips) {
      chip.classList.remove('qti-match-chip--selected');
    }

    clearDropTargetHighlights(
      [...this.getElements(this.sourceChoices), ...this.getElements(this.targetChoices)],
      'qti-match-choice--drop-target'
    );
  }

  /**
   * Check if an association can be created.
   */
  private canCreateAssociation(
    sourceId: string,
    targetId: string,
    _initiatingSet: 'source' | 'target'
  ): boolean {
    const key = `${sourceId} ${targetId}`;

    // Check if association already exists
    if (this.associations.has(key)) return false;

    // Check max-associations
    if (this.maxAssociations > 0 && this.associations.size >= this.maxAssociations) {
      return false;
    }

    // Check match-max for source
    const sourceChoice = this.sourceChoices.get(sourceId);
    if (sourceChoice && sourceChoice.matchMax > 0) {
      const sourceCount = this.choiceUseCounts.get(sourceId) ?? 0;
      if (sourceCount >= sourceChoice.matchMax) return false;
    }

    // Check match-max for target
    const targetChoice = this.targetChoices.get(targetId);
    if (targetChoice && targetChoice.matchMax > 0) {
      const targetCount = this.choiceUseCounts.get(targetId) ?? 0;
      if (targetCount >= targetChoice.matchMax) return false;
    }

    return true;
  }

  /**
   * Check if a choice can accept a new association (used when moving).
   * Only checks the choice's own matchMax, not the partner's (partner will be freed).
   */
  private canAcceptAssociation(choiceId: string, set: 'source' | 'target'): boolean {
    const choices = set === 'source' ? this.sourceChoices : this.targetChoices;
    const choice = choices.get(choiceId);

    if (!choice || choice.matchMax === 0) return true;

    const count = this.choiceUseCounts.get(choiceId) ?? 0;
    return count < choice.matchMax;
  }

  /**
   * Create an association between a source and target choice.
   */
  createAssociation(sourceId: string, targetId: string): boolean {
    const key = `${sourceId} ${targetId}`;

    if (this.associations.has(key)) return false;

    // Verify we can create this association
    if (!this.canCreateAssociation(sourceId, targetId, 'source')) {
      return false;
    }

    this.associations.add(key);

    // Update use counts
    const sourceCount = (this.choiceUseCounts.get(sourceId) ?? 0) + 1;
    const targetCount = (this.choiceUseCounts.get(targetId) ?? 0) + 1;
    this.choiceUseCounts.set(sourceId, sourceCount);
    this.choiceUseCounts.set(targetId, targetCount);

    // Update chips on both sides
    this.updateChips(sourceId, 'source');
    this.updateChips(targetId, 'target');

    // Update exhaustion state
    this.updateExhaustionState(sourceId);
    this.updateExhaustionState(targetId);

    const sourceChoice = this.sourceChoices.get(sourceId);
    const targetChoice = this.targetChoices.get(targetId);
    if (sourceChoice && targetChoice) {
      announce(this.liveRegion, `${sourceChoice.content} connected to ${targetChoice.content}.`);
    }

    return true;
  }

  /**
   * Remove an association.
   */
  removeAssociation(sourceId: string, targetId: string): void {
    const key = `${sourceId} ${targetId}`;

    if (!this.associations.has(key)) return;

    this.associations.delete(key);

    // Update use counts
    const sourceCount = Math.max(0, (this.choiceUseCounts.get(sourceId) ?? 0) - 1);
    const targetCount = Math.max(0, (this.choiceUseCounts.get(targetId) ?? 0) - 1);
    this.choiceUseCounts.set(sourceId, sourceCount);
    this.choiceUseCounts.set(targetId, targetCount);

    // Update chips on both sides
    this.updateChips(sourceId, 'source');
    this.updateChips(targetId, 'target');

    // Update exhaustion state
    this.updateExhaustionState(sourceId);
    this.updateExhaustionState(targetId);

    const sourceChoice = this.sourceChoices.get(sourceId);
    const targetChoice = this.targetChoices.get(targetId);
    if (sourceChoice && targetChoice) {
      announce(this.liveRegion, `Connection between ${sourceChoice.content} and ${targetChoice.content} removed.`);
    }
  }

  /**
   * Update chips displayed for a choice element.
   * Chips are now siblings of the choice (in the wrapper), not children.
   */
  private updateChips(choiceId: string, set: 'source' | 'target'): void {
    const choices = set === 'source' ? this.sourceChoices : this.targetChoices;
    const choice = choices.get(choiceId);
    if (!choice) return;

    // Chips container is a sibling in the wrapper, not inside the choice element
    const wrapper = choice.element.parentElement;
    const chipsContainer = wrapper?.querySelector('.qti-match-choice-chips');
    if (!chipsContainer) return;

    // Clear existing chips
    chipsContainer.innerHTML = '';

    // Find all associations involving this choice
    const connectedChoices = set === 'source'
      ? this.getTargetsForSource(choiceId)
      : this.getSourcesForTarget(choiceId);

    const otherChoices = set === 'source' ? this.targetChoices : this.sourceChoices;

    for (const connectedId of connectedChoices) {
      const connectedChoice = otherChoices.get(connectedId);
      if (!connectedChoice) continue;

      const sourceId = set === 'source' ? choiceId : connectedId;
      const targetId = set === 'source' ? connectedId : choiceId;
      const existingAssociation = { sourceId, targetId };

      // The chip represents connectedId (from the opposite set)
      const connectedSet: 'source' | 'target' = set === 'source' ? 'target' : 'source';

      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'qti-match-chip';
      chip.setAttribute('data-source-id', sourceId);
      chip.setAttribute('data-target-id', targetId);
      chip.setAttribute('data-connected-id', connectedId);
      chip.setAttribute('draggable', 'true');
      chip.setAttribute('aria-label', `${connectedChoice.content}. Click to select, then click the connected item or press backspace to remove.`);
      chip.textContent = connectedChoice.content;

      // Click to select chip - selecting the chip means selecting what it represents (connectedId)
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this.enabled) return;

        this.select(connectedId, connectedSet, existingAssociation, chip);
      });

      // Keyboard support for chip
      chip.addEventListener('keydown', (e) => {
        if (!this.enabled) return;

        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          this.select(connectedId, connectedSet, existingAssociation, chip);
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

      // Drag support - drag chip to move or remove association
      // The chip represents connectedId, so we highlight the SAME set as the parent (where chip can be moved to)
      chip.addEventListener('dragstart', (e) => {
        if (!this.enabled) {
          e.preventDefault();
          return;
        }

        // Track this drag so we can remove the association if dropped outside
        this.pendingChipDrag = { sourceId, targetId };

        e.dataTransfer?.setData('text/plain', `chip:${sourceId}:${targetId}:${connectedSet}`);
        e.dataTransfer!.effectAllowed = 'move';
        chip.classList.add('qti-match-chip--dragging');

        // Highlight valid drop targets - the SAME set as the parent choice (where chip can be moved to)
        // Don't highlight the current parent (dropping there does nothing)
        const dropTargetSet = set === 'source' ? this.sourceChoices : this.targetChoices;

        highlightDropTargets(
          this.getElements(dropTargetSet),
          'qti-match-choice--drop-target',
          (el) => {
            const elId = el.getAttribute('data-identifier');
            if (!elId) return false;

            // Don't highlight the current parent (dropping there does nothing)
            if (elId === choiceId) return false;

            // Check if the new choice can accept this association
            return this.canAcceptAssociation(elId, set);
          }
        );
      });

      chip.addEventListener('dragend', () => {
        chip.classList.remove('qti-match-chip--dragging');

        // Clear highlights
        clearDropTargetHighlights(
          [...this.getElements(this.sourceChoices), ...this.getElements(this.targetChoices)],
          'qti-match-choice--drop-target'
        );

        // If pendingChipDrag is still set, the drop wasn't handled - remove the association
        if (this.pendingChipDrag) {
          const { sourceId: pendingSourceId, targetId: pendingTargetId } = this.pendingChipDrag;
          this.pendingChipDrag = null;
          this.removeAssociation(pendingSourceId, pendingTargetId);
        }
      });

      chipsContainer.appendChild(chip);
    }
  }

  /**
   * Get all target IDs associated with a source.
   */
  private getTargetsForSource(sourceId: string): string[] {
    const targets: string[] = [];
    for (const key of this.associations) {
      const [src, tgt] = key.split(' ');
      if (src === sourceId) {
        targets.push(tgt);
      }
    }
    return targets;
  }

  /**
   * Get all source IDs associated with a target.
   */
  private getSourcesForTarget(targetId: string): string[] {
    const sources: string[] = [];
    for (const key of this.associations) {
      const [src, tgt] = key.split(' ');
      if (tgt === targetId) {
        sources.push(src);
      }
    }
    return sources;
  }

  /**
   * Check if a choice has reached its match-max limit.
   */
  private isChoiceExhausted(choiceId: string): boolean {
    const sourceChoice = this.sourceChoices.get(choiceId);
    const targetChoice = this.targetChoices.get(choiceId);
    const choice = sourceChoice ?? targetChoice;

    if (!choice || choice.matchMax === 0) return false;

    const count = this.choiceUseCounts.get(choiceId) ?? 0;
    return count >= choice.matchMax;
  }

  /**
   * Update the visual exhaustion state of a choice.
   */
  private updateExhaustionState(choiceId: string): void {
    const sourceChoice = this.sourceChoices.get(choiceId);
    const targetChoice = this.targetChoices.get(choiceId);
    const choice = sourceChoice ?? targetChoice;

    if (!choice) return;

    if (this.isChoiceExhausted(choiceId)) {
      choice.element.classList.add('qti-match-choice--exhausted');
      choice.element.setAttribute('aria-disabled', 'true');
      choice.element.setAttribute('draggable', 'false');
    } else {
      choice.element.classList.remove('qti-match-choice--exhausted');
      choice.element.setAttribute('aria-disabled', 'false');
      choice.element.setAttribute('draggable', 'true');
    }
  }

  /**
   * Get element map from choice map.
   */
  private getElementMap(choices: Map<string, ChoiceData>): Map<string, HTMLElement> {
    const map = new Map<string, HTMLElement>();
    for (const [id, choice] of choices) {
      map.set(id, choice.element);
    }
    return map;
  }

  /**
   * Get elements from choice map.
   */
  private getElements(choices: Map<string, ChoiceData>): HTMLElement[] {
    return Array.from(choices.values()).map((c) => c.element);
  }

  /**
   * Enable or disable the interaction.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (enabled) {
      this.container.classList.remove('qti-match-interaction--disabled');
    } else {
      this.container.classList.add('qti-match-interaction--disabled');
      this.clearSelection();
    }

    // Update all choice elements
    const allChoices = [...this.sourceChoices.values(), ...this.targetChoices.values()];
    for (const choice of allChoices) {
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
      if (sourceId && targetId) {
        this.createAssociation(sourceId, targetId);
      }
    }
  }
}
