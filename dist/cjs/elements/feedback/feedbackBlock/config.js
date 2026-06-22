"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackBlockConfig = void 0;
const slate_1 = require("slate");
exports.feedbackBlockConfig = {
    type: 'qti-feedback-block',
    xmlTagName: 'qti-feedback-block',
    isVoid: false,
    isInline: false,
    needsSpacers: true,
    categories: ['feedback'],
    forbidDescendants: ['feedback'],
    matches: (element) => 'type' in element && element.type === 'qti-feedback-block',
    normalize: (editor, node, path) => {
        // QTI 3.0 requires flow content to be wrapped in qti-content-body
        // Check if there's a qti-content-body child
        const hasContentBody = node.children.some((child) => slate_1.Element.isElement(child) &&
            'type' in child &&
            child.type === 'qti-content-body');
        if (!hasContentBody) {
            // Insert qti-content-body with empty paragraph
            slate_1.Transforms.insertNodes(editor, {
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
