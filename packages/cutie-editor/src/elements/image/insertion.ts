import { type Editor, Transforms } from 'slate';
import type { ImageElement } from '../../types';

/**
 * Insert an image at the current cursor position.
 * Images are inline elements, so they will be inserted within the current paragraph.
 */
export function insertImage(editor: Editor, src: string, alt?: string): void {
  const image: ImageElement = {
    type: 'image',
    children: [{ text: '' }],
    attributes: { src, alt: alt || '' },
  };
  Transforms.insertNodes(editor, image);
}
