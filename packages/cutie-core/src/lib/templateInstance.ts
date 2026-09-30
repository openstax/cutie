import { AttemptState } from '../types';
import { createValueContainer } from '../utils/valueContainer';

/**
 * Makes the item document the attempt's clone of the item template: the
 * correct responses and default values template processing set replace the
 * declared ones (QTI 3 Implementation Guide §3.7.4: each clone "is identical
 * except for the value, qti-default-value, and qti-correct-response" of its
 * variables). Everything that reads a declaration then sees this attempt's
 * values. Mutates and returns the document.
 */
export function instantiateTemplate(itemDoc: Document, state: AttemptState): Document {
  for (const [identifier, value] of Object.entries(state.correctResponses ?? {})) {
    replaceValueContainer(itemDoc, ['qti-response-declaration'], identifier, 'qti-correct-response', value);
  }
  for (const [identifier, value] of Object.entries(state.defaultValues ?? {})) {
    replaceValueContainer(
      itemDoc,
      ['qti-response-declaration', 'qti-outcome-declaration'],
      identifier,
      'qti-default-value',
      value
    );
  }
  return itemDoc;
}

/**
 * Replaces a declaration's value container (qti-correct-response or
 * qti-default-value) with one holding the given value
 */
function replaceValueContainer(
  itemDoc: Document,
  declarationTags: string[],
  identifier: string,
  containerTag: string,
  value: unknown
): void {
  const declaration = declarationTags
    .flatMap((tag) => Array.from(itemDoc.getElementsByTagName(tag)))
    .find((element) => element.getAttribute('identifier') === identifier);
  if (!declaration) return;

  const existing = Array.from(declaration.childNodes).find(
    (node): node is Element => node.nodeType === 1 && (node as Element).tagName === containerTag
  );
  const replacement = createValueContainer(itemDoc, containerTag, value);

  if (existing) {
    declaration.replaceChild(replacement, existing);
  } else {
    // QTI orders qti-default-value before qti-correct-response
    const next = containerTag === 'qti-default-value' ? declaration.firstChild : null;
    declaration.insertBefore(replacement, next);
  }
}
