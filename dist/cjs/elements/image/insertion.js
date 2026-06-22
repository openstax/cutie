"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertImage = insertImage;
const slate_1 = require("slate");
/**
 * Insert an image at the current cursor position.
 * Images are inline elements, so they will be inserted within the current paragraph.
 */
function insertImage(editor, src, alt) {
    const image = {
        type: 'image',
        children: [{ text: '' }],
        attributes: { src, alt: alt || '' },
    };
    slate_1.Transforms.insertNodes(editor, image);
}
