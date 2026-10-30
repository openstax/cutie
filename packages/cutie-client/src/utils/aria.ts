type IdListAttribute = 'aria-describedby' | 'aria-labelledby';

const readIds = (element: Element, attribute: IdListAttribute): string[] =>
  (element.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean);

/**
 * Write an id list attribute, dropping it once the list is empty.
 */
function writeIds(element: Element, attribute: IdListAttribute, ids: string[]): void {
  if (ids.length > 0) {
    element.setAttribute(attribute, ids.join(' '));
  } else {
    element.removeAttribute(attribute);
  }
}

/**
 * Add an id to an element's aria-describedby list, keeping any ids already there.
 */
export function addAriaDescribedBy(element: Element, id: string): void {
  const ids = readIds(element, 'aria-describedby');
  if (!ids.includes(id)) ids.push(id);
  writeIds(element, 'aria-describedby', ids);
}

/**
 * Remove an id from an element's aria-describedby list, dropping the
 * attribute once the list is empty.
 */
export function removeAriaDescribedBy(element: Element, id: string): void {
  writeIds(element, 'aria-describedby', readIds(element, 'aria-describedby').filter((existing) => existing !== id));
}

/**
 * Put an id first in an element's aria-labelledby list, so its text leads the
 * element's name, keeping any ids already there.
 */
export function prependAriaLabelledBy(element: Element, id: string): void {
  writeIds(element, 'aria-labelledby', [id, ...readIds(element, 'aria-labelledby').filter((existing) => existing !== id)]);
}

/**
 * Remove an id from an element's aria-labelledby list, dropping the
 * attribute once the list is empty.
 */
export function removeAriaLabelledBy(element: Element, id: string): void {
  writeIds(element, 'aria-labelledby', readIds(element, 'aria-labelledby').filter((existing) => existing !== id));
}
