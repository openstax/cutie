/* spell-checker: ignore hottext */
import { isFormulaResponse } from './responseDeclarations.js';

/**
 * Counts the options an interaction offers a learner guessing through tries:
 * each one a learner can pick (a choice) or make (a pairing). Null when the
 * interaction's options can't be counted, so retrying it can't be bounded.
 */
type OptionCounter = (interaction: Element, itemDoc: Document) => number | null;

const OPTION_COUNTERS: Record<string, OptionCounter> = {
  'qti-choice-interaction': (interaction) => countDescendants(interaction, 'qti-simple-choice'),
  'qti-order-interaction': (interaction) => countDescendants(interaction, 'qti-simple-choice'),
  'qti-inline-choice-interaction': (interaction) => countDescendants(interaction, 'qti-inline-choice'),
  'qti-hotspot-interaction': (interaction) => countDescendants(interaction, 'qti-hotspot-choice'),
  'qti-hottext-interaction': (interaction) => countDescendants(interaction, 'qti-hottext'),

  // Every word or image that may go in every gap
  'qti-gap-match-interaction': (interaction) =>
    countPairings(
      [...descendants(interaction, 'qti-gap-text'), ...descendants(interaction, 'qti-gap-img')],
      descendants(interaction, 'qti-gap')
    ),

  // Every source in the first set that may pair with every target in the second
  'qti-match-interaction': (interaction) => {
    const [sources, targets] = descendants(interaction, 'qti-simple-match-set').map((set) =>
      descendants(set, 'qti-simple-associable-choice')
    );
    return sources && targets ? countPairings(sources, targets) : null;
  },

  // A text or formula entry is no easier to answer for being retried, so it
  // adds no options; an essay can't be judged on a retry at all
  'qti-text-entry-interaction': () => 0,
  'qti-extended-text-interaction': (interaction, itemDoc) =>
    isFormulaResponse(itemDoc, interaction.getAttribute('response-identifier') ?? '') ? 0 : null,
};

/**
 * The options an interaction offers a learner guessing through tries (see
 * OPTION_COUNTERS), or null when they can't be counted: an interaction with
 * no counter, or one whose response can't be judged on a retry.
 */
export function countGuessableOptions(interaction: Element, itemDoc: Document): number | null {
  const counter = OPTION_COUNTERS[interaction.tagName];
  return counter ? counter(interaction, itemDoc) : null;
}

/**
 * The pairings a learner may make between two sets: every source and target
 * that each allow the other. A `match-group` lists the identifiers its element
 * may be matched with; without one, an element may be matched with any
 * (QTI 3 Information Model, SimpleAssociableChoice, Gap and GapText `match-group`).
 */
function countPairings(sources: Element[], targets: Element[]): number {
  let pairings = 0;
  for (const source of sources) {
    for (const target of targets) {
      if (allowsMatch(source, target) && allowsMatch(target, source)) pairings++;
    }
  }
  return pairings;
}

function allowsMatch(element: Element, other: Element): boolean {
  const matchGroup = element.getAttribute('match-group')?.trim();
  if (!matchGroup) return true;
  return matchGroup.split(/\s+/).includes(other.getAttribute('identifier') ?? '');
}

function descendants(element: Element, tagName: string): Element[] {
  return Array.from(element.getElementsByTagName(tagName));
}

function countDescendants(element: Element, tagName: string): number {
  return descendants(element, tagName).length;
}
