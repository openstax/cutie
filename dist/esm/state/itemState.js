/**
 * Implementation of ItemState interface.
 * Manages response collection and interaction enabled state with observer pattern.
 */
export class ItemStateImpl {
    constructor(previousState) {
        this.responseAccessors = new Map();
        this.observers = new Set();
        this._interactionsEnabled = true;
        if (previousState) {
            this._interactionsEnabled = previousState.interactionsEnabled;
        }
    }
    /**
     * Register a response accessor for a given response identifier
     */
    registerResponse(responseIdentifier, accessor) {
        if (this.responseAccessors.has(responseIdentifier)) {
            console.warn(`Response identifier "${responseIdentifier}" is already registered. Overwriting previous accessor.`);
        }
        this.responseAccessors.set(responseIdentifier, accessor);
    }
    /**
     * Get the current response value for a specific identifier
     */
    getResponse(responseIdentifier) {
        const accessor = this.responseAccessors.get(responseIdentifier);
        if (!accessor) {
            return undefined;
        }
        return accessor().value;
    }
    /**
     * Collect all responses from registered accessors.
     * Pure getter — returns a struct with responses, validity, and invalid count.
     */
    collectAll() {
        const responses = {};
        let invalidCount = 0;
        for (const [identifier, accessor] of this.responseAccessors) {
            const result = accessor();
            responses[identifier] = result.value;
            if (!result.valid) {
                invalidCount++;
            }
        }
        return { responses, valid: invalidCount === 0, invalidCount };
    }
    /**
     * Get all registered response identifiers
     */
    getResponseIdentifiers() {
        return Array.from(this.responseAccessors.keys());
    }
    /**
     * Unregister a response accessor
     */
    unregisterResponse(responseIdentifier) {
        this.responseAccessors.delete(responseIdentifier);
    }
    /**
     * Get the current interactions enabled state (readonly)
     */
    get interactionsEnabled() {
        return this._interactionsEnabled;
    }
    /**
     * Set the interactions enabled state and notify all observers
     */
    setInteractionsEnabled(enabled) {
        if (this._interactionsEnabled === enabled) {
            return; // No change, skip notification
        }
        this._interactionsEnabled = enabled;
        this.notifyObservers();
    }
    /**
     * Add an observer to be notified of state changes
     */
    addObserver(observer) {
        this.observers.add(observer);
    }
    /**
     * Remove an observer
     */
    removeObserver(observer) {
        this.observers.delete(observer);
    }
    /**
     * Notify all observers of state change
     */
    notifyObservers() {
        const state = { interactionsEnabled: this._interactionsEnabled };
        for (const observer of this.observers) {
            observer(state);
        }
    }
    /**
     * Clear all response accessors and observers (for cleanup)
     */
    clear() {
        this.responseAccessors.clear();
        this.observers.clear();
    }
}
