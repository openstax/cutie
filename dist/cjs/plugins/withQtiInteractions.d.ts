import { Editor, Element, Path } from 'slate';
import type { CustomEditor, ElementConfig, FeedbackIdentifierSource } from '../types';
export declare const elementConfigs: ElementConfig[];
/**
 * Check if an element needs spacer paragraphs around it for cursor positioning.
 * Block-level interactions that don't allow inline text editing need spacers.
 */
export declare function elementNeedsSpacers(element: Element): boolean;
/**
 * Get the categories for an element (e.g., ['interaction'])
 */
export declare function getElementCategories(element: Element): string[];
/**
 * Get the forbidden descendant categories for an element
 */
export declare function getElementForbiddenDescendants(element: Element): string[];
/**
 * Run the element-specific normalize hook if one exists.
 * Returns true if normalization was performed (caller should return early).
 * Returns false if no normalization was needed.
 */
export declare function normalizeElement(editor: CustomEditor, element: Element, path: Path): boolean;
/**
 * Get feedback identifiers for an element if it provides them.
 */
export declare function getElementFeedbackIdentifiers(element: Element): FeedbackIdentifierSource | null;
/**
 * Check if an element is inline based on its config or known inline types.
 * This is the source of truth for inline detection - use this instead of
 * hardcoding inline type lists elsewhere.
 */
export declare function isElementInline(element: Element): boolean;
/**
 * Collect all existing response identifiers from the editor.
 * Uses the element config registry to find all interactions.
 */
export declare function collectExistingResponseIds(editor: Editor): Set<string>;
/**
 * Plugin to handle QTI interaction-specific behavior
 */
export declare function withQtiInteractions(editor: CustomEditor): CustomEditor;
