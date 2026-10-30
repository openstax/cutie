/**
 * Context Labels
 *
 * Gives interactions accessible names drawn from the content around them,
 * such as surrounding text or the headers of the table cell they're in. Runs
 * once the whole item body is built, since that context isn't in place while
 * each interaction's handler runs.
 */

import { labelChoiceInteractions } from './choiceInteractions.js';
import { labelInlineInteractions } from './inlineInteractions.js';

export { SR_ONLY_STYLES } from './inlineInteractions.js';

/**
 * Labels the interactions in the fragment from their context. Mutates the
 * fragment in place. Returns true if any labels need SR_ONLY_STYLES.
 */
export function labelInteractionsFromContext(fragment: DocumentFragment): boolean {
  labelChoiceInteractions(fragment);
  return labelInlineInteractions(fragment);
}
