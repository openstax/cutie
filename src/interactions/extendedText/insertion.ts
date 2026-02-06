import { Editor, Element, Transforms } from 'slate';
import { generateUniqueResponseId } from '../../utils/idGenerator';

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
  const responseId = config.responseIdentifier || generateUniqueResponseId(editor);

  const extendedText = {
    type: 'qti-extended-text-interaction',
    children: [
      {
        type: 'qti-prompt',
        children: [
          { type: 'paragraph', children: [{ text: '' }], attributes: {} },
        ],
      },
    ],
    attributes: {
      'response-identifier': responseId,
      'expected-lines': config.expectedLines,
      'expected-length': config.expectedLength,
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

  // Get current selection to find where we'll insert
  const { selection } = editor;
  const insertPoint = selection ? Editor.start(editor, selection) : Editor.end(editor, []);

  Transforms.insertNodes(editor, extendedText as any, { at: insertPoint });

  // Find the inserted interaction and position cursor in the prompt
  const [interactionEntry] = Editor.nodes(editor, {
    at: insertPoint,
    match: (n) => Element.isElement(n) && 'type' in n && n.type === 'qti-extended-text-interaction',
  });

  if (interactionEntry) {
    const [, interactionPath] = interactionEntry;
    // Select the start of the prompt's paragraph: interaction -> prompt -> paragraph
    const promptParagraphPath = [...interactionPath, 0, 0];
    Transforms.select(editor, Editor.start(editor, promptParagraphPath));
  }

  // Insert trailing paragraph for cursor positioning after the interaction
  Transforms.insertNodes(
    editor,
    { type: 'paragraph', children: [{ text: '' }] } as any,
    { at: interactionEntry ? [interactionEntry[1][0] + 1] : undefined }
  );
}
