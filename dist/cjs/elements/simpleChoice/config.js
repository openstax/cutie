"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.choiceContentConfig = exports.choiceIdLabelConfig = exports.simpleChoiceConfig = void 0;
const normalization_1 = require("../../utils/normalization");
exports.simpleChoiceConfig = {
    type: 'qti-simple-choice',
    xmlTagName: 'qti-simple-choice',
    isVoid: false,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'qti-simple-choice',
};
exports.choiceIdLabelConfig = {
    type: 'choice-id-label',
    xmlTagName: null,
    isVoid: true,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: [],
    matches: (element) => 'type' in element && element.type === 'choice-id-label',
};
exports.choiceContentConfig = {
    type: 'choice-content',
    xmlTagName: null,
    isVoid: false,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'choice-content',
    normalize: (editor, node, path) => (0, normalization_1.wrapInlineContentInParagraphs)(editor, node, path),
};
