"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertChoiceInteraction = insertChoiceInteraction;
const slate_1 = require("slate");
const idGenerator_1 = require("../../utils/idGenerator");
/**
 * Insert a choice interaction at the current selection
 */
function insertChoiceInteraction(editor, config = {}) {
    const responseId = config.responseIdentifier || (0, idGenerator_1.generateUniqueResponseId)(editor);
    const maxChoices = config.maxChoices || '1';
    const choices = config.choices || [
        { identifier: 'choice-1', text: 'Choice 1' },
        { identifier: 'choice-2', text: 'Choice 2' },
    ];
    // Include the prompt in the initial structure so we can position cursor there
    const choiceInteraction = {
        type: 'qti-choice-interaction',
        attributes: {
            'response-identifier': responseId,
            'max-choices': maxChoices,
            'min-choices': config.minChoices,
            shuffle: config.shuffle ? 'true' : undefined,
        },
        children: [
            {
                type: 'qti-prompt',
                children: [
                    { type: 'paragraph', children: [{ text: '' }], attributes: {} },
                ],
            },
            ...choices.map((choice) => ({
                type: 'qti-simple-choice',
                attributes: {
                    identifier: choice.identifier,
                },
                children: [
                    {
                        type: 'choice-id-label',
                        children: [{ text: '' }],
                        attributes: { identifier: choice.identifier },
                    },
                    {
                        type: 'choice-content',
                        children: [
                            {
                                type: 'paragraph',
                                children: [{ text: choice.text || choice.identifier }],
                                attributes: {},
                            },
                        ],
                        attributes: {},
                    },
                ],
            })),
        ],
        responseDeclaration: {
            tagName: 'qti-response-declaration',
            attributes: {
                identifier: responseId,
                cardinality: maxChoices === '1' ? 'single' : 'multiple',
                'base-type': 'identifier',
            },
            children: [],
        },
    };
    // Get current selection to find where we'll insert
    const { selection } = editor;
    const insertPoint = selection ? slate_1.Editor.start(editor, selection) : slate_1.Editor.end(editor, []);
    slate_1.Transforms.insertNodes(editor, choiceInteraction, { at: insertPoint });
    // Find the inserted interaction and position cursor in the prompt
    // The interaction was inserted at insertPoint, so we need to find it
    const [interactionEntry] = slate_1.Editor.nodes(editor, {
        at: insertPoint,
        match: (n) => slate_1.Element.isElement(n) && 'type' in n && n.type === 'qti-choice-interaction',
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
