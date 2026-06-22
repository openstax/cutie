"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSourceId = generateSourceId;
exports.generateTargetId = generateTargetId;
exports.insertMatchInteraction = insertMatchInteraction;
const slate_1 = require("slate");
const idGenerator_1 = require("../../utils/idGenerator");
/**
 * Generate a unique source identifier within the interaction
 */
function generateSourceId(editor, interactionPath) {
    const existingIds = new Set();
    // Find all choices within this interaction to avoid conflicts
    for (const [node] of slate_1.Editor.nodes(editor, {
        at: interactionPath,
        match: (n) => slate_1.Element.isElement(n) &&
            'type' in n &&
            n.type === 'qti-simple-associable-choice',
    })) {
        if (slate_1.Element.isElement(node) && 'attributes' in node) {
            const attrs = node.attributes;
            if (attrs === null || attrs === void 0 ? void 0 : attrs.identifier) {
                existingIds.add(attrs.identifier);
            }
        }
    }
    // Generate unique ID (sourceA, sourceB, sourceC, ...)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let counter = 0;
    while (true) {
        let suffix = '';
        let n = counter;
        // Convert counter to letter sequence (A, B, ..., Z, AA, AB, ...)
        do {
            suffix = letters[n % 26] + suffix;
            n = Math.floor(n / 26) - 1;
        } while (n >= 0);
        const id = `source${suffix}`;
        if (!existingIds.has(id)) {
            return id;
        }
        counter++;
    }
}
/**
 * Generate a unique target identifier within the interaction
 */
function generateTargetId(editor, interactionPath) {
    const existingIds = new Set();
    // Find all target choices within this interaction
    for (const [node] of slate_1.Editor.nodes(editor, {
        at: interactionPath,
        match: (n) => slate_1.Element.isElement(n) &&
            'type' in n &&
            n.type === 'qti-simple-associable-choice',
    })) {
        if (slate_1.Element.isElement(node) && 'attributes' in node) {
            const attrs = node.attributes;
            if (attrs === null || attrs === void 0 ? void 0 : attrs.identifier) {
                existingIds.add(attrs.identifier);
            }
        }
    }
    // Generate unique ID (targetX, targetY, targetZ, ...)
    // Use reverse alphabet so targets start from end (X, Y, Z, W...) to distinguish from sources
    // spell-checker: disable-next-line
    const letters = 'XYZWVUTSRQPONMLKJIHGFEDCBA';
    let counter = 0;
    while (true) {
        let suffix = '';
        let n = counter;
        // Convert counter to letter sequence (X, Y, ..., A, XX, XY, ...)
        do {
            suffix = letters[n % 26] + suffix;
            n = Math.floor(n / 26) - 1;
        } while (n >= 0);
        const id = `target${suffix}`;
        if (!existingIds.has(id)) {
            return id;
        }
        counter++;
    }
}
/**
 * Insert a match interaction at the current selection
 */
function insertMatchInteraction(editor, config = {}) {
    var _a;
    const responseId = config.responseIdentifier || (0, idGenerator_1.generateUniqueResponseId)(editor);
    const matchInteraction = {
        type: 'qti-match-interaction',
        attributes: {
            'response-identifier': responseId,
            shuffle: config.shuffle ? 'true' : undefined,
            'max-associations': (_a = config.maxAssociations) === null || _a === void 0 ? void 0 : _a.toString(),
        },
        children: [
            {
                type: 'qti-prompt',
                children: [{ text: 'Match each item to its corresponding target.' }],
                attributes: {},
            },
            {
                type: 'match-source-set',
                children: [
                    {
                        type: 'qti-simple-associable-choice',
                        attributes: { identifier: 'sourceA', 'match-max': '1' },
                        children: [{ text: 'Source A' }],
                    },
                    {
                        type: 'qti-simple-associable-choice',
                        attributes: { identifier: 'sourceB', 'match-max': '1' },
                        children: [{ text: 'Source B' }],
                    },
                ],
            },
            {
                type: 'match-target-set',
                children: [
                    {
                        type: 'qti-simple-associable-choice',
                        attributes: { identifier: 'targetX', 'match-max': '1' },
                        children: [{ text: 'Target X' }],
                    },
                    {
                        type: 'qti-simple-associable-choice',
                        attributes: { identifier: 'targetY', 'match-max': '1' },
                        children: [{ text: 'Target Y' }],
                    },
                ],
            },
        ],
        responseDeclaration: {
            tagName: 'qti-response-declaration',
            attributes: {
                identifier: responseId,
                cardinality: 'multiple',
                'base-type': 'directedPair',
            },
            children: [],
        },
    };
    // Get current selection to find where we'll insert
    const { selection } = editor;
    const insertPoint = selection ? slate_1.Editor.start(editor, selection) : slate_1.Editor.end(editor, []);
    slate_1.Transforms.insertNodes(editor, matchInteraction, { at: insertPoint });
    // Find the inserted interaction and position cursor in the prompt
    const [interactionEntry] = slate_1.Editor.nodes(editor, {
        at: insertPoint,
        match: (n) => slate_1.Element.isElement(n) && 'type' in n && n.type === 'qti-match-interaction',
    });
    if (interactionEntry) {
        const [, interactionPath] = interactionEntry;
        // Select the start of the prompt: interaction -> prompt -> text
        const promptPath = [...interactionPath, 0, 0];
        slate_1.Transforms.select(editor, slate_1.Editor.start(editor, promptPath));
    }
    // Insert trailing paragraph for cursor positioning after the interaction
    slate_1.Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] }, { at: interactionEntry ? [interactionEntry[1][0] + 1] : undefined });
}
