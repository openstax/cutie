import { Element, Transforms } from 'slate';
import type { CustomEditor, ElementConfig } from '../../types';

export const extendedTextInteractionConfig: ElementConfig = {
  type: 'qti-extended-text-interaction',
  isVoid: false,
  isInline: false,
  needsSpacers: true,
  categories: ['interaction'],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-extended-text-interaction',

  normalize: (editor: CustomEditor, node: Element, path) => {
    // Ensure extended text interaction always has a qti-prompt as first child
    const firstChild = node.children[0];
    const hasPrompt =
      firstChild &&
      Element.isElement(firstChild) &&
      'type' in firstChild &&
      firstChild.type === 'qti-prompt';

    if (!hasPrompt) {
      Transforms.insertNodes(
        editor,
        {
          type: 'qti-prompt',
          children: [
            { type: 'paragraph', children: [{ text: '' }], attributes: {} },
          ],
        } as Element,
        { at: path.concat(0) }
      );
      return true;
    }

    return false;
  },
};
