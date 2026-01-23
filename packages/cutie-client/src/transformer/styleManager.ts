import type { StyleManager } from './types';

/**
 * Default implementation of StyleManager.
 * Injects styles into a <style> element in the document head.
 * Ensures each style ID is only injected once.
 */
export class DefaultStyleManager implements StyleManager {
  private registeredStyles = new Set<string>();
  private styleElement: HTMLStyleElement;

  constructor() {
    // Create a dedicated style element for cutie-client styles
    this.styleElement = document.createElement('style');
    this.styleElement.setAttribute('data-cutie-styles', 'true');
    document.head.appendChild(this.styleElement);
  }

  addStyle(id: string, css: string): void {
    if (this.registeredStyles.has(id)) {
      return; // Style already registered
    }

    this.registeredStyles.add(id);

    // Append the CSS to the style element
    const currentContent = this.styleElement.textContent ?? '';
    this.styleElement.textContent = currentContent + `\n/* ${id} */\n${css}\n`;
  }

  hasStyle(id: string): boolean {
    return this.registeredStyles.has(id);
  }

  /**
   * Cleanup method to remove the style element from the DOM.
   * Should be called when unmounting the item.
   */
  cleanup(): void {
    this.styleElement.remove();
    this.registeredStyles.clear();
  }
}
