import { Editor, Element, Transforms } from 'slate';
import { generateUniqueResponseId } from '../../utils/idGenerator';

/**
 * Generate a unique source identifier within the interaction
 */
export function generateSourceId(editor: Editor, interactionPath: number[]): string {
  const existingIds = new Set<string>();

  // Find all choices within this interaction to avoid conflicts
  for (const [node] of Editor.nodes(editor, {
    at: interactionPath,
    match: (n) =>
      Element.isElement(n) &&
      'type' in n &&
      n.type === 'qti-simple-associable-choice',
  })) {
    if (Element.isElement(node) && 'attributes' in node) {
      const attrs = node.attributes as any;
      if (attrs?.identifier) {
        existingIds.add(attrs.identifier);
      }
    }
  }

  // Generate unique ID (sourceA, sourceB, sourceC, ...)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let counter = 0;

  while (true) {
    let suffix = '';
    let n = counter;

    // Convert counter to letter sequence (A, B, ..., Z, AA, AB, ...)
    do {
      suffix = letters[n % 26] + suffix;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);

    const id = `source${suffix}`;
    if (!existingIds.has(id)) {
      return id;
    }
    counter++;
  }
}

/**
 * Generate a unique target identifier within the interaction
 */
export function generateTargetId(editor: Editor, interactionPath: number[]): string {
  const existingIds = new Set<string>();

  // Find all target choices within this interaction
  for (const [node] of Editor.nodes(editor, {
    at: interactionPath,
    match: (n) =>
      Element.isElement(n) &&
      'type' in n &&
      n.type === 'qti-simple-associable-choice',
  })) {
    if (Element.isElement(node) && 'attributes' in node) {
      const attrs = node.attributes as any;
      if (attrs?.identifier) {
        existingIds.add(attrs.identifier);
      }
    }
  }

  // Generate unique ID (targetX, targetY, targetZ, ...)
  // Use reverse alphabet so targets start from end (X, Y, Z, W...) to distinguish from sources
  // spell-checker: disable-next-line
  const letters = 'XYZWVUTSRQPONMLKJIHGFEDCBA';
  let counter = 0;

  while (true) {
    let suffix = '';
    let n = counter;

    // Convert counter to letter sequence (X, Y, ..., A, XX, XY, ...)
    do {
      suffix = letters[n % 26] + suffix;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);

    const id = `target${suffix}`;
    if (!existingIds.has(id)) {
      return id;
    }
    counter++;
  }
}

/**
 * Insert a match interaction at the current selection
 */
export function insertMatchInteraction(
  editor: Editor,
  config: {
    responseIdentifier?: string;
    shuffle?: boolean;
    maxAssociations?: number;
  } = {}
): void {
  const responseId = config.responseIdentifier || generateUniqueResponseId(editor);

  const matchInteraction = {
    type: 'qti-match-interaction',
    attributes: {
      'response-identifier': responseId,
      shuffle: config.shuffle ? 'true' : undefined,
      'max-associations': config.maxAssociations?.toString(),
    },
    children: [
      {
        type: 'qti-prompt',
        children: [{ text: 'Match each item to its corresponding target.' }],
        attributes: {},
      },
      {
        type: 'match-source-set',
        children: [
          {
            type: 'qti-simple-associable-choice',
            attributes: { identifier: 'sourceA', 'match-max': '1' },
            children: [{ text: 'Source A' }],
          },
          {
            type: 'qti-simple-associable-choice',
            attributes: { identifier: 'sourceB', 'match-max': '1' },
            children: [{ text: 'Source B' }],
          },
        ],
      },
      {
        type: 'match-target-set',
        children: [
          {
            type: 'qti-simple-associable-choice',
            attributes: { identifier: 'targetX', 'match-max': '1' },
            children: [{ text: 'Target X' }],
          },
          {
            type: 'qti-simple-associable-choice',
            attributes: { identifier: 'targetY', 'match-max': '1' },
            children: [{ text: 'Target Y' }],
          },
        ],
      },
    ],
    responseDeclaration: {
      tagName: 'qti-response-declaration',
      attributes: {
        identifier: responseId,
        cardinality: 'multiple',
        'base-type': 'directedPair',
      },
      children: [],
    },
  };

  // Get current selection to find where we'll insert
  const { selection } = editor;
  const insertPoint = selection ? Editor.start(editor, selection) : Editor.end(editor, []);

  Transforms.insertNodes(editor, matchInteraction as any, { at: insertPoint });

  // Find the inserted interaction and position cursor in the prompt
  const [interactionEntry] = Editor.nodes(editor, {
    at: insertPoint,
    match: (n) => Element.isElement(n) && 'type' in n && n.type === 'qti-match-interaction',
  });

  if (interactionEntry) {
    const [, interactionPath] = interactionEntry;
    // Select the start of the prompt: interaction -> prompt -> text
    const promptPath = [...interactionPath, 0, 0];
    Transforms.select(editor, Editor.start(editor, promptPath));
  }

  // Insert trailing paragraph for cursor positioning after the interaction
  Transforms.insertNodes(
    editor,
    { type: 'paragraph', children: [{ text: '' }] } as any,
    { at: interactionEntry ? [interactionEntry[1][0] + 1] : undefined }
  );
}
