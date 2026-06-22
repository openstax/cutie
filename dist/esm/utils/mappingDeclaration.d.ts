import type { XmlNode } from '../serialization/xmlNode';
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
export declare function hasMapping(decl: XmlNode): boolean;
/**
 * Get the mapping element from a declaration
 */
export declare function getMappingElement(decl: XmlNode): XmlNode | undefined;
/**
 * Extract mapping data from a declaration
 */
export declare function getMapping(decl: XmlNode): MappingData | undefined;
/**
 * Remove the mapping from a declaration (keeps the declaration itself)
 */
export declare function removeMapping(decl: XmlNode): XmlNode;
/**
 * Add an empty mapping to a declaration with default value
 */
export declare function addEmptyMapping(decl: XmlNode, defaultValue?: number): XmlNode;
/**
 * Update mapping metadata (default-value, lower-bound, upper-bound)
 */
export declare function updateMappingMetadata(decl: XmlNode, metadata: MappingMetadata): XmlNode;
/**
 * Set all map entries in a mapping (replaces existing entries)
 */
export declare function setMapEntries(decl: XmlNode, entries: MapEntry[]): XmlNode;
/**
 * Compute the maximum possible mapped value for a single response declaration.
 *
 * For single cardinality: max of positive entry values.
 * For multiple/ordered cardinality: sum of positive entry values.
 * Respects upperBound if set on the mapping.
 * Returns null if no mapping or no positive entries.
 */
export declare function getMaxMappedValue(decl: XmlNode): number | null;
/**
 * Update mapping with both metadata and entries at once
 */
export declare function updateMapping(decl: XmlNode, metadata: MappingMetadata, entries: MapEntry[]): XmlNode;
