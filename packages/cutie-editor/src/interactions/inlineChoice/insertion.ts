import { Editor, Element, Transforms } from 'slate';
import type { InlineChoiceOption } from '../../types';

/**
 * Generate a unique response identifier
 */
function generateResponseId(editor: Editor): string {
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
        type === 'qti-choice-interaction' ||
        type === 'qti-inline-choice-interaction'
      );
    },
  }));

  for (const [node] of nodes) {
    if (Element.isElement(node) && 'attributes' in node) {
      const attrs = node.attributes as Record<string, string | undefined>;
      if (attrs && attrs['response-identifier']) {
        existingIds.add(attrs['response-identifier']);
      }
    }
  }

  // Generate unique ID
  // First interaction gets "RESPONSE", subsequent get "RESPONSE_2", "RESPONSE_3", etc.
  if (!existingIds.has('RESPONSE')) {
    return 'RESPONSE';
  }

  let counter = 2;
  let id = `RESPONSE_${counter}`;
  while (existingIds.has(id)) {
    counter++;
    id = `RESPONSE_${counter}`;
  }

  return id;
}

/**
 * Insert an inline choice interaction at the current selection
 */
export function insertInlineChoiceInteraction(
  editor: Editor,
  config: {
    responseIdentifier?: string;
    shuffle?: boolean;
    choices?: InlineChoiceOption[];
  } = {}
): void {
  const responseId = config.responseIdentifier || generateResponseId(editor);

  const defaultChoices: InlineChoiceOption[] = config.choices || [
    { identifier: 'choice-1', text: 'Option 1' },
    { identifier: 'choice-2', text: 'Option 2' },
    { identifier: 'choice-3', text: 'Option 3' },
  ];

  const inlineChoice = {
    type: 'qti-inline-choice-interaction',
    children: [{ text: '' }],
    attributes: {
      'response-identifier': responseId,
      ...(config.shuffle && { shuffle: 'true' }),
    },
    choices: defaultChoices,
    responseDeclaration: {
      tagName: 'qti-response-declaration',
      attributes: {
        identifier: responseId,
        cardinality: 'single',
        'base-type': 'identifier',
      },
      children: [],
    },
  };

  Transforms.insertNodes(editor, inlineChoice as any);
}
