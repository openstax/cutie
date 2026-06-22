/**
 * Derives the maximum score for an assessment item by analyzing the response processing rules.
 *
 * Strategy (in priority order):
 * 1. Check for explicit MAXSCORE variable
 * 1b. Check for normal-maximum attribute on SCORE outcome declaration
 * 2. Try pattern: Sum of outcome variables (e.g., SCORE = SCORE1 + SCORE2 + SCORE3 + SCORE4)
 * 3. Try pattern: Mapping upper-bound
 * 4. Try pattern: Sum of map-entries
 * 5. Try pattern: Response processing template
 * 6. Return null (graceful failure)
 *
 * @param itemDoc The QTI assessment item document
 * @param variables The current variable state (used to check for explicit MAXSCORE)
 * @returns The derived maximum score, or null if it cannot be determined
 */
export declare function deriveMaxScore(itemDoc: Document, variables: Record<string, unknown>): number | null;
