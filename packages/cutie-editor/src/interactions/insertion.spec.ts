import { createEditor, type Descendant, Editor, Element } from 'slate';
import { describe, expect, it } from 'vitest';
import { withQtiInteractions } from '../plugins/withQtiInteractions';
import type { CustomEditor } from '../types';
import { insertChoiceInteraction } from './choice/insertion';
import { insertGapMatchInteraction } from './gapMatch/insertion';
import { insertInlineChoiceInteraction } from './inlineChoice/insertion';
import { insertMatchInteraction } from './match/insertion';

function createTestEditor(): CustomEditor {
  const editor = withQtiInteractions(createEditor() as CustomEditor);
  editor.children = [
    { type: 'paragraph', children: [{ text: '' }], attributes: {} },
  ] as Descendant[];
  editor.selection = { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } };
  return editor;
}

function findInteraction(editor: CustomEditor, type: string): Element {
  const [entry] = Editor.nodes(editor, {
    at: [],
    match: n => Element.isElement(n) && 'type' in n && n.type === type,
  });
  expect(entry).toBeDefined();
  return entry[0] as Element;
}

describe('interaction insertion', () => {
  it.each([
    ['qti-choice-interaction', insertChoiceInteraction],
    ['qti-inline-choice-interaction', insertInlineChoiceInteraction],
    ['qti-match-interaction', insertMatchInteraction],
    ['qti-gap-match-interaction', insertGapMatchInteraction],
  ] as const)('inserts %s with no shuffle attribute', (type, insert) => {
    const editor = createTestEditor();
    insert(editor);
    const interaction = findInteraction(editor, type) as Element & { attributes: Record<string, unknown> };
    expect('shuffle' in interaction.attributes).toBe(false);
  });
});
