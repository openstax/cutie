import { Editor, Range, Transforms } from 'slate';
/**
 * Insert a feedback inline element at the current selection
 *
 * @param editor - The Slate editor instance
 * @param identifier - The feedback identifier (e.g., "RESPONSE_correct")
 * @param showHide - Whether to show or hide when matched (default: 'show')
 */
export function insertFeedbackInline(editor, identifier, showHide = 'show') {
    const { selection } = editor;
    if (!selection)
        return;
    const isExpanded = Range.isExpanded(selection);
    const feedbackNode = {
        type: 'qti-feedback-inline',
        attributes: {
            'outcome-identifier': 'FEEDBACK',
            identifier,
            'show-hide': showHide,
            'data-feedback-type': 'info',
        },
        children: isExpanded
            ? [] // Children will be wrapped from selection
            : [{ text: 'Feedback text' }],
    };
    if (isExpanded) {
        // Wrap the selection in feedback
        Transforms.wrapNodes(editor, feedbackNode, { split: true });
    }
    else {
        // Insert new feedback at cursor
        Transforms.insertNodes(editor, feedbackNode);
    }
}
/**
 * Remove feedback inline formatting from the selection
 */
export function removeFeedbackInline(editor) {
    Transforms.unwrapNodes(editor, {
        match: (n) => 'type' in n && n.type === 'qti-feedback-inline',
        split: true,
    });
}
/**
 * Check if the current selection is inside a feedback inline element
 */
export function isInFeedbackInline(editor) {
    const [match] = Editor.nodes(editor, {
        match: (n) => 'type' in n && n.type === 'qti-feedback-inline',
    });
    return !!match;
}
