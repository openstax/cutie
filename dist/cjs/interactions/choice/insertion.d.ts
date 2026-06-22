import { Editor } from 'slate';
/**
 * Insert a choice interaction at the current selection
 */
export declare function insertChoiceInteraction(editor: Editor, config?: {
    responseIdentifier?: string;
    maxChoices?: string;
    minChoices?: string;
    shuffle?: boolean;
    choices?: Array<{
        identifier: string;
        text?: string;
    }>;
}): void;
