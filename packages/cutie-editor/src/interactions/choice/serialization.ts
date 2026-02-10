import type { Descendant } from 'slate';
import type { SerializationContext } from '../../serialization/slateToXml';
import type { ConvertChildrenFn, ParserContext } from '../../serialization/xmlToSlate';
import { createXmlElement } from '../../serialization/xmlUtils';
import type { SlateElement, XmlNode } from '../../types';
import { choiceInteractionConfig } from './config';

/**
 * Create a default response declaration for a choice interaction
 */
function createDefaultResponseDeclaration(
  responseIdentifier: string,
  maxChoices: string
): XmlNode {
  return {
    tagName: 'qti-response-declaration',
    attributes: {
      identifier: responseIdentifier,
      cardinality: maxChoices === '1' ? 'single' : 'multiple',
      'base-type': 'identifier',
    },
    children: [],
  };
}

/**
 * Parse QTI choice interaction from XML
 */
function parseChoiceInteraction(
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
  const maxChoices = attributes['max-choices'] || '1';

  // Get existing response declaration or create a default one
  const responseDeclaration = (responseId && context?.responseDeclarations.get(responseId))
    || createDefaultResponseDeclaration(responseId, maxChoices);

  // Use structural conversion - children are qti-prompt and qti-simple-choice elements
  const children = convertChildrenStructural(Array.from(element.childNodes));
  return {
    type: 'qti-choice-interaction',
    children: children.length > 0 ? children : [{ type: 'qti-simple-choice', children: [{ text: '' }], attributes: { identifier: 'choice-1' } }],
    attributes: {
      'response-identifier': responseId,
      'max-choices': maxChoices,
      'min-choices': attributes['min-choices'],
      shuffle: attributes['shuffle'],
      ...attributes,
    },
    responseDeclaration,
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

    // Add response declaration to context if present
    if (element.responseDeclaration) {
      context.responseDeclarations.set(responseId, element.responseDeclaration);
    }

    // Register interaction config for response processing generation
    context.responseConfigs.set(responseId, choiceInteractionConfig);
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
export const choiceParsers: Record<string, (element: Element, convertChildren: ConvertChildrenFn, convertChildrenStructural: ConvertChildrenFn, context?: ParserContext) => SlateElement> = {
  'qti-choice-interaction': parseChoiceInteraction,
};

export const choiceSerializers: Record<string, (el: SlateElement, ctx: SerializationContext, convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void) => Element | DocumentFragment | null> = {
  'qti-choice-interaction': serializeChoiceInteraction as any,
};
