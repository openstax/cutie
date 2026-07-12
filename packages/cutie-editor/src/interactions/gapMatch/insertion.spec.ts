import { createEditor, type Descendant, Editor, Transforms } from 'slate';
import { describe, expect, it } from 'vitest';
import { withQtiInteractions, withXhtml } from '../../plugins';
import { serializeSlateToQti } from '../../serialization/slateToXml';
import type { CustomEditor } from '../../types';
import { insertBowtieInteraction } from './insertion';

/**
 * Build an editor seeded like a fresh document: a document-metadata node at [0]
 * (defaulting to all-or-nothing scoring) followed by an empty paragraph.
 */
function createSeededEditor(): CustomEditor {
  const editor = withQtiInteractions(withXhtml(createEditor())) as CustomEditor;
  editor.children = [
    {
      type: 'document-metadata',
      children: [{ text: '' }],
      responseProcessing: { mode: 'allCorrect' },
    },
    { type: 'paragraph', children: [{ text: '' }] },
  ] as unknown as Descendant[];
  Transforms.select(editor, Editor.end(editor, [1]));
  return editor;
}

describe('insertBowtieInteraction', () => {
  it('inserts a serializable bowtie gap-match with the layout class', () => {
    const editor = createSeededEditor();

    insertBowtieInteraction(editor);
    const result = serializeSlateToQti(editor.children, '');

    expect(result.errors ?? []).toEqual([]);
    expect(result.xml).toContain('qti-gap-match-interaction');
    expect(result.xml).toContain('class="bowtie"');
  });

  it('restricts each column via its own match-group', () => {
    const editor = createSeededEditor();

    insertBowtieInteraction(editor);
    const result = serializeSlateToQti(editor.children, '');

    for (const group of ['actions', 'condition', 'parameters']) {
      expect(result.xml).toContain(`match-group="${group}"`);
    }
  });

  it('scores +1 per correct placement with a floor of 0', () => {
    const editor = createSeededEditor();

    insertBowtieInteraction(editor);
    const result = serializeSlateToQti(editor.children, '');

    // Mapping present on the declaration, floored at 0.
    expect(result.xml).toContain('lower-bound="0"');
    expect(result.xml).toContain('mapped-value="1"');
    // Scoring runs the map_response template, which sums the per-pair mapped
    // values (partial credit) rather than all-or-nothing.
    expect(result.xml).toContain('map_response');
  });

  it('switches the document to sumScores partial-credit processing', () => {
    const editor = createSeededEditor();

    insertBowtieInteraction(editor);

    const metadata = editor.children[0] as unknown as {
      responseProcessing: { mode: string };
    };
    expect(metadata.responseProcessing.mode).toBe('sumScores');
  });
});
