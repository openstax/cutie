import { Editor } from 'slate';
import { collectExistingResponseIds } from '../plugins/withQtiInteractions';

// Re-export for backwards compatibility - uses element registry to find interactions
export { collectExistingResponseIds };

/**
 * Generate a unique response identifier by scanning the editor
 *
 * First interaction gets "RESPONSE", subsequent get "RESPONSE_2", "RESPONSE_3", etc.
 * This ensures compatibility with QTI standard templates (match_correct, map_response)
 * which require the identifier to be exactly "RESPONSE"
 */
export function generateUniqueResponseId(editor: Editor): string {
  const existingIds = collectExistingResponseIds(editor);

  if (!existingIds.has('RESPONSE')) {
    return 'RESPONSE';
  }

  let counter = 2;
  let id = `RESPONSE_${counter}`;
  while (existingIds.has(id)) {
    counter++;
    id = `RESPONSE_${counter}`;
  }

  return id;
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
