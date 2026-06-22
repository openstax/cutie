import { Element, Transforms } from 'slate';
import { hasCorrectResponse } from '../../utils/responseDeclaration';
export const extendedTextInteractionConfig = {
    type: 'qti-extended-text-interaction',
    xmlTagName: 'qti-extended-text-interaction',
    isVoid: false,
    isInline: false,
    needsSpacers: true,
    categories: ['interaction'],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'qti-extended-text-interaction',
    normalize: (editor, node, path) => {
        // Ensure extended text interaction always has a qti-prompt as first child
        const firstChild = node.children[0];
        const hasPrompt = firstChild &&
            Element.isElement(firstChild) &&
            'type' in firstChild &&
            firstChild.type === 'qti-prompt';
        if (!hasPrompt) {
            Transforms.insertNodes(editor, {
                type: 'qti-prompt',
                children: [
                    { type: 'paragraph', children: [{ text: '' }], attributes: {} },
                ],
            }, { at: path.concat(0) });
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
