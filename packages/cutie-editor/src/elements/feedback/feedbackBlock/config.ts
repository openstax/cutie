import { Element } from 'slate';
import type { ElementConfig } from '../../../types.js';
import { wrapFeedbackContentInContentBody } from '../../../utils/normalization.js';

export const feedbackBlockConfig: ElementConfig = {
  type: 'qti-feedback-block',
  xmlTagName: 'qti-feedback-block',
  isVoid: false,
  isInline: false,
  needsSpacers: true,
  categories: ['feedback'],
  forbidDescendants: ['feedback'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-feedback-block',

  normalize: (editor, node, path) => wrapFeedbackContentInContentBody(editor, node, path),
};
