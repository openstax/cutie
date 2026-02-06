/**
 * Math formula comparison using Compute Engine
 *
 * Provides comparison of mathematical expressions with three modes:
 * - strict: AST structure must match exactly after parsing
 * - canonical: Normalized forms compared (e.g., 5x === x*5)
 * - algebraic: Full mathematical equivalence (e.g., 2x+3x === 5x)
 */

import { ComputeEngine } from '@cortex-js/compute-engine';

export type MathComparisonMode = 'strict' | 'canonical' | 'algebraic';

// Singleton compute engine instance
let computeEngine: ComputeEngine | null = null;

function getComputeEngine(): ComputeEngine {
  if (!computeEngine) {
    computeEngine = new ComputeEngine();
  }
  return computeEngine;
}

/**
 * Compare two mathematical expressions in LaTeX format
 *
 * @param response - The learner's response (LaTeX string)
 * @param correct - The correct answer (LaTeX string)
 * @param mode - Comparison mode: 'strict', 'canonical', or 'algebraic'
 * @returns true if expressions are equivalent according to the mode
 */
export function compareMathExpressions(
  response: string,
  correct: string,
  mode: MathComparisonMode = 'canonical'
): boolean {
  // Handle empty/null cases
  if (!response || !correct) {
    return false;
  }

  const trimmedResponse = response.trim();
  const trimmedCorrect = correct.trim();

  if (trimmedResponse === '' || trimmedCorrect === '') {
    return false;
  }

  // Fast path: exact string match works for all modes
  if (trimmedResponse === trimmedCorrect) {
    return true;
  }

  try {
    const ce = getComputeEngine();

    switch (mode) {
      case 'strict': {
        // Parse without canonicalization to preserve original structure
        const responseExpr = ce.parse(trimmedResponse, { canonical: false });
        const correctExpr = ce.parse(trimmedCorrect, { canonical: false });

        if (!responseExpr.isValid || !correctExpr.isValid) {
          return trimmedResponse === trimmedCorrect;
        }

        // Compare raw parsed ASTs (JSON representation)
        return JSON.stringify(responseExpr.json) === JSON.stringify(correctExpr.json);
      }

      case 'canonical': {
        // Parse with default canonicalization
        const responseExpr = ce.parse(trimmedResponse);
        const correctExpr = ce.parse(trimmedCorrect);

        if (!responseExpr.isValid || !correctExpr.isValid) {
          return trimmedResponse === trimmedCorrect;
        }

        // Compare canonical (normalized) forms
        return JSON.stringify(responseExpr.canonical.json) === JSON.stringify(correctExpr.canonical.json);
      }

      case 'algebraic': {
        const responseExpr = ce.parse(trimmedResponse);
        const correctExpr = ce.parse(trimmedCorrect);

        if (!responseExpr.isValid || !correctExpr.isValid) {
          return trimmedResponse === trimmedCorrect;
        }

        // Use isEqual for full mathematical equivalence
        return responseExpr.isEqual(correctExpr);
      }

      default:
        return false;
    }
  } catch {
    // On any error, fall back to string comparison
    return trimmedResponse === trimmedCorrect;
  }
}

/**
 * Get the formula comparison mode from a response declaration
 *
 * @param itemDoc - The item document
 * @param responseIdentifier - The response identifier to look up
 * @returns The comparison mode, or null if not a formula response
 */
export function getFormulaComparisonMode(
  itemDoc: Document,
  responseIdentifier: string
): MathComparisonMode | null {
  const declarations = itemDoc.getElementsByTagName('qti-response-declaration');

  for (let i = 0; i < declarations.length; i++) {
    const decl = declarations[i];
    if (decl.getAttribute('identifier') === responseIdentifier) {
      const responseType = decl.getAttribute('data-response-type');
      if (responseType === 'formula') {
        const mode = decl.getAttribute('data-comparison-mode');
        if (mode === 'strict' || mode === 'canonical' || mode === 'algebraic') {
          return mode;
        }
        // Default to canonical if no mode specified
        return 'canonical';
      }
      break;
    }
  }

  return null;
}
