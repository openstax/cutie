import type { Descendant } from 'slate';
import type { SerializationContext } from '../../serialization/slateToXml';
import type { ParserContext } from '../../serialization/xmlToSlate';
import { createXmlElement } from '../../serialization/xmlUtils';
import type { SlateElement } from '../../types';

export type ConvertChildrenFn = (nodes: Node[]) => Descendant[];

/**
 * Parse QTI content body from XML
 */
function parseContentBody(
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
    type: 'qti-content-body',
    children: children.length > 0 ? children : [{ type: 'paragraph', children: [{ text: '' }] }],
    attributes,
  } as SlateElement;
}

/**
 * Serialize content body to XML
 */
function serializeContentBody(
  element: SlateElement & { type: 'qti-content-body' },
  context: SerializationContext,
  convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-content-body');

  if (element.attributes) {
    setAttributes(xmlElement, element.attributes);
  }

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
export const contentBodyParsers: Record<
  string,
  (element: Element, convertChildren: ConvertChildrenFn, context?: ParserContext) => SlateElement
> = {
  'qti-content-body': parseContentBody,
};

export const contentBodySerializers: Record<
  string,
  (
    el: SlateElement,
    ctx: SerializationContext,
    convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
  ) => Element | DocumentFragment | null
> = {
  'qti-content-body': serializeContentBody as any,
};
