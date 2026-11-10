import { DeliveryOptions } from '../types.js';
import { hasExternalScoring } from './externalScoring.js';
import { countGuessableOptions } from './guessableOptions.js';
import { processTemplateConditionals } from './visibility.js';

/**
 * Resolves the `maxTries` delivery option to the number of tries an attempt
 * at the item gets.
 *
 * @param variables - The attempt's variables once template processing has run,
 *   which decide the choices this variant shows
 * @throws When given a number that is not a positive integer
 */
export function resolveMaxTries(
  itemDoc: Document,
  maxTries: Required<DeliveryOptions>['maxTries'],
  variables: Record<string, unknown>
): number {
  if (maxTries === 'smart') return deriveSmartMaxTries(itemDoc, variables);

  if (!Number.isSafeInteger(maxTries) || maxTries < 1) {
    throw new Error(`maxTries must be a positive integer or 'smart', got ${maxTries}`);
  }
  return maxTries;
}

/**
 * The most tries `'smart'` allows, however many options an item shows.
 */
export const SMART_MAX_TRIES_CAP = 4;

/**
 * The `'smart'` number of tries: enough to correct a mistake, too few to guess
 * through the options.
 *
 * A try is judged for the item as a whole, so the options a learner would
 * guess through are those of every interaction this variant shows (after
 * template conditionals), pooled (see countGuessableOptions). The item allows
 * half of them, rounded down, at least one and at most SMART_MAX_TRIES_CAP.
 * An item with an interaction whose options can't be counted, an externally
 * scored item, or an item with no options gets one try.
 */
export function deriveSmartMaxTries(itemDoc: Document, variables: Record<string, unknown>): number {
  if (hasExternalScoring(itemDoc)) return 1;

  const authoredBody = itemDoc.getElementsByTagName('qti-item-body')[0];
  if (!authoredBody) return 1;

  // Every interaction this variant can show counts, including those inside
  // feedback an adaptive item reveals in later steps: which steps a learner
  // reaches can't be known in advance, and a fresh try starts the item over
  const itemBody = authoredBody.cloneNode(true) as Element;
  processTemplateConditionals(itemBody, variables);

  const interactions = Array.from(itemBody.getElementsByTagName('*')).filter((element) =>
    element.tagName.endsWith('-interaction')
  );

  let options = 0;
  for (const interaction of interactions) {
    const count = countGuessableOptions(interaction, itemDoc);
    if (count === null) return 1;
    options += count;
  }

  return Math.min(SMART_MAX_TRIES_CAP, Math.max(1, Math.floor(options / 2)));
}
