import { Element } from 'slate';
import type { ElementConfig } from '../../../types.js';
import { wrapFeedbackContentInContentBody } from '../../../utils/normalization.js';

export const modalFeedbackConfig: ElementConfig = {
  type: 'qti-modal-feedback',
  xmlTagName: 'qti-modal-feedback',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: ['feedback', 'modal-feedback'],
  forbidDescendants: ['feedback', 'modal-feedback'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-modal-feedback',

  normalize: (editor, node, path) => wrapFeedbackContentInContentBody(editor, node, path),
};
