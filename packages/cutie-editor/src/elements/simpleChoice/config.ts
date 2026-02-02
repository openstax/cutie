import { Editor, Element, Text, Transforms } from 'slate';
import type { CustomEditor, ElementConfig } from '../../types';

export const simpleChoiceConfig: ElementConfig = {
  type: 'qti-simple-choice',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-simple-choice',
};

export const choiceIdLabelConfig: ElementConfig = {
  type: 'choice-id-label',
  isVoid: true,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: [],
  matches: (element: Element) => 'type' in element && element.type === 'choice-id-label',
};

export const choiceContentConfig: ElementConfig = {
  type: 'choice-content',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'choice-content',

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
