import { Editor } from 'slate';
/**
 * Generate a unique gap identifier within the interaction
 */
export declare function generateGapId(editor: Editor, interactionPath: number[]): string;
/**
 * Generate a unique choice identifier within the interaction
 */
export declare function generateChoiceId(editor: Editor, interactionPath: number[]): string;
/**
 * Insert a gap-match interaction at the current selection
 */
export declare function insertGapMatchInteraction(editor: Editor, config?: {
    responseIdentifier?: string;
    shuffle?: boolean;
}): void;
/**
 * Insert a gap or create a choice based on current selection.
 * - If there's a text selection: create a new choice with that text
 * - If just a cursor position: insert a gap at cursor
 *
 * @returns 'gap' if a gap was inserted, 'choice' if a choice was created, false if failed
 */
export declare function insertGapOrChoiceAtSelection(editor: Editor): 'gap' | 'choice' | false;
/**
 * @deprecated Use insertGapOrChoiceAtSelection instead
 */
export declare function insertGapAtSelection(editor: Editor): boolean;
