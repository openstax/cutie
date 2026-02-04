import { Element, Transforms } from 'slate';
import type { CustomEditor, ElementConfig } from '../../types';

export const gapMatchInteractionConfig: ElementConfig = {
  type: 'qti-gap-match-interaction',
  isVoid: false,
  isInline: false,
  needsSpacers: true,
  categories: ['interaction'],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-gap-match-interaction',

  normalize: (editor: CustomEditor, node: Element, path) => {
    // Ensure gap-match interaction always has gap-match-choices as first child
    const firstChild = node.children[0];
    const hasChoices =
      firstChild &&
      Element.isElement(firstChild) &&
      'type' in firstChild &&
      firstChild.type === 'gap-match-choices';

    if (!hasChoices) {
      Transforms.insertNodes(
        editor,
        {
          type: 'gap-match-choices',
          children: [
            {
              type: 'qti-gap-text',
              children: [{ text: 'Choice A' }],
              attributes: { identifier: 'A', 'match-max': '1' },
            },
          ],
        } as Element,
        { at: path.concat(0) }
      );
      return true;
    }

    // Ensure there's a gap-match-content element
    const hasContent = node.children.some(
      (child) =>
        Element.isElement(child) &&
        'type' in child &&
        child.type === 'gap-match-content'
    );

    if (!hasContent) {
      Transforms.insertNodes(
        editor,
        {
          type: 'gap-match-content',
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

export const gapMatchChoicesConfig: ElementConfig = {
  type: 'gap-match-choices',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'gap-match-choices',
};

export const gapMatchContentConfig: ElementConfig = {
  type: 'gap-match-content',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'gap-match-content',
};

export const gapTextConfig: ElementConfig = {
  type: 'qti-gap-text',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-gap-text',
};

export const gapImgConfig: ElementConfig = {
  type: 'qti-gap-img',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-gap-img',
};

export const gapConfig: ElementConfig = {
  type: 'qti-gap',
  isVoid: true,
  isInline: true,
  needsSpacers: false,
  categories: [],
  forbidDescendants: [],
  matches: (element: Element) => 'type' in element && element.type === 'qti-gap',
};
