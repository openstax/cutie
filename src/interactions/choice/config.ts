import type { Element } from 'slate';

export const choiceInteractionConfig = {
  type: 'qti-choice-interaction',
  isVoid: false,
  isInline: false,
  matches: (element: Element) => 'type' in element && element.type === 'qti-choice-interaction',
};
