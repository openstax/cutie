/**
 * Inline Interaction Annotator
 *
 * Annotates inline interactions (textEntryInteraction, inlineChoiceInteraction)
 * with aria-labelledby referencing spans wrapped around surrounding visible text.
 * This provides accessible labels per WCAG 4.1.2 and 3.3.2.
 *
 * References:
 * - W3C ARIA9 technique: https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA9
 * - MDN Multipart Labels: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Multipart_labels
 * - Adrian Roselli labeling priority: https://adrianroselli.com/2020/01/my-priority-of-methods-for-labeling-a-control.html
 * - WCAG 4.1.2 Name, Role, Value: https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html
 * - WCAG 3.3.2 Labels or Instructions: https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html
 */
export declare const BLOCK_TAGS: Set<string>;
/** Default ID generator for production use */
export declare function defaultGenerateId(): string;
/**
 * Annotates all inline interactions in the fragment with aria-labelledby
 * referencing spans wrapped around surrounding text. Mutates fragment in place.
 * Returns true if annotations were made, false if no interactions found.
 */
export declare function annotateInlineInteractions(fragment: DocumentFragment, generateId?: () => string): boolean;
/** CSS for visually-hidden description spans */
export declare const SR_ONLY_STYLES = "\n  .cutie-sr-only {\n    position: absolute;\n    width: 1px;\n    height: 1px;\n    padding: 0;\n    margin: -1px;\n    overflow: hidden;\n    clip: rect(0, 0, 0, 0);\n    white-space: nowrap;\n    border: 0;\n  }\n";
