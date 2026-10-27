/**
 * Utility functions for working with QTI response declarations
 */

/** Value containers a response declaration can hold, each wrapping qti-value children */
type DeclarationValueContainer = 'qti-default-value' | 'qti-correct-response';

/**
 * Reads the values held by one value container (qti-default-value or
 * qti-correct-response) of a response declaration.
 *
 * @param doc - The document containing the response declaration
 * @param responseIdentifier - The identifier of the response declaration
 * @param containerTag - Which value container to read
 * @returns Single value string, array of strings for multiple/ordered cardinality,
 *   or null if the declaration or container is absent or holds no values
 */
function getDeclarationValue(
  doc: Document | null,
  responseIdentifier: string,
  containerTag: DeclarationValueContainer
): string | string[] | null {
  if (!doc) return null;

  const responseDeclaration = doc.querySelector(
    `qti-response-declaration[identifier="${responseIdentifier}"]`
  );
  if (!responseDeclaration) return null;

  const valueContainer = responseDeclaration.querySelector(containerTag);
  if (!valueContainer) return null;

  const valueElements = valueContainer.querySelectorAll('qti-value');
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
  return getDeclarationValue(doc, responseIdentifier, 'qti-default-value');
}

/**
 * Extracts the correct response from a response declaration.
 * cutie-core only includes qti-correct-response in the template once an
 * attempt is finished and the delivery options allow showing it.
 *
 * @param doc - The document containing the response declaration
 * @param responseIdentifier - The identifier of the response declaration
 * @returns Single value string, array of strings for multiple cardinality, or null if absent
 */
export function getCorrectResponse(
  doc: Document | null,
  responseIdentifier: string
): string | string[] | null {
  return getDeclarationValue(doc, responseIdentifier, 'qti-correct-response');
}

/**
 * Normalizes a declaration value to an array of values (empty when null).
 */
export function toValueList(value: string | string[] | null): string[] {
  if (value === null) return [];
  return Array.isArray(value) ? value : [value];
}
