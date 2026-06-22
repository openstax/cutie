import type { CustomEditor } from '../../../types';
/**
 * Insert a feedback block element at the current selection
 *
 * @param editor - The Slate editor instance
 * @param identifier - The feedback identifier (e.g., "RESPONSE_correct")
 * @param showHide - Whether to show or hide when matched (default: 'show')
 */
export declare function insertFeedbackBlock(editor: CustomEditor, identifier: string, showHide?: 'show' | 'hide'): void;
/**
 * Check if the current selection is inside a feedback block element
 */
export declare function isInFeedbackBlock(editor: CustomEditor): boolean;
