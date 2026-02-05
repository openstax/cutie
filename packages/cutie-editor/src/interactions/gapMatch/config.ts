import { Element, Transforms } from 'slate';
import type {
  CustomEditor,
  ElementConfig,
  FeedbackIdentifier,
  GapMatchContent,
  QtiGap,
  QtiGapMatchInteraction,
  SlateElement,
} from '../../types';
import { hasCorrectResponse } from '../../utils/responseDeclaration';

/**
 * Recursively find all qti-gap elements within the gap-match-content
 */
function findGapsInContent(node: SlateElement | { text: string }): QtiGap[] {
  if (!('type' in node)) return [];

  if (node.type === 'qti-gap') {
    return [node as QtiGap];
  }

  const gaps: QtiGap[] = [];
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      gaps.push(...findGapsInContent(child as SlateElement | { text: string }));
    }
  }
  return gaps;
}

export const gapMatchInteractionConfig: ElementConfig = {
  type: 'qti-gap-match-interaction',
  isVoid: false,
  isInline: false,
  needsSpacers: true,
  categories: ['interaction'],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-gap-match-interaction',

  normalize: (editor: CustomEditor, node: Element, path) => {
    // Ensure gap-match interaction always has gap-match-choices as first child
    const firstChild = node.children[0];
    const hasChoices =
      firstChild &&
      Element.isElement(firstChild) &&
      'type' in firstChild &&
      firstChild.type === 'gap-match-choices';

    if (!hasChoices) {
      Transforms.insertNodes(
        editor,
        {
          type: 'gap-match-choices',
          children: [
            {
              type: 'qti-gap-text',
              children: [{ text: 'Choice A' }],
              attributes: { identifier: 'A', 'match-max': '1' },
            },
          ],
        } as Element,
        { at: path.concat(0) }
      );
      return true;
    }

    // Ensure there's a gap-match-content element
    const hasContent = node.children.some(
      (child) =>
        Element.isElement(child) &&
        'type' in child &&
        child.type === 'gap-match-content'
    );

    if (!hasContent) {
      Transforms.insertNodes(
        editor,
        {
          type: 'gap-match-content',
          children: [
            { type: 'paragraph', children: [{ text: '' }], attributes: {} },
          ],
        } as Element,
        { at: path.concat(node.children.length) }
      );
      return true;
    }

    return false;
  },

  getFeedbackIdentifiers: (element: Element) => {
    const el = element as QtiGapMatchInteraction;
    const responseId = el.attributes['response-identifier'] || 'RESPONSE';
    const identifiers: FeedbackIdentifier[] = [];

    // Only add correct/incorrect if the interaction has a correct response configured
    if (el.responseDeclaration && hasCorrectResponse(el.responseDeclaration)) {
      identifiers.push({
        id: `${responseId}_correct`,
        label: `${responseId} is correct`,
        description: 'Shown when all gaps are filled correctly',
      });

      identifiers.push({
        id: `${responseId}_incorrect`,
        label: `${responseId} is incorrect`,
        description: 'Shown when at least one gap is wrong',
      });
    }

    // Find gap-match-content and extract gaps for per-gap identifiers
    const contentChild = el.children.find(
      (child) => 'type' in child && child.type === 'gap-match-content'
    ) as GapMatchContent | undefined;

    if (contentChild) {
      const gaps = findGapsInContent(contentChild);
      for (const gap of gaps) {
        const gapId = gap.attributes.identifier;
        if (gapId) {
          identifiers.push({
            id: `${responseId}_gap_${gapId}`,
            label: `${responseId} gap "${gapId}"`,
            description: `Shown when gap "${gapId}" is filled correctly`,
          });
        }
      }
    }

    return {
      responseIdentifier: responseId,
      interactionType: 'Gap Match Interaction',
      identifiers,
    };
  },
};

export const gapMatchChoicesConfig: ElementConfig = {
  type: 'gap-match-choices',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'gap-match-choices',
};

export const gapMatchContentConfig: ElementConfig = {
  type: 'gap-match-content',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'gap-match-content',
};

export const gapTextConfig: ElementConfig = {
  type: 'qti-gap-text',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-gap-text',
};

export const gapImgConfig: ElementConfig = {
  type: 'qti-gap-img',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-gap-img',
};

export const gapConfig: ElementConfig = {
  type: 'qti-gap',
  isVoid: true,
  isInline: true,
  needsSpacers: false,
  categories: [],
  forbidDescendants: [],
  matches: (element: Element) => 'type' in element && element.type === 'qti-gap',
};
