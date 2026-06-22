import { wrapInlineContentInParagraphs } from '../../utils/normalization';
export const simpleChoiceConfig = {
    type: 'qti-simple-choice',
    xmlTagName: 'qti-simple-choice',
    isVoid: false,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'qti-simple-choice',
};
export const choiceIdLabelConfig = {
    type: 'choice-id-label',
    xmlTagName: null,
    isVoid: true,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: [],
    matches: (element) => 'type' in element && element.type === 'choice-id-label',
};
export const choiceContentConfig = {
    type: 'choice-content',
    xmlTagName: null,
    isVoid: false,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'choice-content',
    normalize: (editor, node, path) => wrapInlineContentInParagraphs(editor, node, path),
};
