import type { Descendant } from 'slate';
import type { SerializationContext } from '../../../serialization/slateToXml';
import type { ConvertChildrenFn, ParserContext } from '../../../serialization/xmlToSlate';
import { createXmlElement } from '../../../serialization/xmlUtils';
import type { QtiFeedbackBlock, SlateElement } from '../../../types';

/**
 * Parse QTI feedback block from XML
 */
function parseFeedbackBlock(
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

  // Use structural conversion - children are block-level elements
  const children = convertChildrenStructural(Array.from(element.childNodes));

  return {
    type: 'qti-feedback-block',
    children: children.length > 0 ? children : [{ type: 'paragraph', children: [{ text: '' }] }],
    attributes: {
      'outcome-identifier': attributes['outcome-identifier'] || 'FEEDBACK',
      identifier: attributes['identifier'] || '',
      'show-hide': (attributes['show-hide'] as 'show' | 'hide') || 'show',
      ...attributes,
    },
  } as QtiFeedbackBlock;
}

/**
 * Serialize feedback block to XML
 */
function serializeFeedbackBlock(
  element: SlateElement & { type: 'qti-feedback-block' },
  context: SerializationContext,
  convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-feedback-block');

  // Set attributes
  setAttributes(xmlElement, element.attributes);

  // Track the feedback identifier for response processing generation
  const identifier = element.attributes.identifier;
  if (identifier && context.feedbackIdentifiersUsed) {
    context.feedbackIdentifiersUsed.add(identifier);
  }

  // Convert children
  convertChildren(element.children, xmlElement);

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
 * Export parsers and serializers as objects that can be spread
 */
export const feedbackBlockParsers: Record<
  string,
  (element: Element, convertChildren: ConvertChildrenFn, convertChildrenStructural: ConvertChildrenFn, context?: ParserContext) => SlateElement
> = {
  'qti-feedback-block': parseFeedbackBlock,
};

export const feedbackBlockSerializers: Record<
  string,
  (
    el: SlateElement,
    ctx: SerializationContext,
    convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
  ) => Element | DocumentFragment | null
> = {
  'qti-feedback-block': serializeFeedbackBlock as any,
};
