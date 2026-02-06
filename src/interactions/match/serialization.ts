import type { Descendant } from 'slate';
import type { SerializationContext } from '../../serialization/slateToXml';
import type { ConvertChildrenFn, ParserContext } from '../../serialization/xmlToSlate';
import { createXmlElement } from '../../serialization/xmlUtils';
import type { QtiSimpleAssociableChoice, SlateElement, XmlNode } from '../../types';

/**
 * Create a default response declaration for a match interaction
 */
function createDefaultResponseDeclaration(responseIdentifier: string): XmlNode {
  return {
    tagName: 'qti-response-declaration',
    attributes: {
      identifier: responseIdentifier,
      cardinality: 'multiple',
      'base-type': 'directedPair',
    },
    children: [],
  };
}

/**
 * Create a default simple associable choice
 */
function createDefaultAssociableChoice(
  identifier: string,
  text: string
): QtiSimpleAssociableChoice {
  return {
    type: 'qti-simple-associable-choice',
    children: [{ text }],
    attributes: { identifier, 'match-max': '1' },
  };
}

/**
 * Parse QTI match interaction from XML
 */
function parseMatchInteraction(
  element: Element,
  convertChildren: ConvertChildrenFn,
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
  const responseDeclaration =
    (responseId && context?.responseDeclarations.get(responseId)) ||
    createDefaultResponseDeclaration(responseId);

  // Process children
  const children = Array.from(element.childNodes);
  let promptElement: SlateElement | null = null;
  const matchSets: Element[] = [];

  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tagName = el.tagName.toLowerCase();
      if (tagName === 'qti-prompt') {
        // Parse the prompt
        const promptChildren = convertChildren(Array.from(el.childNodes));
        promptElement = {
          type: 'qti-prompt',
          children: promptChildren.length > 0 ? promptChildren : [{ text: '' }],
          attributes: {},
        } as SlateElement;
      } else if (tagName === 'qti-simple-match-set') {
        matchSets.push(el);
      }
    }
  }

  // Parse the two match sets (first = source, second = target)
  const sourceChoices: SlateElement[] = [];
  const targetChoices: SlateElement[] = [];

  if (matchSets[0]) {
    const choiceElements = matchSets[0].querySelectorAll(
      'qti-simple-associable-choice'
    );
    for (const choiceEl of choiceElements) {
      sourceChoices.push(parseSimpleAssociableChoice(choiceEl, convertChildren));
    }
  }

  if (matchSets[1]) {
    const choiceElements = matchSets[1].querySelectorAll(
      'qti-simple-associable-choice'
    );
    for (const choiceEl of choiceElements) {
      targetChoices.push(parseSimpleAssociableChoice(choiceEl, convertChildren));
    }
  }

  // Build children array
  const resultChildren: SlateElement[] = [];

  if (promptElement) {
    resultChildren.push(promptElement);
  }

  resultChildren.push({
    type: 'match-source-set',
    children:
      sourceChoices.length > 0
        ? sourceChoices
        : [
            createDefaultAssociableChoice('sourceA', 'Source A'),
            createDefaultAssociableChoice('sourceB', 'Source B'),
          ],
  } as SlateElement);

  resultChildren.push({
    type: 'match-target-set',
    children:
      targetChoices.length > 0
        ? targetChoices
        : [
            createDefaultAssociableChoice('targetX', 'Target X'),
            createDefaultAssociableChoice('targetY', 'Target Y'),
          ],
  } as SlateElement);

  return {
    type: 'qti-match-interaction',
    children: resultChildren,
    attributes: {
      'response-identifier': responseId,
      'max-associations': attributes['max-associations'],
      'min-associations': attributes['min-associations'],
      shuffle: attributes['shuffle'],
      ...attributes,
    },
    responseDeclaration,
  } as SlateElement;
}

/**
 * Parse qti-simple-associable-choice element
 */
function parseSimpleAssociableChoice(
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
    type: 'qti-simple-associable-choice',
    children: children.length > 0 ? children : [{ text: '' }],
    attributes: {
      identifier: attributes['identifier'] || '',
      'match-max': attributes['match-max'],
      'match-min': attributes['match-min'],
      fixed: attributes['fixed'],
      ...attributes,
    },
  } as SlateElement;
}

/**
 * Serialize match interaction to XML
 */
function serializeMatchInteraction(
  element: SlateElement & { type: 'qti-match-interaction' },
  context: SerializationContext,
  convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-match-interaction');

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
      message: 'Match interaction missing response-identifier',
    });
  }

  // Set attributes
  for (const [key, value] of Object.entries(element.attributes)) {
    if (value !== undefined) {
      xmlElement.setAttribute(key, value);
    }
  }

  // Serialize children
  for (const child of element.children) {
    if ('type' in child) {
      if (child.type === 'qti-prompt') {
        // Serialize prompt directly
        const promptEl = createXmlElement(context.doc, 'qti-prompt');
        convertChildren(child.children, promptEl);
        xmlElement.appendChild(promptEl);
      } else if (child.type === 'match-source-set') {
        // Unwrap to qti-simple-match-set
        const matchSet = createXmlElement(context.doc, 'qti-simple-match-set');
        convertChildren(child.children, matchSet);
        xmlElement.appendChild(matchSet);
      } else if (child.type === 'match-target-set') {
        // Unwrap to qti-simple-match-set
        const matchSet = createXmlElement(context.doc, 'qti-simple-match-set');
        convertChildren(child.children, matchSet);
        xmlElement.appendChild(matchSet);
      }
    }
  }

  return xmlElement;
}

/**
 * Serialize simple associable choice to XML
 */
function serializeSimpleAssociableChoice(
  element: SlateElement & { type: 'qti-simple-associable-choice' },
  context: SerializationContext,
  convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): Element {
  const xmlElement = createXmlElement(
    context.doc,
    'qti-simple-associable-choice'
  );

  // Set attributes
  for (const [key, value] of Object.entries(element.attributes)) {
    if (value !== undefined) {
      xmlElement.setAttribute(key, value);
    }
  }

  // Convert children (text content)
  convertChildren(element.children, xmlElement);

  return xmlElement;
}

/**
 * Serialize match-source-set (editor-only wrapper) - returns DocumentFragment
 */
function serializeMatchSourceSet(
  element: SlateElement & { type: 'match-source-set' },
  context: SerializationContext,
  convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): DocumentFragment {
  const fragment = context.doc.createDocumentFragment();
  convertChildren(element.children, fragment);
  return fragment;
}

/**
 * Serialize match-target-set (editor-only wrapper) - returns DocumentFragment
 */
function serializeMatchTargetSet(
  element: SlateElement & { type: 'match-target-set' },
  context: SerializationContext,
  convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): DocumentFragment {
  const fragment = context.doc.createDocumentFragment();
  convertChildren(element.children, fragment);
  return fragment;
}

/**
 * Export parsers and serializers as objects that can be spread
 */
export const matchParsers: Record<
  string,
  (
    element: Element,
    convertChildren: ConvertChildrenFn,
    convertChildrenStructural: ConvertChildrenFn,
    context?: ParserContext
  ) => SlateElement
> = {
  'qti-match-interaction': parseMatchInteraction,
};

export const matchSerializers: Record<
  string,
  (
    el: SlateElement,
    ctx: SerializationContext,
    convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
  ) => Element | DocumentFragment | null
> = {
  'qti-match-interaction': serializeMatchInteraction as any,
  'qti-simple-associable-choice': serializeSimpleAssociableChoice as any,
  'match-source-set': serializeMatchSourceSet as any,
  'match-target-set': serializeMatchTargetSet as any,
};
