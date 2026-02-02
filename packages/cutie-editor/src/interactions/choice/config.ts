import type { Element } from 'slate';

export const choiceInteractionConfig = {
  type: 'qti-choice-interaction',
  isVoid: false,
  isInline: false,
  needsSpacers: true,
  categories: ['interaction'],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-choice-interaction',
};
