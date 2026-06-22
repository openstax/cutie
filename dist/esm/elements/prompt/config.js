import { wrapInlineContentInParagraphs } from '../../utils/normalization';
export const promptConfig = {
    type: 'qti-prompt',
    xmlTagName: 'qti-prompt',
    isVoid: false,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'qti-prompt',
    normalize: (editor, node, path) => wrapInlineContentInParagraphs(editor, node, path),
};
