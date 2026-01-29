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
 * Parse QTI simple choice from XML
 */
function parseSimpleChoice(
  element: Element,
  convertChildren: ConvertChildrenFn
): SlateElement {
  const attributes: Record<string, string | undefined> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }

  const children = convertChildren(Array.from(element.childNodes));
  const identifier = attributes['identifier'] || '';

  // Create the editable ID label as first child
  const idLabel: SlateElement = {
    type: 'choice-id-label',
    children: [{ text: identifier }],
    attributes: {},
  };

  // If content doesn't have paragraph children, wrap in paragraph for proper editing
  const hasParagraph = children.some(child => 'type' in child && child.type === 'paragraph');

  let contentChildren: Descendant[];
  if (!hasParagraph && children.length > 0) {
    // Wrap text/inline content in paragraph
    contentChildren = [{
      type: 'paragraph',
      children: children,
      attributes: {},
    }];
  } else if (children.length > 0) {
    contentChildren = children;
  } else {
    // Empty choice - add empty paragraph
    contentChildren = [{
      type: 'paragraph',
      children: [{ text: '' }],
      attributes: {},
    }];
  }

  // Wrap content in choice-content element (second child)
  const contentWrapper: SlateElement = {
    type: 'choice-content',
    children: contentChildren,
    attributes: {},
  };

  // qti-simple-choice has exactly 2 children: ID label and content wrapper
  return {
    type: 'qti-simple-choice',
    children: [idLabel, contentWrapper],
    attributes: {
      identifier,
      fixed: attributes['fixed'],
      ...attributes,
    },
  } as SlateElement;
}

/**
 * Parse QTI prompt from XML
 */
function parsePrompt(
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
    type: 'qti-prompt',
    children: children.length > 0 ? children : [{ text: '' }],
    attributes,
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
 * Serialize simple choice to XML
 */
function serializeSimpleChoice(
  element: SlateElement & { type: 'qti-simple-choice' },
  context: SerializationContext,
  convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): Element {
  const xmlElement = createXmlElement(context.doc, 'qti-simple-choice');

  // Extract identifier from choice-id-label (first child)
  let identifier = '';
  const firstChild = element.children[0];
  if (firstChild && 'type' in firstChild && firstChild.type === 'choice-id-label') {
    // Get text content from choice-id-label
    identifier = firstChild.children
      .filter((child): child is { text: string } => 'text' in child)
      .map(child => child.text)
      .join('');
  }

  // Set attributes with identifier from label
  const attributes = { ...element.attributes };
  if (identifier) {
    attributes.identifier = identifier;
  }
  setAttributes(xmlElement, attributes);

  // Convert children (choice-id-label will be skipped by serializer map)
  convertChildren(element.children, xmlElement);

  return xmlElement;
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
 * Serialize choice-content wrapper (unwrap its children)
 */
function serializeChoiceContent(
  element: SlateElement & { type: 'choice-content' },
  context: SerializationContext,
  convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void
): DocumentFragment {
  // Unwrap choice-content - return its children directly (it's editor-only wrapper)
  const fragment = context.doc.createDocumentFragment();

  // If there's exactly one child and it's a paragraph, unwrap it for clean XML
  if (element.children.length === 1) {
    const onlyChild = element.children[0];
    if ('type' in onlyChild && onlyChild.type === 'paragraph') {
      // Unwrap paragraph - serialize its children directly
      convertChildren(onlyChild.children, fragment);
      return fragment;
    }
  }

  // Otherwise serialize all children normally
  convertChildren(element.children, fragment);
  return fragment;
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
  'qti-simple-choice': parseSimpleChoice,
  'qti-prompt': parsePrompt,
};

export const choiceSerializers: Record<string, (el: SlateElement, ctx: SerializationContext, convertChildren: (children: Descendant[], parent: Element | DocumentFragment) => void) => Element | DocumentFragment | null> = {
  'qti-choice-interaction': serializeChoiceInteraction as any,
  'qti-simple-choice': serializeSimpleChoice as any,
  'qti-prompt': serializePrompt as any,
  'choice-id-label': () => null, // Skip during serialization (it's editor-only, identifier is in parent attributes)
  'choice-content': serializeChoiceContent as any,
};
