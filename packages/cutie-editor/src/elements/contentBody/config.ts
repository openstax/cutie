import { Element } from 'slate';
import type { ElementConfig } from '../../types';
import { wrapInlineContentInParagraphs } from '../../utils/normalization';

export const contentBodyConfig: ElementConfig = {
  type: 'qti-content-body',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: [],
  matches: (element: Element) => 'type' in element && element.type === 'qti-content-body',

  normalize: (editor, node, path) => wrapInlineContentInParagraphs(editor, node, path),
};
