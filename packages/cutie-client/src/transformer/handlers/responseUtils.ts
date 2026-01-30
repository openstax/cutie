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
export function getDefaultValue(
  doc: Document | null,
  responseIdentifier: string
): string | string[] | null {
  if (!doc) return null;

  const responseDeclaration = doc.querySelector(
    `qti-response-declaration[identifier="${responseIdentifier}"]`
  );
  if (!responseDeclaration) return null;

  const defaultValueElement = responseDeclaration.querySelector('qti-default-value');
  if (!defaultValueElement) return null;

  const valueElements = defaultValueElement.querySelectorAll('qti-value');
  if (valueElements.length === 0) return null;

  const values = Array.from(valueElements).map((el) => el.textContent ?? '');

  // Check cardinality to determine return type
  const cardinality = responseDeclaration.getAttribute('cardinality');
  if (cardinality === 'multiple' || cardinality === 'ordered') {
    return values;
  }

  // Single cardinality - return first value
  return values[0] ?? null;
}
