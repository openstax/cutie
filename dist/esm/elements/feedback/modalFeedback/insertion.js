import { Editor, Element as SlateElement, Transforms } from 'slate';
/**
 * Insert a modal feedback element at the bottom of the editor
 *
 * @param editor - The Slate editor instance
 * @param identifier - The feedback identifier (e.g., "RESPONSE_correct")
 * @param showHide - Whether to show or hide when matched (default: 'show')
 */
export function insertModalFeedback(editor, identifier, showHide = 'show') {
    const feedbackNode = {
        type: 'qti-modal-feedback',
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
                        children: [{ text: 'Modal feedback content goes here.' }],
                    },
                ],
            },
        ],
    };
    // Insert the modal feedback at the bottom of the editor
    const endPath = [editor.children.length];
    Transforms.insertNodes(editor, feedbackNode, { at: endPath });
    // Find the inserted modal feedback and position cursor inside it
    const [feedbackEntry] = Editor.nodes(editor, {
        at: endPath,
        match: (n) => SlateElement.isElement(n) && 'type' in n && n.type === 'qti-modal-feedback',
    });
    if (feedbackEntry) {
        const [, feedbackPath] = feedbackEntry;
        // Select the start of the content paragraph: modal-feedback -> content-body -> paragraph
        const contentParagraphPath = [...feedbackPath, 0, 0];
        Transforms.select(editor, Editor.start(editor, contentParagraphPath));
    }
    // Insert a trailing paragraph for cursor positioning
    Transforms.insertNodes(editor, {
        type: 'paragraph',
        children: [{ text: '' }],
    }, { at: [editor.children.length] });
}
/**
 * Check if the current selection is inside a modal feedback element
 */
export function isInModalFeedback(editor) {
    const [match] = Editor.nodes(editor, {
        match: (n) => 'type' in n && n.type === 'qti-modal-feedback',
    });
    return !!match;
}
