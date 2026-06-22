import type { Score } from '../types';
/**
 * Builds an xAPI-compatible Score object from raw score and max score values.
 *
 * @param raw - The raw score achieved
 * @param max - The maximum possible score
 * @returns A Score object with raw, min, max, and scaled values
 */
export declare function buildScore(raw: number, max: number): Score;
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
export declare function extractStandardOutcomes(variables: Record<string, unknown>, itemDoc: Document): Score | null;
