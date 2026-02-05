import { Element, Transforms } from 'slate';
import type { CustomEditor, ElementConfig, FeedbackIdentifier, QtiExtendedTextInteraction } from '../../types';
import { hasCorrectResponse } from '../../utils/responseDeclaration';

export const extendedTextInteractionConfig: ElementConfig = {
  type: 'qti-extended-text-interaction',
  isVoid: false,
  isInline: false,
  needsSpacers: true,
  categories: ['interaction'],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-extended-text-interaction',

  normalize: (editor: CustomEditor, node: Element, path) => {
    // Ensure extended text interaction always has a qti-prompt as first child
    const firstChild = node.children[0];
    const hasPrompt =
      firstChild &&
      Element.isElement(firstChild) &&
      'type' in firstChild &&
      firstChild.type === 'qti-prompt';

    if (!hasPrompt) {
      Transforms.insertNodes(
        editor,
        {
          type: 'qti-prompt',
          children: [
            { type: 'paragraph', children: [{ text: '' }], attributes: {} },
          ],
        } as Element,
        { at: path.concat(0) }
      );
      return true;
    }

    return false;
  },

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
