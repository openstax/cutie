/**
 * CSS styles for error display elements.
 * Registered as part of base styles so they are always available.
 */
export declare const ERROR_DISPLAY_STYLES = "\n  .cutie-error-display {\n    display: inline-block;\n    background-color: var(--cutie-bg-alt);\n    border: 2px solid var(--cutie-feedback-incorrect);\n    border-radius: 4px;\n    padding: 12px 16px;\n    margin: 8px 0;\n    font-family: system-ui, -apple-system, sans-serif;\n  }\n\n  .cutie-error-display__title {\n    display: block;\n    margin-bottom: 4px;\n    color: var(--cutie-feedback-incorrect);\n  }\n\n  .cutie-error-display__message {\n    color: var(--cutie-feedback-incorrect);\n    font-size: 14px;\n  }\n";
/**
 * Create a generic error display element
 *
 * @param title - The error title text
 * @param message - The detailed error message
 * @returns HTMLElement configured with error styling
 */
export declare function createErrorElement(title: string, message: string): HTMLElement;
/**
 * Create a visual error display for unsupported elements
 */
export declare function createUnsupportedElement(elementName: string): HTMLElement;
/**
 * Create an error display for a missing required attribute
 *
 * @param elementName - The QTI element name (e.g., 'qti-choice-interaction')
 * @param attributeName - The missing attribute name (e.g., 'response-identifier')
 * @returns HTMLElement configured with error styling
 */
export declare function createMissingAttributeError(elementName: string, attributeName: string): HTMLElement;
/**
 * Create an error display for an invalid attribute value
 *
 * @param elementName - The QTI element name
 * @param attributeName - The attribute name
 * @param value - The invalid value
 * @param reason - Optional explanation of why the value is invalid
 * @returns HTMLElement configured with error styling
 */
export declare function createInvalidAttributeError(elementName: string, attributeName: string, value: string, reason?: string): HTMLElement;
