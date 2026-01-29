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
 * Parse QTI choice interaction from XML
 */
function parseChoiceInteraction(
  element: Element,
  convertChildren: ConvertChildrenFn
): SlateElement {
  const attributes: Record<string, string | undefined> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }

  const children = convertChildren(Array.from(element.childNodes));
  return {
    type: 'qti-choice-interaction',
    children: children.length > 0 ? children : [{ type: 'qti-simple-choice', children: [{ text: '' }], attributes: { identifier: 'choice-1' } }],
    attributes: {
      'response-identifier': attributes['response-identifier'] || '',
      'max-choices': attributes['max-choices'] || '1',
      'min-choices': attributes['min-choices'],
      shuffle: attributes['shuffle'],
      ...attributes,
    },
  } as SlateElement;
}

/**
 * Serialize choice interaction to XML
 */
function serializeChoiceInteraction(
  element: SlateElement & { type: 'qti-choice-interaction' },
  context: SerializationContext,
  convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
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
export const choiceParsers: Record<string, (element: Element, convertChildren: ConvertChildrenFn) => SlateElement> = {
  'qti-choice-interaction': parseChoiceInteraction,
};

export const choiceSerializers: Record<string, (el: SlateElement, ctx: SerializationContext, convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void) => Element | DocumentFragment | null> = {
  'qti-choice-interaction': serializeChoiceInteraction as any,
};
