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
 * Manages style injection for handlers.
 * Ensures styles are only injected once per ID.
 */
export interface StyleManager {
  /**
   * Register a style block with a unique ID.
   * If the ID already exists, the style will not be re-injected.
   *
   * @param id - Unique identifier for this style block
   * @param css - CSS content to inject
   */
  addStyle(id: string, css: string): void;

  /**
   * Check if a style ID has already been registered
   */
  hasStyle(id: string): boolean;
}

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

  /**
   * Style manager for injecting CSS.
   * Handlers use this to register styles that can use pseudo-selectors and pseudo-elements.
   */
  styleManager?: StyleManager;

  /**
   * Register a callback to run after transformed content is mounted into the DOM.
   * Use for operations requiring elements to be connected (e.g., dialog.showModal()).
   */
  onMount?: (callback: () => void) => void;
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
