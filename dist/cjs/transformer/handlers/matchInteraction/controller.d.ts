import type { TransformContext } from '../../types';
/**
 * Controller for managing match interaction state and behavior.
 * Handles click-to-connect, drag-and-drop, and keyboard interactions.
 */
export declare class MatchController {
    readonly responseIdentifier: string;
    private context;
    private container;
    private maxAssociations;
    private associations;
    private selection;
    private enabled;
    private choices;
    private sourceIds;
    private targetIds;
    private pendingChipDrag;
    private documentClickHandler;
    constructor(responseIdentifier: string, context: TransformContext, container: HTMLElement, maxAssociations?: number);
    /**
     * Initialize the controller after all choices are registered.
     */
    initialize(_sourceSetElement: HTMLElement, _targetSetElement: HTMLElement): void;
    /**
     * Register a choice with the controller.
     */
    registerChoice(id: string, set: 'source' | 'target', element: HTMLElement, matchMax: number, content: string): void;
    /**
     * Wire up event listeners for a choice element.
     */
    private wireChoiceEvents;
    /**
     * Handle click on a choice.
     */
    private handleChoiceClick;
    /**
     * Unified selection: select a choice (optionally with an existing association to replace).
     */
    private select;
    /**
     * Clear the current selection.
     */
    clearSelection(): void;
    /**
     * Check if an association can be created.
     */
    private canCreateAssociation;
    /**
     * Check if a choice can accept a new association (used when moving).
     * Only checks the choice's own matchMax, not the partner's (partner will be freed).
     */
    private canAcceptAssociation;
    /**
     * Create an association between a source and target choice.
     */
    createAssociation(sourceId: string, targetId: string): boolean;
    /**
     * Remove an association.
     */
    removeAssociation(sourceId: string, targetId: string): void;
    /**
     * Update chips displayed for a choice element.
     * Chips are now siblings of the choice (in the wrapper), not children.
     */
    private updateChips;
    /**
     * Check if a choice has reached its match-max limit.
     */
    private isChoiceExhausted;
    /**
     * Update the visual exhaustion state of a choice.
     */
    private updateExhaustionState;
    /**
     * Focus the first choice in a set and update roving tabindex.
     * Returns true if focus was moved, false if the set is empty.
     */
    private focusFirstInSet;
    /**
     * Get choice elements for a set (for roving tabindex navigation).
     */
    private getChoiceElementsInSet;
    /**
     * Get all choice elements in a set as an array.
     */
    private getChoiceElementsArray;
    /**
     * Get all choice elements from both sets.
     */
    private getAllChoiceElements;
    /**
     * Enable or disable the interaction.
     */
    setEnabled(enabled: boolean): void;
    /**
     * Get the current response as an array of directed pairs.
     */
    getResponse(): string[];
    /**
     * Initialize from default values.
     */
    initializeFromDefaults(defaults: string[]): void;
}
