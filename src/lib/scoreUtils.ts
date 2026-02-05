import type { Score } from '../types';
import { deriveMaxScore } from './deriveMaxScore';

/**
 * Builds an xAPI-compatible Score object from raw score and max score values.
 *
 * @param raw - The raw score achieved
 * @param max - The maximum possible score
 * @returns A Score object with raw, min, max, and scaled values
 */
export function buildScore(raw: number, max: number): Score {
  return {
    raw,
    min: 0,
    max,
    scaled: max > 0 ? raw / max : 0,
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
