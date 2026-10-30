/**
 * Choice Interaction Labels
 *
 * A choice interaction's qti-prompt becomes the legend that names its
 * fieldset. A choice interaction with no prompt in a table cell is labelled by
 * the headers of that cell instead, the same way inline interactions with no
 * surrounding text are. One with no prompt outside a table has no name: it
 * needs a prompt to be accessible.
 *
 * References:
 * - W3C WAI grouping controls: https://www.w3.org/WAI/tutorials/forms/grouping/
 * - WCAG 1.3.1 Info and Relationships: https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html
 */

import { defaultGenerateId } from './ids.js';
import { labelByTableHeaders } from './tableHeaders.js';

const GROUP_SELECTOR = '.cutie-choice-interaction fieldset.cutie-simple-choice-group';

/** A group already named by its prompt's legend or by an ARIA label */
function isNamed(group: Element): boolean {
  return (
    Array.from(group.children).some((child) => child.tagName === 'LEGEND') ||
    group.hasAttribute('aria-labelledby') ||
    group.hasAttribute('aria-label')
  );
}

/**
 * Labels the prompt-less choice interactions in the fragment that sit in
 * table cells by those cells' headers. Mutates fragment in place.
 */
export function labelChoiceInteractions(
  fragment: DocumentFragment,
  generateId: () => string = defaultGenerateId
): void {
  for (const group of fragment.querySelectorAll(GROUP_SELECTOR)) {
    if (!isNamed(group)) labelByTableHeaders(group, generateId);
  }
}
