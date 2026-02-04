import { Editor, Element as SlateElement, Transforms } from 'slate';
import type { CustomEditor, QtiFeedbackBlock } from '../../../types';

/**
 * Insert a feedback block element at the current selection
 *
 * @param editor - The Slate editor instance
 * @param identifier - The feedback identifier (e.g., "RESPONSE_correct")
 * @param showHide - Whether to show or hide when matched (default: 'show')
 */
export function insertFeedbackBlock(
  editor: CustomEditor,
  identifier: string,
  showHide: 'show' | 'hide' = 'show'
): void {
  const feedbackNode: QtiFeedbackBlock = {
    type: 'qti-feedback-block',
    attributes: {
      'outcome-identifier': 'FEEDBACK',
      identifier,
      'show-hide': showHide,
    },
    children: [
      {
        type: 'qti-content-body',
        children: [
          {
            type: 'paragraph',
            children: [{ text: 'Feedback content goes here.' }],
          },
        ],
      },
    ],
  };

  // Insert the feedback block
  Transforms.insertNodes(editor, feedbackNode as SlateElement);

  // Insert a trailing paragraph for cursor positioning
  Transforms.insertNodes(editor, {
    type: 'paragraph',
    children: [{ text: '' }],
  } as SlateElement);
}

/**
 * Check if the current selection is inside a feedback block element
 */
export function isInFeedbackBlock(editor: CustomEditor): boolean {
  const [match] = Editor.nodes(editor, {
    match: (n) => 'type' in n && n.type === 'qti-feedback-block',
  });
  return !!match;
}
