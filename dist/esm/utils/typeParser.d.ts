/**
 * Parse a value from string to the appropriate type for template variables.
 *
 * This version is used during template initialization where values should be
 * parsed into their native types for processing.
 *
 * @param text - The string value to parse
 * @param baseType - The QTI base type
 * @returns The parsed value in its native type
 */
export declare function parseValue(text: string, baseType: string): unknown;
/**
 * Parse a value from string to the appropriate type for response variables.
 *
 * This version is used during response processing where certain types
 * (like point, pair, directedPair, identifier) are kept as strings for
 * flexible processing by downstream functions.
 *
 * @param text - The string value to parse
 * @param baseType - The QTI base type
 * @returns The parsed value (some types remain as strings)
 */
export declare function parseResponseValue(text: string, baseType: string): unknown;
