import { Element, Transforms } from 'slate';
import type { CustomEditor, ElementConfig } from '../../../types';

export const feedbackBlockConfig: ElementConfig = {
  type: 'qti-feedback-block',
  isVoid: false,
  isInline: false,
  needsSpacers: true,
  categories: ['feedback'],
  forbidDescendants: ['feedback'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-feedback-block',

  normalize: (editor: CustomEditor, node: Element, path) => {
    // QTI 3.0 requires flow content to be wrapped in qti-content-body
    // Check if there's a qti-content-body child
    const hasContentBody = node.children.some(
      (child) =>
        Element.isElement(child) &&
        'type' in child &&
        child.type === 'qti-content-body'
    );

    if (!hasContentBody) {
      // Insert qti-content-body with empty paragraph
      Transforms.insertNodes(
        editor,
        {
          type: 'qti-content-body',
          children: [
            { type: 'paragraph', children: [{ text: '' }], attributes: {} },
          ],
        } as Element,
        { at: path.concat(node.children.length) }
      );
      return true;
    }

    return false;
  },
};
