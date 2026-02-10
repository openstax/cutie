import type { Descendant } from 'slate';
import type { SerializationContext } from '../../serialization/slateToXml';
import type { ConvertChildrenFn, ParserContext } from '../../serialization/xmlToSlate';
import { createXmlElement } from '../../serialization/xmlUtils';
import type { SlateElement, XmlNode } from '../../types';
import { textEntryInteractionConfig } from './config';

/**
 * Create a default response declaration for a text entry interaction
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
 * Parse QTI text entry interaction from XML
 */
function parseTextEntryInteraction(
  element: Element,
  _convertChildren: ConvertChildrenFn,
  _convertChildrenStructural: ConvertChildrenFn,
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

  return {
    type: 'qti-text-entry-interaction',
    children: [{ text: '' }],
    attributes: {
      'response-identifier': responseId,
      'expected-length': attributes['expected-length'],
      'pattern-mask': attributes['pattern-mask'],
      'placeholder-text': attributes['placeholder-text'],
      ...attributes,
    },
    responseDeclaration,
  };
}

/**
 * Serialize text entry interaction to XML
 */
function serializeTextEntryInteraction(
  element: SlateElement & { type: 'qti-text-entry-interaction' },
  context: SerializationContext,
  _convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-text-entry-interaction');

  // Track response identifier
  const responseId = element.attributes['response-identifier'];
  if (responseId) {
    context.responseIdentifiers.push(responseId);

    // Add response declaration to context if present
    if (element.responseDeclaration) {
      context.responseDeclarations.set(responseId, element.responseDeclaration);
    }

    // Register interaction config for response processing generation
    context.responseConfigs.set(responseId, textEntryInteractionConfig);
  } else {
    context.errors.push({
      type: 'missing-identifier',
      message: 'Text entry interaction missing response-identifier',
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
export const textEntryParsers: Record<string, (element: Element, convertChildren: ConvertChildrenFn, convertChildrenStructural: ConvertChildrenFn, context?: ParserContext) => SlateElement> = {
  'qti-text-entry-interaction': parseTextEntryInteraction,
};

export const textEntrySerializers: Record<string, (el: SlateElement, ctx: SerializationContext, convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void) => Element | DocumentFragment | null> = {
  'qti-text-entry-interaction': serializeTextEntryInteraction as any,
};
