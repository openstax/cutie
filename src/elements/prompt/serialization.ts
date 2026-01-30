import type { Descendant } from 'slate';
import type { SerializationContext } from '../../serialization/slateToXml';
import type { ParserContext } from '../../serialization/xmlToSlate';
import { createXmlElement } from '../../serialization/xmlUtils';
import type { SlateElement } from '../../types';

export type ConvertChildrenFn = (nodes: Node[]) => Descendant[];

/**
 * Parse QTI prompt from XML
 */
function parsePrompt(
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
    type: 'qti-prompt',
    children: children.length > 0 ? children : [{ text: '' }],
    attributes,
  } as SlateElement;
}

/**
 * Serialize prompt to XML
 */
function serializePrompt(
  element: SlateElement & { type: 'qti-prompt' },
  context: SerializationContext,
  convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-prompt');

  if (element.attributes) {
    setAttributes(xmlElement, element.attributes);
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
export const promptParsers: Record<string, (element: Element, convertChildren: ConvertChildrenFn, context?: ParserContext) => SlateElement> = {
  'qti-prompt': parsePrompt,
};

export const promptSerializers: Record<string, (el: SlateElement, ctx: SerializationContext, convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void) => Element | DocumentFragment | null> = {
  'qti-prompt': serializePrompt as any,
};
