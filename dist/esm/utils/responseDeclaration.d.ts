import type { XmlNode } from '../serialization/xmlNode';
export { findChild, findChildren } from '../serialization/xmlNode';
/**
 * Check if a response declaration has a correct response defined
 */
export declare function hasCorrectResponse(decl: XmlNode): boolean;
/**
 * Get the correct response element from a declaration
 */
export declare function getCorrectResponse(decl: XmlNode): XmlNode | undefined;
/**
 * Remove the correct response from a declaration (keeps the declaration itself)
 */
export declare function removeCorrectResponse(decl: XmlNode): XmlNode;
/**
 * Add an empty correct response to a declaration
 */
export declare function addEmptyCorrectResponse(decl: XmlNode): XmlNode;
/**
 * Extract multiple correct values from a response declaration (for choice interactions)
 */
export declare function getCorrectValues(decl: XmlNode): string[];
/**
 * Extract a single correct value from a response declaration (for text entry interactions)
 */
export declare function getCorrectValue(decl: XmlNode): string;
/**
 * Set multiple correct values in a response declaration (for choice interactions)
 * Also updates the cardinality attribute
 */
export declare function setCorrectValues(decl: XmlNode, values: string[], cardinality: 'single' | 'multiple'): XmlNode;
/**
 * Update a single correct value in a response declaration (for text entry interactions)
 * Preserves the qti-correct-response element even if value is empty
 */
export declare function updateCorrectValue(decl: XmlNode, value: string): XmlNode;
/**
 * Update an attribute on a response declaration
 */
export declare function updateDeclAttribute(decl: XmlNode, key: string, value: string): XmlNode;
/**
 * Update the identifier in a response declaration
 */
export declare function updateIdentifier(decl: XmlNode, identifier: string): XmlNode;
/**
 * Update the cardinality in a response declaration
 */
export declare function updateCardinality(decl: XmlNode, cardinality: 'single' | 'multiple'): XmlNode;
/**
 * Update the base-type in a response declaration
 */
export declare function updateBaseType(decl: XmlNode, baseType: string): XmlNode;
/**
 * Get the base-type from a response declaration
 */
export declare function getBaseType(decl: XmlNode): string;
/**
 * Get the cardinality from a response declaration
 */
export declare function getCardinality(decl: XmlNode): 'single' | 'multiple';
/**
 * Get the identifier from a response declaration
 */
export declare function getIdentifier(decl: XmlNode): string;
/**
 * Get an arbitrary attribute from a response declaration
 */
export declare function getResponseDeclAttribute(decl: XmlNode, attrName: string): string | undefined;
/**
 * Remove an attribute from a response declaration
 */
export declare function removeDeclAttribute(decl: XmlNode, attrName: string): XmlNode;
