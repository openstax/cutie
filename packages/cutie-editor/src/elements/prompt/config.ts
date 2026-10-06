import { Element } from 'slate';
import type { ElementConfig } from '../../types.js';
import { wrapInlineContentInParagraphs } from '../../utils/normalization.js';

export const promptConfig: ElementConfig = {
  type: 'qti-prompt',
  xmlTagName: 'qti-prompt',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-prompt',

  normalize: (editor, node, path) => wrapInlineContentInParagraphs(editor, node, path),
};
