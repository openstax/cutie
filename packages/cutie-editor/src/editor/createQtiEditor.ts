import { createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { withReact } from 'slate-react';
import { withQtiInteractions, withUnknownElements, withXhtml } from '../plugins/index.js';
import type { CustomEditor } from '../types.js';

/**
 * Create a Slate editor with the full QTI plugin stack
 */
export function createQtiEditor(): CustomEditor {
  const baseEditor = withReact(withHistory(createEditor()));
  return withUnknownElements(withQtiInteractions(withXhtml(baseEditor)));
}
