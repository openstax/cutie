import { Editor } from 'slate';
/**
 * Generate a unique source identifier within the interaction
 */
export declare function generateSourceId(editor: Editor, interactionPath: number[]): string;
/**
 * Generate a unique target identifier within the interaction
 */
export declare function generateTargetId(editor: Editor, interactionPath: number[]): string;
/**
 * Insert a match interaction at the current selection
 */
export declare function insertMatchInteraction(editor: Editor, config?: {
    responseIdentifier?: string;
    shuffle?: boolean;
    maxAssociations?: number;
}): void;
