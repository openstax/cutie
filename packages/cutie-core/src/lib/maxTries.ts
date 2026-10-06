import { DeliveryOptions } from '../types.js';
import { hasExternalScoring } from './externalScoring.js';
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
 * The option elements each guessable interaction offers the learner, by
 * interaction tag. A learner guessing through the tries works through these.
 */
const GUESSABLE_OPTIONS: Record<string, (interaction: Element) => Element[]> = {
  'qti-choice-interaction': (interaction) => descendants(interaction, 'qti-simple-choice'),
  'qti-order-interaction': (interaction) => descendants(interaction, 'qti-simple-choice'),
  'qti-inline-choice-interaction': (interaction) => descendants(interaction, 'qti-inline-choice'),
  'qti-hotspot-interaction': (interaction) => descendants(interaction, 'qti-hotspot-choice'),
  'qti-gap-match-interaction': (interaction) => [
    ...descendants(interaction, 'qti-gap-text'),
    ...descendants(interaction, 'qti-gap-img'),
  ],
  // The target set: the second qti-simple-match-set
  'qti-match-interaction': (interaction) => {
    const target = descendants(interaction, 'qti-simple-match-set')[1];
    return target ? descendants(target, 'qti-simple-associable-choice') : [];
  },
};

/**
 * Interactions that are no easier to answer for being retried, so they don't
 * limit the tries.
 */
const UNGUESSABLE_INTERACTIONS = new Set(['qti-text-entry-interaction']);

/**
 * The `'smart'` number of tries: enough to correct a mistake, too few to guess
 * through the options.
 *
 * Each guessable interaction allows half the options this variant shows (after
 * template conditionals), rounded down, and at least one; the item allows the
 * fewest any interaction does. A text entry sets no limit. An item with any
 * other interaction, an externally scored item, or an item nothing limits gets
 * one try.
 */
export function deriveSmartMaxTries(itemDoc: Document, variables: Record<string, unknown>): number {
  if (hasExternalScoring(itemDoc)) return 1;

  const authoredBody = itemDoc.getElementsByTagName('qti-item-body')[0];
  if (!authoredBody) return 1;

  const itemBody = authoredBody.cloneNode(true) as Element;
  processTemplateConditionals(itemBody, variables);

  const interactions = descendants(itemBody, '*').filter((element) =>
    element.tagName.endsWith('-interaction')
  );

  let limit = Infinity;
  for (const interaction of interactions) {
    if (UNGUESSABLE_INTERACTIONS.has(interaction.tagName)) continue;

    const options = GUESSABLE_OPTIONS[interaction.tagName];
    const tries = options ? Math.max(1, Math.floor(options(interaction).length / 2)) : 1;
    limit = Math.min(limit, tries);
  }

  return Number.isFinite(limit) ? limit : 1;
}

function descendants(element: Element, tagName: string): Element[] {
  return Array.from(element.getElementsByTagName(tagName));
}
