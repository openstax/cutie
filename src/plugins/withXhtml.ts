import { Editor, Element, Node, Path, Transforms } from 'slate';
import type { CustomEditor } from '../types';
import {
  elementNeedsSpacers,
  getElementCategories,
  getElementForbiddenDescendants,
} from './withQtiInteractions';

/**
 * Check if an element is a text-editable block (can hold cursor for editing)
 */
function isTextEditableBlock(element: Element): boolean {
  if (!('type' in element)) return false;
  const type = element.type as string;
  return ['paragraph', 'div', 'heading', 'list', 'list-item'].includes(type);
}

/**
 * Plugin to handle XHTML normalization rules
 */
export function withXhtml(editor: CustomEditor): CustomEditor {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    // Check if this element is in a forbidden context (ancestor forbids its category)
    // If so, move it to be a sibling after the forbidding ancestor
    if (Element.isElement(node) && 'type' in node && path.length > 0) {
      const myCategories = getElementCategories(node);

      if (myCategories.length > 0) {
        // Walk up ancestors to check for forbidden context
        const ancestors = Node.ancestors(editor, path, { reverse: true });

        for (const [ancestor, ancestorPath] of ancestors) {
          if (Element.isElement(ancestor)) {
            const forbidden = getElementForbiddenDescendants(ancestor);

            if (forbidden.length > 0 && myCategories.some(cat => forbidden.includes(cat))) {
              // I'm forbidden here - move myself after this ancestor
              Transforms.moveNodes(editor, {
                at: path,
                to: Path.next(ancestorPath),
              });
              return; // Normalization will re-run
            }
          }
        }
      }
    }

    // Normalize containers (editor or block elements with children) to add spacers
    // around elements that need them for cursor positioning
    if (Editor.isEditor(node) || (Element.isElement(node) && 'type' in node)) {
      const children = Editor.isEditor(node) ? node.children : (node as Element).children;

      // Only process if this is a container that can have block children
      // Skip inline containers and specific element types that shouldn't have spacers added
      const skipTypes = ['qti-choice-interaction', 'qti-simple-choice', 'qti-prompt', 'list', 'list-item'];
      if (Element.isElement(node) && 'type' in node && skipTypes.includes(node.type as string)) {
        // Fall through to other normalization
      } else {
        // Check each child - if it needs spacers, ensure adjacent siblings are text-editable
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if (!Element.isElement(child)) continue;

          if (elementNeedsSpacers(child)) {
            // Check if previous sibling is text-editable (or this is first child)
            const prevSibling = i > 0 ? children[i - 1] : null;
            const needsSpacerBefore = !prevSibling ||
              !Element.isElement(prevSibling) ||
              !isTextEditableBlock(prevSibling);

            if (needsSpacerBefore) {
              Transforms.insertNodes(
                editor,
                { type: 'paragraph', children: [{ text: '' }] } as any,
                { at: path.concat(i) }
              );
              return; // Normalization will re-run
            }

            // Check if next sibling is text-editable (or this is last child)
            const nextSibling = i < children.length - 1 ? children[i + 1] : null;
            const needsSpacerAfter = !nextSibling ||
              !Element.isElement(nextSibling) ||
              !isTextEditableBlock(nextSibling);

            if (needsSpacerAfter) {
              Transforms.insertNodes(
                editor,
                { type: 'paragraph', children: [{ text: '' }] } as any,
                { at: path.concat(i + 1) }
              );
              return; // Normalization will re-run
            }
          }
        }
      }
    }

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
