import { Editor, Element, Transforms } from 'slate';

/**
 * Generate a unique response identifier
 */
function generateResponseId(editor: Editor): string {
  const existingIds = new Set<string>();

  // Collect all existing response identifiers
  const nodes = Array.from(Editor.nodes(editor, {
    at: [],
    match: (n) => {
      if (!Element.isElement(n)) return false;
      if (!('type' in n)) return false;
      const type = n.type as string;
      return (
        type === 'qti-text-entry-interaction' ||
        type === 'qti-extended-text-interaction' ||
        type === 'qti-choice-interaction'
      );
    },
  }));

  for (const [node] of nodes) {
    if (Element.isElement(node) && 'attributes' in node) {
      const attrs = node.attributes as any;
      if (attrs && attrs['response-identifier']) {
        existingIds.add(attrs['response-identifier']);
      }
    }
  }

  // Generate unique ID
  let counter = 1;
  let id = `RESPONSE_${counter}`;
  while (existingIds.has(id)) {
    counter++;
    id = `RESPONSE_${counter}`;
  }

  return id;
}

/**
 * Insert an extended text interaction at the current selection
 */
export function insertExtendedTextInteraction(
  editor: Editor,
  config: {
    responseIdentifier?: string;
    expectedLines?: string;
    expectedLength?: string;
    placeholderText?: string;
  } = {}
): void {
  const responseId = config.responseIdentifier || generateResponseId(editor);

  const extendedText = {
    type: 'qti-extended-text-interaction',
    children: [{ text: '' }],
    attributes: {
      'response-identifier': responseId,
      'expected-lines': config.expectedLines,
      'expected-length': config.expectedLength,
      'placeholder-text': config.placeholderText,
    },
  };

  Transforms.insertNodes(editor, extendedText as any);
  Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] } as any);
}
