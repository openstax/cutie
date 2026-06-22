"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inlineChoiceInteractionConfig = void 0;
const responseDeclaration_1 = require("../../utils/responseDeclaration");
exports.inlineChoiceInteractionConfig = {
    type: 'qti-inline-choice-interaction',
    xmlTagName: 'qti-inline-choice-interaction',
    isVoid: true,
    isInline: true,
    needsSpacers: false, // Inline elements don't need spacers
    categories: ['interaction'],
    forbidDescendants: [], // Void element, can't have descendants
    matches: (element) => 'type' in element && element.type === 'qti-inline-choice-interaction',
    getFeedbackIdentifiers: (element) => {
        const el = element;
        const responseId = el.attributes['response-identifier'] || 'RESPONSE';
        const identifiers = [];
        // Only add correct/incorrect if the interaction has a correct response configured
        if (el.responseDeclaration && (0, responseDeclaration_1.hasCorrectResponse)(el.responseDeclaration)) {
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
