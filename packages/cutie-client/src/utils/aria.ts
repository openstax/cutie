/**
 * Add an id to an element's aria-describedby list, keeping any ids already there.
 */
export function addAriaDescribedBy(element: Element, id: string): void {
  const existing = element.getAttribute('aria-describedby');
  const ids = existing ? existing.split(/\s+/).filter(Boolean) : [];
  if (!ids.includes(id)) ids.push(id);
  element.setAttribute('aria-describedby', ids.join(' '));
}

/**
 * Remove an id from an element's aria-describedby list, dropping the
 * attribute once the list is empty.
 */
export function removeAriaDescribedBy(element: Element, id: string): void {
  const ids = (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((existing) => existing && existing !== id);
  if (ids.length > 0) {
    element.setAttribute('aria-describedby', ids.join(' '));
  } else {
    element.removeAttribute('aria-describedby');
  }
}
