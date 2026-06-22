/**
 * Default implementation of StyleManager.
 * Injects styles into a <style> element in the document head.
 * Ensures each style ID is only injected once.
 */
export class DefaultStyleManager {
    constructor() {
        this.registeredStyles = new Set();
        // Create a dedicated style element for cutie-client styles
        this.styleElement = document.createElement('style');
        this.styleElement.setAttribute('data-cutie-styles', 'true');
        document.head.appendChild(this.styleElement);
    }
    addStyle(id, css) {
        var _a;
        if (this.registeredStyles.has(id)) {
            return; // Style already registered
        }
        this.registeredStyles.add(id);
        // Append the CSS to the style element
        const currentContent = (_a = this.styleElement.textContent) !== null && _a !== void 0 ? _a : '';
        this.styleElement.textContent = currentContent + `\n/* ${id} */\n${css}\n`;
    }
    hasStyle(id) {
        return this.registeredStyles.has(id);
    }
    /**
     * Cleanup method to remove the style element from the DOM.
     * Should be called when unmounting the item.
     */
    cleanup() {
        this.styleElement.remove();
        this.registeredStyles.clear();
    }
}
