/**
 * Result returned by a response accessor, including the value and validation state
 */
export interface ResponseAccessorResult {
  value: unknown;
  valid: boolean;
}

/**
 * Result of collecting all responses, including validation summary
 */
export interface CollectResult {
  responses: ResponseData;
  valid: boolean;
  invalidCount: number;
}

/**
 * Options for reading a response through its accessor
 */
export interface ResponseAccessorOptions {
  /**
   * When true, report the value and validity without side effects: no
   * validation message is rendered and nothing is announced. Defaults to false
   * (submit-time behavior: validation errors are shown and announced).
   */
  silent?: boolean;
}

/**
 * Function that retrieves current response value from an interaction
 */
export type ResponseAccessor = (options?: ResponseAccessorOptions) => ResponseAccessorResult;

/**
 * Listener invoked with the current raw value of every response, valid or not
 */
export type ResponseChangeListener = (responses: ResponseData) => void;

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
  collectAll(): CollectResult;
  getResponseIdentifiers(): string[];
  unregisterResponse(responseIdentifier: string): void;

  /**
   * Signal that a learner edit changed a response value. Handlers call this
   * from learner-edit event paths only — never when restoring values
   * programmatically (e.g. from qti-default-value).
   */
  notifyResponseChange(responseIdentifier: string): void;

  /**
   * Call `listener` on each learner edit that changes the given response
   * (as reported by notifyResponseChange).
   */
  onResponseEdit(responseIdentifier: string, listener: () => void): void;

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
   * Transform a single element (preserving the element itself, not just its
   * children). Use when a handler needs an authored wrapper — e.g. a
   * qti-layout-row grid — to survive into the output. Injected to avoid
   * circular dependencies.
   */
  transformNode?: (element: Element) => DocumentFragment;

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

  /**
   * Register a teardown callback to run when this render is torn down: on the
   * next update() or on unmount. Use for resources a render sets up outside its
   * own DOM (e.g., document-level event listeners).
   */
  onCleanup?: (callback: () => void) => void;

  /**
   * Register a teardown callback to run only when the item is unmounted. Use for
   * resources that must persist across renders.
   */
  onUnmount?: (callback: () => void) => void;

  /**
   * The top-level container element that the item is rendered into.
   * Useful for focus management (e.g., restoring focus after a modal closes).
   */
  containerElement?: HTMLElement;

  /**
   * Persistent state bag that survives across update() calls.
   * Handlers can read/write arbitrary keyed data. Cleared on unmount().
   */
  state?: Map<string, unknown>;
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
