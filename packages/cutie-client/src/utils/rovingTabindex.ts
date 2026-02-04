/**
 * Roving tabindex utilities for keyboard navigation within groups.
 * Only one element in the group is focusable at a time (tabindex="0"),
 * while others are not tabbable (tabindex="-1").
 */

/**
 * Focus the next element in the group (wraps around).
 * @returns The newly focused element, or null if the group is empty
 */
export function focusNext(
  elements: Map<string, HTMLElement>,
  currentId: string
): HTMLElement | null {
  const ids = Array.from(elements.keys());
  if (ids.length === 0) return null;

  const currentIndex = ids.indexOf(currentId);
  const nextIndex = (currentIndex + 1) % ids.length;
  const nextId = ids[nextIndex];
  const nextElement = elements.get(nextId);

  if (nextElement) {
    updateRovingTabindex(elements, nextElement);
    nextElement.focus();
    return nextElement;
  }
  return null;
}

/**
 * Focus the previous element in the group (wraps around).
 * @returns The newly focused element, or null if the group is empty
 */
export function focusPrev(
  elements: Map<string, HTMLElement>,
  currentId: string
): HTMLElement | null {
  const ids = Array.from(elements.keys());
  if (ids.length === 0) return null;

  const currentIndex = ids.indexOf(currentId);
  const prevIndex = (currentIndex - 1 + ids.length) % ids.length;
  const prevId = ids[prevIndex];
  const prevElement = elements.get(prevId);

  if (prevElement) {
    updateRovingTabindex(elements, prevElement);
    prevElement.focus();
    return prevElement;
  }
  return null;
}

/**
 * Updates roving tabindex so only the focused element is tabbable.
 */
export function updateRovingTabindex(
  elements: Map<string, HTMLElement>,
  focusedElement: HTMLElement
): void {
  for (const element of elements.values()) {
    element.setAttribute('tabindex', element === focusedElement ? '0' : '-1');
  }
}

/**
 * Initializes roving tabindex for a group of elements.
 * Sets the first element to tabindex="0" and others to "-1".
 */
export function initializeRovingTabindex(
  elements: Map<string, HTMLElement>
): void {
  let isFirst = true;
  for (const element of elements.values()) {
    element.setAttribute('tabindex', isFirst ? '0' : '-1');
    isFirst = false;
  }
}
