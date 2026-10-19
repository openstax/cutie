import { AttemptState } from '../types.js';
import { createValueContainer } from '../utils/valueContainer.js';

/**
 * Makes the item document the attempt's clone of the item template, as far as
 * its correct responses go: those template processing set replace the declared
 * ones (QTI 3 Implementation Guide §3.7.4: each clone "is identical except for
 * the value, qti-default-value, and qti-correct-response" of its variables).
 * Everything that reads a correct response then sees this attempt's.
 * Mutates and returns the document.
 *
 * Defaults template processing set are applied to the variables directly
 * (initially, and by resetOutcomeVariables on a fresh try), keeping their types.
 */
export function instantiateTemplate(itemDoc: Document, state: AttemptState): Document {
  for (const [identifier, value] of Object.entries(state.correctResponses ?? {})) {
    replaceCorrectResponse(itemDoc, identifier, value);
  }
  return itemDoc;
}

/**
 * Replaces a response declaration's qti-correct-response with one holding the
 * given value. A NULL value (null, or an empty container) means there is no
 * correct response, so the declaration is left without one.
 */
function replaceCorrectResponse(itemDoc: Document, identifier: string, value: unknown): void {
  const declaration = Array.from(itemDoc.getElementsByTagName('qti-response-declaration')).find(
    (element) => element.getAttribute('identifier') === identifier
  );
  if (!declaration) return;

  const existing = Array.from(declaration.childNodes).find(
    (node): node is Element => node.nodeType === 1 && (node as Element).tagName === 'qti-correct-response'
  );
  if (existing) declaration.removeChild(existing);

  const isNull = value === null || value === undefined || (Array.isArray(value) && value.length === 0);
  if (!isNull) {
    // QTI orders qti-correct-response before any qti-mapping or qti-area-mapping
    const mapping = Array.from(declaration.childNodes).find(
      (node) => node.nodeType === 1 && ['qti-mapping', 'qti-area-mapping'].includes((node as Element).tagName)
    );
    declaration.insertBefore(createValueContainer(itemDoc, 'qti-correct-response', value), mapping ?? null);
  }
}
