import type { Element } from 'slate';
import type { ElementConfig, FeedbackIdentifier, QtiTextEntryInteraction } from '../../types';
import { hasCorrectResponse } from '../../utils/responseDeclaration';

export const textEntryInteractionConfig: ElementConfig = {
  type: 'qti-text-entry-interaction',
  isVoid: true,
  isInline: true,
  needsSpacers: false, // Inline elements don't need spacers
  categories: ['interaction'],
  forbidDescendants: [], // Void element, can't have descendants
  matches: (element: Element) => 'type' in element && element.type === 'qti-text-entry-interaction',

  getFeedbackIdentifiers: (element: Element) => {
    const el = element as QtiTextEntryInteraction;
    const responseId = el.attributes['response-identifier'] || 'RESPONSE';
    const identifiers: FeedbackIdentifier[] = [];

    // Only add correct/incorrect if the interaction has a correct response configured
    if (el.responseDeclaration && hasCorrectResponse(el.responseDeclaration)) {
      identifiers.push({
        id: `${responseId}_correct`,
        label: `${responseId} is correct`,
        description: 'Shown when response matches correct value',
      });

      identifiers.push({
        id: `${responseId}_incorrect`,
        label: `${responseId} is incorrect`,
        description: 'Shown when response doesn\'t match correct value',
      });
    }

    return {
      responseIdentifier: responseId,
      interactionType: 'Text Entry Interaction',
      identifiers,
    };
  },
};
