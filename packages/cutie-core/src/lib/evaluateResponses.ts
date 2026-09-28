import {
  compareResponseValues,
  getAreaMapping,
  getCorrectResponse,
  getMaxAreaMappedValue,
  getMaxMappedValue,
  getResponseDeclaration,
  getResponseMapping,
  mapResponse,
  mapResponsePoint,
} from './responseDeclarations';

/**
 * How a single response was judged.
 */
export type ResponseEvaluation = 'correct' | 'incorrect' | 'partial';

/**
 * Judges one response variable against its own declaration, using the same
 * machinery response processing scores with:
 *
 * 1. A mapping (qti-mapping or qti-area-mapping): full credit is `correct`,
 *    no credit is `incorrect`, anything between is `partial`.
 * 2. Otherwise a correct response: a match is `correct`, anything else `incorrect`.
 * 3. Neither: `null`, the response cannot be judged on its own.
 *
 * The declaration is taken at face value; items whose response processing
 * combines several responses still get a verdict per response.
 */
export function evaluateResponse(
  itemDoc: Document,
  identifier: string,
  variables: Record<string, unknown>
): ResponseEvaluation | null {
  const declaration = getResponseDeclaration(itemDoc, identifier);
  if (!declaration) return null;

  const cardinality = declaration.getAttribute('cardinality') || 'single';

  const mapping = getResponseMapping(itemDoc, identifier);
  if (mapping) {
    return evaluateMappedValue(
      mapResponse(itemDoc, identifier, variables),
      getMaxMappedValue(mapping, cardinality)
    );
  }

  const areaMapping = getAreaMapping(itemDoc, identifier);
  if (areaMapping) {
    return evaluateMappedValue(
      mapResponsePoint(itemDoc, identifier, variables),
      getMaxAreaMappedValue(areaMapping, cardinality)
    );
  }

  const correctValue = getCorrectResponse(itemDoc, identifier, variables);
  if (correctValue === null) return null;

  return compareResponseValues(itemDoc, identifier, variables[identifier] ?? null, correctValue)
    ? 'correct'
    : 'incorrect';
}

/**
 * Turns a mapped value into a verdict relative to the most the mapping can award.
 * A mapping that can never award credit gives no verdict.
 */
function evaluateMappedValue(value: number, maxValue: number): ResponseEvaluation | null {
  if (maxValue <= 0) return null;
  if (value >= maxValue) return 'correct';
  if (value <= 0) return 'incorrect';
  return 'partial';
}
