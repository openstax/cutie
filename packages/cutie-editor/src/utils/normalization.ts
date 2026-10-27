import { Editor, Element, type Node, Path, Text, Transforms } from 'slate';
import type { CustomEditor } from '../types.js';

/**
 * Normalize a container element by wrapping consecutive inline content in paragraphs.
 * Groups text nodes and inline elements together into single paragraphs.
 *
 * @returns true if a change was made, false otherwise
 */
export function wrapInlineContentInParagraphs(
  editor: CustomEditor,
  node: Element,
  path: Path
): boolean {
  // If empty, insert a paragraph child
  if (node.children.length === 0) {
    Transforms.insertNodes(
      editor,
      { type: 'paragraph', children: [{ text: '' }], attributes: {} } as Element,
      { at: path.concat(0) }
    );
    return true;
  }

  // Find the first run of consecutive text/inline elements that need wrapping
  let runStart: number | null = null;
  let runEnd: number | null = null;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const isInlineContent =
      Text.isText(child) || (Element.isElement(child) && !Editor.isBlock(editor, child));

    if (isInlineContent) {
      if (runStart === null) {
        runStart = i;
      }
      runEnd = i;
    } else {
      // Hit a block element - if we have a pending run, stop here
      if (runStart !== null) {
        break;
      }
    }
  }

  // If we found inline content to wrap, wrap the entire run
  if (runStart !== null && runEnd !== null) {
    // Use match function to select only the nodes in the run
    const runStartIndex = runStart;
    const runEndIndex = runEnd;

    Transforms.wrapNodes(
      editor,
      { type: 'paragraph', children: [], attributes: {} } as Element,
      {
        at: path,
        match: (_n, p) =>
          p.length === path.length + 1 &&
          p[path.length] >= runStartIndex &&
          p[path.length] <= runEndIndex,
      }
    );
    return true;
  }

  return false;
}

/**
 * Children of a feedback element that sit beside qti-content-body rather than in it.
 * The editor doesn't model them, so they arrive as qti-unknown elements.
 */
const FEEDBACK_NON_CONTENT_TAGS = ['qti-stylesheet', 'qti-catalog-info'];

function isFeedbackContent(child: Node): boolean {
  if (!Element.isElement(child) || !('type' in child)) return true;
  if (child.type === 'qti-content-body') return false;
  return !(
    child.type === 'qti-unknown' &&
    'originalTagName' in child &&
    FEEDBACK_NON_CONTENT_TAGS.includes(child.originalTagName)
  );
}

/**
 * Normalize a feedback element (qti-feedback-block, qti-modal-feedback) so its
 * content is inside a qti-content-body, as QTI 3.0 requires. Loose content is
 * moved into a new qti-content-body; an element with no content gets an empty one.
 *
 * @returns true if a change was made, false otherwise
 */
export function wrapFeedbackContentInContentBody(
  editor: CustomEditor,
  node: Element,
  path: Path
): boolean {
  const hasContentBody = node.children.some(
    (child) => Element.isElement(child) && 'type' in child && child.type === 'qti-content-body'
  );
  if (hasContentBody) return false;

  const hasContent = node.children.some(isFeedbackContent);
  if (hasContent) {
    Transforms.wrapNodes(
      editor,
      { type: 'qti-content-body', children: [], attributes: {} } as Element,
      {
        at: path,
        match: (n, p) => p.length === path.length + 1 && isFeedbackContent(n),
      }
    );
    return true;
  }

  Transforms.insertNodes(
    editor,
    {
      type: 'qti-content-body',
      children: [{ type: 'paragraph', children: [{ text: '' }], attributes: {} }],
    } as Element,
    { at: path.concat(node.children.length) }
  );
  return true;
}
