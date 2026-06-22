import { Element, Path } from 'slate';
import type { CustomEditor } from '../types';
/**
 * Normalize a container element by wrapping consecutive inline content in paragraphs.
 * Groups text nodes and inline elements together into single paragraphs.
 *
 * @returns true if a change was made, false otherwise
 */
export declare function wrapInlineContentInParagraphs(editor: CustomEditor, node: Element, path: Path): boolean;
