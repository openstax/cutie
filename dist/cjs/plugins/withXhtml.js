"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withXhtml = withXhtml;
const slate_1 = require("slate");
const withQtiInteractions_1 = require("./withQtiInteractions");
/**
 * Check if an element is a text-editable block (can hold cursor for editing)
 */
function isTextEditableBlock(element) {
    if (!('type' in element))
        return false;
    const type = element.type;
    return ['paragraph', 'div', 'heading', 'list', 'list-item', 'blockquote'].includes(type);
}
/**
 * Plugin to handle XHTML normalization rules
 */
function withXhtml(editor) {
    const { normalizeNode } = editor;
    editor.normalizeNode = (entry) => {
        const [node, path] = entry;
        // Check if this element is in a forbidden context (ancestor forbids its category)
        // If so, move it to be a sibling after the forbidding ancestor
        if (slate_1.Element.isElement(node) && 'type' in node && path.length > 0) {
            const myCategories = (0, withQtiInteractions_1.getElementCategories)(node);
            if (myCategories.length > 0) {
                // Walk up ancestors to check for forbidden context
                const ancestors = slate_1.Node.ancestors(editor, path, { reverse: true });
                for (const [ancestor, ancestorPath] of ancestors) {
                    if (slate_1.Element.isElement(ancestor)) {
                        const forbidden = (0, withQtiInteractions_1.getElementForbiddenDescendants)(ancestor);
                        if (forbidden.length > 0 && myCategories.some(cat => forbidden.includes(cat))) {
                            // I'm forbidden here - move myself after this ancestor
                            slate_1.Transforms.moveNodes(editor, {
                                at: path,
                                to: slate_1.Path.next(ancestorPath),
                            });
                            return; // Normalization will re-run
                        }
                    }
                }
            }
        }
        // Run element-specific normalization hooks
        if (slate_1.Element.isElement(node)) {
            if ((0, withQtiInteractions_1.normalizeElement)(editor, node, path)) {
                return; // Normalization was performed, will re-run
            }
        }
        // Normalize containers (editor or block elements with children) to add spacers
        // around elements that need them for cursor positioning
        if (slate_1.Editor.isEditor(node) || (slate_1.Element.isElement(node) && 'type' in node)) {
            const children = slate_1.Editor.isEditor(node) ? node.children : node.children;
            // Only process if this is a container that can have block children
            // Skip inline containers and specific element types that shouldn't have spacers added
            const skipTypes = ['qti-choice-interaction', 'qti-simple-choice', 'qti-prompt', 'list', 'list-item'];
            if (slate_1.Element.isElement(node) && 'type' in node && skipTypes.includes(node.type)) {
                // Fall through to other normalization
            }
            else {
                // Check each child - if it needs spacers, ensure adjacent siblings are text-editable
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    if (!slate_1.Element.isElement(child))
                        continue;
                    if ((0, withQtiInteractions_1.elementNeedsSpacers)(child)) {
                        // Check if previous sibling is text-editable (or this is first child)
                        const prevSibling = i > 0 ? children[i - 1] : null;
                        const needsSpacerBefore = !prevSibling ||
                            !slate_1.Element.isElement(prevSibling) ||
                            !isTextEditableBlock(prevSibling);
                        if (needsSpacerBefore) {
                            slate_1.Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] }, { at: path.concat(i) });
                            return; // Normalization will re-run
                        }
                        // Check if next sibling is text-editable (or this is last child)
                        const nextSibling = i < children.length - 1 ? children[i + 1] : null;
                        const needsSpacerAfter = !nextSibling ||
                            !slate_1.Element.isElement(nextSibling) ||
                            !isTextEditableBlock(nextSibling);
                        if (needsSpacerAfter) {
                            slate_1.Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] }, { at: path.concat(i + 1) });
                            return; // Normalization will re-run
                        }
                    }
                }
            }
        }
        // Ensure block elements don't contain text directly at the root
        if (slate_1.Element.isElement(node) && 'type' in node) {
            const type = node.type;
            // Block elements that should only contain other blocks or inline elements
            const blockTypes = [
                'paragraph',
                'div',
                'heading',
                'list-item',
                'blockquote',
                'qti-simple-choice',
                'qti-prompt',
            ];
            if (blockTypes.includes(type)) {
                // Ensure at least one child
                if (node.children.length === 0) {
                    slate_1.Transforms.insertNodes(editor, { text: '' }, { at: path.concat(0) });
                    return;
                }
            }
            // Lists must only contain list-item children
            if (type === 'list') {
                for (const [child, childPath] of slate_1.Node.children(editor, path)) {
                    if (!slate_1.Element.isElement(child) ||
                        !('type' in child) ||
                        child.type !== 'list-item') {
                        // Wrap non-list-item children in list-item
                        slate_1.Transforms.wrapNodes(editor, { type: 'list-item', children: [] }, { at: childPath });
                        return;
                    }
                }
            }
            // Choice interactions must contain at least one simple-choice
            if (type === 'qti-choice-interaction') {
                const hasChoice = node.children.some((child) => slate_1.Element.isElement(child) &&
                    'type' in child &&
                    (child.type === 'qti-simple-choice' || child.type === 'qti-prompt'));
                if (!hasChoice) {
                    // Add a default choice with proper structure
                    slate_1.Transforms.insertNodes(editor, {
                        type: 'qti-simple-choice',
                        attributes: { identifier: 'choice-1' },
                        children: [
                            {
                                type: 'choice-id-label',
                                children: [{ text: '' }],
                                attributes: { identifier: 'choice-1' },
                            },
                            {
                                type: 'choice-content',
                                children: [
                                    { type: 'paragraph', children: [{ text: 'Choice 1' }], attributes: {} },
                                ],
                                attributes: {},
                            },
                        ],
                    }, { at: path.concat(0) });
                    return;
                }
            }
        }
        // Call the original normalizeNode to handle default normalization
        normalizeNode(entry);
    };
    return editor;
}
