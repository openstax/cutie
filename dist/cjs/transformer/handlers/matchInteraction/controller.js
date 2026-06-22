"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchController = void 0;
const utils_1 = require("../../../utils");
/**
 * Controller for managing match interaction state and behavior.
 * Handles click-to-connect, drag-and-drop, and keyboard interactions.
 */
class MatchController {
    constructor(responseIdentifier, context, container, maxAssociations = 0) {
        var _a, _b;
        // State
        this.associations = new Set(); // "sourceId targetId" pairs
        // Unified selection state: selecting a choice or chip is the same thing
        // The only difference is whether there's an existing association to remove first
        this.selection = null;
        this.enabled = true;
        // Choice data - unified storage
        this.choices = new Map();
        this.sourceIds = [];
        this.targetIds = [];
        // Track pending chip drag for drop-outside-to-remove behavior
        this.pendingChipDrag = null;
        this.responseIdentifier = responseIdentifier;
        this.context = context;
        this.container = container;
        this.maxAssociations = maxAssociations;
        // Document click handler to clear selection when clicking outside
        this.documentClickHandler = (e) => {
            if (!this.enabled || !this.selection)
                return;
            const target = e.target;
            const isChoice = target.closest('.cutie-match-choice');
            const isChip = target.closest('.cutie-match-chip');
            if (!isChoice && !isChip) {
                this.clearSelection();
            }
        };
        document.addEventListener('click', this.documentClickHandler);
        (_b = (_a = this.context).onCleanup) === null || _b === void 0 ? void 0 : _b.call(_a, () => {
            document.removeEventListener('click', this.documentClickHandler);
        });
    }
    /**
     * Initialize the controller after all choices are registered.
     */
    initialize(_sourceSetElement, _targetSetElement) {
        // Currently no initialization needed after choices are registered.
        // Set elements are tracked via individual choice registrations.
    }
    /**
     * Register a choice with the controller.
     */
    registerChoice(id, set, element, matchMax, content) {
        const choiceData = { id, set, element, matchMax, content, connectedIds: new Set() };
        this.choices.set(id, choiceData);
        (set === 'source' ? this.sourceIds : this.targetIds).push(id);
        this.wireChoiceEvents(choiceData);
    }
    /**
     * Wire up event listeners for a choice element.
     */
    wireChoiceEvents(choice) {
        const { id, set, element } = choice;
        // Click to select/connect
        element.addEventListener('click', (e) => {
            if (!this.enabled)
                return;
            // Ignore clicks on chips
            if (e.target.closest('.cutie-match-chip'))
                return;
            this.handleChoiceClick(id);
        });
        // Keyboard navigation
        element.addEventListener('keydown', (e) => {
            if (!this.enabled)
                return;
            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    this.handleChoiceClick(id);
                    break;
                case 'ArrowDown':
                case 'ArrowRight':
                    e.preventDefault();
                    (0, utils_1.focusNext)(this.getChoiceElementsInSet(set), id);
                    break;
                case 'ArrowUp':
                case 'ArrowLeft':
                    e.preventDefault();
                    (0, utils_1.focusPrev)(this.getChoiceElementsInSet(set), id);
                    break;
                case 'Tab': {
                    // Handle set switching on Tab
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
            var _a;
            if (!this.enabled)
                return;
            if (this.isChoiceExhausted(id)) {
                e.preventDefault();
                return;
            }
            // Select the choice (highlights valid drop targets)
            this.select(id);
            (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData('text/plain', `${set}:${id}`);
            element.classList.add('cutie-match-choice--dragging');
        });
        element.addEventListener('dragend', () => {
            element.classList.remove('cutie-match-choice--dragging');
            this.clearSelection();
        });
        // Drop target
        element.addEventListener('dragover', (e) => {
            var _a;
            if (!this.enabled)
                return;
            const data = (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.types.includes('text/plain');
            if (!data)
                return;
            e.preventDefault();
            element.classList.add('cutie-match-choice--drag-over');
        });
        element.addEventListener('dragleave', () => {
            element.classList.remove('cutie-match-choice--drag-over');
        });
        element.addEventListener('drop', (e) => {
            if (!this.enabled)
                return;
            e.preventDefault();
            element.classList.remove('cutie-match-choice--drag-over');
            // Selection is already set up by dragstart - let handleChoiceClick complete the action
            if (!this.selection)
                return;
            // For chip drags, mark as handled so dragend doesn't remove the association
            this.pendingChipDrag = null;
            this.handleChoiceClick(id);
        });
    }
    /**
     * Handle click on a choice.
     */
    handleChoiceClick(choiceId) {
        const choice = this.choices.get(choiceId);
        if (!choice)
            return;
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
                    }
                    else {
                        // Clicked on a different item - move the association
                        this.removeAssociation(existingAssociation.sourceId, existingAssociation.targetId);
                        const newSourceId = originSet === 'source' ? originId : choiceId;
                        const newTargetId = originSet === 'source' ? choiceId : originId;
                        // Use canAcceptAssociation since the origin is being freed
                        if (this.canAcceptAssociation(choiceId)) {
                            this.createAssociation(newSourceId, newTargetId);
                        }
                    }
                }
                else {
                    // No existing association - create new
                    const sourceId = originSet === 'source' ? originId : choiceId;
                    const targetId = originSet === 'source' ? choiceId : originId;
                    if (this.canCreateAssociation(sourceId, targetId)) {
                        this.createAssociation(sourceId, targetId);
                    }
                }
                this.clearSelection();
                return;
            }
            else {
                // Clicked on same set - clear selection and continue to potentially select the new choice
                this.clearSelection();
            }
        }
        if (this.isChoiceExhausted(choiceId))
            return;
        // Select this choice (no existing association)
        this.select(choiceId);
    }
    /**
     * Unified selection: select a choice (optionally with an existing association to replace).
     */
    select(originId, existingAssociation, chipElement) {
        this.clearSelection();
        const choice = this.choices.get(originId);
        if (!choice)
            return;
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
        (0, utils_1.highlightDropTargets)(this.getChoiceElementsArray(oppositeSet), 'cutie-match-choice--drop-target', (el) => {
            const elId = el.getAttribute('data-identifier');
            if (!elId)
                return false;
            // Don't highlight the current connected item (clicking it just clears selection now)
            if (elId === connectedId)
                return false;
            // For a move operation, we need to check if the new partner can accept
            // (the original choice's count will be freed when we remove the old association)
            if (existingAssociation) {
                return this.canAcceptAssociation(elId);
            }
            // For a fresh selection, check full association validity
            const sourceId = choice.set === 'source' ? originId : elId;
            const targetId = choice.set === 'source' ? elId : originId;
            return this.canCreateAssociation(sourceId, targetId);
        });
        if (existingAssociation) {
            (0, utils_1.announce)(this.context, `${choice.content} selected. Click again or press backspace to remove. Click another item to move.`);
        }
        else {
            (0, utils_1.announce)(this.context, `${choice.content} selected. Choose an item from the other set to create an association.`);
        }
    }
    /**
     * Clear the current selection.
     */
    clearSelection() {
        if (this.selection) {
            const choice = this.choices.get(this.selection.originId);
            if (choice) {
                choice.element.classList.remove('cutie-match-choice--selected');
                choice.element.setAttribute('aria-selected', 'false');
            }
            this.selection = null;
        }
        // Clear all chip highlight styling
        const allChips = this.container.querySelectorAll('.cutie-match-chip--selected');
        for (const chip of allChips) {
            chip.classList.remove('cutie-match-chip--selected');
        }
        (0, utils_1.clearDropTargetHighlights)(this.getAllChoiceElements(), 'cutie-match-choice--drop-target');
    }
    /**
     * Check if an association can be created.
     */
    canCreateAssociation(sourceId, targetId) {
        const key = `${sourceId} ${targetId}`;
        // Check if association already exists
        if (this.associations.has(key))
            return false;
        // Check max-associations
        if (this.maxAssociations > 0 && this.associations.size >= this.maxAssociations) {
            return false;
        }
        // Check match-max for source
        const sourceChoice = this.choices.get(sourceId);
        if (sourceChoice && sourceChoice.matchMax > 0) {
            if (sourceChoice.connectedIds.size >= sourceChoice.matchMax)
                return false;
        }
        // Check match-max for target
        const targetChoice = this.choices.get(targetId);
        if (targetChoice && targetChoice.matchMax > 0) {
            if (targetChoice.connectedIds.size >= targetChoice.matchMax)
                return false;
        }
        return true;
    }
    /**
     * Check if a choice can accept a new association (used when moving).
     * Only checks the choice's own matchMax, not the partner's (partner will be freed).
     */
    canAcceptAssociation(choiceId) {
        const choice = this.choices.get(choiceId);
        if (!choice || choice.matchMax === 0)
            return true;
        return choice.connectedIds.size < choice.matchMax;
    }
    /**
     * Create an association between a source and target choice.
     */
    createAssociation(sourceId, targetId) {
        const key = `${sourceId} ${targetId}`;
        if (this.associations.has(key))
            return false;
        // Verify we can create this association
        if (!this.canCreateAssociation(sourceId, targetId)) {
            return false;
        }
        this.associations.add(key);
        // Update connectedIds on both choices
        const sourceChoice = this.choices.get(sourceId);
        const targetChoice = this.choices.get(targetId);
        sourceChoice === null || sourceChoice === void 0 ? void 0 : sourceChoice.connectedIds.add(targetId);
        targetChoice === null || targetChoice === void 0 ? void 0 : targetChoice.connectedIds.add(sourceId);
        // Update chips on both sides
        this.updateChips(sourceId);
        this.updateChips(targetId);
        // Update exhaustion state
        this.updateExhaustionState(sourceId);
        this.updateExhaustionState(targetId);
        if (sourceChoice && targetChoice) {
            (0, utils_1.announce)(this.context, `${sourceChoice.content} connected to ${targetChoice.content}.`);
        }
        return true;
    }
    /**
     * Remove an association.
     */
    removeAssociation(sourceId, targetId) {
        const key = `${sourceId} ${targetId}`;
        if (!this.associations.has(key))
            return;
        this.associations.delete(key);
        // Update connectedIds on both choices
        const sourceChoice = this.choices.get(sourceId);
        const targetChoice = this.choices.get(targetId);
        sourceChoice === null || sourceChoice === void 0 ? void 0 : sourceChoice.connectedIds.delete(targetId);
        targetChoice === null || targetChoice === void 0 ? void 0 : targetChoice.connectedIds.delete(sourceId);
        // Update chips on both sides
        this.updateChips(sourceId);
        this.updateChips(targetId);
        // Update exhaustion state
        this.updateExhaustionState(sourceId);
        this.updateExhaustionState(targetId);
        if (sourceChoice && targetChoice) {
            (0, utils_1.announce)(this.context, `Connection between ${sourceChoice.content} and ${targetChoice.content} removed.`);
        }
    }
    /**
     * Update chips displayed for a choice element.
     * Chips are now siblings of the choice (in the wrapper), not children.
     */
    updateChips(choiceId) {
        const choice = this.choices.get(choiceId);
        if (!choice)
            return;
        // Chips container is a sibling in the wrapper, not inside the choice element
        const wrapper = choice.element.parentElement;
        const chipsContainer = wrapper === null || wrapper === void 0 ? void 0 : wrapper.querySelector('.cutie-match-choice-chips');
        if (!chipsContainer)
            return;
        // Clear existing chips
        chipsContainer.innerHTML = '';
        // Use connectedIds directly from the choice
        for (const connectedId of choice.connectedIds) {
            const connectedChoice = this.choices.get(connectedId);
            if (!connectedChoice)
                continue;
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
                var _a, _b, _c, _d;
                e.stopPropagation();
                if (!this.enabled)
                    return;
                if (((_b = (_a = this.selection) === null || _a === void 0 ? void 0 : _a.existingAssociation) === null || _b === void 0 ? void 0 : _b.sourceId) === sourceId
                    && ((_d = (_c = this.selection) === null || _c === void 0 ? void 0 : _c.existingAssociation) === null || _d === void 0 ? void 0 : _d.targetId) === targetId) {
                    this.clearSelection();
                    this.removeAssociation(sourceId, targetId);
                    choice.element.focus();
                    return;
                }
                this.select(connectedId, existingAssociation, chip);
            });
            // Keyboard support for chip
            chip.addEventListener('keydown', (e) => {
                var _a, _b, _c, _d;
                if (!this.enabled)
                    return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    // Tap-again-to-remove: if this chip's association is already selected, remove it
                    if (((_b = (_a = this.selection) === null || _a === void 0 ? void 0 : _a.existingAssociation) === null || _b === void 0 ? void 0 : _b.sourceId) === sourceId
                        && ((_d = (_c = this.selection) === null || _c === void 0 ? void 0 : _c.existingAssociation) === null || _d === void 0 ? void 0 : _d.targetId) === targetId) {
                        this.clearSelection();
                        this.removeAssociation(sourceId, targetId);
                        choice.element.focus();
                        return;
                    }
                    this.select(connectedId, existingAssociation, chip);
                }
                else if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.removeAssociation(sourceId, targetId);
                    // Return focus to the choice element
                    choice.element.focus();
                }
                else if (e.key === 'Escape') {
                    this.clearSelection();
                    choice.element.focus();
                }
            });
            // Drag support - select the chip and set up drag data
            chip.addEventListener('dragstart', (e) => {
                var _a;
                if (!this.enabled) {
                    e.preventDefault();
                    return;
                }
                // Select the chip (highlights valid drop targets)
                this.select(connectedId, existingAssociation, chip);
                // Track this drag so we can remove the association if dropped outside
                this.pendingChipDrag = { sourceId, targetId };
                (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData('text/plain', `chip:${sourceId}:${targetId}:${connectedSet}`);
                e.dataTransfer.effectAllowed = 'move';
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
            chipsContainer.appendChild(chip);
        }
    }
    /**
     * Check if a choice has reached its match-max limit.
     */
    isChoiceExhausted(choiceId) {
        return !this.canAcceptAssociation(choiceId);
    }
    /**
     * Update the visual exhaustion state of a choice.
     */
    updateExhaustionState(choiceId) {
        const choice = this.choices.get(choiceId);
        if (!choice)
            return;
        if (this.isChoiceExhausted(choiceId)) {
            choice.element.classList.add('cutie-match-choice--exhausted');
            choice.element.setAttribute('aria-disabled', 'true');
            choice.element.setAttribute('draggable', 'false');
        }
        else {
            choice.element.classList.remove('cutie-match-choice--exhausted');
            choice.element.setAttribute('aria-disabled', 'false');
            choice.element.setAttribute('draggable', 'true');
        }
    }
    /**
     * Focus the first choice in a set and update roving tabindex.
     * Returns true if focus was moved, false if the set is empty.
     */
    focusFirstInSet(set) {
        const ids = set === 'source' ? this.sourceIds : this.targetIds;
        const firstChoice = ids[0] ? this.choices.get(ids[0]) : undefined;
        if (firstChoice) {
            (0, utils_1.updateRovingTabindex)(this.getChoiceElementsInSet(set), firstChoice.element);
            firstChoice.element.focus();
            return true;
        }
        return false;
    }
    /**
     * Get choice elements for a set (for roving tabindex navigation).
     */
    getChoiceElementsInSet(set) {
        const ids = set === 'source' ? this.sourceIds : this.targetIds;
        const map = new Map();
        for (const id of ids) {
            const choice = this.choices.get(id);
            if (choice)
                map.set(id, choice.element);
        }
        return map;
    }
    /**
     * Get all choice elements in a set as an array.
     */
    getChoiceElementsArray(set) {
        const ids = set === 'source' ? this.sourceIds : this.targetIds;
        const elements = [];
        for (const id of ids) {
            const choice = this.choices.get(id);
            if (choice)
                elements.push(choice.element);
        }
        return elements;
    }
    /**
     * Get all choice elements from both sets.
     */
    getAllChoiceElements() {
        return [...this.getChoiceElementsArray('source'), ...this.getChoiceElementsArray('target')];
    }
    /**
     * Enable or disable the interaction.
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled) {
            this.container.classList.remove('cutie-match-interaction--disabled');
        }
        else {
            this.container.classList.add('cutie-match-interaction--disabled');
            this.clearSelection();
        }
        // Update all choice elements
        for (const choice of this.choices.values()) {
            if (enabled) {
                choice.element.removeAttribute('disabled');
                if (!this.isChoiceExhausted(choice.id)) {
                    choice.element.setAttribute('draggable', 'true');
                }
            }
            else {
                choice.element.setAttribute('disabled', '');
                choice.element.setAttribute('draggable', 'false');
            }
        }
    }
    /**
     * Get the current response as an array of directed pairs.
     */
    getResponse() {
        return Array.from(this.associations);
    }
    /**
     * Initialize from default values.
     */
    initializeFromDefaults(defaults) {
        for (const pair of defaults) {
            const [sourceId, targetId] = pair.split(' ');
            if (sourceId && targetId) {
                this.createAssociation(sourceId, targetId);
            }
        }
    }
}
exports.MatchController = MatchController;
