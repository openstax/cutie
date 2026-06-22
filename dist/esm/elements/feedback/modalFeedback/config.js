import { Element, Transforms } from 'slate';
export const modalFeedbackConfig = {
    type: 'qti-modal-feedback',
    xmlTagName: 'qti-modal-feedback',
    isVoid: false,
    isInline: false,
    needsSpacers: false,
    categories: ['feedback', 'modal-feedback'],
    forbidDescendants: ['feedback', 'modal-feedback'],
    matches: (element) => 'type' in element && element.type === 'qti-modal-feedback',
    normalize: (editor, node, path) => {
        // QTI 3.0 requires flow content to be wrapped in qti-content-body
        // Check if there's a qti-content-body child
        const hasContentBody = node.children.some((child) => Element.isElement(child) &&
            'type' in child &&
            child.type === 'qti-content-body');
        if (!hasContentBody) {
            // Insert qti-content-body with empty paragraph
            Transforms.insertNodes(editor, {
                type: 'qti-content-body',
                children: [
                    { type: 'paragraph', children: [{ text: '' }], attributes: {} },
                ],
            }, { at: path.concat(node.children.length) });
            return true;
        }
        return false;
    },
};
