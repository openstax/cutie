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
export declare function getExternalScoredInfo(itemDoc: Document, variables: Record<string, unknown>): ExternalScoredInfo | null;
