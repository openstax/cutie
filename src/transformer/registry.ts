import type { ElementHandler, HandlerRegistration } from './types';

/**
 * Registry for element handlers
 */
class HandlerRegistry {
  private handlers: HandlerRegistration[] = [];

  /**
   * Register a handler with a given priority
   * Lower priority numbers are checked first
   */
  register(name: string, handler: ElementHandler, priority: number): void {
    this.handlers.push({ name, handler, priority });
    // Keep sorted by priority (lower numbers first)
    this.handlers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Find the first handler that can handle the given element
   */
  findHandler(element: Element): ElementHandler | undefined {
    for (const registration of this.handlers) {
      if (registration.handler.canHandle(element)) {
        return registration.handler;
      }
    }
    return undefined;
  }

  /**
   * Get all registered handlers (for debugging)
   */
  getAll(): HandlerRegistration[] {
    return [...this.handlers];
  }
}

// Export singleton instance
export const registry = new HandlerRegistry();
