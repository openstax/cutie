import type { Element } from 'slate';

export const extendedTextInteractionConfig = {
  type: 'qti-extended-text-interaction',
  isVoid: true,
  isInline: false,
  needsSpacers: true,
  categories: ['interaction'],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-extended-text-interaction',
};
