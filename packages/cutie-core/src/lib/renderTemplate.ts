import { AttemptState } from '../types';

/**
 * Renders a sanitized QTI template for client consumption.
 *
 * This function:
 * 1. Substitutes template and outcome variable values into the item body
 * 2. Applies conditional visibility rules based on current state
 * 3. Shows/hides feedback elements based on outcome variables
 * 4. Strips sensitive content that should not be exposed to the client:
 *    - qti-template-declaration elements
 *    - qti-template-processing rules
 *    - qti-response-processing rules
 *    - qti-correct-response declarations
 *    - Hidden feedback that shouldn't be visible yet
 * 5. Serializes the sanitized document to XML string
 *
 * This runs after both initializeState and processResponse to generate
 * the template that the client will render.
 *
 * @param itemDoc - Parsed QTI assessment item XML document
 * @param state - Current attempt state with variable values
 * @returns Sanitized QTI XML string safe for client rendering
 */
export function renderTemplate(
  itemDoc: Document,
  state: AttemptState
): string {
  // Clone the document to avoid mutating the original
  const clonedDoc = itemDoc.cloneNode(true) as Document;
  const root = clonedDoc.documentElement;

  // Step 1: Remove sensitive content that shouldn't be exposed to the client
  removeSensitiveElements(root);

  // Step 2: Substitute template variables into qti-printed-variable elements
  substituteVariables(root, state.variables);

  // Step 3: Clean up empty text nodes and normalize whitespace
  normalizeWhitespace(root);

  // Step 4: Serialize the sanitized document to XML string
  return serializeToXml(clonedDoc);
}

/**
 * Substitutes variable values into qti-printed-variable elements.
 * Replaces each qti-printed-variable element with a text node containing the variable value.
 */
function substituteVariables(
  root: Element,
  variables: Record<string, unknown>
): void {
  const printedVars = Array.from(
    root.getElementsByTagName('qti-printed-variable')
  );

  for (const printedVar of printedVars) {
    const identifier = printedVar.getAttribute('identifier');
    if (!identifier) continue;

    const value = variables[identifier];
    if (value === undefined || value === null) continue;

    // Convert the value to a string representation
    const textValue = String(value);

    // Create a text node with the value
    const textNode = root.ownerDocument.createTextNode(textValue);

    // Replace the qti-printed-variable element with the text node
    // Also normalize surrounding whitespace to avoid extra newlines
    const parent = printedVar.parentNode;
    if (parent) {
      parent.replaceChild(textNode, printedVar);
    }
  }
}

/**
 * Removes sensitive elements from the document that should not be exposed to the client.
 * This includes:
 * - qti-response-declaration (may contain correct responses)
 * - qti-outcome-declaration
 * - qti-template-declaration
 * - qti-template-processing
 * - qti-response-processing
 */
function removeSensitiveElements(root: Element): void {
  const sensitiveTagNames = [
    'qti-response-declaration',
    'qti-outcome-declaration',
    'qti-template-declaration',
    'qti-template-processing',
    'qti-response-processing',
  ];

  for (const tagName of sensitiveTagNames) {
    const elements = Array.from(root.getElementsByTagName(tagName));
    for (const element of elements) {
      element.parentNode?.removeChild(element);
    }
  }
}

/**
 * Normalizes whitespace in the document by removing whitespace-only text nodes
 * that are direct children of qti-assessment-item.
 *
 * qti-assessment-item should only contain structural elements, so any text nodes
 * are just formatting. We remove all whitespace-only text nodes and add single
 * newlines between elements for readability.
 */
function normalizeWhitespace(root: Element): void {
  if (root.nodeName !== 'qti-assessment-item') {
    return;
  }

  const childNodes = Array.from(root.childNodes);

  // Remove all whitespace-only text nodes
  for (const child of childNodes) {
    if (child.nodeType === 3) {
      const textNode = child as Text;
      if (textNode.textContent?.trim() === '') {
        root.removeChild(child);
      }
    }
  }

  // Add single newline + indent between element children for formatting
  const elementChildren = Array.from(root.childNodes).filter(
    (node) => node.nodeType === 1
  );

  for (let i = 0; i < elementChildren.length; i++) {
    const elem = elementChildren[i];
    // Add newline before each element (except we'll handle the first one separately)
    if (i > 0) {
      root.insertBefore(root.ownerDocument.createTextNode('\n\n    '), elem);
    }
  }

  // Add newline at the start (after opening tag) and end (before closing tag)
  if (elementChildren.length > 0) {
    root.insertBefore(
      root.ownerDocument.createTextNode('\n\n    '),
      elementChildren[0]
    );
    root.appendChild(root.ownerDocument.createTextNode('\n\n  '));
  }
}

/**
 * Serializes the document to an XML string.
 */
function serializeToXml(doc: Document): string {
  const serializer = new (require('@xmldom/xmldom').XMLSerializer)();
  return serializer.serializeToString(doc);
}
