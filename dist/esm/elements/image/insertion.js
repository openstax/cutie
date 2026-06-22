import { Transforms } from 'slate';
/**
 * Insert an image at the current cursor position.
 * Images are inline elements, so they will be inserted within the current paragraph.
 */
export function insertImage(editor, src, alt) {
    const image = {
        type: 'image',
        children: [{ text: '' }],
        attributes: { src, alt: alt || '' },
    };
    Transforms.insertNodes(editor, image);
}
