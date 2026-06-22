import type { StyleManager } from '../transformer/types';
/**
 * Create a constraint message element with a warning icon.
 * The icon is hidden by default and shown when the element has the error class.
 *
 * Registers shared validation display styles via the provided StyleManager (idempotent).
 *
 * @param id - Unique ID for the element (used for aria-describedby linking)
 * @param text - Informational constraint text (e.g., "Select at least 2 choices.")
 * @param styleManager - Optional style manager for registering shared styles
 */
export interface ConstraintMessage {
    element: HTMLElement;
    setError: (isError: boolean) => void;
    setText: (text: string) => void;
}
export declare function createConstraintMessage(id: string, text: string, styleManager?: StyleManager): ConstraintMessage;
/**
 * Create an inline required indicator for inline interactions (text entry, inline choice).
 * Renders a superscript asterisk placed as a sibling after the input/select element.
 *
 * @param id - Unique ID for the element (used for aria-describedby linking)
 * @param title - Tooltip text (e.g., "Selection required" or custom pattern message)
 * @param styleManager - Optional style manager for registering shared styles
 */
export declare function createInlineRequiredIndicator(id: string, title: string, styleManager?: StyleManager): ConstraintMessage;
