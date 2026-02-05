/**
 * Drag and drop utilities for interactive elements.
 */

/**
 * Highlight valid drop targets.
 * @param elements Elements to potentially highlight
 * @param highlightClass CSS class to add for highlighting
 * @param isValid Optional predicate to determine which elements to highlight
 */
export function highlightDropTargets(
  elements: Iterable<HTMLElement>,
  highlightClass: string,
  isValid?: (el: HTMLElement) => boolean
): void {
  for (const element of elements) {
    if (!isValid || isValid(element)) {
      element.classList.add(highlightClass);
    }
  }
}

/**
 * Clear drop target highlights from elements.
 * @param elements Elements to clear highlights from
 * @param highlightClass CSS class to remove
 */
export function clearDropTargetHighlights(
  elements: Iterable<HTMLElement>,
  highlightClass: string
): void {
  for (const element of elements) {
    element.classList.remove(highlightClass);
  }
}
