import { Element, Node, Transforms } from 'slate';
import type { CustomEditor } from '../types';

/**
 * Plugin to handle XHTML normalization rules
 */
export function withXhtml(editor: CustomEditor): CustomEditor {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    // Ensure block elements don't contain text directly at the root
    if (Element.isElement(node) && 'type' in node) {
      const type = node.type as string;

      // Block elements that should only contain other blocks or inline elements
      const blockTypes = [
        'paragraph',
        'div',
        'heading',
        'list-item',
        'qti-simple-choice',
        'qti-prompt',
      ];

      if (blockTypes.includes(type)) {
        // Ensure at least one child
        if (node.children.length === 0) {
          Transforms.insertNodes(
            editor,
            { text: '' },
            { at: path.concat(0) }
          );
          return;
        }
      }

      // Lists must only contain list-item children
      if (type === 'list') {
        for (const [child, childPath] of Node.children(editor, path)) {
          if (
            !Element.isElement(child) ||
            !('type' in child) ||
            child.type !== 'list-item'
          ) {
            // Wrap non-list-item children in list-item
            Transforms.wrapNodes(
              editor,
              { type: 'list-item', children: [] } as any,
              { at: childPath }
            );
            return;
          }
        }
      }

      // Choice interactions must contain at least one simple-choice
      if (type === 'qti-choice-interaction') {
        const hasChoice = node.children.some(
          (child) =>
            Element.isElement(child) &&
            'type' in child &&
            (child.type === 'qti-simple-choice' || child.type === 'qti-prompt')
        );

        if (!hasChoice) {
          // Add a default choice
          Transforms.insertNodes(
            editor,
            {
              type: 'qti-simple-choice',
              attributes: { identifier: 'choice-1' },
              children: [{ text: 'Choice 1' }],
            } as any,
            { at: path.concat(0) }
          );
          return;
        }
      }
    }

    // Call the original normalizeNode to handle default normalization
    normalizeNode(entry);
  };

  return editor;
}
