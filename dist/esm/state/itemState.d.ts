import type { CollectResult, ItemState, ResponseAccessor, StateObserver } from '../transformer/types';
/**
 * Implementation of ItemState interface.
 * Manages response collection and interaction enabled state with observer pattern.
 */
export declare class ItemStateImpl implements ItemState {
    private responseAccessors;
    private observers;
    private _interactionsEnabled;
    constructor(previousState?: ItemState);
    /**
     * Register a response accessor for a given response identifier
     */
    registerResponse(responseIdentifier: string, accessor: ResponseAccessor): void;
    /**
     * Get the current response value for a specific identifier
     */
    getResponse(responseIdentifier: string): unknown;
    /**
     * Collect all responses from registered accessors.
     * Pure getter — returns a struct with responses, validity, and invalid count.
     */
    collectAll(): CollectResult;
    /**
     * Get all registered response identifiers
     */
    getResponseIdentifiers(): string[];
    /**
     * Unregister a response accessor
     */
    unregisterResponse(responseIdentifier: string): void;
    /**
     * Get the current interactions enabled state (readonly)
     */
    get interactionsEnabled(): boolean;
    /**
     * Set the interactions enabled state and notify all observers
     */
    setInteractionsEnabled(enabled: boolean): void;
    /**
     * Add an observer to be notified of state changes
     */
    addObserver(observer: StateObserver): void;
    /**
     * Remove an observer
     */
    removeObserver(observer: StateObserver): void;
    /**
     * Notify all observers of state change
     */
    private notifyObservers;
    /**
     * Clear all response accessors and observers (for cleanup)
     */
    clear(): void;
}
