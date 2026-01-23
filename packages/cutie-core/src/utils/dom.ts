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
export function* getChildElements(element: Element): Generator<Element> {
  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) { // ELEMENT_NODE
      yield node as Element;
    }
  }
}

/**
 * Gets the first child element node
 *
 * @param element - Parent element
 * @returns First child element or null if none found
 */
export function getFirstChildElement(element: Element): Element | null {
  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) { // ELEMENT_NODE
      return node as Element;
    }
  }
  return null;
}
