/**
 * Context passed through transformation pipeline
 */
export interface TransformContext {
  /**
   * Function to recursively transform child elements
   * Injected to avoid circular dependencies
   */
  transformChildren?: (element: Element) => DocumentFragment;
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
