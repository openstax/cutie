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
 * Function that retrieves current response value from an interaction
 */
export type ResponseAccessor = () => ResponseAccessorResult;

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

  // State management with observer pattern
  readonly interactionsEnabled: boolean;
  setInteractionsEnabled(enabled: boolean): void;
  addObserver(observer: StateObserver): void;
  removeObserver(observer: StateObserver): void;
}

/**
 * A single registered field within a ParagraphValidationAggregator.
 */
export interface ParagraphValidationField {
  /** DOM id of this field's row — set as aria-describedby on the field's input/select. */
  readonly id: string;
  /** Toggle this field's error visibility within the shared paragraph summary. */
  setError(isError: boolean): void;
}

/**
 * Aggregates validation errors for inline interactions (text-entry,
 * inline-choice) within a single enclosing paragraph, rendered as one
 * consolidated message block above the paragraph.
 */
export interface ParagraphValidationAggregator {
  /**
   * Reserve the next 1-based ordinal position for an inline interaction
   * within this paragraph, whether or not it is constrained. Every inline
   * interaction handler (text-entry, inline-choice) calls this exactly once
   * per transform(), in document order — this keeps "Blank N" labels here in
   * sync with the "blank N of M" labels assigned independently by
   * inlineInteractionAnnotator.ts, which counts the same set of
   * interactions in the same document-order walk.
   */
  nextOrdinal(): number;

  /**
   * Register a constrained field for display in the shared validation
   * summary. Call only for interactions that actually have a constraint.
   */
  registerField(ordinal: number, message: string): ParagraphValidationField;

  /** True once at least one field has been registered. */
  hasFields(): boolean;

  /** The rendered summary element (a <div> wrapping a <ul>). */
  readonly element: HTMLElement;
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
   * Aggregator for the nearest enclosing paragraph's validation summary.
   * Set by htmlPassthrough.ts while transforming a <p>'s children; inline
   * interaction handlers register their constrained fields here in addition
   * to (not instead of) their own per-field indicator.
   */
  paragraphValidation?: ParagraphValidationAggregator;

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
   * Register a teardown callback to run when the item is unmounted.
   * Use for cleanup of resources that persist beyond a single render (e.g., live regions on document.body).
   */
  onCleanup?: (callback: () => void) => void;

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
