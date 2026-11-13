import { createEditor, type Descendant } from 'slate';
import { describe, expect, it } from 'vitest';
import { withQtiInteractions } from '../../plugins/withQtiInteractions.js';
import type { CustomEditor, QtiGapMatchInteraction } from '../../types.js';
import {
  findGapMatchInteraction,
  generateMatchGroupId,
  getMatchGroups,
  removeMatchGroup,
  setMatchGroups,
} from './matchGroups.js';

function createInteraction(): QtiGapMatchInteraction {
  return {
    type: 'qti-gap-match-interaction',
    attributes: { 'response-identifier': 'RESPONSE' },
    responseDeclaration: { tagName: 'qti-response-declaration', attributes: {}, children: [] },
    matchGroups: [{ identifier: 'cause', heading: 'Condition' }],
    children: [
      {
        type: 'gap-match-choices',
        children: [
          { type: 'qti-gap-text', attributes: { identifier: 'C', 'match-group': 'cause' }, children: [{ text: 'bleeding' }] },
          { type: 'qti-gap-text', attributes: { identifier: 'E', 'match-group': 'effect cause' }, children: [{ text: 'platelets' }] },
        ],
      },
      {
        type: 'gap-match-content',
        children: [
          {
            type: 'paragraph',
            attributes: {},
            children: [
              { text: 'At risk for ' },
              { type: 'qti-gap', attributes: { identifier: 'G1', 'match-group': 'cause' }, children: [{ text: '' }] },
              { text: '' },
            ],
          },
        ],
      },
    ],
  } as QtiGapMatchInteraction;
}

function createTestEditor(): CustomEditor {
  const editor = withQtiInteractions(createEditor() as CustomEditor);
  editor.children = [createInteraction() as unknown as Descendant];
  return editor;
}

describe('matchGroups', () => {
  it('lists declared groups first, then groups only named by choices or gaps', () => {
    expect(getMatchGroups(createInteraction())).toEqual([
      { identifier: 'cause', heading: 'Condition' },
      { identifier: 'effect', heading: '' },
    ]);
  });

  it('generates an identifier not already in use', () => {
    expect(generateMatchGroupId([{ identifier: 'group2', heading: '' }])).toBe('group3');
    expect(generateMatchGroupId([{ identifier: 'a', heading: '' }, { identifier: 'group3', heading: '' }])).toBe(
      'group4'
    );
  });

  it('finds the interaction above a gap', () => {
    const editor = createTestEditor();
    expect(findGapMatchInteraction(editor, [0, 1, 0, 1])?.interactionPath).toEqual([0]);
  });

  it('sets the declared groups', () => {
    const editor = createTestEditor();
    setMatchGroups(editor, [0], [{ identifier: 'cause', heading: 'Risk' }]);
    expect((editor.children[0] as QtiGapMatchInteraction).matchGroups).toEqual([
      { identifier: 'cause', heading: 'Risk' },
    ]);
  });

  it('removes a group from the declarations and from every choice and gap', () => {
    const editor = createTestEditor();
    removeMatchGroup(editor, [0], 'cause');

    const interaction = editor.children[0] as QtiGapMatchInteraction;
    expect(interaction.matchGroups).toEqual([{ identifier: 'effect', heading: '' }]);

    const [choices, content] = interaction.children as any[];
    expect(choices.children[0].attributes).not.toHaveProperty('match-group');
    expect(choices.children[1].attributes['match-group']).toBe('effect');
    expect(content.children[0].children[1].attributes).not.toHaveProperty('match-group');
  });
});
