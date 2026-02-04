import type { Descendant } from 'slate';
import type { SerializationContext } from '../../serialization/slateToXml';
import type { ConvertChildrenFn, ParserContext } from '../../serialization/xmlToSlate';
import { createXmlElement } from '../../serialization/xmlUtils';
import type { InlineChoiceOption, SlateElement, XmlNode } from '../../types';

/**
 * Create a default response declaration for an inline choice interaction
 */
function createDefaultResponseDeclaration(responseIdentifier: string): XmlNode {
  return {
    tagName: 'qti-response-declaration',
    attributes: {
      identifier: responseIdentifier,
      cardinality: 'single',
      'base-type': 'identifier',
    },
    children: [],
  };
}

/**
 * Parse QTI inline choice interaction from XML
 */
function parseInlineChoiceInteraction(
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

  // Parse qti-inline-choice children to extract choices
  const choices: InlineChoiceOption[] = [];
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i];
    if (child.tagName?.toLowerCase() === 'qti-inline-choice') {
      const identifier = child.getAttribute('identifier');
      if (identifier) {
        choices.push({
          identifier,
          text: child.textContent ?? '',
          fixed: child.getAttribute('fixed') === 'true' ? true : undefined,
        });
      }
    }
  }

  // Get existing response declaration or create a default one
  const responseDeclaration = (responseId && context?.responseDeclarations.get(responseId))
    || createDefaultResponseDeclaration(responseId);

  return {
    type: 'qti-inline-choice-interaction',
    children: [{ text: '' }],
    attributes: {
      'response-identifier': responseId,
      shuffle: attributes['shuffle'],
      ...attributes,
    },
    choices,
    responseDeclaration,
  };
}

/**
 * Serialize inline choice interaction to XML
 */
function serializeInlineChoiceInteraction(
  element: SlateElement & { type: 'qti-inline-choice-interaction' },
  context: SerializationContext,
  _convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-inline-choice-interaction');

  // Track response identifier
  const responseId = element.attributes['response-identifier'];
  if (responseId) {
    context.responseIdentifiers.push(responseId);

    // Add response declaration to context if present
    if (element.responseDeclaration) {
      context.responseDeclarations.set(responseId, element.responseDeclaration);
    }
  } else {
    context.errors.push({
      type: 'missing-identifier',
      message: 'Inline choice interaction missing response-identifier',
    });
  }

  // Set interaction attributes (excluding choices which are serialized as child elements)
  setAttributes(xmlElement, element.attributes);

  // Serialize choices as qti-inline-choice child elements
  const choices = (element as any).choices as InlineChoiceOption[] | undefined;
  if (choices && choices.length > 0) {
    for (const choice of choices) {
      const choiceElement = createXmlElement(context.doc, 'qti-inline-choice');
      choiceElement.setAttribute('identifier', choice.identifier);
      if (choice.fixed) {
        choiceElement.setAttribute('fixed', 'true');
      }
      choiceElement.textContent = choice.text;
      xmlElement.appendChild(choiceElement);
    }
  }

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
export const inlineChoiceParsers: Record<string, (element: Element, convertChildren: ConvertChildrenFn, convertChildrenStructural: ConvertChildrenFn, context?: ParserContext) => SlateElement> = {
  'qti-inline-choice-interaction': parseInlineChoiceInteraction,
};

export const inlineChoiceSerializers: Record<string, (el: SlateElement, ctx: SerializationContext, convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void) => Element | DocumentFragment | null> = {
  'qti-inline-choice-interaction': serializeInlineChoiceInteraction as any,
};
