import { deriveMaxScore } from './deriveMaxScore.js';

/**
 * Information about an externally-scored item.
 */
export interface ExternalScoredInfo {
  maxScore: number;
}

/**
 * Whether any outcome of the item is scored outside response processing
 * (`external-scored`, by a human or an external machine).
 */
export function hasExternalScoring(itemDoc: Document): boolean {
  return Array.from(itemDoc.getElementsByTagName('qti-outcome-declaration')).some((decl) =>
    ['human', 'externalMachine'].includes(decl.getAttribute('external-scored') ?? '')
  );
}

/**
 * Whether an item is scored by a human: its SCORE outcome declaration has
 * `external-scored="human"`. Such an item awaits manual scoring once submitted.
 */
export function isExternallyScored(itemDoc: Document): boolean {
  return Array.from(itemDoc.getElementsByTagName('qti-outcome-declaration')).some(
    (decl) =>
      decl.getAttribute('identifier') === 'SCORE' &&
      decl.getAttribute('external-scored') === 'human'
  );
}

/**
 * Checks whether an item is externally scored (see isExternallyScored) and,
 * if so, what it can score.
 *
 * @param itemDoc - Parsed QTI assessment item XML document
 * @param variables - The current variable state (passed through to deriveMaxScore)
 * @returns Object with maxScore if externally scored, or null if not
 */
export function getExternalScoredInfo(
  itemDoc: Document,
  variables: Record<string, unknown>
): ExternalScoredInfo | null {
  if (!isExternallyScored(itemDoc)) return null;

  const maxScore = deriveMaxScore(itemDoc, variables);
  return maxScore === null ? null : { maxScore };
}
