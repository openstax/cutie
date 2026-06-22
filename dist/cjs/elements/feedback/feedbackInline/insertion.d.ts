import type { CustomEditor } from '../../../types';
/**
 * Insert a feedback inline element at the current selection
 *
 * @param editor - The Slate editor instance
 * @param identifier - The feedback identifier (e.g., "RESPONSE_correct")
 * @param showHide - Whether to show or hide when matched (default: 'show')
 */
export declare function insertFeedbackInline(editor: CustomEditor, identifier: string, showHide?: 'show' | 'hide'): void;
/**
 * Remove feedback inline formatting from the selection
 */
export declare function removeFeedbackInline(editor: CustomEditor): void;
/**
 * Check if the current selection is inside a feedback inline element
 */
export declare function isInFeedbackInline(editor: CustomEditor): boolean;
