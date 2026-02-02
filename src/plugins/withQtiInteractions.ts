import { Element, Path } from 'slate';
import { choiceInteractionConfig } from '../interactions/choice/config';
import { extendedTextInteractionConfig } from '../interactions/extendedText/config';
import { textEntryInteractionConfig } from '../interactions/textEntry/config';
import type { CustomEditor, ElementConfig } from '../types';

const interactionConfigs: ElementConfig[] = [
  choiceInteractionConfig,
  textEntryInteractionConfig,
  extendedTextInteractionConfig,
];

/**
 * Check if an element needs spacer paragraphs around it for cursor positioning.
 * Block-level interactions that don't allow inline text editing need spacers.
 */
export function elementNeedsSpacers(element: Element): boolean {
  if (!('type' in element)) return false;
  const config = interactionConfigs.find(c => c.matches(element));
  return config?.needsSpacers ?? false;
}

/**
 * Get the categories for an element (e.g., ['interaction'])
 */
export function getElementCategories(element: Element): string[] {
  if (!('type' in element)) return [];
  const config = interactionConfigs.find(c => c.matches(element));
  return config?.categories ?? [];
}

/**
 * Get the forbidden descendant categories for an element
 */
export function getElementForbiddenDescendants(element: Element): string[] {
  if (!('type' in element)) return [];
  const config = interactionConfigs.find(c => c.matches(element));
  return config?.forbidDescendants ?? [];
}

/**
 * Run the element-specific normalize hook if one exists.
 * Returns true if normalization was performed (caller should return early).
 * Returns false if no normalization was needed.
 */
export function normalizeElement(editor: CustomEditor, element: Element, path: Path): boolean {
  if (!('type' in element)) return false;
  const config = interactionConfigs.find(c => c.matches(element));
  if (config?.normalize) {
    return config.normalize(editor, element, path);
  }
  return false;
}

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
      const voidTypes = ['image', 'line-break', 'document-metadata', 'horizontal-rule'];
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
