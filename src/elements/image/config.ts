import type { Element } from 'slate';
import type { ElementConfig } from '../../types';

export const imageConfig: ElementConfig = {
  type: 'image',
  isVoid: true,
  isInline: true,
  needsSpacers: false,
  categories: [],
  forbidDescendants: [],
  matches: (element: Element) => 'type' in element && element.type === 'image',
};
