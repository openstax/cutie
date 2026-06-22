"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapInlineContentInParagraphs = wrapInlineContentInParagraphs;
const slate_1 = require("slate");
/**
 * Normalize a container element by wrapping consecutive inline content in paragraphs.
 * Groups text nodes and inline elements together into single paragraphs.
 *
 * @returns true if a change was made, false otherwise
 */
function wrapInlineContentInParagraphs(editor, node, path) {
    // If empty, insert a paragraph child
    if (node.children.length === 0) {
        slate_1.Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }], attributes: {} }, { at: path.concat(0) });
        return true;
    }
    // Find the first run of consecutive text/inline elements that need wrapping
    let runStart = null;
    let runEnd = null;
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const isInlineContent = slate_1.Text.isText(child) || (slate_1.Element.isElement(child) && !slate_1.Editor.isBlock(editor, child));
        if (isInlineContent) {
            if (runStart === null) {
                runStart = i;
            }
            runEnd = i;
        }
        else {
            // Hit a block element - if we have a pending run, stop here
            if (runStart !== null) {
                break;
            }
        }
    }
    // If we found inline content to wrap, wrap the entire run
    if (runStart !== null && runEnd !== null) {
        // Use match function to select only the nodes in the run
        const runStartIndex = runStart;
        const runEndIndex = runEnd;
        slate_1.Transforms.wrapNodes(editor, { type: 'paragraph', children: [], attributes: {} }, {
            at: path,
            match: (_n, p) => p.length === path.length + 1 &&
                p[path.length] >= runStartIndex &&
                p[path.length] <= runEndIndex,
        });
        return true;
    }
    return false;
}
