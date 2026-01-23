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
    case 'point': {
      const pointParts = trimmed.split(/\s+/);
      return [parseInt(pointParts[0], 10), parseInt(pointParts[1], 10)];
    }
    case 'directedPair':
    case 'pair': {
      const pairParts = trimmed.split(/\s+/);
      return [pairParts[0], pairParts[1]];
    }
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
    case 'pair':
      return trimmed; // Keep as string for processing
    case 'duration':
      return parseFloat(trimmed);
    case 'file':
    case 'uri':
      return trimmed;
    default:
      return trimmed;
  }
}
