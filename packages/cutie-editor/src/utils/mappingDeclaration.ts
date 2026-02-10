import type { XmlNode } from '../serialization/xmlNode';
import { findChild, findChildren } from '../serialization/xmlNode';

// Re-export for convenience
export { findChild, findChildren } from '../serialization/xmlNode';

/**
 * Mapping metadata (attributes on qti-mapping element)
 */
export interface MappingMetadata {
  defaultValue: number;
  lowerBound?: number;
  upperBound?: number;
}

/**
 * A single map entry
 */
export interface MapEntry {
  mapKey: string;
  mappedValue: number;
  caseSensitive?: boolean;
}

/**
 * Full mapping data extracted from a declaration
 */
export interface MappingData {
  metadata: MappingMetadata;
  entries: MapEntry[];
}

/**
 * Check if a response declaration has a mapping defined
 */
export function hasMapping(decl: XmlNode): boolean {
  return !!findChild(decl, 'qti-mapping');
}

/**
 * Get the mapping element from a declaration
 */
export function getMappingElement(decl: XmlNode): XmlNode | undefined {
  return findChild(decl, 'qti-mapping');
}

/**
 * Extract mapping data from a declaration
 */
export function getMapping(decl: XmlNode): MappingData | undefined {
  const mapping = findChild(decl, 'qti-mapping');
  if (!mapping) return undefined;

  const defaultValue = parseFloat(mapping.attributes['default-value'] || '0');
  const lowerBoundStr = mapping.attributes['lower-bound'];
  const upperBoundStr = mapping.attributes['upper-bound'];

  const metadata: MappingMetadata = {
    defaultValue: isNaN(defaultValue) ? 0 : defaultValue,
    lowerBound: lowerBoundStr !== undefined ? parseFloat(lowerBoundStr) : undefined,
    upperBound: upperBoundStr !== undefined ? parseFloat(upperBoundStr) : undefined,
  };

  // Clean up NaN values
  if (metadata.lowerBound !== undefined && isNaN(metadata.lowerBound)) {
    metadata.lowerBound = undefined;
  }
  if (metadata.upperBound !== undefined && isNaN(metadata.upperBound)) {
    metadata.upperBound = undefined;
  }

  const entries = findChildren(mapping, 'qti-map-entry').map(entry => {
    const mapKey = entry.attributes['map-key'] || '';
    const mappedValue = parseFloat(entry.attributes['mapped-value'] || '0');
    const caseSensitiveStr = entry.attributes['case-sensitive'];

    const mapEntry: MapEntry = {
      mapKey,
      mappedValue: isNaN(mappedValue) ? 0 : mappedValue,
    };

    if (caseSensitiveStr !== undefined) {
      mapEntry.caseSensitive = caseSensitiveStr === 'true';
    }

    return mapEntry;
  });

  return { metadata, entries };
}

/**
 * Remove the mapping from a declaration (keeps the declaration itself)
 */
export function removeMapping(decl: XmlNode): XmlNode {
  return {
    tagName: decl.tagName,
    attributes: { ...decl.attributes },
    children: decl.children.filter(
      (c): c is XmlNode => typeof c !== 'string' && c.tagName !== 'qti-mapping'
    ),
  };
}

/**
 * Add an empty mapping to a declaration with default value
 */
export function addEmptyMapping(decl: XmlNode, defaultValue: number = 0): XmlNode {
  const cleanDecl = removeMapping(decl);
  return {
    ...cleanDecl,
    children: [
      ...cleanDecl.children,
      {
        tagName: 'qti-mapping',
        attributes: { 'default-value': String(defaultValue) },
        children: [],
      },
    ],
  };
}

/**
 * Update mapping metadata (default-value, lower-bound, upper-bound)
 */
export function updateMappingMetadata(decl: XmlNode, metadata: MappingMetadata): XmlNode {
  const mapping = findChild(decl, 'qti-mapping');
  if (!mapping) return decl;

  const newAttributes: Record<string, string> = {
    'default-value': String(metadata.defaultValue),
  };

  if (metadata.lowerBound !== undefined) {
    newAttributes['lower-bound'] = String(metadata.lowerBound);
  }
  if (metadata.upperBound !== undefined) {
    newAttributes['upper-bound'] = String(metadata.upperBound);
  }

  const newMapping: XmlNode = {
    tagName: 'qti-mapping',
    attributes: newAttributes,
    children: mapping.children,
  };

  return {
    tagName: decl.tagName,
    attributes: { ...decl.attributes },
    children: decl.children.map(c =>
      typeof c !== 'string' && c.tagName === 'qti-mapping' ? newMapping : c
    ),
  };
}

/**
 * Set all map entries in a mapping (replaces existing entries)
 */
export function setMapEntries(decl: XmlNode, entries: MapEntry[]): XmlNode {
  const mapping = findChild(decl, 'qti-mapping');
  if (!mapping) return decl;

  const entryNodes: XmlNode[] = entries.map(entry => {
    const attributes: Record<string, string> = {
      'map-key': entry.mapKey,
      'mapped-value': String(entry.mappedValue),
    };
    if (entry.caseSensitive !== undefined) {
      attributes['case-sensitive'] = String(entry.caseSensitive);
    }
    return {
      tagName: 'qti-map-entry',
      attributes,
      children: [],
    };
  });

  const newMapping: XmlNode = {
    tagName: 'qti-mapping',
    attributes: { ...mapping.attributes },
    children: entryNodes,
  };

  return {
    tagName: decl.tagName,
    attributes: { ...decl.attributes },
    children: decl.children.map(c =>
      typeof c !== 'string' && c.tagName === 'qti-mapping' ? newMapping : c
    ),
  };
}

/**
 * Compute the maximum possible mapped value for a single response declaration.
 *
 * For single cardinality: max of positive entry values.
 * For multiple/ordered cardinality: sum of positive entry values.
 * Respects upperBound if set on the mapping.
 * Returns null if no mapping or no positive entries.
 */
export function getMaxMappedValue(decl: XmlNode): number | null {
  const mapping = getMapping(decl);
  if (!mapping) return null;

  const positiveValues = mapping.entries
    .map(e => e.mappedValue)
    .filter(v => v > 0);

  if (positiveValues.length === 0) return null;

  const cardinality = decl.attributes['cardinality'] || 'single';
  let max: number;

  if (cardinality === 'multiple' || cardinality === 'ordered') {
    max = positiveValues.reduce((sum, v) => sum + v, 0);
  } else {
    max = Math.max(...positiveValues);
  }

  if (mapping.metadata.upperBound !== undefined) {
    max = Math.min(max, mapping.metadata.upperBound);
  }

  return max;
}

/**
 * Update mapping with both metadata and entries at once
 */
export function updateMapping(
  decl: XmlNode,
  metadata: MappingMetadata,
  entries: MapEntry[]
): XmlNode {
  // Ensure mapping exists
  let result = hasMapping(decl) ? decl : addEmptyMapping(decl, metadata.defaultValue);
  result = updateMappingMetadata(result, metadata);
  result = setMapEntries(result, entries);
  return result;
}
