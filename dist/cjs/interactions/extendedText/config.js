"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendedTextInteractionConfig = void 0;
const slate_1 = require("slate");
const responseDeclaration_1 = require("../../utils/responseDeclaration");
exports.extendedTextInteractionConfig = {
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
            slate_1.Element.isElement(firstChild) &&
            'type' in firstChild &&
            firstChild.type === 'qti-prompt';
        if (!hasPrompt) {
            slate_1.Transforms.insertNodes(editor, {
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
        if (el.responseDeclaration && (0, responseDeclaration_1.hasCorrectResponse)(el.responseDeclaration)) {
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
