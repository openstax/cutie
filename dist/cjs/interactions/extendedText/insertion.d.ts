import { Editor } from 'slate';
/**
 * Insert an extended text interaction at the current selection
 */
export declare function insertExtendedTextInteraction(editor: Editor, config?: {
    responseIdentifier?: string;
    expectedLines?: string;
    expectedLength?: string;
    placeholderText?: string;
}): void;
