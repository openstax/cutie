/**
 * Function that retrieves current response value from an interaction
 */
export type ResponseAccessor = () => unknown;

/**
 * Response data format expected by cutie-core
 */
export type ResponseData = Record<string, unknown>;

/**
 * Observer callback for state changes
 */
export type StateObserver = (state: { interactionsEnabled: boolean }) => void;

/**
 * Central state manager for an item instance.
 * Manages response collection and interaction enabled state with observer pattern.
 */
export interface ItemState {
  // Response collection
  registerResponse(responseIdentifier: string, accessor: ResponseAccessor): void;
  getResponse(responseIdentifier: string): unknown;
  collectAll(): ResponseData;
  getResponseIdentifiers(): string[];
  unregisterResponse(responseIdentifier: string): void;

  // State management with observer pattern
  readonly interactionsEnabled: boolean;
  setInteractionsEnabled(enabled: boolean): void;
  addObserver(observer: StateObserver): void;
  removeObserver(observer: StateObserver): void;
}

/**
 * Context passed through transformation pipeline
 */
export interface TransformContext {
  /**
   * Function to recursively transform child elements
   * Injected to avoid circular dependencies
   */
  transformChildren?: (element: Element) => DocumentFragment;

  /**
   * Item state manager for response collection and interaction state.
   * Handlers use this to register response accessors and observe state changes.
   */
  itemState?: ItemState;
}

/**
 * Handler interface for transforming elements
 */
export interface ElementHandler {
  /**
   * Check if this handler can process the given element
   */
  canHandle(element: Element): boolean;

  /**
   * Transform the element into a DocumentFragment
   */
  transform(element: Element, context: TransformContext): DocumentFragment;
}

/**
 * Registration entry for a handler
 */
export interface HandlerRegistration {
  /** Descriptive name for debugging */
  name: string;
  /** The handler instance */
  handler: ElementHandler;
  /** Priority (lower number = higher priority) */
  priority: number;
}
