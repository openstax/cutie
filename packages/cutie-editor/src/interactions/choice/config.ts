import { Element, Transforms } from 'slate';
import type {
  CustomEditor,
  ElementConfig,
  FeedbackIdentifier,
  QtiChoiceInteraction,
  QtiSimpleChoice,
} from '../../types';
import { hasCorrectResponse } from '../../utils/responseDeclaration';

export const choiceInteractionConfig: ElementConfig = {
  type: 'qti-choice-interaction',
  isVoid: false,
  isInline: false,
  needsSpacers: true,
  categories: ['interaction'],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-choice-interaction',

  normalize: (editor: CustomEditor, node: Element, path) => {
    // Ensure choice interaction always has a qti-prompt as first child
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
    const el = element as QtiChoiceInteraction;
    const responseId = el.attributes['response-identifier'] || 'RESPONSE';
    const identifiers: FeedbackIdentifier[] = [];

    // Only add correct/incorrect if the interaction has a correct response configured
    if (el.responseDeclaration && hasCorrectResponse(el.responseDeclaration)) {
      identifiers.push({
        id: `${responseId}_correct`,
        label: `${responseId} is correct`,
        description: 'Shown when all selected choices are correct',
      });

      identifiers.push({
        id: `${responseId}_incorrect`,
        label: `${responseId} is incorrect`,
        description: 'Shown when at least one choice is wrong',
      });
    }

    // Add per-choice identifiers
    for (const child of el.children) {
      if ('type' in child && child.type === 'qti-simple-choice') {
        const choice = child as QtiSimpleChoice;
        const choiceId = choice.attributes.identifier;
        if (choiceId) {
          identifiers.push({
            id: `${responseId}_choice_${choiceId}`,
            label: `${responseId} is "${choiceId}"`,
            description: `Shown when choice "${choiceId}" is selected`,
          });
        }
      }
    }

    return {
      responseIdentifier: responseId,
      interactionType: 'Choice Interaction',
      identifiers,
    };
  },
};
