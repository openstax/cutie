import type { ElementHandler, HandlerRegistration } from './types';
/**
 * Registry for element handlers
 */
declare class HandlerRegistry {
    private handlers;
    /**
     * Register a handler with a given priority
     * Lower priority numbers are checked first
     */
    register(name: string, handler: ElementHandler, priority: number): void;
    /**
     * Find the first handler that can handle the given element
     */
    findHandler(element: Element): ElementHandler | undefined;
    /**
     * Get all registered handlers (for debugging)
     */
    getAll(): HandlerRegistration[];
}
export declare const registry: HandlerRegistry;
export {};
