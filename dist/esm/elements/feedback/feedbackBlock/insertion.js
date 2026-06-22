import { Editor, Transforms } from 'slate';
/**
 * Insert a feedback block element at the current selection
 *
 * @param editor - The Slate editor instance
 * @param identifier - The feedback identifier (e.g., "RESPONSE_correct")
 * @param showHide - Whether to show or hide when matched (default: 'show')
 */
export function insertFeedbackBlock(editor, identifier, showHide = 'show') {
    const feedbackNode = {
        type: 'qti-feedback-block',
        attributes: {
            'outcome-identifier': 'FEEDBACK',
            identifier,
            'show-hide': showHide,
            'data-feedback-type': 'info',
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
    Transforms.insertNodes(editor, feedbackNode);
    // Insert a trailing paragraph for cursor positioning
    Transforms.insertNodes(editor, {
        type: 'paragraph',
        children: [{ text: '' }],
    });
}
/**
 * Check if the current selection is inside a feedback block element
 */
export function isInFeedbackBlock(editor) {
    const [match] = Editor.nodes(editor, {
        match: (n) => 'type' in n && n.type === 'qti-feedback-block',
    });
    return !!match;
}
