import type { Descendant } from 'slate';
import { promptSerializers } from '../elements/prompt';
import { simpleChoiceSerializers } from '../elements/simpleChoice';
import { choiceSerializers } from '../interactions/choice';
import { extendedTextSerializers } from '../interactions/extendedText';
import { textEntrySerializers } from '../interactions/textEntry';
import type { DocumentMetadata, ResponseProcessingConfig, SerializationResult, SlateElement, SlateText, TextAlign, ValidationError } from '../types';
import { generateResponseProcessingXml } from '../utils/responseProcessingGenerator';
import { type XmlNode, xmlNodeToDom } from './xmlNode';
import { createXmlDocument, createXmlElement } from './xmlUtils';

const QTI_NAMESPACE = 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0';

/**
 * Internal result type that includes response declarations and processing config
 */
interface InternalSerializationResult extends SerializationResult {
  responseDeclarations: Map<string, XmlNode>;
  outcomeDeclarations: Map<string, XmlNode>;
  responseProcessingConfig?: ResponseProcessingConfig;
}

/**
 * Check if a node is a document metadata node
 */
function isDocumentMetadata(node: Descendant): node is DocumentMetadata {
  return 'type' in node && node.type === 'document-metadata';
}

/**
 * Check if a node is an empty paragraph (only contains empty text)
 */
function isEmptyParagraph(node: Descendant): boolean {
  if (!('type' in node) || node.type !== 'paragraph') {
    return false;
  }
  const element = node as SlateElement;
  return element.children.every(
    (child) => 'text' in child && child.text === ''
  );
}

/**
 * Strip empty spacer paragraphs from nodes array.
 * These are added by the editor for cursor positioning but shouldn't be serialized.
 * Empty paragraphs serve no purpose in QTI content.
 */
function stripEmptySpacerParagraphs(nodes: Descendant[]): Descendant[] {
  return nodes.filter((node) => !isEmptyParagraph(node));
}

/**
 * Serialize Slate document to QTI XML
 *
 * @param nodes - Slate descendants
 * @returns Serialization result with XML string, identifiers, and errors
 */
export function serializeSlateToXml(nodes: Descendant[]): InternalSerializationResult {
  const doc = createXmlDocument();
  const itemBody = doc.documentElement;

  const context: SerializationContext = {
    doc,
    responseIdentifiers: [],
    errors: [],
    responseDeclarations: new Map(),
    outcomeDeclarations: new Map(),
  };

  // Extract document metadata if present (always at position [0])
  let responseProcessingConfig: ResponseProcessingConfig | undefined;
  if (nodes.length > 0 && isDocumentMetadata(nodes[0])) {
    responseProcessingConfig = nodes[0].responseProcessing;
  }

  // Filter out metadata node and empty spacer paragraphs
  const contentNodes = nodes.filter((node) => !isDocumentMetadata(node));
  const nodesToSerialize = stripEmptySpacerParagraphs(contentNodes);

  // Convert Slate nodes to XML
  for (const node of nodesToSerialize) {
    const element = convertSlateNodeToXml(node, context);
    if (element) {
      itemBody.appendChild(element);
    }
  }

  // Check for duplicate response identifiers
  checkDuplicateIdentifiers(context);

  // Serialize to string
  const serializer = new XMLSerializer();
  const xml = serializer.serializeToString(doc);

  return {
    xml,
    responseIdentifiers: context.responseIdentifiers,
    errors: context.errors.length > 0 ? context.errors : undefined,
    responseDeclarations: context.responseDeclarations,
    outcomeDeclarations: context.outcomeDeclarations,
    responseProcessingConfig,
  };
}

/**
 * Serialization context for tracking state
 */
export interface SerializationContext {
  doc: XMLDocument;
  responseIdentifiers: string[];
  errors: ValidationError[];
  responseDeclarations: Map<string, XmlNode>;
  outcomeDeclarations: Map<string, XmlNode>;
}

// Single contact point per interaction: spread all serializer objects
const interactionSerializers: Record<string, (el: SlateElement, ctx: SerializationContext, convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void) => Element | DocumentFragment | null> = {
  ...choiceSerializers,
  ...textEntrySerializers,
  ...extendedTextSerializers,
  ...promptSerializers,
  ...simpleChoiceSerializers,
};

/**
 * Convert a Slate node to an XML element or text node
 */
function convertSlateNodeToXml(
  node: Descendant,
  context: SerializationContext
): Node | null {
  // Text node
  if ('text' in node) {
    return convertTextNodeToXml(node as SlateText, context);
  }

  // Element node
  const element = node as SlateElement;

  // Helper to convert children
  const convertChildren = (children: Descendant[], parent: Element | DocumentFragment) => {
    for (const child of children) {
      const childNode = convertSlateNodeToXml(child, context);
      if (childNode) {
        parent.appendChild(childNode);
      }
    }
  };

  // Check interaction serializers first
  const serializer = interactionSerializers[element.type];
  if (serializer) {
    return serializer(element, context, convertChildren);
  }

  // Fall through to generic elements
  switch (element.type) {

    case 'qti-unknown':
      return convertUnknownQtiElement(element, context);

    case 'paragraph':
      return convertParagraph(element, context);

    case 'div':
      return convertDiv(element, context);

    case 'span':
      return convertSpan(element, context);

    case 'heading':
      return convertHeading(element, context);

    case 'image':
      return convertImage(element, context);

    case 'line-break':
      return convertLineBreak(element, context);

    case 'list':
      return convertList(element, context);

    case 'list-item':
      return convertListItem(element, context);

    case 'strong':
      return convertStrong(element, context);

    case 'em':
      return convertEm(element, context);

    case 'blockquote':
      return convertBlockquote(element, context);

    case 'horizontal-rule':
      return convertHorizontalRule(element, context);

    default:
      // Unknown element type - treat as div
      return convertDiv(element as any, context);
  }
}

/**
 * Convert text node to XML text node (with formatting elements if needed)
 */
function convertTextNodeToXml(
  node: SlateText,
  context: SerializationContext
): Node | DocumentFragment {
  let textNode: Node = context.doc.createTextNode(node.text);

  // Wrap in formatting elements if needed (use QTI namespace for all elements)
  if (node.bold) {
    const strong = createXmlElement(context.doc, 'strong');
    strong.appendChild(textNode);
    textNode = strong;
  }

  if (node.italic) {
    const em = createXmlElement(context.doc, 'em');
    em.appendChild(textNode);
    textNode = em;
  }

  if (node.underline) {
    const u = createXmlElement(context.doc, 'u');
    u.appendChild(textNode);
    textNode = u;
  }

  if (node.code) {
    const code = createXmlElement(context.doc, 'code');
    code.appendChild(textNode);
    textNode = code;
  }

  if (node.strikethrough) {
    const s = createXmlElement(context.doc, 's');
    s.appendChild(textNode);
    textNode = s;
  }

  return textNode;
}

/**
 * Convert unknown QTI element
 */
function convertUnknownQtiElement(
  element: SlateElement & { type: 'qti-unknown' },
  context: SerializationContext
): Element | null {
  // If we have raw XML, try to use that for perfect round-trip
  if (element.rawXml) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(element.rawXml, 'application/xml');
      const imported = context.doc.importNode(doc.documentElement, true);
      return imported as Element;
    } catch {
      // Fall through to manual reconstruction
    }
  }

  // Otherwise, reconstruct from stored data
  const xmlElement = createXmlElement(context.doc, element.originalTagName);
  setAttributes(xmlElement, element.attributes);

  // Convert children if not void
  if (!element.isVoid) {
    for (const child of element.children) {
      const childNode = convertSlateNodeToXml(child, context);
      if (childNode) {
        xmlElement.appendChild(childNode);
      }
    }
  }

  return xmlElement;
}

/**
 * Convert paragraph element
 */
function convertParagraph(
  element: SlateElement & { type: 'paragraph'; align?: TextAlign },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'p');

  if (element.attributes) {
    setAttributes(xmlElement, element.attributes);
  }

  // Add alignment to style attribute
  const style = buildStyleWithAlignment(element.attributes?.['style'], element.align);
  if (style) {
    xmlElement.setAttribute('style', style);
  }

  // Convert children
  for (const child of element.children) {
    const childNode = convertSlateNodeToXml(child, context);
    if (childNode) {
      xmlElement.appendChild(childNode);
    }
  }

  return xmlElement;
}

/**
 * Convert div element
 */
function convertDiv(
  element: SlateElement & { type: 'div' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'div');

  if (element.attributes) {
    setAttributes(xmlElement, element.attributes);
  }

  // Convert children
  for (const child of element.children) {
    const childNode = convertSlateNodeToXml(child, context);
    if (childNode) {
      xmlElement.appendChild(childNode);
    }
  }

  return xmlElement;
}

/**
 * Convert span element
 */
function convertSpan(
  element: SlateElement & { type: 'span' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'span');

  if (element.attributes) {
    setAttributes(xmlElement, element.attributes);
  }

  // Convert children
  for (const child of element.children) {
    const childNode = convertSlateNodeToXml(child, context);
    if (childNode) {
      xmlElement.appendChild(childNode);
    }
  }

  return xmlElement;
}

/**
 * Convert heading element
 */
function convertHeading(
  element: SlateElement & { type: 'heading'; align?: TextAlign },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, `h${element.level}`);

  if (element.attributes) {
    setAttributes(xmlElement, element.attributes);
  }

  // Add alignment to style attribute
  const style = buildStyleWithAlignment(element.attributes?.['style'], element.align);
  if (style) {
    xmlElement.setAttribute('style', style);
  }

  // Convert children
  for (const child of element.children) {
    const childNode = convertSlateNodeToXml(child, context);
    if (childNode) {
      xmlElement.appendChild(childNode);
    }
  }

  return xmlElement;
}

/**
 * Convert image element
 */
function convertImage(
  element: SlateElement & { type: 'image' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'img');
  setAttributes(xmlElement, element.attributes);
  return xmlElement;
}

/**
 * Convert line break element
 */
function convertLineBreak(
  element: SlateElement & { type: 'line-break' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'br');
  if (element.attributes) {
    setAttributes(xmlElement, element.attributes);
  }
  return xmlElement;
}

/**
 * Convert list element
 */
function convertList(
  element: SlateElement & { type: 'list' },
  context: SerializationContext
): Element {
  const tagName = element.ordered ? 'ol' : 'ul';
  const xmlElement = createXmlElement(context.doc, tagName);

  if (element.attributes) {
    setAttributes(xmlElement, element.attributes);
  }

  // Convert children
  for (const child of element.children) {
    const childNode = convertSlateNodeToXml(child, context);
    if (childNode) {
      xmlElement.appendChild(childNode);
    }
  }

  return xmlElement;
}

/**
 * Convert list item element
 */
function convertListItem(
  element: SlateElement & { type: 'list-item' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'li');

  if (element.attributes) {
    setAttributes(xmlElement, element.attributes);
  }

  // Convert children
  for (const child of element.children) {
    const childNode = convertSlateNodeToXml(child, context);
    if (childNode) {
      xmlElement.appendChild(childNode);
    }
  }

  return xmlElement;
}

/**
 * Convert strong element
 */
function convertStrong(
  element: SlateElement & { type: 'strong' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'strong');

  if (element.attributes) {
    setAttributes(xmlElement, element.attributes);
  }

  // Convert children
  for (const child of element.children) {
    const childNode = convertSlateNodeToXml(child, context);
    if (childNode) {
      xmlElement.appendChild(childNode);
    }
  }

  return xmlElement;
}

/**
 * Convert em element
 */
function convertEm(
  element: SlateElement & { type: 'em' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'em');

  if (element.attributes) {
    setAttributes(xmlElement, element.attributes);
  }

  // Convert children
  for (const child of element.children) {
    const childNode = convertSlateNodeToXml(child, context);
    if (childNode) {
      xmlElement.appendChild(childNode);
    }
  }

  return xmlElement;
}

/**
 * Convert blockquote element
 */
function convertBlockquote(
  element: SlateElement & { type: 'blockquote'; align?: TextAlign },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'blockquote');

  if (element.attributes) {
    setAttributes(xmlElement, element.attributes);
  }

  // Add alignment to style attribute
  const style = buildStyleWithAlignment(element.attributes?.['style'], element.align);
  if (style) {
    xmlElement.setAttribute('style', style);
  }

  // Convert children
  for (const child of element.children) {
    const childNode = convertSlateNodeToXml(child, context);
    if (childNode) {
      xmlElement.appendChild(childNode);
    }
  }

  return xmlElement;
}

/**
 * Convert horizontal rule element
 */
function convertHorizontalRule(
  element: SlateElement & { type: 'horizontal-rule' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'hr');
  if (element.attributes) {
    setAttributes(xmlElement, element.attributes);
  }
  return xmlElement;
}

/**
 * Set attributes on an XML element from attributes object
 */
function setAttributes(
  element: Element,
  attributes: Record<string, string | undefined>
): void {
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      element.setAttribute(key, value);
    }
  }
}

/**
 * Build style attribute with alignment included
 * Returns the merged style string, or undefined if no styles
 */
function buildStyleWithAlignment(
  existingStyle: string | undefined,
  align: TextAlign | undefined
): string | undefined {
  // Don't add text-align for left (it's the default)
  if (!align || align === 'left') return existingStyle;

  const alignStyle = `text-align: ${align}`;

  // If there's an existing style, remove any existing text-align and add the new one
  if (existingStyle) {
    // Remove existing text-align if present
    const filteredStyle = existingStyle
      .split(';')
      .map(s => s.trim())
      .filter(s => !s.toLowerCase().startsWith('text-align'))
      .join('; ');
    return filteredStyle ? `${filteredStyle}; ${alignStyle}` : alignStyle;
  }

  return alignStyle;
}

/**
 * Check for duplicate response identifiers
 */
function checkDuplicateIdentifiers(context: SerializationContext): void {
  const seen = new Map<string, number>();

  for (const id of context.responseIdentifiers) {
    const count = seen.get(id) || 0;
    seen.set(id, count + 1);
  }

  for (const [id, count] of seen.entries()) {
    if (count > 1) {
      context.errors.push({
        type: 'duplicate-identifier',
        message: `Duplicate response identifier: ${id} (used ${count} times)`,
        responseIdentifier: id,
      });
    }
  }
}

/**
 * Update response declarations in the assessment item
 *
 * Removes all existing response declarations and re-adds them from the collected
 * declarations map. This ensures that renamed or removed declarations don't leave
 * orphaned elements in the document.
 *
 * @param assessmentItem - The qti-assessment-item element
 * @param declarations - Map of response identifier to XmlNode
 * @param doc - The XML document
 */
function updateResponseDeclarations(
  assessmentItem: Element,
  declarations: Map<string, XmlNode>,
  doc: Document
): void {
  const itemBody = assessmentItem.querySelector('qti-item-body');

  // Remove ALL existing response declarations
  // This is safe because all interactions are serialized and add their declarations
  // to the map, so we have a complete picture of what should exist
  const existingDeclarations = assessmentItem.querySelectorAll('qti-response-declaration');
  for (const existing of existingDeclarations) {
    existing.remove();
  }

  // Insert all response declarations (before qti-item-body)
  for (const [, node] of declarations) {
    const element = xmlNodeToDom(node, doc);
    assessmentItem.insertBefore(element, itemBody);
  }
}

/**
 * Update outcome declarations in the assessment item
 *
 * Unlike response declarations which are fully managed, outcome declarations
 * are selectively managed - we only add/remove the intermediate score variables
 * (e.g., RESP1_SCORE) that are generated for sumScores mode with unmapped responses.
 * Other outcome declarations (like SCORE) are left untouched.
 *
 * @param assessmentItem - The qti-assessment-item element
 * @param declarations - Map of outcome identifier to XmlNode (intermediate scores only)
 * @param doc - The XML document
 */
function updateOutcomeDeclarations(
  assessmentItem: Element,
  declarations: Map<string, XmlNode>,
  doc: Document
): void {
  const itemBody = assessmentItem.querySelector('qti-item-body');

  // Remove only the outcome declarations we're managing (intermediate scores)
  // Keep existing SCORE declaration and other outcome declarations
  for (const [identifier] of declarations) {
    const existing = assessmentItem.querySelector(
      `qti-outcome-declaration[identifier="${identifier}"]`
    );
    if (existing) {
      existing.remove();
    }
  }

  // Insert new outcome declarations before qti-item-body
  for (const [, node] of declarations) {
    const element = xmlNodeToDom(node, doc);
    assessmentItem.insertBefore(element, itemBody);
  }
}

/**
 * Update or replace the response processing element in the assessment item
 */
function updateResponseProcessing(
  assessmentItem: Element,
  config: ResponseProcessingConfig | undefined,
  responseIdentifiers: string[],
  responseDeclarations: Map<string, XmlNode>,
  outcomeDeclarations: Map<string, XmlNode>,
  doc: Document
): void {
  // Remove existing response processing
  const existingRP = assessmentItem.querySelector('qti-response-processing');
  if (existingRP) {
    existingRP.remove();
  }

  // Generate new response processing if we have a config
  if (config) {
    const newRP = generateResponseProcessingXml(
      config,
      responseIdentifiers,
      responseDeclarations,
      outcomeDeclarations,
      doc
    );

    if (newRP) {
      // Response processing should be appended at the end of the assessment item
      assessmentItem.appendChild(newRP);
    }
  }
}

/**
 * Check if a QTI XML string is empty or invalid
 */
function isEmptyDocument(xml: string): boolean {
  if (!xml || !xml.trim()) return true;
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  // cspell:ignore parsererror - standard DOM API element name
  return !!doc.querySelector('parsererror');
}

/**
 * Create a new minimal QTI assessment item document
 */
function createNewQtiDocument(): Document {
  const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="${QTI_NAMESPACE}"
                     identifier="new-item"
                     title="New Item"
                     adaptive="false"
                     time-dependent="false">
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body></qti-item-body>
</qti-assessment-item>`;
  return new DOMParser().parseFromString(xmlString, 'application/xml');
}

/**
 * Serialize Slate document back to full QTI XML document
 *
 * This function takes the original QTI XML and Slate nodes (representing item-body content),
 * and returns a complete QTI document with the item-body updated.
 *
 * @param nodes - Slate descendants representing the edited item-body content
 * @param originalQtiXml - Original full QTI XML document
 * @returns Serialization result with full QTI XML string, identifiers, and errors
 */
export function serializeSlateToQti(
  nodes: Descendant[],
  originalQtiXml: string
): SerializationResult {
  // Use new document if original is empty/invalid
  const parser = new DOMParser();
  const doc = isEmptyDocument(originalQtiXml)
    ? createNewQtiDocument()
    : parser.parseFromString(originalQtiXml, 'application/xml');

  // Find the assessment item element
  const assessmentItem = doc.querySelector('qti-assessment-item');
  if (!assessmentItem) {
    return {
      xml: originalQtiXml,
      responseIdentifiers: [],
      errors: [{
        type: 'invalid-xml',
        message: 'Invalid QTI XML structure - no qti-assessment-item found',
      }],
    };
  }

  // Find the existing item-body element
  const oldItemBody = assessmentItem.querySelector('qti-item-body');
  if (!oldItemBody) {
    return {
      xml: originalQtiXml,
      responseIdentifiers: [],
      errors: [{
        type: 'invalid-xml',
        message: 'Invalid QTI XML structure - no qti-item-body found',
      }],
    };
  }

  // Create new item-body with edited content
  const itemBodyResult = serializeSlateToXml(nodes);

  // Update response declarations using collected data from serialization
  updateResponseDeclarations(assessmentItem, itemBodyResult.responseDeclarations, doc);

  // Update response processing based on the mode
  // This may populate outcomeDeclarations with intermediate score variables
  updateResponseProcessing(
    assessmentItem,
    itemBodyResult.responseProcessingConfig,
    itemBodyResult.responseIdentifiers,
    itemBodyResult.responseDeclarations,
    itemBodyResult.outcomeDeclarations,
    doc
  );

  // Update outcome declarations (for intermediate score variables generated by sumScores mode)
  updateOutcomeDeclarations(assessmentItem, itemBodyResult.outcomeDeclarations, doc);

  // Parse the new item-body
  const newItemBodyDoc = parser.parseFromString(itemBodyResult.xml, 'application/xml');
  const newItemBody = newItemBodyDoc.documentElement;

  // Replace the old item-body with the new one
  const imported = doc.importNode(newItemBody, true);
  // Remove xmlns attribute - it's inherited from the parent qti-assessment-item
  imported.removeAttribute('xmlns');
  assessmentItem.replaceChild(imported, oldItemBody);

  // Serialize the complete document back to XML
  const serializer = new XMLSerializer();
  const fullXml = serializer.serializeToString(doc);

  return {
    xml: fullXml,
    responseIdentifiers: itemBodyResult.responseIdentifiers,
    errors: itemBodyResult.errors,
  };
}
