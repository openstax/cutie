import type { Descendant, Element as SlateElementType } from 'slate';
import { contentBodyParsers } from '../elements/contentBody';
import { feedbackBlockParsers } from '../elements/feedbackBlock';
import { feedbackInlineParsers } from '../elements/feedbackInline';
import { modalFeedbackParsers } from '../elements/modalFeedback';
import { promptParsers } from '../elements/prompt';
import { simpleChoiceParsers } from '../elements/simpleChoice';
import { choiceParsers } from '../interactions/choice';
import { extendedTextParsers } from '../interactions/extendedText';
import { textEntryParsers } from '../interactions/textEntry';
import { isElementInline } from '../plugins/withQtiInteractions';
import type { DocumentMetadata, ElementAttributes, SlateElement, SlateText, TextAlign } from '../types';
import { classifyResponseProcessing } from '../utils/responseProcessingClassifier';
import { domToXmlNode, type XmlNode } from './xmlNode';
import { isQtiElement, normalizeTagName, parseXml, serializeElement } from './xmlUtils';

/**
 * Parser context for passing response declarations to interaction parsers
 */
export interface ParserContext {
  responseDeclarations: Map<string, XmlNode>;
}

/**
 * Parser function type that receives element, child converter, and optional context
 */
type ParserFn = (
  element: Element,
  convertChildren: (nodes: Node[]) => Descendant[],
  context?: ParserContext
) => SlateElement | SlateElement[];

// Single contact point per interaction: spread all parser objects
const interactionParsers: Record<string, ParserFn> = {
  ...choiceParsers,
  ...textEntryParsers,
  ...extendedTextParsers,
  ...promptParsers,
  ...simpleChoiceParsers,
  ...feedbackInlineParsers,
  ...feedbackBlockParsers,
  ...modalFeedbackParsers,
  ...contentBodyParsers,
};

/**
 * Create a default empty document structure for new items
 */
function createEmptyDocument(): Descendant[] {
  const metadataNode: DocumentMetadata = {
    type: 'document-metadata',
    children: [{ text: '' }],
    responseProcessing: { mode: 'allCorrect' },
  };
  return [
    metadataNode,
    { type: 'paragraph', children: [{ text: '' }] },
  ];
}

/**
 * Parse QTI XML to Slate document structure
 *
 * @param xml - Full QTI XML document (qti-assessment-item)
 * @returns Array of Slate descendants representing qti-item-body content
 *          with a document-metadata node at position [0]
 */
export function parseXmlToSlate(xml: string): Descendant[] {
  // Handle empty input - return default empty document structure
  if (!xml || !xml.trim()) {
    return createEmptyDocument();
  }

  const doc = parseXml(xml);
  if (!doc) {
    throw new Error('Failed to parse QTI XML');
  }

  // Find qti-item-body element
  const itemBody = doc.querySelector('qti-item-body');
  if (!itemBody) {
    throw new Error('No qti-item-body found in QTI XML document');
  }

  // Extract response declarations into a map (once, upfront)
  const responseDeclarations = new Map<string, XmlNode>();
  for (const decl of doc.querySelectorAll('qti-response-declaration')) {
    const id = decl.getAttribute('identifier');
    if (id) {
      responseDeclarations.set(id, domToXmlNode(decl));
    }
  }

  const context: ParserContext = { responseDeclarations };

  // Classify response processing to determine mode
  const responseProcessing = classifyResponseProcessing(doc);

  // Create document metadata node
  const metadataNode: DocumentMetadata = {
    type: 'document-metadata',
    children: [{ text: '' }],
    responseProcessing,
  };

  // Convert children of qti-item-body to Slate nodes
  const contentNodes = convertNodesToSlate(Array.from(itemBody.childNodes), true, context);

  // Parse modal feedback from outside qti-item-body (direct children of qti-assessment-item)
  const assessmentItem = doc.querySelector('qti-assessment-item');
  const modalFeedbackNodes: Descendant[] = [];
  if (assessmentItem) {
    const modalFeedbackElements = assessmentItem.querySelectorAll(':scope > qti-modal-feedback');
    for (const el of modalFeedbackElements) {
      const parser = interactionParsers['qti-modal-feedback'];
      if (parser) {
        const parsed = parser(el, (nodes) => convertNodesToSlate(nodes, false, context), context);
        if (Array.isArray(parsed)) {
          modalFeedbackNodes.push(...parsed);
        } else {
          modalFeedbackNodes.push(parsed);
        }
      }
    }
  }

  // Return metadata node at [0] followed by content nodes and modal feedback
  return [metadataNode, ...contentNodes, ...modalFeedbackNodes];
}

/**
 * Check if a Slate node is an inline element that needs to be wrapped in a paragraph
 * when it appears at the root level of the document.
 */
function isInlineSlateNode(node: Descendant): boolean {
  // Text nodes are inline
  if ('text' in node) return true;

  // Use the shared inline detection helper for elements
  if ('type' in node) {
    return isElementInline(node as SlateElementType);
  }

  return false;
}

/**
 * Wrap consecutive inline nodes in paragraphs at the root level.
 * This handles cases like standalone <img> tags in the XML.
 */
function wrapInlineNodesInParagraphs(nodes: Descendant[]): Descendant[] {
  const result: Descendant[] = [];
  let inlineBuffer: Descendant[] = [];

  const flushBuffer = () => {
    if (inlineBuffer.length > 0) {
      result.push({
        type: 'paragraph',
        children: inlineBuffer,
      } as SlateElement);
      inlineBuffer = [];
    }
  };

  for (const node of nodes) {
    if (isInlineSlateNode(node)) {
      inlineBuffer.push(node);
    } else {
      flushBuffer();
      result.push(node);
    }
  }

  flushBuffer();
  return result;
}

/**
 * Convert a list of DOM nodes to Slate descendants
 * @param nodes - DOM nodes to convert
 * @param isRootLevel - Whether this is the document root level (requires at least one node)
 * @param context - Parser context with response declarations
 */
function convertNodesToSlate(nodes: Node[], isRootLevel = false, context?: ParserContext): Descendant[] {
  const result: Descendant[] = [];

  for (const node of nodes) {
    const converted = convertNodeToSlate(node, context);
    if (converted) {
      if (Array.isArray(converted)) {
        result.push(...converted);
      } else {
        result.push(converted);
      }
    }
  }

  // At root level, wrap any inline nodes in paragraphs
  // This handles cases like standalone <img> tags in the XML
  const normalized = isRootLevel ? wrapInlineNodesInParagraphs(result) : result;

  // Ensure we have at least one node at root level (Slate requirement)
  if (isRootLevel && normalized.length === 0) {
    normalized.push({
      type: 'paragraph',
      children: [{ text: '' }],
    });
  }

  return normalized;
}

/**
 * Check if an element is block-level
 */
function isBlockElement(element: Element): boolean {
  const blockTags = [
    'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre',
    'qti-item-body', 'qti-prompt', 'qti-choice-interaction',
    'qti-simple-choice', 'qti-text-entry-interaction', 'qti-extended-text-interaction',
    'qti-content-body', 'qti-modal-feedback', 'qti-feedback-block', 'qti-feedback-inline',
  ];
  return blockTags.includes(element.tagName.toLowerCase());
}

/**
 * Check if a text node is structural whitespace (XML formatting)
 * Returns true if the text node appears between block-level elements
 */
function isStructuralWhitespace(node: Node): boolean {
  const parent = node.parentElement;
  if (!parent) return false;

  // Check if parent is a block-level element
  if (!isBlockElement(parent)) return false;

  // Check if this text node is surrounded by block-level siblings
  // (or is at the start/end of the parent with block siblings)
  const siblings = Array.from(parent.childNodes);
  const nodeIndex = siblings.findIndex(sibling => sibling === node);

  // Look at adjacent siblings
  const prevSibling = nodeIndex > 0 ? siblings[nodeIndex - 1] : null;
  const nextSibling = nodeIndex < siblings.length - 1 ? siblings[nodeIndex + 1] : null;

  const prevIsBlock = prevSibling?.nodeType === Node.ELEMENT_NODE &&
                      isBlockElement(prevSibling as Element);
  const nextIsBlock = nextSibling?.nodeType === Node.ELEMENT_NODE &&
                      isBlockElement(nextSibling as Element);

  // If between two block elements, or at boundary with a block element, it's structural
  return prevIsBlock || nextIsBlock || nodeIndex === 0 || nodeIndex === siblings.length - 1;
}

/**
 * Convert a single DOM node to Slate node(s)
 * @param node - DOM node to convert
 * @param context - Parser context with response declarations
 */
function convertNodeToSlate(node: Node, context?: ParserContext): Descendant | Descendant[] | null {
  // Text node
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';

    // Normalize whitespace: collapse sequences of spaces, tabs, and newlines to single space
    // This mirrors HTML rendering behavior where XML formatting (indentation, line breaks)
    // should not affect the displayed text
    const normalizedText = text.replace(/[\s\n\r\t]+/g, ' ');

    // Skip if normalized to empty string
    if (normalizedText === '') {
      return null;
    }

    // Skip whitespace-only text that is structural (XML formatting between blocks)
    if (normalizedText === ' ' && isStructuralWhitespace(node)) {
      return null;
    }

    return { text: normalizedText };
  }

  // Element node
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tagName = normalizeTagName(element.tagName);
    const attributes = extractAttributes(element);

    // Check interaction parsers first
    const parser = interactionParsers[tagName];
    if (parser) {
      return parser(element, (nodes) => convertNodesToSlate(nodes, false, context), context);
    }

    // Unknown QTI elements - preserve with warning
    if (isQtiElement(tagName)) {
      const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
      const rawXml = serializeElement(element);

      return {
        type: 'qti-unknown',
        originalTagName: tagName,
        children: children.length > 0 ? children : [{ text: '' }],
        attributes,
        rawXml,
        isVoid: element.childNodes.length === 0,
      };
    }

    // XHTML elements
    if (tagName === 'p') {
      const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
      const align = extractAlignment(attributes);
      return {
        type: 'paragraph',
        children: children.length > 0 ? children : [{ text: '' }],
        ...(align && { align }),
        attributes,
      };
    }

    if (tagName === 'div') {
      const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
      return {
        type: 'div',
        children: children.length > 0 ? children : [{ text: '' }],
        attributes,
      };
    }

    if (tagName === 'span') {
      const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
      return {
        type: 'span',
        children: children.length > 0 ? children : [{ text: '' }],
        attributes,
      };
    }

    if (tagName.match(/^h[1-6]$/)) {
      const level = parseInt(tagName[1], 10) as 1 | 2 | 3 | 4 | 5 | 6;
      const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
      const align = extractAlignment(attributes);
      return {
        type: 'heading',
        level,
        children: children.length > 0 ? children : [{ text: '' }],
        ...(align && { align }),
        attributes,
      };
    }

    if (tagName === 'strong' || tagName === 'b') {
      const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
      // Apply bold mark to text children
      return applyMarkToChildren(children, 'bold');
    }

    if (tagName === 'em' || tagName === 'i') {
      const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
      // Apply italic mark to text children
      return applyMarkToChildren(children, 'italic');
    }

    if (tagName === 'u') {
      const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
      // Apply underline mark to text children
      return applyMarkToChildren(children, 'underline');
    }

    if (tagName === 'code') {
      const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
      // Apply code mark to text children
      return applyMarkToChildren(children, 'code');
    }

    if (tagName === 's' || tagName === 'del' || tagName === 'strike') {
      const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
      // Apply strikethrough mark to text children
      return applyMarkToChildren(children, 'strikethrough');
    }

    if (tagName === 'img') {
      return {
        type: 'image',
        children: [{ text: '' }],
        attributes: {
          src: attributes['src'] || '',
          alt: attributes['alt'],
          width: attributes['width'],
          height: attributes['height'],
          ...attributes,
        },
      };
    }

    if (tagName === 'br') {
      return {
        type: 'line-break',
        children: [{ text: '' }],
        attributes,
      };
    }

    if (tagName === 'hr') {
      return {
        type: 'horizontal-rule',
        children: [{ text: '' }],
        attributes,
      };
    }

    if (tagName === 'blockquote') {
      const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
      const align = extractAlignment(attributes);
      return {
        type: 'blockquote',
        children: children.length > 0 ? children : [{ text: '' }],
        ...(align && { align }),
        attributes,
      };
    }

    if (tagName === 'ul' || tagName === 'ol') {
      const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
      return {
        type: 'list',
        ordered: tagName === 'ol',
        children: children.filter(child => 'type' in child && child.type === 'list-item'),
        attributes,
      } as SlateElement;
    }

    if (tagName === 'li') {
      const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
      return {
        type: 'list-item',
        children: children.length > 0 ? children : [{ text: '' }],
        attributes,
      };
    }

    // Default: treat as div
    const children = convertNodesToSlate(Array.from(element.childNodes), false, context);
    return {
      type: 'div',
      children: children.length > 0 ? children : [{ text: '' }],
      attributes,
    };
  }

  // Other node types (comments, etc.) - skip
  return null;
}

/**
 * Extract all attributes from an element as kebab-case object
 */
function extractAttributes(element: Element): ElementAttributes {
  const attributes: ElementAttributes = {};

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    // Keep attribute names in original case (usually kebab-case in XML)
    attributes[attr.name] = attr.value;
  }

  return attributes;
}

/**
 * Extract text-align from style attribute
 */
function extractAlignment(attributes: ElementAttributes): TextAlign | undefined {
  const style = attributes['style'];
  if (!style) return undefined;
  const match = style.match(/text-align:\s*(left|center|right)/i);
  return match ? (match[1].toLowerCase() as TextAlign) : undefined;
}

/**
 * Apply a text mark to all text nodes in children
 */
function applyMarkToChildren(
  children: Descendant[],
  mark: 'bold' | 'italic' | 'underline' | 'code' | 'strikethrough'
): Descendant[] {
  return children.map(child => {
    if ('text' in child) {
      const textNode = child as SlateText;
      return { ...textNode, [mark]: true };
    }
    return child;
  });
}
