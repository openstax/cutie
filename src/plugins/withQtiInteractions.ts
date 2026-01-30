import { Element } from 'slate';
import { choiceInteractionConfig } from '../interactions/choice/config';
import { extendedTextInteractionConfig } from '../interactions/extendedText/config';
import { textEntryInteractionConfig } from '../interactions/textEntry/config';
import type { CustomEditor } from '../types';

const interactionConfigs = [
  choiceInteractionConfig,
  textEntryInteractionConfig,
  extendedTextInteractionConfig,
];

/**
 * Plugin to handle QTI interaction-specific behavior
 */
export function withQtiInteractions(editor: CustomEditor): CustomEditor {
  const { isVoid, isInline } = editor;

  // Mark certain interactions as void
  editor.isVoid = (element: Element) => {
    if ('type' in element) {
      const config = interactionConfigs.find(c => c.matches(element));
      if (config) return config.isVoid;

      const type = element.type as string;
      const voidTypes = ['image', 'line-break'];
      if (voidTypes.includes(type)) {
        return true;
      }

      // Check if unknown QTI element is marked as void
      if (type === 'qti-unknown' && 'isVoid' in element && element.isVoid) {
        return true;
      }
    }

    return isVoid(element);
  };

  // Mark text-entry as inline (but NOT choice-id-label - it should be block to avoid spacers)
  editor.isInline = (element: Element) => {
    if ('type' in element) {
      const config = interactionConfigs.find(c => c.matches(element));
      if (config) return config.isInline;

      const type = element.type as string;
      const inlineTypes = ['span', 'strong', 'em', 'line-break'];
      if (inlineTypes.includes(type)) {
        return true;
      }
    }

    return isInline(element);
  };

  return editor;
}
