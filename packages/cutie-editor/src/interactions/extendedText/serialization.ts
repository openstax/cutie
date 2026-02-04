import type { Descendant } from 'slate';
import type { SerializationContext } from '../../serialization/slateToXml';
import type { ConvertChildrenFn, ParserContext } from '../../serialization/xmlToSlate';
import { createXmlElement } from '../../serialization/xmlUtils';
import type { SlateElement, XmlNode } from '../../types';

/**
 * Create a default response declaration for an extended text interaction
 */
function createDefaultResponseDeclaration(responseIdentifier: string): XmlNode {
  return {
    tagName: 'qti-response-declaration',
    attributes: {
      identifier: responseIdentifier,
      cardinality: 'single',
      'base-type': 'string',
    },
    children: [],
  };
}

/**
 * Parse QTI extended text interaction from XML
 */
function parseExtendedTextInteraction(
  element: Element,
  _convertChildren: ConvertChildrenFn,
  convertChildrenStructural: ConvertChildrenFn,
  context?: ParserContext
): SlateElement {
  const attributes: Record<string, string | undefined> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }

  const responseId = attributes['response-identifier'] || '';

  // Get existing response declaration or create a default one
  const responseDeclaration = (responseId && context?.responseDeclarations.get(responseId))
    || createDefaultResponseDeclaration(responseId);

  // Parse children (should include qti-prompt) - use structural conversion
  const children = convertChildrenStructural(Array.from(element.childNodes));

  return {
    type: 'qti-extended-text-interaction',
    children: children.length > 0 ? children : [{ text: '' }],
    attributes: {
      'response-identifier': responseId,
      'expected-lines': attributes['expected-lines'],
      'expected-length': attributes['expected-length'],
      'placeholder-text': attributes['placeholder-text'],
      ...attributes,
    },
    responseDeclaration,
  } as SlateElement;
}

/**
 * Serialize extended text interaction to XML
 */
function serializeExtendedTextInteraction(
  element: SlateElement & { type: 'qti-extended-text-interaction' },
  context: SerializationContext,
  convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-extended-text-interaction');

  // Track response identifier
  const responseId = element.attributes['response-identifier'];
  if (responseId) {
    context.responseIdentifiers.push(responseId);

    // Add response declaration to context
    if (element.responseDeclaration) {
      context.responseDeclarations.set(responseId, element.responseDeclaration);
    }
  } else {
    context.errors.push({
      type: 'missing-identifier',
      message: 'Extended text interaction missing response-identifier',
    });
  }

  // Set attributes
  setAttributes(xmlElement, element.attributes);

  // Serialize children (qti-prompt)
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
export const extendedTextParsers: Record<string, (element: Element, convertChildren: ConvertChildrenFn, convertChildrenStructural: ConvertChildrenFn, context?: ParserContext) => SlateElement> = {
  'qti-extended-text-interaction': parseExtendedTextInteraction,
};

export const extendedTextSerializers: Record<string, (el: SlateElement, ctx: SerializationContext, convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void) => Element | DocumentFragment | null> = {
  'qti-extended-text-interaction': serializeExtendedTextInteraction as any,
};
