import type { StyleManager } from './types';
/**
 * Default implementation of StyleManager.
 * Injects styles into a <style> element in the document head.
 * Ensures each style ID is only injected once.
 */
export declare class DefaultStyleManager implements StyleManager {
    private registeredStyles;
    private styleElement;
    constructor();
    addStyle(id: string, css: string): void;
    hasStyle(id: string): boolean;
    /**
     * Cleanup method to remove the style element from the DOM.
     * Should be called when unmounting the item.
     */
    cleanup(): void;
}
