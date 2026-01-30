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
 * Insert a text entry interaction at the current selection
 */
export function insertTextEntryInteraction(
  editor: Editor,
  config: {
    responseIdentifier?: string;
    expectedLength?: string;
    patternMask?: string;
    placeholderText?: string;
  } = {}
): void {
  const responseId = config.responseIdentifier || generateResponseId(editor);

  const textEntry = {
    type: 'qti-text-entry-interaction',
    children: [{ text: '' }],
    attributes: {
      'response-identifier': responseId,
      'expected-length': config.expectedLength,
      'pattern-mask': config.patternMask,
      'placeholder-text': config.placeholderText,
    },
    responseDeclaration: {
      tagName: 'qti-response-declaration',
      attributes: {
        identifier: responseId,
        cardinality: 'single',
        'base-type': 'string',
      },
      children: [],
    },
  };

  Transforms.insertNodes(editor, textEntry as any);
}
