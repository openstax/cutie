"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertFeedbackInline = insertFeedbackInline;
exports.removeFeedbackInline = removeFeedbackInline;
exports.isInFeedbackInline = isInFeedbackInline;
const slate_1 = require("slate");
/**
 * Insert a feedback inline element at the current selection
 *
 * @param editor - The Slate editor instance
 * @param identifier - The feedback identifier (e.g., "RESPONSE_correct")
 * @param showHide - Whether to show or hide when matched (default: 'show')
 */
function insertFeedbackInline(editor, identifier, showHide = 'show') {
    const { selection } = editor;
    if (!selection)
        return;
    const isExpanded = slate_1.Range.isExpanded(selection);
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
        slate_1.Transforms.wrapNodes(editor, feedbackNode, { split: true });
    }
    else {
        // Insert new feedback at cursor
        slate_1.Transforms.insertNodes(editor, feedbackNode);
    }
}
/**
 * Remove feedback inline formatting from the selection
 */
function removeFeedbackInline(editor) {
    slate_1.Transforms.unwrapNodes(editor, {
        match: (n) => 'type' in n && n.type === 'qti-feedback-inline',
        split: true,
    });
}
/**
 * Check if the current selection is inside a feedback inline element
 */
function isInFeedbackInline(editor) {
    const [match] = slate_1.Editor.nodes(editor, {
        match: (n) => 'type' in n && n.type === 'qti-feedback-inline',
    });
    return !!match;
}
