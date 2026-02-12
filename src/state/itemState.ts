import type { ItemState, ResponseAccessor, ResponseData, StateObserver } from '../transformer/types';

/**
 * Implementation of ItemState interface.
 * Manages response collection and interaction enabled state with observer pattern.
 */
export class ItemStateImpl implements ItemState {
  private responseAccessors: Map<string, ResponseAccessor> = new Map();
  private observers: Set<StateObserver> = new Set();
  private _interactionsEnabled = true;
  private previousAlertElement: HTMLElement | null = null;

  constructor(previousState?: ItemState) {
    if (previousState) {
      this._interactionsEnabled = previousState.interactionsEnabled;
    }
  }

  /**
   * Register a response accessor for a given response identifier
   */
  registerResponse(responseIdentifier: string, accessor: ResponseAccessor): void {
    if (this.responseAccessors.has(responseIdentifier)) {
      console.warn(
        `Response identifier "${responseIdentifier}" is already registered. Overwriting previous accessor.`
      );
    }
    this.responseAccessors.set(responseIdentifier, accessor);
  }

  /**
   * Get the current response value for a specific identifier
   */
  getResponse(responseIdentifier: string): unknown {
    const accessor = this.responseAccessors.get(responseIdentifier);
    if (!accessor) {
      return undefined;
    }
    return accessor().value;
  }

  /**
   * Collect all responses from registered accessors.
   * Returns undefined if any accessor reports invalid state.
   * Adds role="alert" to the first invalid handler's errorElement for screen readers.
   */
  collectAll(): ResponseData | undefined {
    const responses: ResponseData = {};
    let firstInvalidErrorElement: HTMLElement | undefined;
    let allValid = true;

    for (const [identifier, accessor] of this.responseAccessors) {
      const result = accessor();
      responses[identifier] = result.value;
      if (!result.valid) {
        allValid = false;
        if (!firstInvalidErrorElement && result.errorElement) {
          firstInvalidErrorElement = result.errorElement;
        }
      }
    }

    // Clean up previous alert
    if (this.previousAlertElement) {
      this.previousAlertElement.removeAttribute('role');
      this.previousAlertElement = null;
    }

    if (!allValid) {
      // Add role="alert" only to the first invalid errorElement
      if (firstInvalidErrorElement) {
        firstInvalidErrorElement.setAttribute('role', 'alert');
        this.previousAlertElement = firstInvalidErrorElement;
      }
      return undefined;
    }

    return responses;
  }

  /**
   * Get all registered response identifiers
   */
  getResponseIdentifiers(): string[] {
    return Array.from(this.responseAccessors.keys());
  }

  /**
   * Unregister a response accessor
   */
  unregisterResponse(responseIdentifier: string): void {
    this.responseAccessors.delete(responseIdentifier);
  }

  /**
   * Get the current interactions enabled state (readonly)
   */
  get interactionsEnabled(): boolean {
    return this._interactionsEnabled;
  }

  /**
   * Set the interactions enabled state and notify all observers
   */
  setInteractionsEnabled(enabled: boolean): void {
    if (this._interactionsEnabled === enabled) {
      return; // No change, skip notification
    }
    this._interactionsEnabled = enabled;
    this.notifyObservers();
  }

  /**
   * Add an observer to be notified of state changes
   */
  addObserver(observer: StateObserver): void {
    this.observers.add(observer);
  }

  /**
   * Remove an observer
   */
  removeObserver(observer: StateObserver): void {
    this.observers.delete(observer);
  }

  /**
   * Notify all observers of state change
   */
  private notifyObservers(): void {
    const state = { interactionsEnabled: this._interactionsEnabled };
    for (const observer of this.observers) {
      observer(state);
    }
  }

  /**
   * Clear all response accessors and observers (for cleanup)
   */
  clear(): void {
    this.responseAccessors.clear();
    this.observers.clear();
  }
}
