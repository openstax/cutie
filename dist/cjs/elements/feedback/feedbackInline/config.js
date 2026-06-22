"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackInlineConfig = void 0;
const slate_1 = require("slate");
exports.feedbackInlineConfig = {
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
            slate_1.Transforms.insertNodes(editor, { text: '' }, { at: path.concat(0) });
            return true;
        }
        return false;
    },
};
