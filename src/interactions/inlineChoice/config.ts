import type { Element } from 'slate';
import type { ElementConfig, FeedbackIdentifier, QtiInlineChoiceInteraction } from '../../types';
import { hasCorrectResponse } from '../../utils/responseDeclaration';

export const inlineChoiceInteractionConfig: ElementConfig = {
  type: 'qti-inline-choice-interaction',
  isVoid: true,
  isInline: true,
  needsSpacers: false, // Inline elements don't need spacers
  categories: ['interaction'],
  forbidDescendants: [], // Void element, can't have descendants
  matches: (element: Element) => 'type' in element && element.type === 'qti-inline-choice-interaction',

  getFeedbackIdentifiers: (element: Element) => {
    const el = element as QtiInlineChoiceInteraction;
    const responseId = el.attributes['response-identifier'] || 'RESPONSE';
    const identifiers: FeedbackIdentifier[] = [];

    // Only add correct/incorrect if the interaction has a correct response configured
    if (el.responseDeclaration && hasCorrectResponse(el.responseDeclaration)) {
      identifiers.push({
        id: `${responseId}_correct`,
        label: `${responseId} is correct`,
        description: 'Shown when correct choice is selected',
      });

      identifiers.push({
        id: `${responseId}_incorrect`,
        label: `${responseId} is incorrect`,
        description: 'Shown when incorrect choice is selected',
      });
    }

    // Add per-choice identifiers
    for (const choice of el.choices) {
      if (choice.identifier) {
        identifiers.push({
          id: `${responseId}_choice_${choice.identifier}`,
          label: `${responseId} is "${choice.identifier}"`,
          description: `Shown when choice "${choice.identifier}" is selected`,
        });
      }
    }

    return {
      responseIdentifier: responseId,
      interactionType: 'Inline Choice Interaction',
      identifiers,
    };
  },
};
