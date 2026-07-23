import { Editor, Element, Transforms } from 'slate';
import type { CustomEditor } from '../../types';
import { generateUniqueResponseId } from '../../utils/idGenerator';
import {
  type MapEntry,
  type MappingMetadata,
  updateMapping,
} from '../../utils/mappingDeclaration';
import { updateResponseProcessingMode } from '../../utils/responseProcessingTransforms';

interface XmlNode {
  tagName: string;
  attributes: Record<string, string>;
  children: (XmlNode | string)[];
}

/**
 * Add a correct pairing to the response declaration
 */
function addCorrectPairing(decl: XmlNode, pairing: string): XmlNode {
  // Find existing correct-response or create one
  const existingCorrectResponse = decl.children.find(
    (c): c is XmlNode => typeof c !== 'string' && c.tagName === 'qti-correct-response'
  );

  if (existingCorrectResponse) {
    // Add new value to existing correct-response
    const newValue: XmlNode = {
      tagName: 'qti-value',
      attributes: {},
      children: [pairing],
    };

    const updatedCorrectResponse: XmlNode = {
      ...existingCorrectResponse,
      children: [...existingCorrectResponse.children, newValue],
    };

    return {
      ...decl,
      children: decl.children.map((c) =>
        typeof c !== 'string' && c.tagName === 'qti-correct-response' ? updatedCorrectResponse : c
      ),
    };
  }

  // Create new correct-response with the pairing
  const correctResponse: XmlNode = {
    tagName: 'qti-correct-response',
    attributes: {},
    children: [
      {
        tagName: 'qti-value',
        attributes: {},
        children: [pairing],
      },
    ],
  };

  return {
    ...decl,
    children: [...decl.children, correctResponse],
  };
}

/**
 * Generate a unique gap identifier within the interaction
 */
export function generateGapId(editor: Editor, interactionPath: number[]): string {
  const existingIds = new Set<string>();

  // Find all gaps within this interaction
  for (const [node] of Editor.nodes(editor, {
    at: interactionPath,
    match: (n) => Element.isElement(n) && 'type' in n && n.type === 'qti-gap',
  })) {
    if (Element.isElement(node) && 'attributes' in node) {
      const attrs = node.attributes as any;
      if (attrs?.identifier) {
        existingIds.add(attrs.identifier);
      }
    }
  }

  // Generate unique ID (G1, G2, G3, etc.)
  let counter = 1;
  let id = `G${counter}`;
  while (existingIds.has(id)) {
    counter++;
    id = `G${counter}`;
  }

  return id;
}

/**
 * Generate a unique choice identifier within the interaction
 */
export function generateChoiceId(editor: Editor, interactionPath: number[]): string {
  const existingIds = new Set<string>();

  // Find all choices within this interaction
  for (const [node] of Editor.nodes(editor, {
    at: interactionPath,
    match: (n) =>
      Element.isElement(n) &&
      'type' in n &&
      (n.type === 'qti-gap-text' || n.type === 'qti-gap-img'),
  })) {
    if (Element.isElement(node) && 'attributes' in node) {
      const attrs = node.attributes as any;
      if (attrs?.identifier) {
        existingIds.add(attrs.identifier);
      }
    }
  }

  // Generate unique ID (A, B, C, ..., AA, AB, etc.)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let counter = 0;

  while (true) {
    let id = '';
    let n = counter;

    // Convert counter to letter sequence (A, B, ..., Z, AA, AB, ...)
    do {
      id = letters[n % 26] + id;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);

    if (!existingIds.has(id)) {
      return id;
    }
    counter++;
  }
}

/**
 * Insert a gap-match interaction at the current selection
 */
export function insertGapMatchInteraction(
  editor: Editor,
  config: {
    responseIdentifier?: string;
    shuffle?: boolean;
  } = {}
): void {
  const responseId = config.responseIdentifier || generateUniqueResponseId(editor);

  const gapMatchInteraction = {
    type: 'qti-gap-match-interaction',
    attributes: {
      'response-identifier': responseId,
      shuffle: config.shuffle ? 'true' : undefined,
    },
    children: [
      {
        type: 'gap-match-choices',
        children: [
          {
            type: 'qti-gap-text',
            attributes: { identifier: 'A', 'match-max': '1' },
            children: [{ text: 'Choice A' }],
          },
          {
            type: 'qti-gap-text',
            attributes: { identifier: 'B', 'match-max': '1' },
            children: [{ text: 'Choice B' }],
          },
        ],
      },
      {
        type: 'gap-match-content',
        children: [
          {
            type: 'paragraph',
            children: [
              { text: 'Write your content here. Select text and use the properties panel to create gaps.' },
            ],
            attributes: {},
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

  Transforms.insertNodes(editor, gapMatchInteraction as any, { at: insertPoint });

  // Find the inserted interaction and position cursor in the content
  const [interactionEntry] = Editor.nodes(editor, {
    at: insertPoint,
    match: (n) => Element.isElement(n) && 'type' in n && n.type === 'qti-gap-match-interaction',
  });

  if (interactionEntry) {
    const [, interactionPath] = interactionEntry;
    // Select the start of the content area: interaction -> content -> paragraph
    const contentParagraphPath = [...interactionPath, 1, 0];
    Transforms.select(editor, Editor.start(editor, contentParagraphPath));
  }

  // Insert trailing paragraph for cursor positioning after the interaction
  Transforms.insertNodes(
    editor,
    { type: 'paragraph', children: [{ text: '' }] } as any,
    { at: interactionEntry ? [interactionEntry[1][0] + 1] : undefined }
  );
}

/**
 * A single column of a bowtie: its match-group, heading, gaps, and choice pool
 * (a couple of decoys per column keep the task non-trivial).
 */
interface BowtieColumn {
  group: string;
  label: string;
  gaps: string[];
  choices: Array<{ id: string; text: string; correctGap?: string }>;
}

/**
 * The bowtie preset: three columns (2 gaps | 1 gap | 2 gaps) laid out with
 * placeholder content the author replaces. Each column is its own match-group
 * so choices can only be dropped into their own column's gaps. The columns are
 * authored with the QTI layout grid (qti-layout-row / qti-layout-col-4); the
 * client lays them out side by side and banks each group's choices beneath its
 * own column. A couple of decoy choices per column keep the task non-trivial.
 */
const BOWTIE_COLUMNS: BowtieColumn[] = [
  {
    group: 'group-1',
    label: 'Column 1',
    gaps: ['G1', 'G2'],
    choices: [
      { id: 'A', text: 'Choice A', correctGap: 'G1' },
      { id: 'B', text: 'Choice B', correctGap: 'G2' },
      { id: 'C', text: 'Choice C' },
      { id: 'D', text: 'Choice D' },
    ],
  },
  {
    group: 'group-2',
    label: 'Column 2',
    gaps: ['G3'],
    choices: [
      { id: 'E', text: 'Choice E', correctGap: 'G3' },
      { id: 'F', text: 'Choice F' },
      { id: 'G', text: 'Choice G' },
    ],
  },
  {
    group: 'group-3',
    label: 'Column 3',
    gaps: ['G4', 'G5'],
    choices: [
      { id: 'H', text: 'Choice H', correctGap: 'G4' },
      { id: 'I', text: 'Choice I', correctGap: 'G5' },
      { id: 'J', text: 'Choice J' },
      { id: 'K', text: 'Choice K' },
    ],
  },
];

/**
 * Insert a bowtie interaction: a gap-match preset with three match-group-restricted
 * columns and per-correct-choice scoring (+1 each, min 0). It is a standard
 * qti-gap-match-interaction whose columns are authored with the QTI layout grid
 * (qti-layout-row / qti-layout-col-4) so the client lays them out side by side
 * and banks each group's choices beneath its own column. The document's response
 * processing is set to sum the mapped scores so each correct placement earns a
 * point.
 */
export function insertBowtieInteraction(
  editor: Editor,
  config: {
    responseIdentifier?: string;
    shuffle?: boolean;
  } = {}
): void {
  const responseId = config.responseIdentifier || generateUniqueResponseId(editor);

  // Flatten the columns into the gap-text choice pool (match-group-tagged).
  const choiceNodes = BOWTIE_COLUMNS.flatMap((column) =>
    column.choices.map((choice) => ({
      type: 'qti-gap-text',
      attributes: {
        identifier: choice.id,
        'match-max': '1',
        'match-group': column.group,
      },
      children: [{ text: choice.text }],
    }))
  );

  // Lay the columns out with the QTI layout grid: a qti-layout-row wrapping one
  // qti-layout-col-4 per column, each holding a paragraph with a bold heading
  // followed by its gaps. Empty text nodes wrap the inline void gaps as Slate
  // requires. The client renders the columns side by side and, because each
  // column's gaps all share a single match-group, banks that group's choices
  // beneath the column.
  const layoutRow = {
    type: 'div',
    attributes: { class: 'qti-layout-row' },
    children: BOWTIE_COLUMNS.map((column) => {
      const paragraphChildren: Array<Record<string, unknown>> = [
        { text: column.label, bold: true },
      ];
      for (const gapId of column.gaps) {
        paragraphChildren.push({
          type: 'qti-gap',
          attributes: { identifier: gapId, 'match-group': column.group },
          children: [{ text: '' }],
        });
        paragraphChildren.push({ text: '' });
      }
      return {
        type: 'div',
        attributes: { class: 'qti-layout-col-4' },
        children: [{ type: 'paragraph', attributes: {}, children: paragraphChildren }],
      };
    }),
  };

  // Correct pairings ("CHOICE GAP") and a +1 map-entry for each.
  const correctValues: string[] = [];
  const mapEntries: MapEntry[] = [];
  for (const column of BOWTIE_COLUMNS) {
    for (const choice of column.choices) {
      if (choice.correctGap) {
        const pairing = `${choice.id} ${choice.correctGap}`;
        correctValues.push(pairing);
        mapEntries.push({ mapKey: pairing, mappedValue: 1 });
      }
    }
  }

  // Build the response declaration: correct response + a mapping that floors the
  // score at 0 (wrong placements map to the default 0, never negative).
  const baseDecl = {
    tagName: 'qti-response-declaration',
    attributes: {
      identifier: responseId,
      cardinality: 'multiple',
      'base-type': 'directedPair',
    },
    children: [
      {
        tagName: 'qti-correct-response',
        attributes: {},
        children: correctValues.map((value) => ({
          tagName: 'qti-value',
          attributes: {},
          children: [value],
        })),
      },
    ],
  };
  const mappingMetadata: MappingMetadata = { defaultValue: 0, lowerBound: 0 };
  const responseDeclaration = updateMapping(baseDecl as any, mappingMetadata, mapEntries);

  const bowtieInteraction = {
    type: 'qti-gap-match-interaction',
    attributes: {
      'response-identifier': responseId,
      shuffle: config.shuffle ? 'true' : undefined,
    },
    children: [
      { type: 'gap-match-choices', children: choiceNodes },
      { type: 'gap-match-content', children: [layoutRow] },
    ],
    responseDeclaration,
  };

  // Insert at the current selection (same flow as insertGapMatchInteraction).
  const { selection } = editor;
  const insertPoint = selection ? Editor.start(editor, selection) : Editor.end(editor, []);

  Transforms.insertNodes(editor, bowtieInteraction as any, { at: insertPoint });

  const [interactionEntry] = Editor.nodes(editor, {
    at: insertPoint,
    match: (n) => Element.isElement(n) && 'type' in n && n.type === 'qti-gap-match-interaction',
  });

  if (interactionEntry) {
    const [, interactionPath] = interactionEntry;
    // Select the start of the first content region.
    Transforms.select(editor, Editor.start(editor, [...interactionPath, 1, 0]));
  }

  // Trailing paragraph for cursor positioning after the interaction.
  Transforms.insertNodes(
    editor,
    { type: 'paragraph', children: [{ text: '' }] } as any,
    { at: interactionEntry ? [interactionEntry[1][0] + 1] : undefined }
  );

  // Partial-credit scoring: sum the mapped response so each correct placement
  // contributes its +1. Without this the item defaults to all-or-nothing.
  updateResponseProcessingMode(editor as unknown as CustomEditor, 'sumScores');
}

/**
 * Check if the current selection has actual text selected (not just a cursor)
 */
function hasTextSelection(editor: Editor): boolean {
  const { selection } = editor;
  if (!selection) return false;

  // Check if anchor and focus are at different positions
  if (selection.anchor.path.join(',') !== selection.focus.path.join(',')) {
    return true;
  }
  return selection.anchor.offset !== selection.focus.offset;
}

/**
 * Get the selected text content (recursively extracts text from nested nodes)
 */
function getSelectedText(editor: Editor): string {
  const { selection } = editor;
  if (!selection) return '';

  const fragment = Editor.fragment(editor, selection);

  function extractText(nodes: any[]): string {
    return nodes
      .map((node) => {
        if ('text' in node) return node.text;
        if ('children' in node) return extractText(node.children);
        return '';
      })
      .join('');
  }

  return extractText(fragment);
}

/**
 * Insert a gap or create a choice based on current selection.
 * - If there's a text selection: create a new choice with that text
 * - If just a cursor position: insert a gap at cursor
 *
 * @returns 'gap' if a gap was inserted, 'choice' if a choice was created, false if failed
 */
export function insertGapOrChoiceAtSelection(editor: Editor): 'gap' | 'choice' | false {
  const { selection } = editor;
  if (!selection) return false;

  // Find the gap-match-interaction ancestor
  const [interactionEntry] = Editor.nodes(editor, {
    at: selection,
    match: (n) => Element.isElement(n) && 'type' in n && n.type === 'qti-gap-match-interaction',
  });

  if (!interactionEntry) {
    return false;
  }

  const [, interactionPath] = interactionEntry;

  // Check if we have a text selection
  if (hasTextSelection(editor)) {
    // Create a new choice with the selected text, then replace selection with a gap
    const selectedText = getSelectedText(editor);
    if (!selectedText.trim()) return false;

    const choiceId = generateChoiceId(editor, interactionPath);
    const gapId = generateGapId(editor, interactionPath);

    // Find the choices container and add the new choice
    let choiceAdded = false;
    for (const [node, nodePath] of Editor.nodes(editor, {
      at: interactionPath,
      match: (n) => Element.isElement(n) && 'type' in n && n.type === 'gap-match-choices',
    })) {
      if (Element.isElement(node)) {
        Transforms.insertNodes(
          editor,
          {
            type: 'qti-gap-text',
            attributes: { identifier: choiceId, 'match-max': '1' },
            children: [{ text: selectedText }],
          } as Element,
          { at: [...nodePath, node.children.length] }
        );
        choiceAdded = true;
        break;
      }
    }

    if (!choiceAdded) return false;

    // Delete the selected text and insert a gap in its place
    Transforms.delete(editor);
    Transforms.insertNodes(editor, {
      type: 'qti-gap',
      children: [{ text: '' }],
      attributes: { identifier: gapId },
    } as any);

    // Add the correct answer pairing to the response declaration
    const [interaction] = Editor.nodes(editor, {
      at: interactionPath,
      match: (n) => Element.isElement(n) && 'type' in n && n.type === 'qti-gap-match-interaction',
    });

    if (interaction) {
      const [interactionNode] = interaction;
      const el = interactionNode as any;
      const responseDecl = el.responseDeclaration;

      if (responseDecl) {
        // Add the new pairing (format: "choiceId gapId")
        const newPairing = `${choiceId} ${gapId}`;
        const updatedDecl = addCorrectPairing(responseDecl, newPairing);

        Transforms.setNodes(
          editor,
          { responseDeclaration: updatedDecl } as any,
          { at: interactionPath }
        );
      }
    }

    return 'choice';
  }

  // Just a cursor - verify we're inside the content area
  const [contentEntry] = Editor.nodes(editor, {
    at: selection,
    match: (n) => Element.isElement(n) && 'type' in n && n.type === 'gap-match-content',
  });

  if (!contentEntry) {
    return false;
  }

  // Generate a unique gap ID
  const gapId = generateGapId(editor, interactionPath);

  // Insert the gap void element
  Transforms.insertNodes(editor, {
    type: 'qti-gap',
    children: [{ text: '' }],
    attributes: { identifier: gapId },
  } as any);

  return 'gap';
}

/**
 * @deprecated Use insertGapOrChoiceAtSelection instead
 */
export function insertGapAtSelection(editor: Editor): boolean {
  return insertGapOrChoiceAtSelection(editor) === 'gap';
}
