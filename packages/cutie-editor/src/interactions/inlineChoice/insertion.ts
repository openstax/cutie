import { Editor, Transforms } from 'slate';
import type { InlineChoiceOption } from '../../types';
import { generateUniqueResponseId } from '../../utils/idGenerator';

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
  const responseId = config.responseIdentifier || generateUniqueResponseId(editor);

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
