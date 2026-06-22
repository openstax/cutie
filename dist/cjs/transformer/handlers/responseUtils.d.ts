/**
 * Utility functions for working with QTI response declarations
 */
/**
 * Extracts default value(s) from a response declaration.
 * Looks for qti-default-value > qti-value elements and returns the values.
 *
 * @param doc - The document containing the response declaration
 * @param responseIdentifier - The identifier of the response declaration
 * @returns Single value string, array of strings for multiple cardinality, or null if no default
 */
export declare function getDefaultValue(doc: Document | null, responseIdentifier: string): string | string[] | null;
