import { Element } from 'slate';
import type { ElementConfig } from '../../types';
import { wrapInlineContentInParagraphs } from '../../utils/normalization';

export const simpleChoiceConfig: ElementConfig = {
  type: 'qti-simple-choice',
  xmlTagName: 'qti-simple-choice',
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'qti-simple-choice',
};

export const choiceIdLabelConfig: ElementConfig = {
  type: 'choice-id-label',
  xmlTagName: null,
  isVoid: true,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: [],
  matches: (element: Element) => 'type' in element && element.type === 'choice-id-label',
};

export const choiceContentConfig: ElementConfig = {
  type: 'choice-content',
  xmlTagName: null,
  isVoid: false,
  isInline: false,
  needsSpacers: false,
  categories: [],
  forbidDescendants: ['interaction'],
  matches: (element: Element) => 'type' in element && element.type === 'choice-content',

  normalize: (editor, node, path) => wrapInlineContentInParagraphs(editor, node, path),
};
