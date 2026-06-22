import { Transforms } from 'slate';
export const feedbackInlineConfig = {
    type: 'qti-feedback-inline',
    xmlTagName: 'qti-feedback-inline',
    isVoid: false,
    isInline: true,
    needsSpacers: false,
    categories: ['feedback'],
    forbidDescendants: ['feedback'],
    matches: (element) => 'type' in element && element.type === 'qti-feedback-inline',
    normalize: (editor, node, path) => {
        // If empty, insert empty text node
        if (node.children.length === 0) {
            Transforms.insertNodes(editor, { text: '' }, { at: path.concat(0) });
            return true;
        }
        return false;
    },
};
