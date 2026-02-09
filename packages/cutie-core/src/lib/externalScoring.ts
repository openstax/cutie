import { deriveMaxScore } from './deriveMaxScore';

/**
 * Information about an externally-scored item.
 */
export interface ExternalScoredInfo {
  maxScore: number;
}

/**
 * Checks whether an item is externally scored by looking for a SCORE outcome
 * declaration with `external-scored="human"`.
 *
 * @param itemDoc - Parsed QTI assessment item XML document
 * @param variables - The current variable state (passed through to deriveMaxScore)
 * @returns Object with maxScore if externally scored, or null if not
 */
export function getExternalScoredInfo(
  itemDoc: Document,
  variables: Record<string, unknown>
): ExternalScoredInfo | null {
  const outcomeDeclarations = itemDoc.getElementsByTagName('qti-outcome-declaration');

  for (let i = 0; i < outcomeDeclarations.length; i++) {
    const decl = outcomeDeclarations[i];
    if (
      decl.getAttribute('identifier') === 'SCORE' &&
      decl.getAttribute('external-scored') === 'human'
    ) {
      const maxScore = deriveMaxScore(itemDoc, variables);
      if (maxScore === null) {
        return null;
      }
      return { maxScore };
    }
  }

  return null;
}
