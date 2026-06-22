/**
 * Parses the `qti-input-width-{N}` vocabulary class from an element's class attribute.
 * Returns the numeric width value, or null if no valid width class is found.
 *
 * QTI Vocab: https://www.imsglobal.org/spec/qti/v3p0/vocab
 */
export declare function parseInputWidth(element: Element): number | null;
