import { Editor, Element, Transforms } from 'slate';
import { generateUniqueResponseId } from '../../utils/idGenerator';

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
  const responseId = config.responseIdentifier || generateUniqueResponseId(editor);
  const maxChoices = config.maxChoices || '1';
  const choices = config.choices || [
    { identifier: 'choice-1', text: 'Choice 1' },
    { identifier: 'choice-2', text: 'Choice 2' },
  ];

  // Include the prompt in the initial structure so we can position cursor there
  const choiceInteraction = {
    type: 'qti-choice-interaction',
    attributes: {
      'response-identifier': responseId,
      'max-choices': maxChoices,
      'min-choices': config.minChoices,
      shuffle: config.shuffle ? 'true' : undefined,
    },
    children: [
      {
        type: 'qti-prompt',
        children: [
          { type: 'paragraph', children: [{ text: '' }], attributes: {} },
        ],
      },
      ...choices.map((choice) => ({
        type: 'qti-simple-choice',
        attributes: {
          identifier: choice.identifier,
        },
        children: [
          {
            type: 'choice-id-label',
            children: [{ text: '' }],
            attributes: { identifier: choice.identifier },
          },
          {
            type: 'choice-content',
            children: [
              {
                type: 'paragraph',
                children: [{ text: choice.text || choice.identifier }],
                attributes: {},
              },
            ],
            attributes: {},
          },
        ],
      })),
    ],
    responseDeclaration: {
      tagName: 'qti-response-declaration',
      attributes: {
        identifier: responseId,
        cardinality: maxChoices === '1' ? 'single' : 'multiple',
        'base-type': 'identifier',
      },
      children: [],
    },
  };

  // Get current selection to find where we'll insert
  const { selection } = editor;
  const insertPoint = selection ? Editor.start(editor, selection) : Editor.end(editor, []);

  Transforms.insertNodes(editor, choiceInteraction as any, { at: insertPoint });

  // Find the inserted interaction and position cursor in the prompt
  // The interaction was inserted at insertPoint, so we need to find it
  const [interactionEntry] = Editor.nodes(editor, {
    at: insertPoint,
    match: (n) => Element.isElement(n) && 'type' in n && n.type === 'qti-choice-interaction',
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
