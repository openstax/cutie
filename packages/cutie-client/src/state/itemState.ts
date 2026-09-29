import type {
  CollectResult,
  ItemState,
  ResponseAccessor,
  ResponseChangeListener,
  ResponseData,
  StateObserver,
} from '../transformer/types';

export interface ItemStateOptions {
  /** Called with the current raw responses whenever a handler reports a learner edit */
  onResponseChange?: ResponseChangeListener;
}

/**
 * Implementation of ItemState interface.
 * Manages response collection and interaction enabled state with observer pattern.
 */
export class ItemStateImpl implements ItemState {
  private responseAccessors: Map<string, ResponseAccessor> = new Map();
  private observers: Set<StateObserver> = new Set();
  private _interactionsEnabled = true;
  private readonly onResponseChange?: ResponseChangeListener;

  constructor(previousState?: ItemState, options?: ItemStateOptions) {
    if (previousState) {
      this._interactionsEnabled = previousState.interactionsEnabled;
    }
    this.onResponseChange = options?.onResponseChange;
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
   * Pure getter — returns a struct with responses, validity, and invalid count.
   */
  collectAll(): CollectResult {
    const responses: ResponseData = {};
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
   * Read the current value of every registered response without validating:
   * no validation UI is rendered and nothing is announced.
   */
  peekAll(): ResponseData {
    const responses: ResponseData = {};
    for (const [identifier, accessor] of this.responseAccessors) {
      responses[identifier] = accessor({ silent: true }).value;
    }
    return responses;
  }

  /**
   * Report a learner edit to the response change listener, if any.
   */
  notifyResponseChange(): void {
    this.onResponseChange?.(this.peekAll());
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
