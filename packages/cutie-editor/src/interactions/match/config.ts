import { Element, Transforms } from 'slate';
import type {
  CustomEditor,
  ElementConfig,
  FeedbackIdentifier,
  MatchSourceSet,
  MatchTargetSet,
  QtiMatchInteraction,
  QtiSimpleAssociableChoice,
} from '../../types';
import { hasCorrectResponse } from '../../utils/responseDeclaration';

/**
 * Get all simple associable choices from a match set
 */
function getChoicesFromSet(
  set: MatchSourceSet | MatchTargetSet
): QtiSimpleAssociableChoice[] {
  return set.children.filter(
    (child): child is QtiSimpleAssociableChoice =>
      'type' in child && child.type === 'qti-simple-associable-choice'
  );
}

export const matchInteractionConfig: ElementConfig = {
  type: 'qti-match-interaction',
  isVoid: false,
  isInline: false,
  needsSpacers: true,
  categories: ['interaction'],
  forbidDescendants: ['interaction'],
  matches: (element: Element) =>
    'type' in element && element.type === 'qti-match-interaction',

  normalize: (editor: CustomEditor, node: Element, path) => {
    const children = node.children;

    // Find existing source and target sets
    const hasSourceSet = children.some(
      (child) =>
        Element.isElement(child) &&
        'type' in child &&
        child.type === 'match-source-set'
    );

    const hasTargetSet = children.some(
      (child) =>
        Element.isElement(child) &&
        'type' in child &&
        child.type === 'match-target-set'
    );

    // Determine insertion index (after qti-prompt if present)
    let insertIndex = 0;
    if (
      children.length > 0 &&
      Element.isElement(children[0]) &&
      'type' in children[0] &&
      children[0].type === 'qti-prompt'
    ) {
      insertIndex = 1;
    }

    // Ensure source set exists
    if (!hasSourceSet) {
      Transforms.insertNodes(
        editor,
        {
          type: 'match-source-set',
          children: [
            {
              type: 'qti-simple-associable-choice',
              children: [{ text: 'Source A' }],
              attributes: { identifier: 'sourceA', 'match-max': '1' },
            },
            {
              type: 'qti-simple-associable-choice',
              children: [{ text: 'Source B' }],
              attributes: { identifier: 'sourceB', 'match-max': '1' },
            },
          ],
        } as Element,
        { at: path.concat(insertIndex) }
      );
      return true;
    }

    // Ensure target set exists (after source set)
    if (!hasTargetSet) {
      // Find source set index
      const sourceSetIndex = children.findIndex(
        (child) =>
          Element.isElement(child) &&
          'type' in child &&
          child.type === 'match-source-set'
      );

      Transforms.insertNodes(
        editor,
        {
          type: 'match-target-set',
          children: [
            {
              type: 'qti-simple-associable-choice',
              children: [{ text: 'Target X' }],
              attributes: { identifier: 'targetX', 'match-max': '1' },
            },
            {
              type: 'qti-simple-associable-choice',
              children: [{ text: 'Target Y' }],
              attributes: { identifier: 'targetY', 'match-max': '1' },
            },
          ],
        } as Element,
        { at: path.concat(sourceSetIndex + 1) }
      );
      return true;
    }

    return false;
  },

  getFeedbackIdentifiers: (element: Element) => {
    const el = element as QtiMatchInteraction;
    const responseId = el.attributes['response-identifier'] || 'RESPONSE';
    const identifiers: FeedbackIdentifier[] = [];

    // Only add correct/incorrect if the interaction has a correct response configured
    if (el.responseDeclaration && hasCorrectResponse(el.responseDeclaration)) {
      identifiers.push({
        id: `${responseId}_correct`,
        label: `${responseId} is correct`,
        description: 'Shown when all matches are correct',
      });

      identifiers.push({
        id: `${responseId}_incorrect`,
        label: `${responseId} is incorrect`,
        description: 'Shown when at least one match is wrong',
      });
    }

    // Add per-source identifiers for partial feedback
    const sourceSet = el.children.find(
      (child) => 'type' in child && child.type === 'match-source-set'
    ) as MatchSourceSet | undefined;

    if (sourceSet) {
      const choices = getChoicesFromSet(sourceSet);
      for (const choice of choices) {
        const choiceId = choice.attributes.identifier;
        if (choiceId) {
          identifiers.push({
            id: `${responseId}_source_${choiceId}`,
            label: `${responseId} source "${choiceId}"`,
            description: `Shown when source "${choiceId}" is matched correctly`,
          });
        }
      }
    }

    return {
      responseIdentifier: responseId,
      interactionType: 'Match Interaction',
      identifiers,
    };
  },
};

export const matchSourceSetConfig: ElementConfig = {
  type: 'match-source-set',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) =>
    'type' in element && element.type === 'match-source-set',
};

export const matchTargetSetConfig: ElementConfig = {
  type: 'match-target-set',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) =>
    'type' in element && element.type === 'match-target-set',
};

export const simpleAssociableChoiceConfig: ElementConfig = {
  type: 'qti-simple-associable-choice',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) =>
    'type' in element && element.type === 'qti-simple-associable-choice',
};
