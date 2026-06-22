"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentBodyConfig = void 0;
const normalization_1 = require("../../utils/normalization");
exports.contentBodyConfig = {
    type: 'qti-content-body',
    xmlTagName: 'qti-content-body',
    isVoid: false,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: [],
    matches: (element) => 'type' in element && element.type === 'qti-content-body',
    normalize: (editor, node, path) => (0, normalization_1.wrapInlineContentInParagraphs)(editor, node, path),
};
