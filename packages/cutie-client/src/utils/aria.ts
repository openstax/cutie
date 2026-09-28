/**
 * Add an id to an element's aria-describedby list, keeping any ids already there.
 */
export function addAriaDescribedBy(element: Element, id: string): void {
  const existing = element.getAttribute('aria-describedby');
  const ids = existing ? existing.split(/\s+/).filter(Boolean) : [];
  if (!ids.includes(id)) ids.push(id);
  element.setAttribute('aria-describedby', ids.join(' '));
}
