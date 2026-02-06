import { Editor, Transforms } from 'slate';
import { generateUniqueResponseId } from '../../utils/idGenerator';

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
  const responseId = config.responseIdentifier || generateUniqueResponseId(editor);

  const textEntry = {
    type: 'qti-text-entry-interaction',
    children: [{ text: '' }],
    attributes: {
      'response-identifier': responseId,
      'expected-length': config.expectedLength,
      'pattern-mask': config.patternMask,
      'placeholder-text': config.placeholderText,
    },
    responseDeclaration: {
      tagName: 'qti-response-declaration',
      attributes: {
        identifier: responseId,
        cardinality: 'single',
        'base-type': 'string',
      },
      children: [],
    },
  };

  Transforms.insertNodes(editor, textEntry as any);
}
