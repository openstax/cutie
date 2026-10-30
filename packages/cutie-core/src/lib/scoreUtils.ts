import type { Score } from '../types.js';
import { deriveMaxScore } from './deriveMaxScore.js';

/**
 * Round a score to remove floating point noise (0.1 + 0.2 is 0.3, not
 * 0.30000000000000004), so scores compare and print as authored
 */
export function roundScore(score: number): number {
  return Math.round(score * 1e9) / 1e9;
}

/**
 * Builds an xAPI-compatible Score object from raw score and max score values.
 * Raw and scaled are rounded (see roundScore), so a full score scales to exactly 1.
 *
 * @param raw - The raw score achieved
 * @param max - The maximum possible score
 * @returns A Score object with raw, min, max, and scaled values
 */
export function buildScore(raw: number, max: number): Score {
  const rawScore = roundScore(raw);
  return {
    raw: rawScore,
    min: 0,
    max,
    scaled: max > 0 ? roundScore(rawScore / max) : 0,
  };
}

/**
 * Extract standard outcome variables (SCORE, MAXSCORE) from variables object
 * and build an xAPI-compatible Score.
 *
 * Returns null if either raw score or max score cannot be determined.
 *
 * @param variables - The current variable state
 * @param itemDoc - The QTI assessment item document
 * @returns A Score object or null if score cannot be determined
 */
export function extractStandardOutcomes(
  variables: Record<string, unknown>,
  itemDoc: Document
): Score | null {
  // Extract SCORE
  const scoreValue = variables['SCORE'];
  const rawScore = typeof scoreValue === 'number' ? scoreValue : null;

  // Derive MAXSCORE using shared function
  const maxScore = deriveMaxScore(itemDoc, variables);

  // Return null if either value cannot be determined
  if (rawScore === null || maxScore === null) {
    return null;
  }

  return buildScore(rawScore, maxScore);
}
