import type { Descendant } from 'slate';
import { promptParsers } from '../elements/prompt';
import { simpleChoiceParsers } from '../elements/simpleChoice';
import { choiceParsers } from '../interactions/choice';
import { extendedTextParsers } from '../interactions/extendedText';
import { textEntryParsers } from '../interactions/textEntry';
import type { ElementAttributes, SlateElement, SlateText } from '../types';
import { isQtiElement, normalizeTagName, parseXml, serializeElement } from './xmlUtils';

// Single contact point per interaction: spread all parser objects
const interactionParsers: Record<string, (element: Element, convertChildren: (nodes: Node[]) => Descendant[]) => SlateElement | SlateElement[]> = {
  ...choiceParsers,
  ...textEntryParsers,
  ...extendedTextParsers,
  ...promptParsers,
  ...simpleChoiceParsers,
};

/**
 * Parse QTI XML to Slate document structure
 *
 * @param xml - Full QTI XML document (qti-assessment-item)
 * @returns Array of Slate descendants representing qti-item-body content
 */
export function parseXmlToSlate(xml: string): Descendant[] {
  const doc = parseXml(xml);
  if (!doc) {
    throw new Error('Failed to parse QTI XML');
  }

  // Find qti-item-body element
  const itemBody = doc.querySelector('qti-item-body');
  if (!itemBody) {
    throw new Error('No qti-item-body found in QTI XML document');
  }

  // Convert children of qti-item-body to Slate nodes
  return convertNodesToSlate(Array.from(itemBody.childNodes), true);
}

/**
 * Convert a list of DOM nodes to Slate descendants
 * @param nodes - DOM nodes to convert
 * @param isRootLevel - Whether this is the document root level (requires at least one node)
 */
function convertNodesToSlate(nodes: Node[], isRootLevel = false): Descendant[] {
  const result: Descendant[] = [];

  for (const node of nodes) {
    const converted = convertNodeToSlate(node);
    if (converted) {
      if (Array.isArray(converted)) {
        result.push(...converted);
      } else {
        result.push(converted);
      }
    }
  }

  // Ensure we have at least one node at root level (Slate requirement)
  if (isRootLevel && result.length === 0) {
    result.push({
      type: 'paragraph',
      children: [{ text: '' }],
    });
  }

  return result;
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
 */
function convertNodeToSlate(node: Node): Descendant | Descendant[] | null {
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
      return parser(element, (nodes) => convertNodesToSlate(nodes));
    }

    // Unknown QTI elements - preserve with warning
    if (isQtiElement(tagName)) {
      const children = convertNodesToSlate(Array.from(element.childNodes));
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
      const children = convertNodesToSlate(Array.from(element.childNodes));
      return {
        type: 'paragraph',
        children: children.length > 0 ? children : [{ text: '' }],
        attributes,
      };
    }

    if (tagName === 'div') {
      const children = convertNodesToSlate(Array.from(element.childNodes));
      return {
        type: 'div',
        children: children.length > 0 ? children : [{ text: '' }],
        attributes,
      };
    }

    if (tagName === 'span') {
      const children = convertNodesToSlate(Array.from(element.childNodes));
      return {
        type: 'span',
        children: children.length > 0 ? children : [{ text: '' }],
        attributes,
      };
    }

    if (tagName.match(/^h[1-6]$/)) {
      const level = parseInt(tagName[1], 10) as 1 | 2 | 3 | 4 | 5 | 6;
      const children = convertNodesToSlate(Array.from(element.childNodes));
      return {
        type: 'heading',
        level,
        children: children.length > 0 ? children : [{ text: '' }],
        attributes,
      };
    }

    if (tagName === 'strong' || tagName === 'b') {
      const children = convertNodesToSlate(Array.from(element.childNodes));
      // Apply bold mark to text children
      return applyMarkToChildren(children, 'bold');
    }

    if (tagName === 'em' || tagName === 'i') {
      const children = convertNodesToSlate(Array.from(element.childNodes));
      // Apply italic mark to text children
      return applyMarkToChildren(children, 'italic');
    }

    if (tagName === 'u') {
      const children = convertNodesToSlate(Array.from(element.childNodes));
      // Apply underline mark to text children
      return applyMarkToChildren(children, 'underline');
    }

    if (tagName === 'code') {
      const children = convertNodesToSlate(Array.from(element.childNodes));
      // Apply code mark to text children
      return applyMarkToChildren(children, 'code');
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

    if (tagName === 'ul' || tagName === 'ol') {
      const children = convertNodesToSlate(Array.from(element.childNodes));
      return {
        type: 'list',
        ordered: tagName === 'ol',
        children: children.filter(child => 'type' in child && child.type === 'list-item'),
        attributes,
      } as SlateElement;
    }

    if (tagName === 'li') {
      const children = convertNodesToSlate(Array.from(element.childNodes));
      return {
        type: 'list-item',
        children: children.length > 0 ? children : [{ text: '' }],
        attributes,
      };
    }

    // Default: treat as div
    const children = convertNodesToSlate(Array.from(element.childNodes));
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
 * Apply a text mark to all text nodes in children
 */
function applyMarkToChildren(
  children: Descendant[],
  mark: 'bold' | 'italic' | 'underline' | 'code'
): Descendant[] {
  return children.map(child => {
    if ('text' in child) {
      const textNode = child as SlateText;
      return { ...textNode, [mark]: true };
    }
    return child;
  });
}
