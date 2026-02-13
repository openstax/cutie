/**
 * Parses the `qti-input-width-{N}` vocabulary class from an element's class attribute.
 * Returns the numeric width value, or null if no valid width class is found.
 *
 * QTI Vocab: https://www.imsglobal.org/spec/qti/v3p0/vocab
 */
export function parseInputWidth(element: Element): number | null {
  const match = element.getAttribute('class')?.match(/\bqti-input-width-(\d+)\b/);
  if (!match) return null;
  const width = parseInt(match[1], 10);
  return isNaN(width) || width <= 0 ? null : width;
}
