import type { Descendant } from 'slate';
import type { SerializationContext } from '../../../serialization/slateToXml';
import type { ParserContext } from '../../../serialization/xmlToSlate';
import { createXmlElement } from '../../../serialization/xmlUtils';
import type { QtiFeedbackInline, SlateElement } from '../../../types';

export type ConvertChildrenFn = (nodes: Node[]) => Descendant[];

/**
 * Parse QTI feedback inline from XML
 */
function parseFeedbackInline(
  element: Element,
  convertChildren: ConvertChildrenFn,
  _context?: ParserContext
): SlateElement {
  const attributes: Record<string, string | undefined> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }

  const children = convertChildren(Array.from(element.childNodes));

  return {
    type: 'qti-feedback-inline',
    children: children.length > 0 ? children : [{ text: '' }],
    attributes: {
      'outcome-identifier': attributes['outcome-identifier'] || 'FEEDBACK',
      identifier: attributes['identifier'] || '',
      'show-hide': (attributes['show-hide'] as 'show' | 'hide') || 'show',
      ...attributes,
    },
  } as QtiFeedbackInline;
}

/**
 * Serialize feedback inline to XML
 */
function serializeFeedbackInline(
  element: SlateElement & { type: 'qti-feedback-inline' },
  context: SerializationContext,
  convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-feedback-inline');

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
export const feedbackInlineParsers: Record<
  string,
  (element: Element, convertChildren: ConvertChildrenFn, context?: ParserContext) => SlateElement
> = {
  'qti-feedback-inline': parseFeedbackInline,
};

export const feedbackInlineSerializers: Record<
  string,
  (
    el: SlateElement,
    ctx: SerializationContext,
    convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
  ) => Element | DocumentFragment | null
> = {
  'qti-feedback-inline': serializeFeedbackInline as any,
};
