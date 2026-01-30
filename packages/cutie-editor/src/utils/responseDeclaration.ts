import type { XmlNode } from '../serialization/xmlNode';
import { findChild, findChildren } from '../serialization/xmlNode';

// Re-export for convenience
export { findChild, findChildren } from '../serialization/xmlNode';

/**
 * Check if a response declaration has a correct response defined
 */
export function hasCorrectResponse(decl: XmlNode): boolean {
  return !!findChild(decl, 'qti-correct-response');
}

/**
 * Get the correct response element from a declaration
 */
export function getCorrectResponse(decl: XmlNode): XmlNode | undefined {
  return findChild(decl, 'qti-correct-response');
}

/**
 * Remove the correct response from a declaration (keeps the declaration itself)
 */
export function removeCorrectResponse(decl: XmlNode): XmlNode {
  return {
    tagName: decl.tagName,
    attributes: { ...decl.attributes },
    children: decl.children.filter(
      (c): c is XmlNode => typeof c !== 'string' && c.tagName !== 'qti-correct-response'
    ),
  };
}

/**
 * Add an empty correct response to a declaration
 */
export function addEmptyCorrectResponse(decl: XmlNode): XmlNode {
  const cleanDecl = removeCorrectResponse(decl);
  return {
    ...cleanDecl,
    children: [
      ...cleanDecl.children,
      {
        tagName: 'qti-correct-response',
        attributes: {},
        children: [],
      },
    ],
  };
}

/**
 * Extract multiple correct values from a response declaration (for choice interactions)
 */
export function getCorrectValues(decl: XmlNode): string[] {
  const correctResponse = findChild(decl, 'qti-correct-response');
  if (!correctResponse) return [];
  return findChildren(correctResponse, 'qti-value')
    .map(v => (typeof v.children[0] === 'string' ? v.children[0] : ''))
    .filter(Boolean);
}

/**
 * Extract a single correct value from a response declaration (for text entry interactions)
 */
export function getCorrectValue(decl: XmlNode): string {
  const correctResponse = findChild(decl, 'qti-correct-response');
  if (!correctResponse) return '';
  const value = findChild(correctResponse, 'qti-value');
  if (!value) return '';
  return typeof value.children[0] === 'string' ? value.children[0] : '';
}

/**
 * Set multiple correct values in a response declaration (for choice interactions)
 * Also updates the cardinality attribute
 */
export function setCorrectValues(
  decl: XmlNode,
  values: string[],
  cardinality: 'single' | 'multiple'
): XmlNode {
  // Clone the declaration with updated cardinality, removing old correct response
  const newDecl: XmlNode = {
    tagName: decl.tagName,
    attributes: { ...decl.attributes, cardinality },
    children: decl.children.filter(
      (c): c is XmlNode => typeof c !== 'string' && c.tagName !== 'qti-correct-response'
    ),
  };

  // Add new correct response if there are values
  if (values.length > 0) {
    const correctResponse: XmlNode = {
      tagName: 'qti-correct-response',
      attributes: {},
      children: values.map(v => ({
        tagName: 'qti-value',
        attributes: {},
        children: [v],
      })),
    };
    newDecl.children.push(correctResponse);
  }

  return newDecl;
}

/**
 * Update a single correct value in a response declaration (for text entry interactions)
 * Preserves the qti-correct-response element even if value is empty
 */
export function updateCorrectValue(decl: XmlNode, value: string): XmlNode {
  const otherChildren = decl.children.filter(
    (c): c is XmlNode => typeof c !== 'string' && c.tagName !== 'qti-correct-response'
  );

  const correctResponse: XmlNode = {
    tagName: 'qti-correct-response',
    attributes: {},
    children: value !== '' ? [{
      tagName: 'qti-value',
      attributes: {},
      children: [value],
    }] : [],
  };

  return {
    tagName: decl.tagName,
    attributes: { ...decl.attributes },
    children: [...otherChildren, correctResponse],
  };
}

/**
 * Update an attribute on a response declaration
 */
export function updateDeclAttribute(decl: XmlNode, key: string, value: string): XmlNode {
  return {
    tagName: decl.tagName,
    attributes: { ...decl.attributes, [key]: value },
    children: [...decl.children],
  };
}

/**
 * Update the identifier in a response declaration
 */
export function updateIdentifier(decl: XmlNode, identifier: string): XmlNode {
  return updateDeclAttribute(decl, 'identifier', identifier);
}

/**
 * Update the cardinality in a response declaration
 */
export function updateCardinality(decl: XmlNode, cardinality: 'single' | 'multiple'): XmlNode {
  return updateDeclAttribute(decl, 'cardinality', cardinality);
}

/**
 * Update the base-type in a response declaration
 */
export function updateBaseType(decl: XmlNode, baseType: string): XmlNode {
  return updateDeclAttribute(decl, 'base-type', baseType);
}

/**
 * Get the base-type from a response declaration
 */
export function getBaseType(decl: XmlNode): string {
  return decl.attributes['base-type'] || 'string';
}

/**
 * Get the cardinality from a response declaration
 */
export function getCardinality(decl: XmlNode): 'single' | 'multiple' {
  const cardinality = decl.attributes['cardinality'];
  return cardinality === 'multiple' ? 'multiple' : 'single';
}

/**
 * Get the identifier from a response declaration
 */
export function getIdentifier(decl: XmlNode): string {
  return decl.attributes['identifier'] || '';
}
