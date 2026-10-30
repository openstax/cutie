import { parseNumber, roundScore } from '@openstax/cutie-core';
import { createXmlElement } from '../serialization/xmlUtils.js';
import type { ResponseProcessingMode } from '../types.js';

// The item's maximum score, as the editor declares and reads it: MAXSCORE (the
// spec's declaration of an item's maximum score), with SCORE's normal-maximum
// kept in step with it.

/**
 * The maximum score sumScores response processing declares: the maximum set by
 * the author or the one inferred from the responses, at least 0 when the score
 * is floored at 0, or null when neither is known.
 *
 * @param override - The maximum score set by the author, if any
 * @param inferred - The maximum inferred from the responses, or null
 * @param floored - Whether the score is floored at 0
 */
export function effectiveMaximumScore(override: number | undefined, inferred: number | null, floored: boolean): number | null {
  const maximum = override ?? inferred;
  if (maximum === null) return null;
  return roundScore(floored ? Math.max(maximum, 0) : maximum);
}

/**
 * The maximum score an item declares: its MAXSCORE default value, or null when
 * it has none. (SCORE's normal-maximum is only kept in step with MAXSCORE, never
 * read as the maximum: the spec gives it no effect on scoring.)
 */
export function getDeclaredMaximumScore(doc: Document): number | null {
  const maxScore = doc.querySelector('qti-outcome-declaration[identifier="MAXSCORE"]');
  return maxScore ? readDefaultNumber(maxScore) : null;
}

/**
 * Read an outcome declaration's default value as a number, as delivery does: a
 * single cardinality declaration's (first) value, or null when it isn't a number
 */
function readDefaultNumber(declaration: Element): number | null {
  const cardinality = declaration.getAttribute('cardinality') || 'single';
  if (cardinality !== 'single') return null;
  return parseNumber(declaration.querySelector('qti-default-value > qti-value')?.textContent ?? '');
}

/**
 * Keep the item's maximum score declarations in step.
 *
 * - allCorrect/sumScores: MAXSCORE declares the maximum generated response
 *   processing gives, and is removed when that isn't known. SCORE's
 *   normal-maximum, if it has one, follows it (removed when unknown or not
 *   positive, since it must be). It's never added.
 * - manual: SCORE's normal-maximum declares the points: as loaded if positive
 *   (it must be), or else the item's MAXSCORE if positive, or else 1. MAXSCORE,
 *   if the item has one, follows it. It's never added.
 * - custom: as loaded
 *
 * @param declarations - The outcome declarations, in order (updated in place)
 * @param mode - The scoring mode
 * @param declaredMaximumScore - The maximum score generated response processing
 *   declares, for the modes that manage it
 * @param doc - The XML document
 */
export function applyMaximumScore(
  declarations: Element[],
  mode: ResponseProcessingMode | undefined,
  declaredMaximumScore: { value: number | null } | undefined,
  doc: Document
): void {
  const find = (identifier: string) => declarations.find((declaration) => declaration.getAttribute('identifier') === identifier);
  const score = find('SCORE');
  let maxScore = find('MAXSCORE');

  if (declaredMaximumScore) {
    const { value } = declaredMaximumScore;
    if (score?.hasAttribute('normal-maximum')) {
      if (value === null || value <= 0) {
        score.removeAttribute('normal-maximum');
      } else {
        setNumberAttribute(score, 'normal-maximum', value);
      }
    }

    if (value === null) {
      if (maxScore) declarations.splice(declarations.indexOf(maxScore), 1);
      return;
    }
    if (!maxScore) {
      maxScore = createXmlElement(doc, 'qti-outcome-declaration');
      maxScore.setAttribute('identifier', 'MAXSCORE');
      declarations.splice(score ? declarations.indexOf(score) + 1 : 0, 0, maxScore);
    }
    setMaximumScoreDefault(maxScore, value, doc);
  } else if (mode === 'manual' && score) {
    const positive = (value: number | null) => (value !== null && value > 0 ? value : null);
    const points = positive(parseNumber(score.getAttribute('normal-maximum') ?? ''))
      ?? positive(maxScore ? readDefaultNumber(maxScore) : null);
    if (points === null) {
      score.setAttribute('normal-maximum', '1.0');
    } else {
      setNumberAttribute(score, 'normal-maximum', points);
    }
    if (maxScore) {
      setMaximumScoreDefault(maxScore, points ?? 1, doc);
    }
  }
}

/**
 * Set MAXSCORE's default value, as the single float the spec requires it to be
 */
function setMaximumScoreDefault(maxScore: Element, value: number, doc: Document): void {
  maxScore.setAttribute('cardinality', 'single');
  maxScore.setAttribute('base-type', 'float');
  setDefaultNumber(maxScore, value, doc);
}

/**
 * Set a numeric attribute, keeping its text (e.g. "2.0") when it's already that number
 */
function setNumberAttribute(element: Element, name: string, value: number): void {
  if (parseNumber(element.getAttribute(name) ?? '') !== value) {
    element.setAttribute(name, String(value));
  }
}

/**
 * Set an outcome declaration's default value to a single number, keeping the
 * existing value's text (e.g. "2.0") when it's already that number. The default
 * value comes first in the declaration, before any lookup table.
 */
function setDefaultNumber(declaration: Element, value: number, doc: Document): void {
  const existing = declaration.querySelector('qti-default-value');
  const values = existing ? Array.from(existing.querySelectorAll('qti-value')) : [];
  if (values.length === 1 && parseNumber(values[0].textContent ?? '') === value) {
    return;
  }
  existing?.remove();
  const defaultValue = createXmlElement(doc, 'qti-default-value');
  const valueElement = createXmlElement(doc, 'qti-value');
  valueElement.textContent = String(value);
  defaultValue.appendChild(valueElement);
  declaration.insertBefore(defaultValue, declaration.firstChild);
}
