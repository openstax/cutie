// spell-checker: ignore parsererror
/**
 * Checks if a sanitized QTI template is effectively empty.
 * Returns true if:
 * - The template is falsy or contains only whitespace
 * - The template has parse errors
 * - The qti-item-body element is missing
 * - The qti-item-body contains no meaningful content (no text, no child elements)
 */
export function isEffectivelyEmptyTemplate(template: string): boolean {
  if (!template || !template.trim()) return true;

  const parser = new DOMParser();
  const doc = parser.parseFromString(template, 'application/xml');

  // Check for parse errors
  if (doc.querySelector('parsererror')) return true;

  // Find item body
  const itemBody = doc.querySelector('qti-item-body');
  if (!itemBody) return true;

  // Check if item body has meaningful content
  // (text content that isn't just whitespace, or non-empty child elements)
  const textContent = itemBody.textContent?.trim() || '';
  const hasElements = itemBody.children.length > 0;

  return textContent === '' && !hasElements;
}
