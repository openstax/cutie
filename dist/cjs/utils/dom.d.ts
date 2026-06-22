/**
 * DOM traversal utilities for QTI processing
 */
/**
 * Generator that yields child element nodes (lazy evaluation)
 * More efficient than creating arrays for iteration
 *
 * @param element - Parent element to traverse
 * @yields Child elements (nodeType === 1)
 */
export declare function getChildElements(element: Element): Generator<Element>;
/**
 * Gets the first child element node
 *
 * @param element - Parent element
 * @returns First child element or null if none found
 */
export declare function getFirstChildElement(element: Element): Element | null;
