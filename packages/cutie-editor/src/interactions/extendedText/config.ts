import { Element } from 'slate';
import type { ElementConfig, FeedbackIdentifier, QtiExtendedTextInteraction } from '../../types.js';
import { ensurePromptFirst } from '../../utils/normalization.js';
import { hasCorrectResponse } from '../../utils/responseDeclaration.js';

export const extendedTextInteractionConfig: ElementConfig = {
  type: 'qti-extended-text-interaction',
  xmlTagName: 'qti-extended-text-interaction',
  isVoid: false,
  isInline: false,
  needsSpacers: true,
  categories: ['interaction'],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-extended-text-interaction',

  normalize: (editor, node, path) => ensurePromptFirst(editor, node, path),

  getFeedbackIdentifiers: (element: Element) => {
    const el = element as QtiExtendedTextInteraction;
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
      interactionType: 'Extended Text Interaction',
      identifiers,
    };
  },
};
