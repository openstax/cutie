import type { Element } from 'slate';
import type { ElementConfig } from '../../types';

export const textEntryInteractionConfig: ElementConfig = {
  type: 'qti-text-entry-interaction',
  isVoid: true,
  isInline: true,
  needsSpacers: false, // Inline elements don't need spacers
  categories: ['interaction'],
  forbidDescendants: [], // Void element, can't have descendants
  matches: (element: Element) => 'type' in element && element.type === 'qti-text-entry-interaction',
};
