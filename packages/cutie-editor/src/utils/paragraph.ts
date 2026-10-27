import type { ParagraphElement } from '../types.js';

/**
 * Check if a paragraph has no attributes or alignment. Paragraphs the editor
 * creates (spacers, wrappers for inline content) are always plain; a paragraph
 * with either was authored and carries formatting that must be kept.
 */
export function isPlainParagraph(paragraph: ParagraphElement): boolean {
  return !paragraph.align &&
    Object.values(paragraph.attributes ?? {}).every((value) => value === undefined);
}
