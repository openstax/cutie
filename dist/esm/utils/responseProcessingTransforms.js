import { Editor, Transforms } from 'slate';
/**
 * Update the response processing mode in the document metadata.
 *
 * The metadata node is always at position [0] in the Slate document.
 * This uses Slate's Transforms.setNodes to properly integrate with undo/redo.
 *
 * @param editor - The Slate editor instance
 * @param mode - The new response processing mode
 */
export function updateResponseProcessingMode(editor, mode) {
    // Find the metadata node at [0]
    const [entry] = Editor.nodes(editor, {
        at: [0],
        match: (n) => 'type' in n && n.type === 'document-metadata',
    });
    if (!entry) {
        console.warn('No document-metadata node found at [0]');
        return;
    }
    const [node, path] = entry;
    const metadataNode = node;
    // Don't allow switching away from custom mode through this function
    // (custom mode preserves XML that would be lost)
    if (metadataNode.responseProcessing.mode === 'custom') {
        console.warn('Cannot change mode from custom - would lose custom XML');
        return;
    }
    // Update the mode
    Transforms.setNodes(editor, {
        responseProcessing: {
            mode,
            // Clear customXml when switching modes (only relevant if switching to custom, which we block above)
        },
    }, { at: path });
}
/**
 * Get the current response processing configuration from the document.
 *
 * @param editor - The Slate editor instance
 * @returns The response processing config, or a default allCorrect config if not found
 */
export function getResponseProcessingConfig(editor) {
    const [entry] = Editor.nodes(editor, {
        at: [0],
        match: (n) => 'type' in n && n.type === 'document-metadata',
    });
    if (!entry) {
        return { mode: 'allCorrect' };
    }
    const [node] = entry;
    return node.responseProcessing;
}
