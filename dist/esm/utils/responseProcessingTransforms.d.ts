import type { CustomEditor, DocumentMetadata, ResponseProcessingMode } from '../types';
/**
 * Update the response processing mode in the document metadata.
 *
 * The metadata node is always at position [0] in the Slate document.
 * This uses Slate's Transforms.setNodes to properly integrate with undo/redo.
 *
 * @param editor - The Slate editor instance
 * @param mode - The new response processing mode
 */
export declare function updateResponseProcessingMode(editor: CustomEditor, mode: ResponseProcessingMode): void;
/**
 * Get the current response processing configuration from the document.
 *
 * @param editor - The Slate editor instance
 * @returns The response processing config, or a default allCorrect config if not found
 */
export declare function getResponseProcessingConfig(editor: CustomEditor): DocumentMetadata['responseProcessing'];
