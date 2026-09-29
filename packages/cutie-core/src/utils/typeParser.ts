/**
 * Put a pair in canonical form. A pair is unordered ("A B" is the same pair as
 * "B A"), so its identifiers are sorted, letting every comparison treat equal
 * pairs as equal strings.
 */
export function normalizePair(text: string): string {
  return text.trim().split(/\s+/).sort().join(' ');
}

/**
 * Parse a value from string to the appropriate type for template variables.
 *
 * This version is used during template initialization and for qti-base-value,
 * where values should be parsed into their native types for processing. Point,
 * pair and directedPair values stay in their space-separated string form, the
 * same form responses use, so values from both sources compare equal.
 *
 * @param text - The string value to parse
 * @param baseType - The QTI base type
 * @returns The parsed value in its native type
 */
export function parseValue(text: string, baseType: string): unknown {
  const trimmed = text.trim();

  switch (baseType) {
    case 'boolean':
      return trimmed === 'true';
    case 'integer':
      return parseInt(trimmed, 10);
    case 'float':
      return parseFloat(trimmed);
    case 'string':
      return trimmed;
    case 'point':
    case 'directedPair':
      // Kept in their space-separated string form, the same form responses use
      return trimmed;
    case 'pair':
      return normalizePair(trimmed);
    case 'duration':
      return parseFloat(trimmed);
    case 'file':
    case 'uri':
      return trimmed;
    default:
      return trimmed;
  }
}

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
export function parseResponseValue(text: string, baseType: string): unknown {
  const trimmed = text.trim();

  switch (baseType) {
    case 'boolean':
      return trimmed === 'true';
    case 'integer':
      return parseInt(trimmed, 10);
    case 'float':
      return parseFloat(trimmed);
    case 'string':
      return trimmed;
    case 'point':
      return trimmed; // Keep as string for processing
    case 'identifier':
      return trimmed;
    case 'directedPair':
      return trimmed; // Keep as string for processing
    case 'pair':
      return normalizePair(trimmed);
    case 'duration':
      return parseFloat(trimmed);
    case 'file':
    case 'uri':
      return trimmed;
    default:
      return trimmed;
  }
}
