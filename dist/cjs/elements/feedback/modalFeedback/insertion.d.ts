import type { CustomEditor } from '../../../types';
/**
 * Insert a modal feedback element at the bottom of the editor
 *
 * @param editor - The Slate editor instance
 * @param identifier - The feedback identifier (e.g., "RESPONSE_correct")
 * @param showHide - Whether to show or hide when matched (default: 'show')
 */
export declare function insertModalFeedback(editor: CustomEditor, identifier: string, showHide?: 'show' | 'hide'): void;
/**
 * Check if the current selection is inside a modal feedback element
 */
export declare function isInModalFeedback(editor: CustomEditor): boolean;
