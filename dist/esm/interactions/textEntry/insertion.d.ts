import { Editor } from 'slate';
/**
 * Insert a text entry interaction at the current selection
 */
export declare function insertTextEntryInteraction(editor: Editor, config?: {
    responseIdentifier?: string;
    expectedLength?: string;
    patternMask?: string;
    placeholderText?: string;
}): void;
