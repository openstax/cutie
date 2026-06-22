/**
 * Math formula comparison using Compute Engine
 *
 * Provides comparison of mathematical expressions with three modes:
 * - strict: AST structure must match exactly after parsing
 * - canonical: Normalized forms compared (e.g., 5x === x*5)
 * - algebraic: Full mathematical equivalence (e.g., 2x+3x === 5x)
 */
export type MathComparisonMode = 'strict' | 'canonical' | 'algebraic';
/**
 * Compare two mathematical expressions in LaTeX format
 *
 * @param response - The learner's response (LaTeX string)
 * @param correct - The correct answer (LaTeX string)
 * @param mode - Comparison mode: 'strict', 'canonical', or 'algebraic'
 * @returns true if expressions are equivalent according to the mode
 */
export declare function compareMathExpressions(response: string, correct: string, mode?: MathComparisonMode): boolean;
/**
 * Get the formula comparison mode from a response declaration
 *
 * @param itemDoc - The item document
 * @param responseIdentifier - The response identifier to look up
 * @returns The comparison mode, or null if not a formula response
 */
export declare function getFormulaComparisonMode(itemDoc: Document, responseIdentifier: string): MathComparisonMode | null;
