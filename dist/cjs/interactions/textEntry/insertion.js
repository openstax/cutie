"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertTextEntryInteraction = insertTextEntryInteraction;
const slate_1 = require("slate");
const idGenerator_1 = require("../../utils/idGenerator");
/**
 * Insert a text entry interaction at the current selection
 */
function insertTextEntryInteraction(editor, config = {}) {
    const responseId = config.responseIdentifier || (0, idGenerator_1.generateUniqueResponseId)(editor);
    const textEntry = {
        type: 'qti-text-entry-interaction',
        children: [{ text: '' }],
        attributes: {
            'response-identifier': responseId,
            'expected-length': config.expectedLength,
            'pattern-mask': config.patternMask,
            'placeholder-text': config.placeholderText,
        },
        responseDeclaration: {
            tagName: 'qti-response-declaration',
            attributes: {
                identifier: responseId,
                cardinality: 'single',
                'base-type': 'string',
            },
            children: [],
        },
    };
    slate_1.Transforms.insertNodes(editor, textEntry);
}
