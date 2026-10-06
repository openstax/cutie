import { Element } from 'slate';
import type { ElementConfig } from '../../types.js';
import { wrapInlineContentInParagraphs } from '../../utils/normalization.js';

export const contentBodyConfig: ElementConfig = {
  type: 'qti-content-body',
  xmlTagName: 'qti-content-body',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: [],
  matches: (element: Element) => 'type' in element && element.type === 'qti-content-body',

  normalize: (editor, node, path) => wrapInlineContentInParagraphs(editor, node, path),
};
