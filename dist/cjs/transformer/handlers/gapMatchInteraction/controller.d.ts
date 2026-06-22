import type { TransformContext } from '../../types';
/**
 * Controller for managing gap match interaction state and behavior.
 * Handles all drag/drop and keyboard interactions.
 */
export declare class GapMatchController {
    responseIdentifier: string;
    selectedChoice: string | null;
    selectedFromGap: string | null;
    gapAssignments: Map<string, string>;
    choiceUseCounts: Map<string, number>;
    choiceMaxCounts: Map<string, number>;
    choiceContents: Map<string, string>;
    choiceElements: Map<string, HTMLElement>;
    gapElements: Map<string, HTMLElement>;
    choicesContainer: HTMLElement;
    private context;
    container: HTMLElement;
    private enabled;
    private choiceMatchGroups;
    private gapMatchGroups;
    private documentClickHandler;
    private maxAssociations;
    constructor(responseIdentifier: string, choicesContainer: HTMLElement, context: TransformContext, container: HTMLElement, maxAssociations?: number);
    /**
     * Wire up the choices container to accept drops (return to word bank)
     */
    private wireChoicesContainerEvents;
    /**
     * Register a choice element with the controller
     */
    registerChoice(choiceId: string, element: HTMLElement, maxCount: number, content: string, matchGroups: string[]): void;
    /**
     * Register a gap element with the controller
     */
    registerGap(gapId: string, element: HTMLElement, matchGroups: string[]): void;
    /**
     * Wire up event listeners for a choice element
     */
    private wireChoiceEvents;
    /**
     * Wire up event listeners for a gap element
     */
    private wireGapEvents;
    /**
     * Check if a choice can be placed in a gap (matchGroup compatibility)
     */
    private canPlaceInGap;
    /**
     * Select a choice for placement
     * @param choiceId The choice identifier
     * @param fromGapId If selecting from a filled gap, the gap identifier
     */
    selectChoice(choiceId: string, fromGapId: string | null): void;
    /**
     * Clear the current selection
     */
    clearSelection(): void;
    /**
     * Place a choice in a gap
     */
    placeChoiceInGap(gapId: string, choiceId: string): void;
    /**
     * Remove a choice from a gap
     */
    removeChoiceFromGap(gapId: string, silent?: boolean): void;
    /**
     * Check if a choice has reached its matchMax limit
     */
    isChoiceExhausted(choiceId: string): boolean;
    /**
     * Update the visual exhaustion state of a choice
     */
    private updateChoiceExhaustion;
    /**
     * Enable or disable the interaction
     */
    setEnabled(enabled: boolean): void;
    /**
     * Get the current response as an array of directed pairs
     */
    getResponse(): string[];
    /**
     * Initialize from default values
     */
    initializeFromDefaults(defaults: string[]): void;
}
