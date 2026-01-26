import { Element } from 'slate';
import type { CustomEditor } from '../types';

/**
 * Plugin to handle unknown QTI elements
 */
export function withUnknownElements(editor: CustomEditor): CustomEditor {
  const { isVoid } = editor;

  // Check if unknown elements should be void based on their metadata
  editor.isVoid = (element: Element) => {
    if ('type' in element && element.type === 'qti-unknown') {
      // Check if this unknown element is marked as void
      if ('isVoid' in element && element.isVoid === true) {
        return true;
      }
    }

    return isVoid(element);
  };

  return editor;
}
