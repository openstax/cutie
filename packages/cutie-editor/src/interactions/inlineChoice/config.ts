import type { Element } from 'slate';
import type { ElementConfig } from '../../types';

export const inlineChoiceInteractionConfig: ElementConfig = {
  type: 'qti-inline-choice-interaction',
  isVoid: true,
  isInline: true,
  needsSpacers: false, // Inline elements don't need spacers
  categories: ['interaction'],
  forbidDescendants: [], // Void element, can't have descendants
  matches: (element: Element) => 'type' in element && element.type === 'qti-inline-choice-interaction',
};
