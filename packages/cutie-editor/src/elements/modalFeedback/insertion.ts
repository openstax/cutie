import { Editor, Element as SlateElement, Transforms } from 'slate';
import type { CustomEditor, QtiModalFeedback } from '../../types';

/**
 * Insert a modal feedback element at the current selection
 *
 * @param editor - The Slate editor instance
 * @param identifier - The feedback identifier (e.g., "RESPONSE_correct")
 * @param showHide - Whether to show or hide when matched (default: 'show')
 */
export function insertModalFeedback(
  editor: CustomEditor,
  identifier: string,
  showHide: 'show' | 'hide' = 'show'
): void {
  const feedbackNode: QtiModalFeedback = {
    type: 'qti-modal-feedback',
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
            children: [{ text: 'Modal feedback content goes here.' }],
          },
        ],
      },
    ],
  };

  // Insert the modal feedback
  Transforms.insertNodes(editor, feedbackNode as SlateElement);

  // Insert a trailing paragraph for cursor positioning
  Transforms.insertNodes(editor, {
    type: 'paragraph',
    children: [{ text: '' }],
  } as SlateElement);
}

/**
 * Check if the current selection is inside a modal feedback element
 */
export function isInModalFeedback(editor: CustomEditor): boolean {
  const [match] = Editor.nodes(editor, {
    match: (n) => 'type' in n && n.type === 'qti-modal-feedback',
  });
  return !!match;
}
