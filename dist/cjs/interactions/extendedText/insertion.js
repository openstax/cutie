"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertExtendedTextInteraction = insertExtendedTextInteraction;
const slate_1 = require("slate");
const idGenerator_1 = require("../../utils/idGenerator");
/**
 * Insert an extended text interaction at the current selection
 */
function insertExtendedTextInteraction(editor, config = {}) {
    const responseId = config.responseIdentifier || (0, idGenerator_1.generateUniqueResponseId)(editor);
    const extendedText = {
        type: 'qti-extended-text-interaction',
        children: [
            {
                type: 'qti-prompt',
                children: [
                    { type: 'paragraph', children: [{ text: '' }], attributes: {} },
                ],
            },
        ],
        attributes: {
            'response-identifier': responseId,
            'expected-lines': config.expectedLines,
            'expected-length': config.expectedLength,
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
    // Get current selection to find where we'll insert
    const { selection } = editor;
    const insertPoint = selection ? slate_1.Editor.start(editor, selection) : slate_1.Editor.end(editor, []);
    slate_1.Transforms.insertNodes(editor, extendedText, { at: insertPoint });
    // Find the inserted interaction and position cursor in the prompt
    const [interactionEntry] = slate_1.Editor.nodes(editor, {
        at: insertPoint,
        match: (n) => slate_1.Element.isElement(n) && 'type' in n && n.type === 'qti-extended-text-interaction',
    });
    if (interactionEntry) {
        const [, interactionPath] = interactionEntry;
        // Select the start of the prompt's paragraph: interaction -> prompt -> paragraph
        const promptParagraphPath = [...interactionPath, 0, 0];
        slate_1.Transforms.select(editor, slate_1.Editor.start(editor, promptParagraphPath));
    }
    // Insert trailing paragraph for cursor positioning after the interaction
    slate_1.Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] }, { at: interactionEntry ? [interactionEntry[1][0] + 1] : undefined });
}
