/**
 * Roving tabindex utilities for keyboard navigation within groups.
 * Only one element in the group is focusable at a time (tabindex="0"),
 * while others are not tabbable (tabindex="-1").
 */
/**
 * Focus the next element in the group (wraps around).
 * @returns The newly focused element, or null if the group is empty
 */
export declare function focusNext(elements: Map<string, HTMLElement>, currentId: string): HTMLElement | null;
/**
 * Focus the previous element in the group (wraps around).
 * @returns The newly focused element, or null if the group is empty
 */
export declare function focusPrev(elements: Map<string, HTMLElement>, currentId: string): HTMLElement | null;
/**
 * Updates roving tabindex so only the focused element is tabbable.
 */
export declare function updateRovingTabindex(elements: Map<string, HTMLElement>, focusedElement: HTMLElement): void;
/**
 * Initializes roving tabindex for a group of elements.
 * Sets the first element to tabindex="0" and others to "-1".
 */
export declare function initializeRovingTabindex(elements: Map<string, HTMLElement>): void;
