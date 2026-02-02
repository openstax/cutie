import { Element, Transforms } from 'slate';
import type { CustomEditor, ElementConfig } from '../../types';

export const choiceInteractionConfig: ElementConfig = {
  type: 'qti-choice-interaction',
  isVoid: false,
  isInline: false,
  needsSpacers: true,
  categories: ['interaction'],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-choice-interaction',

  normalize: (editor: CustomEditor, node: Element, path) => {
    // Ensure choice interaction always has a qti-prompt as first child
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
