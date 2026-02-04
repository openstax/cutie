import type { Descendant } from 'slate';
import type { SerializationContext } from '../../serialization/slateToXml';
import type { ParserContext } from '../../serialization/xmlToSlate';
import { createXmlElement } from '../../serialization/xmlUtils';
import type { QtiModalFeedback, SlateElement } from '../../types';

export type ConvertChildrenFn = (nodes: Node[]) => Descendant[];

/**
 * Parse QTI modal feedback from XML
 */
function parseModalFeedback(
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
    type: 'qti-modal-feedback',
    children: children.length > 0 ? children : [{ type: 'paragraph', children: [{ text: '' }] }],
    attributes: {
      'outcome-identifier': attributes['outcome-identifier'] || 'FEEDBACK',
      identifier: attributes['identifier'] || '',
      'show-hide': (attributes['show-hide'] as 'show' | 'hide') || 'show',
      ...attributes,
    },
  } as QtiModalFeedback;
}

/**
 * Serialize modal feedback to XML
 * Returns null because modal feedback is collected separately (outside qti-item-body)
 */
function serializeModalFeedback(
  element: SlateElement & { type: 'qti-modal-feedback' },
  context: SerializationContext,
  convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): null {
  const xmlElement = createXmlElement(context.doc, 'qti-modal-feedback');

  // Set attributes
  setAttributes(xmlElement, element.attributes);

  // Track the feedback identifier for response processing generation
  const identifier = element.attributes.identifier;
  if (identifier && context.feedbackIdentifiersUsed) {
    context.feedbackIdentifiersUsed.add(identifier);
  }

  // Convert children
  convertChildren(element.children, xmlElement);

  // Push to context container (will be added outside item-body)
  context.modalFeedbackElements.push(xmlElement);

  // Return null - nothing goes into item-body
  return null;
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
export const modalFeedbackParsers: Record<
  string,
  (element: Element, convertChildren: ConvertChildrenFn, context?: ParserContext) => SlateElement
> = {
  'qti-modal-feedback': parseModalFeedback,
};

export const modalFeedbackSerializers: Record<
  string,
  (
    el: SlateElement,
    ctx: SerializationContext,
    convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
  ) => Element | DocumentFragment | null
> = {
  'qti-modal-feedback': serializeModalFeedback as any,
};
