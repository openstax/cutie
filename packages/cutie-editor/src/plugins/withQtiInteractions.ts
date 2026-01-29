import { Editor, Element, Transforms } from 'slate';
import type { CustomEditor } from '../types';

/**
 * Plugin to handle QTI interaction-specific behavior
 */
export function withQtiInteractions(editor: CustomEditor): CustomEditor {
  const { isVoid, isInline } = editor;

  // Mark certain interactions as void
  editor.isVoid = (element: Element) => {
    if ('type' in element) {
      const type = element.type as string;
      if (
        type === 'qti-text-entry-interaction' ||
        type === 'qti-extended-text-interaction' ||
        type === 'image' ||
        type === 'line-break'
      ) {
        return true;
      }

      // Check if unknown QTI element is marked as void
      if (type === 'qti-unknown' && 'isVoid' in element && element.isVoid) {
        return true;
      }
    }

    return isVoid(element);
  };

  // Mark text-entry as inline (but NOT choice-id-label - it should be block to avoid spacers)
  editor.isInline = (element: Element) => {
    if ('type' in element) {
      const type = element.type as string;
      if (
        type === 'qti-text-entry-interaction' ||
        type === 'span' ||
        type === 'strong' ||
        type === 'em'
      ) {
        return true;
      }
    }

    return isInline(element);
  };


  return editor;
}

/**
 * Generate a unique response identifier
 */
export function generateResponseId(editor: Editor): string {
  const existingIds = new Set<string>();

  // Collect all existing response identifiers
  const nodes = Array.from(Editor.nodes(editor, {
    at: [],
    match: (n) => {
      if (!Element.isElement(n)) return false;
      if (!('type' in n)) return false;
      const type = n.type as string;
      return (
        type === 'qti-text-entry-interaction' ||
        type === 'qti-extended-text-interaction' ||
        type === 'qti-choice-interaction'
      );
    },
  }));

  for (const [node] of nodes) {
    if (Element.isElement(node) && 'attributes' in node) {
      const attrs = node.attributes as any;
      if (attrs && attrs['response-identifier']) {
        existingIds.add(attrs['response-identifier']);
      }
    }
  }

  // Generate unique ID
  let counter = 1;
  let id = `RESPONSE_${counter}`;
  while (existingIds.has(id)) {
    counter++;
    id = `RESPONSE_${counter}`;
  }

  return id;
}

/**
 * Insert a text entry interaction at the current selection
 */
export function insertTextEntryInteraction(
  editor: Editor,
  config: {
    responseIdentifier?: string;
    expectedLength?: string;
    patternMask?: string;
    placeholderText?: string;
  } = {}
): void {
  const responseId = config.responseIdentifier || generateResponseId(editor);

  const textEntry = {
    type: 'qti-text-entry-interaction',
    children: [{ text: '' }],
    attributes: {
      'response-identifier': responseId,
      'expected-length': config.expectedLength,
      'pattern-mask': config.patternMask,
      'placeholder-text': config.placeholderText,
    },
  };

  Transforms.insertNodes(editor, textEntry as any);
}

/**
 * Insert an extended text interaction at the current selection
 */
export function insertExtendedTextInteraction(
  editor: Editor,
  config: {
    responseIdentifier?: string;
    expectedLines?: string;
    expectedLength?: string;
    placeholderText?: string;
  } = {}
): void {
  const responseId = config.responseIdentifier || generateResponseId(editor);

  const extendedText = {
    type: 'qti-extended-text-interaction',
    children: [{ text: '' }],
    attributes: {
      'response-identifier': responseId,
      'expected-lines': config.expectedLines,
      'expected-length': config.expectedLength,
      'placeholder-text': config.placeholderText,
    },
  };

  Transforms.insertNodes(editor, extendedText as any);
  Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] } as any);
}

/**
 * Insert a choice interaction at the current selection
 */
export function insertChoiceInteraction(
  editor: Editor,
  config: {
    responseIdentifier?: string;
    maxChoices?: string;
    minChoices?: string;
    shuffle?: boolean;
    choices?: Array<{ identifier: string; text?: string }>;
  } = {}
): void {
  const responseId = config.responseIdentifier || generateResponseId(editor);
  const choices = config.choices || [
    { identifier: 'choice-1', text: 'Choice 1' },
    { identifier: 'choice-2', text: 'Choice 2' },
  ];

  const choiceInteraction = {
    type: 'qti-choice-interaction',
    attributes: {
      'response-identifier': responseId,
      'max-choices': config.maxChoices || '1',
      'min-choices': config.minChoices,
      shuffle: config.shuffle ? 'true' : undefined,
    },
    children: choices.map((choice) => ({
      type: 'qti-simple-choice',
      attributes: {
        identifier: choice.identifier,
      },
      children: [
        {
          type: 'choice-id-label',
          children: [{ text: choice.identifier }],
          attributes: {},
        },
        {
          type: 'choice-content',
          children: [{ text: choice.text || choice.identifier }],
          attributes: {},
        },
      ],
    })),
  };

  Transforms.insertNodes(editor, choiceInteraction as any);
  Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] } as any);
}
