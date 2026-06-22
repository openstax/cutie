import { type Editor } from 'slate';
/**
 * Insert an image at the current cursor position.
 * Images are inline elements, so they will be inserted within the current paragraph.
 */
export declare function insertImage(editor: Editor, src: string, alt?: string): void;
