"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptConfig = void 0;
const normalization_1 = require("../../utils/normalization");
exports.promptConfig = {
    type: 'qti-prompt',
    xmlTagName: 'qti-prompt',
    isVoid: false,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'qti-prompt',
    normalize: (editor, node, path) => (0, normalization_1.wrapInlineContentInParagraphs)(editor, node, path),
};
