import { Editor } from 'slate';
import type { InlineChoiceOption } from '../../types';
/**
 * Insert an inline choice interaction at the current selection
 */
export declare function insertInlineChoiceInteraction(editor: Editor, config?: {
    responseIdentifier?: string;
    shuffle?: boolean;
    choices?: InlineChoiceOption[];
}): void;
