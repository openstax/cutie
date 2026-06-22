"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleAssociableChoiceConfig = exports.matchTargetSetConfig = exports.matchSourceSetConfig = exports.matchInteractionConfig = void 0;
const slate_1 = require("slate");
const responseDeclaration_1 = require("../../utils/responseDeclaration");
/**
 * Get all simple associable choices from a match set
 */
function getChoicesFromSet(set) {
    return set.children.filter((child) => 'type' in child && child.type === 'qti-simple-associable-choice');
}
exports.matchInteractionConfig = {
    type: 'qti-match-interaction',
    xmlTagName: 'qti-match-interaction',
    isVoid: false,
    isInline: false,
    needsSpacers: true,
    categories: ['interaction'],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'qti-match-interaction',
    normalize: (editor, node, path) => {
        const children = node.children;
        // Find existing source and target sets
        const hasSourceSet = children.some((child) => slate_1.Element.isElement(child) &&
            'type' in child &&
            child.type === 'match-source-set');
        const hasTargetSet = children.some((child) => slate_1.Element.isElement(child) &&
            'type' in child &&
            child.type === 'match-target-set');
        // Determine insertion index (after qti-prompt if present)
        let insertIndex = 0;
        if (children.length > 0 &&
            slate_1.Element.isElement(children[0]) &&
            'type' in children[0] &&
            children[0].type === 'qti-prompt') {
            insertIndex = 1;
        }
        // Ensure source set exists
        if (!hasSourceSet) {
            slate_1.Transforms.insertNodes(editor, {
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
            }, { at: path.concat(insertIndex) });
            return true;
        }
        // Ensure target set exists (after source set)
        if (!hasTargetSet) {
            // Find source set index
            const sourceSetIndex = children.findIndex((child) => slate_1.Element.isElement(child) &&
                'type' in child &&
                child.type === 'match-source-set');
            slate_1.Transforms.insertNodes(editor, {
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
            }, { at: path.concat(sourceSetIndex + 1) });
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
                description: 'Shown when all matches are correct',
            });
            identifiers.push({
                id: `${responseId}_incorrect`,
                label: `${responseId} is incorrect`,
                description: 'Shown when at least one match is wrong',
            });
        }
        // Add per-source identifiers for partial feedback
        const sourceSet = el.children.find((child) => 'type' in child && child.type === 'match-source-set');
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
exports.matchSourceSetConfig = {
    type: 'match-source-set',
    xmlTagName: null,
    isVoid: false,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'match-source-set',
};
exports.matchTargetSetConfig = {
    type: 'match-target-set',
    xmlTagName: null,
    isVoid: false,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'match-target-set',
};
exports.simpleAssociableChoiceConfig = {
    type: 'qti-simple-associable-choice',
    xmlTagName: 'qti-simple-associable-choice',
    isVoid: false,
    isInline: false,
    needsSpacers: false,
    categories: [],
    forbidDescendants: ['interaction'],
    matches: (element) => 'type' in element && element.type === 'qti-simple-associable-choice',
};
