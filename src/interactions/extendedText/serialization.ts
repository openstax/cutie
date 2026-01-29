import type { Descendant } from 'slate';
import { createXmlElement } from '../../serialization/xmlUtils';
import type { SlateElement } from '../../types';

/**
 * Type definitions for serialization
 */
export interface SerializationContext {
  doc: XMLDocument;
  responseIdentifiers: string[];
  errors: Array<{ type: string; message: string; responseIdentifier?: string }>;
}

export type ConvertChildrenFn = (nodes: Node[]) => Descendant[];

/**
 * Parse QTI extended text interaction from XML
 */
function parseExtendedTextInteraction(
  element: Element,
  _convertChildren: ConvertChildrenFn
): SlateElement {
  const attributes: Record<string, string | undefined> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }

  return {
    type: 'qti-extended-text-interaction',
    children: [{ text: '' }],
    attributes: {
      'response-identifier': attributes['response-identifier'] || '',
      'expected-lines': attributes['expected-lines'],
      'expected-length': attributes['expected-length'],
      'placeholder-text': attributes['placeholder-text'],
      ...attributes,
    },
  };
}

/**
 * Serialize extended text interaction to XML
 */
function serializeExtendedTextInteraction(
  element: SlateElement & { type: 'qti-extended-text-interaction' },
  context: SerializationContext,
  _convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
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
export const extendedTextParsers: Record<string, (element: Element, convertChildren: ConvertChildrenFn) => SlateElement> = {
  'qti-extended-text-interaction': parseExtendedTextInteraction,
};

export const extendedTextSerializers: Record<string, (el: SlateElement, ctx: SerializationContext, convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void) => Element | DocumentFragment | null> = {
  'qti-extended-text-interaction': serializeExtendedTextInteraction as any,
};
