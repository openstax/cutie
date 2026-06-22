/**
 * Registry for element handlers
 */
class HandlerRegistry {
    constructor() {
        this.handlers = [];
    }
    /**
     * Register a handler with a given priority
     * Lower priority numbers are checked first
     */
    register(name, handler, priority) {
        this.handlers.push({ name, handler, priority });
        // Keep sorted by priority (lower numbers first)
        this.handlers.sort((a, b) => a.priority - b.priority);
    }
    /**
     * Find the first handler that can handle the given element
     */
    findHandler(element) {
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
    getAll() {
        return [...this.handlers];
    }
}
// Export singleton instance
export const registry = new HandlerRegistry();
