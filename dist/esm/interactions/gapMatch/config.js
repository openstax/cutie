import { Element, Transforms } from 'slate';
import { hasCorrectResponse } from '../../utils/responseDeclaration';
/**
 * Recursively find all qti-gap elements within the gap-match-content
 */
function findGapsInContent(node) {
    if (!('type' in node))
        return [];
    if (node.type === 'qti-gap') {
        return [node];
    }
    const gaps = [];
    if ('children' in node && Array.isArray(node.children)) {
        for (const child of node.children) {
            gaps.push(...findGapsInContent(child));
        }
    }
    return gaps;
}
export const gapMatchInteractionConfig = {
    type: 'qti-gap-match-interaction',
    xmlTagName: 'qti-gap-match-interaction',
    isVoid: false,
    isInline: false,
    needsSpacers: true,
    categories: ['interaction'],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'qti-gap-match-interaction',
    normalize: (editor, node, path) => {
        // Ensure gap-match interaction always has gap-match-choices as first child
        const firstChild = node.children[0];
        const hasChoices = firstChild &&
            Element.isElement(firstChild) &&
            'type' in firstChild &&
            firstChild.type === 'gap-match-choices';
        if (!hasChoices) {
            Transforms.insertNodes(editor, {
                type: 'gap-match-choices',
                children: [
                    {
                        type: 'qti-gap-text',
                        children: [{ text: 'Choice A' }],
                        attributes: { identifier: 'A', 'match-max': '1' },
                    },
                ],
            }, { at: path.concat(0) });
            return true;
        }
        // Ensure there's a gap-match-content element
        const hasContent = node.children.some((child) => Element.isElement(child) &&
            'type' in child &&
            child.type === 'gap-match-content');
        if (!hasContent) {
            Transforms.insertNodes(editor, {
                type: 'gap-match-content',
                children: [
                    { type: 'paragraph', children: [{ text: '' }], attributes: {} },
                ],
            }, { at: path.concat(node.children.length) });
            return true;
        }
        return false;
    },
    getFeedbackIdentifiers: (element) => {
        const el = element;
        const responseId = el.attributes['response-identifier'] || 'RESPONSE';
        const identifiers = [];
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
        const contentChild = el.children.find((child) => 'type' in child && child.type === 'gap-match-content');
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
export const gapMatchChoicesConfig = {
    type: 'gap-match-choices',
    xmlTagName: null,
    isVoid: false,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'gap-match-choices',
};
export const gapMatchContentConfig = {
    type: 'gap-match-content',
    xmlTagName: null,
    isVoid: false,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'gap-match-content',
};
export const gapTextConfig = {
    type: 'qti-gap-text',
    xmlTagName: 'qti-gap-text',
    isVoid: false,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'qti-gap-text',
};
export const gapImgConfig = {
    type: 'qti-gap-img',
    xmlTagName: 'qti-gap-img',
    isVoid: false,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'qti-gap-img',
};
export const gapConfig = {
    type: 'qti-gap',
    xmlTagName: 'qti-gap',
    isVoid: true,
    isInline: true,
    needsSpacers: false,
    categories: [],
    forbidDescendants: [],
    matches: (element) => 'type' in element && element.type === 'qti-gap',
};
