import { type Editor, Element as SlateElement, Transforms } from 'slate';
import type { ImageElement } from '../../types';

export function insertImage(editor: Editor, src: string, alt?: string): void {
  const image: ImageElement = {
    type: 'image',
    children: [{ text: '' }],
    attributes: { src, alt: alt || '' },
  };
  Transforms.insertNodes(editor, image);
  // Insert paragraph after for cursor positioning
  Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] } as SlateElement);
}
