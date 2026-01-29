import type { Element } from 'slate';

export const textEntryInteractionConfig = {
  type: 'qti-text-entry-interaction',
  isVoid: true,
  isInline: true,
  matches: (element: Element) => 'type' in element && element.type === 'qti-text-entry-interaction',
};
