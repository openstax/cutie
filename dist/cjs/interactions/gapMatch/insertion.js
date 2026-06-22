"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGapId = generateGapId;
exports.generateChoiceId = generateChoiceId;
exports.insertGapMatchInteraction = insertGapMatchInteraction;
exports.insertGapOrChoiceAtSelection = insertGapOrChoiceAtSelection;
exports.insertGapAtSelection = insertGapAtSelection;
const slate_1 = require("slate");
const idGenerator_1 = require("../../utils/idGenerator");
/**
 * Add a correct pairing to the response declaration
 */
function addCorrectPairing(decl, pairing) {
    // Find existing correct-response or create one
    const existingCorrectResponse = decl.children.find((c) => typeof c !== 'string' && c.tagName === 'qti-correct-response');
    if (existingCorrectResponse) {
        // Add new value to existing correct-response
        const newValue = {
            tagName: 'qti-value',
            attributes: {},
            children: [pairing],
        };
        const updatedCorrectResponse = {
            ...existingCorrectResponse,
            children: [...existingCorrectResponse.children, newValue],
        };
        return {
            ...decl,
            children: decl.children.map((c) => typeof c !== 'string' && c.tagName === 'qti-correct-response' ? updatedCorrectResponse : c),
        };
    }
    // Create new correct-response with the pairing
    const correctResponse = {
        tagName: 'qti-correct-response',
        attributes: {},
        children: [
            {
                tagName: 'qti-value',
                attributes: {},
                children: [pairing],
            },
        ],
    };
    return {
        ...decl,
        children: [...decl.children, correctResponse],
    };
}
/**
 * Generate a unique gap identifier within the interaction
 */
function generateGapId(editor, interactionPath) {
    const existingIds = new Set();
    // Find all gaps within this interaction
    for (const [node] of slate_1.Editor.nodes(editor, {
        at: interactionPath,
        match: (n) => slate_1.Element.isElement(n) && 'type' in n && n.type === 'qti-gap',
    })) {
        if (slate_1.Element.isElement(node) && 'attributes' in node) {
            const attrs = node.attributes;
            if (attrs === null || attrs === void 0 ? void 0 : attrs.identifier) {
                existingIds.add(attrs.identifier);
            }
        }
    }
    // Generate unique ID (G1, G2, G3, etc.)
    let counter = 1;
    let id = `G${counter}`;
    while (existingIds.has(id)) {
        counter++;
        id = `G${counter}`;
    }
    return id;
}
/**
 * Generate a unique choice identifier within the interaction
 */
function generateChoiceId(editor, interactionPath) {
    const existingIds = new Set();
    // Find all choices within this interaction
    for (const [node] of slate_1.Editor.nodes(editor, {
        at: interactionPath,
        match: (n) => slate_1.Element.isElement(n) &&
            'type' in n &&
            (n.type === 'qti-gap-text' || n.type === 'qti-gap-img'),
    })) {
        if (slate_1.Element.isElement(node) && 'attributes' in node) {
            const attrs = node.attributes;
            if (attrs === null || attrs === void 0 ? void 0 : attrs.identifier) {
                existingIds.add(attrs.identifier);
            }
        }
    }
    // Generate unique ID (A, B, C, ..., AA, AB, etc.)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let counter = 0;
    while (true) {
        let id = '';
        let n = counter;
        // Convert counter to letter sequence (A, B, ..., Z, AA, AB, ...)
        do {
            id = letters[n % 26] + id;
            n = Math.floor(n / 26) - 1;
        } while (n >= 0);
        if (!existingIds.has(id)) {
            return id;
        }
        counter++;
    }
}
/**
 * Insert a gap-match interaction at the current selection
 */
function insertGapMatchInteraction(editor, config = {}) {
    const responseId = config.responseIdentifier || (0, idGenerator_1.generateUniqueResponseId)(editor);
    const gapMatchInteraction = {
        type: 'qti-gap-match-interaction',
        attributes: {
            'response-identifier': responseId,
            shuffle: config.shuffle ? 'true' : undefined,
        },
        children: [
            {
                type: 'gap-match-choices',
                children: [
                    {
                        type: 'qti-gap-text',
                        attributes: { identifier: 'A', 'match-max': '1' },
                        children: [{ text: 'Choice A' }],
                    },
                    {
                        type: 'qti-gap-text',
                        attributes: { identifier: 'B', 'match-max': '1' },
                        children: [{ text: 'Choice B' }],
                    },
                ],
            },
            {
                type: 'gap-match-content',
                children: [
                    {
                        type: 'paragraph',
                        children: [
                            { text: 'Write your content here. Select text and use the properties panel to create gaps.' },
                        ],
                        attributes: {},
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
    slate_1.Transforms.insertNodes(editor, gapMatchInteraction, { at: insertPoint });
    // Find the inserted interaction and position cursor in the content
    const [interactionEntry] = slate_1.Editor.nodes(editor, {
        at: insertPoint,
        match: (n) => slate_1.Element.isElement(n) && 'type' in n && n.type === 'qti-gap-match-interaction',
    });
    if (interactionEntry) {
        const [, interactionPath] = interactionEntry;
        // Select the start of the content area: interaction -> content -> paragraph
        const contentParagraphPath = [...interactionPath, 1, 0];
        slate_1.Transforms.select(editor, slate_1.Editor.start(editor, contentParagraphPath));
    }
    // Insert trailing paragraph for cursor positioning after the interaction
    slate_1.Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] }, { at: interactionEntry ? [interactionEntry[1][0] + 1] : undefined });
}
/**
 * Check if the current selection has actual text selected (not just a cursor)
 */
function hasTextSelection(editor) {
    const { selection } = editor;
    if (!selection)
        return false;
    // Check if anchor and focus are at different positions
    if (selection.anchor.path.join(',') !== selection.focus.path.join(',')) {
        return true;
    }
    return selection.anchor.offset !== selection.focus.offset;
}
/**
 * Get the selected text content (recursively extracts text from nested nodes)
 */
function getSelectedText(editor) {
    const { selection } = editor;
    if (!selection)
        return '';
    const fragment = slate_1.Editor.fragment(editor, selection);
    function extractText(nodes) {
        return nodes
            .map((node) => {
            if ('text' in node)
                return node.text;
            if ('children' in node)
                return extractText(node.children);
            return '';
        })
            .join('');
    }
    return extractText(fragment);
}
/**
 * Insert a gap or create a choice based on current selection.
 * - If there's a text selection: create a new choice with that text
 * - If just a cursor position: insert a gap at cursor
 *
 * @returns 'gap' if a gap was inserted, 'choice' if a choice was created, false if failed
 */
function insertGapOrChoiceAtSelection(editor) {
    const { selection } = editor;
    if (!selection)
        return false;
    // Find the gap-match-interaction ancestor
    const [interactionEntry] = slate_1.Editor.nodes(editor, {
        at: selection,
        match: (n) => slate_1.Element.isElement(n) && 'type' in n && n.type === 'qti-gap-match-interaction',
    });
    if (!interactionEntry) {
        return false;
    }
    const [, interactionPath] = interactionEntry;
    // Check if we have a text selection
    if (hasTextSelection(editor)) {
        // Create a new choice with the selected text, then replace selection with a gap
        const selectedText = getSelectedText(editor);
        if (!selectedText.trim())
            return false;
        const choiceId = generateChoiceId(editor, interactionPath);
        const gapId = generateGapId(editor, interactionPath);
        // Find the choices container and add the new choice
        let choiceAdded = false;
        for (const [node, nodePath] of slate_1.Editor.nodes(editor, {
            at: interactionPath,
            match: (n) => slate_1.Element.isElement(n) && 'type' in n && n.type === 'gap-match-choices',
        })) {
            if (slate_1.Element.isElement(node)) {
                slate_1.Transforms.insertNodes(editor, {
                    type: 'qti-gap-text',
                    attributes: { identifier: choiceId, 'match-max': '1' },
                    children: [{ text: selectedText }],
                }, { at: [...nodePath, node.children.length] });
                choiceAdded = true;
                break;
            }
        }
        if (!choiceAdded)
            return false;
        // Delete the selected text and insert a gap in its place
        slate_1.Transforms.delete(editor);
        slate_1.Transforms.insertNodes(editor, {
            type: 'qti-gap',
            children: [{ text: '' }],
            attributes: { identifier: gapId },
        });
        // Add the correct answer pairing to the response declaration
        const [interaction] = slate_1.Editor.nodes(editor, {
            at: interactionPath,
            match: (n) => slate_1.Element.isElement(n) && 'type' in n && n.type === 'qti-gap-match-interaction',
        });
        if (interaction) {
            const [interactionNode] = interaction;
            const el = interactionNode;
            const responseDecl = el.responseDeclaration;
            if (responseDecl) {
                // Add the new pairing (format: "choiceId gapId")
                const newPairing = `${choiceId} ${gapId}`;
                const updatedDecl = addCorrectPairing(responseDecl, newPairing);
                slate_1.Transforms.setNodes(editor, { responseDeclaration: updatedDecl }, { at: interactionPath });
            }
        }
        return 'choice';
    }
    // Just a cursor - verify we're inside the content area
    const [contentEntry] = slate_1.Editor.nodes(editor, {
        at: selection,
        match: (n) => slate_1.Element.isElement(n) && 'type' in n && n.type === 'gap-match-content',
    });
    if (!contentEntry) {
        return false;
    }
    // Generate a unique gap ID
    const gapId = generateGapId(editor, interactionPath);
    // Insert the gap void element
    slate_1.Transforms.insertNodes(editor, {
        type: 'qti-gap',
        children: [{ text: '' }],
        attributes: { identifier: gapId },
    });
    return 'gap';
}
/**
 * @deprecated Use insertGapOrChoiceAtSelection instead
 */
function insertGapAtSelection(editor) {
    return insertGapOrChoiceAtSelection(editor) === 'gap';
}
