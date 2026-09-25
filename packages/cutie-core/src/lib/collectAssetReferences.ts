/**
 * A single asset reference found in a QTI document.
 */
export interface AssetReference {
  /** The element carrying the reference. */
  element: Element;
  /** The attribute holding the URL (`src` or `data`). */
  attr: string;
  /** The raw, unresolved attribute value. */
  url: string;
}

/**
 * Collects every asset reference beneath the given element.
 *
 * Walks all descendant elements and records `src` and `data` attributes.
 * One entry is produced per attribute, so an element carrying both yields
 * two entries and the same URL may appear more than once. Callers that
 * need unique URLs should dedupe via {@link uniqueAssetUrls}.
 *
 * This is a pure read of the document as-is: it applies no sanitization
 * and no variable substitution, so what it returns depends entirely on
 * the document it is handed.
 *
 * @param root - Element to search beneath (the root itself is not inspected)
 * @returns Asset references in document order
 */
export function collectAssetReferences(root: Element): AssetReference[] {
  const allElements = root.getElementsByTagName('*');
  const references: AssetReference[] = [];

  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    if (!element) continue;

    const src = element.getAttribute('src');
    const data = element.getAttribute('data');

    if (src) {
      references.push({ element, attr: 'src', url: src });
    }
    if (data) {
      references.push({ element, attr: 'data', url: data });
    }
  }

  return references;
}

/**
 * Reduces asset references to their unique URLs, in document order.
 */
export function uniqueAssetUrls(references: AssetReference[]): string[] {
  return Array.from(new Set(references.map((reference) => reference.url)));
}
