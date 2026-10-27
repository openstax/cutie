/**
 * Creates a value container (e.g. qti-default-value, qti-correct-response)
 * holding one qti-value per value: one for single cardinality, one per member
 * for multiple or ordered.
 */
export function createValueContainer(doc: Document, tagName: string, value: unknown): Element {
  const container = doc.createElement(tagName);
  const values = Array.isArray(value) ? value : [value];

  for (const val of values) {
    const valueElement = doc.createElement('qti-value');
    valueElement.textContent = String(val);
    container.appendChild(valueElement);
  }

  return container;
}
