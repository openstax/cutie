/**
 * Generate a unique response identifier
 *
 * @param existingIds - Set of IDs already in use
 * @param prefix - Prefix for the ID (default: "RESPONSE")
 * @returns A unique response identifier
 */
export function generateResponseId(existingIds: Set<string>, prefix = 'RESPONSE'): string {
  let counter = 1;
  let candidate = `${prefix}_${counter}`;

  // Keep incrementing until we find an unused ID
  while (existingIds.has(candidate)) {
    counter++;
    candidate = `${prefix}_${counter}`;
  }

  return candidate;
}

/**
 * Extract all response identifiers from HTML content
 *
 * @param html - HTML content
 * @returns Set of response identifiers found
 */
export function extractResponseIds(html: string): Set<string> {
  const ids = new Set<string>();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const interactions = doc.querySelectorAll('[response-identifier]');

  interactions.forEach((el) => {
    const id = el.getAttribute('response-identifier');
    if (id) {
      ids.add(id);
    }
  });

  return ids;
}

/**
 * Validate that all response identifiers are unique
 *
 * @param html - HTML content
 * @returns Object with validation result and any duplicate IDs found
 */
export function validateUniqueIds(html: string): {
  valid: boolean;
  duplicates: string[];
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const interactions = doc.querySelectorAll('[response-identifier]');
  const seenIds = new Map<string, number>();
  const duplicates: string[] = [];

  interactions.forEach((el) => {
    const id = el.getAttribute('response-identifier');
    if (id) {
      const count = seenIds.get(id) || 0;
      seenIds.set(id, count + 1);

      if (count === 1 && !duplicates.includes(id)) {
        duplicates.push(id);
      }
    }
  });

  return {
    valid: duplicates.length === 0,
    duplicates,
  };
}
