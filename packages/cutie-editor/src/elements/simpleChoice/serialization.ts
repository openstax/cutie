import type { Descendant } from 'slate';
import type { SerializationContext } from '../../serialization/slateToXml';
import type { ConvertChildrenFn, ParserContext } from '../../serialization/xmlToSlate';
import { createXmlElement } from '../../serialization/xmlUtils';
import type { SlateElement } from '../../types';

/**
 * Parse QTI simple choice from XML
 */
function parseSimpleChoice(
  element: Element,
  _convertChildren: ConvertChildrenFn,
  convertChildrenStructural: ConvertChildrenFn,
  _context?: ParserContext
): SlateElement {
  const attributes: Record<string, string | undefined> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }

  // Use structural conversion - children are structural content
  const children = convertChildrenStructural(Array.from(element.childNodes));
  const identifier = attributes['identifier'] || '';

  // Create the ID label as first child (void element with identifier in attributes)
  const idLabel: SlateElement = {
    type: 'choice-id-label',
    children: [{ text: '' }],
    attributes: { identifier },
  };

  // Wrap content in choice-content element (second child)
  // Normalization will ensure proper paragraph children when loaded into editor
  const contentWrapper: SlateElement = {
    type: 'choice-content',
    children: children.length > 0 ? children : [{ text: '' }],
    attributes: {},
  };

  // qti-simple-choice has exactly 2 children: ID label and content wrapper
  return {
    type: 'qti-simple-choice',
    children: [idLabel, contentWrapper],
    attributes: {
      identifier,
      fixed: attributes['fixed'],
      ...attributes,
    },
  } as SlateElement;
}

/**
 * Serialize simple choice to XML
 */
function serializeSimpleChoice(
  element: SlateElement & { type: 'qti-simple-choice' },
  context: SerializationContext,
  convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-simple-choice');

  // Extract identifier from choice-id-label attributes (first child)
  let identifier = '';
  const firstChild = element.children[0];
  if (firstChild && 'type' in firstChild && firstChild.type === 'choice-id-label') {
    // Get identifier from choice-id-label attributes
    const labelAttrs = (firstChild as SlateElement & { attributes?: { identifier?: string } }).attributes;
    identifier = labelAttrs?.identifier || '';
  }

  // Set attributes with identifier from label
  const attributes = { ...element.attributes };
  if (identifier) {
    attributes.identifier = identifier;
  }
  setAttributes(xmlElement, attributes);

  // Convert children (choice-id-label will be skipped by serializer map)
  convertChildren(element.children, xmlElement);

  return xmlElement;
}

/**
 * Serialize choice-content wrapper (unwrap its children)
 */
function serializeChoiceContent(
  element: SlateElement & { type: 'choice-content' },
  context: SerializationContext,
  convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): DocumentFragment {
  // Unwrap choice-content - return its children directly (it's editor-only wrapper)
  const fragment = context.doc.createDocumentFragment();

  // If there's exactly one child and it's a paragraph, unwrap it for clean XML
  if (element.children.length === 1) {
    const onlyChild = element.children[0];
    if ('type' in onlyChild && onlyChild.type === 'paragraph') {
      // Unwrap paragraph - serialize its children directly
      convertChildren(onlyChild.children, fragment);
      return fragment;
    }
  }

  // Otherwise serialize all children normally
  convertChildren(element.children, fragment);
  return fragment;
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
 * Export parsers and serializers as objects that can be spread
 */
export const simpleChoiceParsers: Record<string, (element: Element, convertChildren: ConvertChildrenFn, convertChildrenStructural: ConvertChildrenFn, context?: ParserContext) => SlateElement> = {
  'qti-simple-choice': parseSimpleChoice,
};

export const simpleChoiceSerializers: Record<string, (el: SlateElement, ctx: SerializationContext, convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void) => Element | DocumentFragment | null> = {
  'qti-simple-choice': serializeSimpleChoice as any,
  'choice-id-label': () => null, // Skip during serialization (it's editor-only, identifier is in parent attributes)
  'choice-content': serializeChoiceContent as any,
};
