import { deepEqual, deepEqualUnordered } from '../utils/equality';
import { normalizePair, parseResponseValue } from '../utils/typeParser';
import { compareMathExpressions, type MathComparisonMode } from './expressionEvaluator/math';

/**
 * Reads and applies the scoring data carried by qti-response-declaration elements:
 * correct responses, mappings and area mappings.
 *
 * Shared by response processing (which scores with them) and response evaluation
 * (which judges each interaction with them), so both compare responses identically.
 */

/**
 * Find the qti-response-declaration with the given identifier
 */
export function getResponseDeclaration(itemDoc: Document, identifier: string): Element | null {
  const declarations = itemDoc.getElementsByTagName('qti-response-declaration');
  for (let i = 0; i < declarations.length; i++) {
    if (declarations[i].getAttribute('identifier') === identifier) {
      return declarations[i];
    }
  }
  return null;
}

/**
 * Get the cardinality of a response declaration
 */
function getResponseCardinality(itemDoc: Document, identifier: string): string {
  return getResponseDeclaration(itemDoc, identifier)?.getAttribute('cardinality') || 'single';
}

/**
 * Compare response values, using formula comparison when appropriate
 *
 * This is the single source of truth for response comparison. It detects
 * formula responses via data-response-type="formula" and routes to
 * Compute Engine comparison with the specified mode.
 */
export function compareResponseValues(
  itemDoc: Document,
  responseIdentifier: string,
  responseValue: unknown,
  correctValue: unknown
): boolean {
  const declaration = getResponseDeclaration(itemDoc, responseIdentifier);

  if (declaration?.getAttribute('data-response-type') === 'formula') {
    const mode = (declaration.getAttribute('data-comparison-mode') || 'canonical') as MathComparisonMode;
    return compareMathExpressions(
      String(responseValue ?? ''),
      String(correctValue ?? ''),
      mode
    );
  }

  // Multiple cardinality responses are unordered sets; order should not matter
  const cardinality = getResponseCardinality(itemDoc, responseIdentifier);
  if (cardinality === 'multiple') {
    return deepEqualUnordered(responseValue, correctValue);
  }

  return deepEqual(responseValue, correctValue);
}

/**
 * Get the correct response value for a response variable.
 *
 * A value set by qti-set-correct-response during template processing takes
 * precedence over the declared qti-correct-response. Returns null when there
 * is neither.
 */
export function getCorrectResponse(
  itemDoc: Document,
  identifier: string,
  variables: Record<string, unknown>
): unknown {
  const templateCorrect = variables[`__correct_${identifier}`];
  if (templateCorrect !== undefined) return templateCorrect;

  const declaration = getResponseDeclaration(itemDoc, identifier);
  const correctResponse = declaration?.getElementsByTagName('qti-correct-response')[0];
  if (!declaration || !correctResponse) return null;

  const cardinality = declaration.getAttribute('cardinality') || 'single';
  const baseType = declaration.getAttribute('base-type') || 'identifier';
  const valueElements = correctResponse.getElementsByTagName('qti-value');

  if (cardinality === 'single') {
    if (valueElements.length > 0) {
      return parseResponseValue(valueElements[0].textContent || '', baseType);
    }
  } else if (cardinality === 'multiple' || cardinality === 'ordered') {
    const values: unknown[] = [];
    for (let j = 0; j < valueElements.length; j++) {
      values.push(parseResponseValue(valueElements[j].textContent || '', baseType));
    }
    return values;
  }

  return null;
}

/**
 * Read an optional numeric bound attribute, or null when it is absent
 */
function parseBound(element: Element, name: string): number | null {
  return element.hasAttribute(name) ? parseFloat(element.getAttribute(name)!) : null;
}

/**
 * Get the response mapping from a response declaration
 */
export function getResponseMapping(itemDoc: Document, identifier: string): ResponseMapping | null {
  const declaration = getResponseDeclaration(itemDoc, identifier);
  const mappingElement = declaration?.getElementsByTagName('qti-mapping')[0];
  if (!mappingElement) return null;

  const defaultValue = parseFloat(mappingElement.getAttribute('default-value') || '0');

  const isPair = declaration?.getAttribute('base-type') === 'pair';
  const mapEntries: MapEntry[] = [];
  const mapEntryElements = mappingElement.getElementsByTagName('qti-map-entry');

  for (let j = 0; j < mapEntryElements.length; j++) {
    const entry = mapEntryElements[j];
    const mapKey = entry.getAttribute('map-key');
    const mappedValue = entry.getAttribute('mapped-value');
    const caseSensitive = entry.getAttribute('case-sensitive') === 'true';
    if (mapKey && mappedValue) {
      mapEntries.push({
        mapKey: isPair ? normalizePair(mapKey) : mapKey,
        mappedValue: parseFloat(mappedValue),
        caseSensitive
      });
    }
  }

  return {
    defaultValue,
    lowerBound: parseBound(mappingElement, 'lower-bound'),
    upperBound: parseBound(mappingElement, 'upper-bound'),
    entries: mapEntries
  };
}

/**
 * Get mapped value for a given response value.
 * Per QTI spec, string mapping is case-insensitive by default.
 * Individual map entries can override this with case-sensitive="true".
 */
function getMappedValue(value: unknown, mapping: ResponseMapping): number {
  const key = String(value);

  for (const entry of mapping.entries) {
    const matches = entry.caseSensitive
      ? key === entry.mapKey
      : key.toLowerCase() === entry.mapKey.toLowerCase();

    if (matches) {
      return entry.mappedValue;
    }
  }

  return mapping.defaultValue;
}

/**
 * Clamp a mapped total to the mapping's lower and upper bounds
 */
function applyMappingBounds(
  score: number,
  bounds: { lowerBound: number | null; upperBound: number | null }
): number {
  if (bounds.lowerBound !== null && score < bounds.lowerBound) {
    return bounds.lowerBound;
  }
  if (bounds.upperBound !== null && score > bounds.upperBound) {
    return bounds.upperBound;
  }
  return score;
}

/**
 * Map a response variable through its qti-mapping (the qti-map-response operator).
 * Returns 0 when the response is null or the declaration has no mapping.
 */
export function mapResponse(
  itemDoc: Document,
  identifier: string,
  variables: Record<string, unknown>
): number {
  const responseValue = variables[identifier];

  if (responseValue === null || responseValue === undefined) {
    return 0.0;
  }

  const mapping = getResponseMapping(itemDoc, identifier);
  if (!mapping) {
    return 0.0;
  }

  const score = Array.isArray(responseValue)
    ? responseValue.reduce<number>((sum, value) => sum + getMappedValue(value, mapping), 0)
    : getMappedValue(responseValue, mapping);

  return applyMappingBounds(score, mapping);
}

/**
 * The highest value a response can map to: the best single entry for single
 * cardinality, or every positive entry for multiple and ordered, within the
 * mapping's bounds. Returns null when that can't be known.
 */
export function getMaxMappedValue(mapping: ResponseMapping, cardinality: string): number | null {
  return getMaxMapped(mapping.entries.map((entry) => entry.mappedValue), mapping, cardinality);
}

/**
 * Get area mapping from a response declaration
 */
export function getAreaMapping(itemDoc: Document, identifier: string): AreaMapping | null {
  const declaration = getResponseDeclaration(itemDoc, identifier);
  const areaMappingElement = declaration?.getElementsByTagName('qti-area-mapping')[0];
  if (!areaMappingElement) return null;

  const defaultValue = parseFloat(areaMappingElement.getAttribute('default-value') || '0');

  const areaMapEntries: AreaMapEntry[] = [];
  const entryElements = areaMappingElement.getElementsByTagName('qti-area-map-entry');

  for (let j = 0; j < entryElements.length; j++) {
    const entry = entryElements[j];
    const shape = entry.getAttribute('shape');
    const coords = entry.getAttribute('coords');
    const mappedValue = entry.getAttribute('mapped-value');

    if (shape && coords && mappedValue) {
      areaMapEntries.push({
        shape,
        coords: coords.split(',').map(c => parseFloat(c.trim())),
        mappedValue: parseFloat(mappedValue)
      });
    }
  }

  return {
    defaultValue,
    lowerBound: parseBound(areaMappingElement, 'lower-bound'),
    upperBound: parseBound(areaMappingElement, 'upper-bound'),
    entries: areaMapEntries
  };
}

/**
 * Find the area a point falls in: the first entry containing it, so areas
 * listed first take priority where they overlap. Returns -1 when the point
 * is in no area or cannot be parsed.
 */
function findAreaIndex(point: unknown, areaMapping: AreaMapping): number {
  // Parse point - can be string like "100 100" or array [100, 100]
  let x: number, y: number;

  if (typeof point === 'string') {
    const parts = point.trim().split(/\s+/);
    x = parseFloat(parts[0]);
    y = parseFloat(parts[1]);
  } else if (Array.isArray(point) && point.length >= 2) {
    x = Number(point[0]);
    y = Number(point[1]);
  } else {
    return -1;
  }

  return areaMapping.entries.findIndex((entry) => isPointInArea(x, y, entry.shape, entry.coords));
}

/**
 * Map a point response variable through its qti-area-mapping (the
 * qti-map-response-point operator). Returns 0 when the response is null or the
 * declaration has no area mapping.
 *
 * Per QTI, when mapping containers each area is mapped once only: several
 * points in the same area add its value to the total just once. A point in no
 * area adds the default value. The total is clamped to the mapping's bounds.
 */
export function mapResponsePoint(
  itemDoc: Document,
  identifier: string,
  variables: Record<string, unknown>
): number {
  const responseValue = variables[identifier];

  if (responseValue === null || responseValue === undefined) {
    return 0;
  }

  const areaMapping = getAreaMapping(itemDoc, identifier);
  if (!areaMapping) {
    return 0;
  }

  const points = Array.isArray(responseValue) ? responseValue : [responseValue];
  const mappedAreas = new Set<number>();
  let score = 0;

  for (const point of points) {
    const areaIndex = findAreaIndex(point, areaMapping);
    if (areaIndex === -1) {
      score += areaMapping.defaultValue;
    } else if (!mappedAreas.has(areaIndex)) {
      mappedAreas.add(areaIndex);
      score += areaMapping.entries[areaIndex].mappedValue;
    }
  }

  return applyMappingBounds(score, areaMapping);
}

/**
 * The highest value a point response can map to: the best single area for
 * single cardinality, or every positive area for multiple, within the
 * mapping's bounds. Returns null when that can't be known.
 */
export function getMaxAreaMappedValue(areaMapping: AreaMapping, cardinality: string): number | null {
  return getMaxMapped(areaMapping.entries.map((entry) => entry.mappedValue), areaMapping, cardinality);
}

/**
 * The highest total a set of mapped values can reach. For multiple and ordered
 * responses every unmapped value earns the default, so a positive default has
 * no limit but the upper bound: without one the maximum is unknown (null).
 */
function getMaxMapped(
  values: number[],
  mapping: { defaultValue: number; lowerBound: number | null; upperBound: number | null },
  cardinality: string
): number | null {
  if (cardinality === 'single') {
    return applyMappingBounds(Math.max(mapping.defaultValue, ...values), mapping);
  }

  if (mapping.defaultValue > 0) {
    return mapping.upperBound;
  }

  const max = values.filter((value) => value > 0).reduce((sum, value) => sum + value, 0);
  return applyMappingBounds(max, mapping);
}

/**
 * Check if a point is inside a defined area
 */
function isPointInArea(x: number, y: number, shape: string, coords: number[]): boolean {
  switch (shape) {
    case 'circle':
      // coords: [centerX, centerY, radius]
      if (coords.length >= 3) {
        const [cx, cy, r] = coords;
        const distance = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
        return distance <= r;
      }
      return false;

    case 'rect':
      // coords: [x1, y1, x2, y2]
      if (coords.length >= 4) {
        const [x1, y1, x2, y2] = coords;
        return x >= x1 && x <= x2 && y >= y1 && y <= y2;
      }
      return false;

    case 'poly': {
      // coords: [x1, y1, x2, y2, x3, y3, ...]
      // Use ray casting algorithm
      if (coords.length < 6) return false;

      let inside = false;
      for (let i = 0, j = coords.length - 2; i < coords.length; i += 2) {
        const xi = coords[i], yi = coords[i + 1];
        const xj = coords[j], yj = coords[j + 1];

        const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;

        j = i;
      }
      return inside;
    }

    default:
      return false;
  }
}

// Type definitions

interface MapEntry {
  mapKey: string;
  mappedValue: number;
  caseSensitive: boolean;
}

export interface ResponseMapping {
  defaultValue: number;
  lowerBound: number | null;
  upperBound: number | null;
  entries: MapEntry[];
}

export interface AreaMapping {
  defaultValue: number;
  lowerBound: number | null;
  upperBound: number | null;
  entries: AreaMapEntry[];
}

interface AreaMapEntry {
  shape: string;
  coords: number[];
  mappedValue: number;
}
