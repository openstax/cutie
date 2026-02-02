import type { Element } from 'slate';
import type { ElementConfig } from '../../types';

export const extendedTextInteractionConfig: ElementConfig = {
  type: 'qti-extended-text-interaction',
  isVoid: true,
  isInline: false,
  needsSpacers: true,
  categories: ['interaction'],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-extended-text-interaction',
};
