import { Editor, Element, Text, Transforms } from 'slate';
import type { CustomEditor, ElementConfig } from '../../types';

export const feedbackBlockConfig: ElementConfig = {
  type: 'qti-feedback-block',
  isVoid: false,
  isInline: false,
  needsSpacers: true,
  categories: ['feedback'],
  forbidDescendants: ['interaction', 'feedback'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-feedback-block',

  normalize: (editor: CustomEditor, node: Element, path) => {
    // If empty, insert a paragraph child
    if (node.children.length === 0) {
      Transforms.insertNodes(
        editor,
        { type: 'paragraph', children: [{ text: '' }], attributes: {} } as Element,
        { at: path.concat(0) }
      );
      return true;
    }

    // Check each child - if any are text or inline elements, wrap them in a paragraph
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childPath = path.concat(i);

      // If it's a text node, wrap it in a paragraph
      if (Text.isText(child)) {
        Transforms.wrapNodes(
          editor,
          { type: 'paragraph', children: [], attributes: {} } as Element,
          { at: childPath }
        );
        return true;
      }

      // If it's an element but not a block, wrap it in a paragraph
      if (Element.isElement(child) && !Editor.isBlock(editor, child)) {
        Transforms.wrapNodes(
          editor,
          { type: 'paragraph', children: [], attributes: {} } as Element,
          { at: childPath }
        );
        return true;
      }
    }

    return false;
  },
};
