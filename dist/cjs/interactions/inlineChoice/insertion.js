"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertInlineChoiceInteraction = insertInlineChoiceInteraction;
const slate_1 = require("slate");
const idGenerator_1 = require("../../utils/idGenerator");
/**
 * Insert an inline choice interaction at the current selection
 */
function insertInlineChoiceInteraction(editor, config = {}) {
    const responseId = config.responseIdentifier || (0, idGenerator_1.generateUniqueResponseId)(editor);
    const defaultChoices = config.choices || [
        { identifier: 'choice-1', text: 'Option 1' },
        { identifier: 'choice-2', text: 'Option 2' },
        { identifier: 'choice-3', text: 'Option 3' },
    ];
    const inlineChoice = {
        type: 'qti-inline-choice-interaction',
        children: [{ text: '' }],
        attributes: {
            'response-identifier': responseId,
            ...(config.shuffle && { shuffle: 'true' }),
        },
        choices: defaultChoices,
        responseDeclaration: {
            tagName: 'qti-response-declaration',
            attributes: {
                identifier: responseId,
                cardinality: 'single',
                'base-type': 'identifier',
            },
            children: [],
        },
    };
    slate_1.Transforms.insertNodes(editor, inlineChoice);
}
