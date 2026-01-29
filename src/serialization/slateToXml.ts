import type { Descendant } from 'slate';
import type { SerializationResult, SlateElement, SlateText, ValidationError } from '../types';
import { createXmlDocument, createXmlElement } from './xmlUtils';

/**
 * Serialize Slate document to QTI XML
 *
 * @param nodes - Slate descendants
 * @returns Serialization result with XML string, identifiers, and errors
 */
export function serializeSlateToXml(nodes: Descendant[]): SerializationResult {
  const doc = createXmlDocument();
  const itemBody = doc.documentElement;

  const context: SerializationContext = {
    doc,
    responseIdentifiers: [],
    errors: [],
  };

  // Convert Slate nodes to XML
  for (const node of nodes) {
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
  };
}

/**
 * Serialization context for tracking state
 */
interface SerializationContext {
  doc: XMLDocument;
  responseIdentifiers: string[];
  errors: ValidationError[];
}

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

  switch (element.type) {
    case 'qti-text-entry-interaction':
      return convertTextEntryInteraction(element, context);

    case 'qti-extended-text-interaction':
      return convertExtendedTextInteraction(element, context);

    case 'qti-choice-interaction':
      return convertChoiceInteraction(element, context);

    case 'qti-prompt':
      return convertPrompt(element, context);

    case 'qti-simple-choice':
      return convertSimpleChoice(element, context);

    case 'choice-id-label':
      // Skip choice-id-label during serialization (it's editor-only, identifier is in parent attributes)
      return null;

    case 'choice-content':
      // Unwrap choice-content - return its children directly (it's editor-only wrapper)
      const fragment = context.doc.createDocumentFragment();
      for (const child of element.children) {
        const childNode = convertSlateNodeToXml(child, context);
        if (childNode) {
          fragment.appendChild(childNode);
        }
      }
      return fragment;

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

  return textNode;
}

/**
 * Convert QTI text entry interaction
 */
function convertTextEntryInteraction(
  element: SlateElement & { type: 'qti-text-entry-interaction' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-text-entry-interaction');

  // Track response identifier
  const responseId = element.attributes['response-identifier'];
  if (responseId) {
    context.responseIdentifiers.push(responseId);
  } else {
    context.errors.push({
      type: 'missing-identifier',
      message: 'Text entry interaction missing response-identifier',
    });
  }

  // Set attributes
  setAttributes(xmlElement, element.attributes);

  return xmlElement;
}

/**
 * Convert QTI extended text interaction
 */
function convertExtendedTextInteraction(
  element: SlateElement & { type: 'qti-extended-text-interaction' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-extended-text-interaction');

  // Track response identifier
  const responseId = element.attributes['response-identifier'];
  if (responseId) {
    context.responseIdentifiers.push(responseId);
  } else {
    context.errors.push({
      type: 'missing-identifier',
      message: 'Extended text interaction missing response-identifier',
    });
  }

  // Set attributes
  setAttributes(xmlElement, element.attributes);

  return xmlElement;
}

/**
 * Convert QTI choice interaction
 */
function convertChoiceInteraction(
  element: SlateElement & { type: 'qti-choice-interaction' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-choice-interaction');

  // Track response identifier
  const responseId = element.attributes['response-identifier'];
  if (responseId) {
    context.responseIdentifiers.push(responseId);
  } else {
    context.errors.push({
      type: 'missing-identifier',
      message: 'Choice interaction missing response-identifier',
    });
  }

  // Set attributes
  setAttributes(xmlElement, element.attributes);

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
 * Convert QTI prompt
 */
function convertPrompt(
  element: SlateElement & { type: 'qti-prompt' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-prompt');

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
 * Convert QTI simple choice
 */
function convertSimpleChoice(
  element: SlateElement & { type: 'qti-simple-choice' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-simple-choice');

  // Extract identifier from choice-id-label (first child)
  let identifier = '';
  const firstChild = element.children[0];
  if (firstChild && 'type' in firstChild && firstChild.type === 'choice-id-label') {
    // Get text content from choice-id-label
    identifier = firstChild.children
      .filter((child): child is { text: string } => 'text' in child)
      .map(child => child.text)
      .join('');
  }

  // Set attributes with identifier from label
  const attributes = { ...element.attributes };
  if (identifier) {
    attributes.identifier = identifier;
  }
  setAttributes(xmlElement, attributes);

  // Convert children (choice-id-label will be skipped by the switch statement)
  for (const child of element.children) {
    const childNode = convertSlateNodeToXml(child, context);
    if (childNode) {
      xmlElement.appendChild(childNode);
    }
  }

  return xmlElement;
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
  element: SlateElement & { type: 'paragraph' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, 'p');

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
  element: SlateElement & { type: 'heading' },
  context: SerializationContext
): Element {
  const xmlElement = createXmlElement(context.doc, `h${element.level}`);

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
  // Parse the original QTI document
  const parser = new DOMParser();
  const doc = parser.parseFromString(originalQtiXml, 'application/xml');

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

  // Parse the new item-body
  const newItemBodyDoc = parser.parseFromString(itemBodyResult.xml, 'application/xml');
  const newItemBody = newItemBodyDoc.documentElement;

  // Replace the old item-body with the new one
  const imported = doc.importNode(newItemBody, true);
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
