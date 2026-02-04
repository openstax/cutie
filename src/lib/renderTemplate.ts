/* spell-checker: ignore inlines */
import { XMLSerializer } from '@xmldom/xmldom';
import { AttemptState, ProcessingOptions } from '../types';

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
 *    - qti-correct-response, qti-mapping from response declarations
 *    - Response declarations not used in the filtered body
 *    - Hidden feedback that shouldn't be visible yet
 * 5. Injects current response values as qti-default-value elements
 * 6. Optionally resolves asset URLs via provided callback
 * 7. Serializes the sanitized document to XML string
 *
 * This runs after both initializeState and processResponse to generate
 * the template that the client will render.
 *
 * @param itemDoc - Parsed QTI assessment item XML document
 * @param state - Current attempt state with variable values
 * @param options - Optional processing options (e.g., asset resolver)
 * @returns Promise resolving to sanitized QTI XML string safe for client rendering
 */
export async function renderTemplate(
  itemDoc: Document,
  state: AttemptState,
  options?: ProcessingOptions
): Promise<string> {
  // Clone the document to avoid mutating the original
  const clonedDoc = itemDoc.cloneNode(true) as Document;
  const root = clonedDoc.documentElement;

  // Step 1: Remove sensitive content that shouldn't be exposed to the client
  removeSensitiveElements(root);

  // Step 2: Substitute template variables into qti-printed-variable elements
  substituteVariables(root, state.variables);

  // Step 3: Process conditional template blocks and inlines
  processTemplateConditionals(root, state.variables);

  // Step 4: Process feedback visibility based on outcome variables
  processFeedbackVisibility(root, state.variables);

  // Step 5: Substitute math variables in MathML expressions
  substituteMathVariables(root, state.variables);

  // Step 6: Sanitize response declarations (after body is filtered)
  sanitizeResponseDeclarations(root, state.variables);

  // Step 7: Clean up empty text nodes and normalize whitespace
  normalizeWhitespace(root);

  // Step 8: Resolve asset URLs if resolver is provided
  if (options?.resolveAssets) {
    await resolveAssetUrls(root, options.resolveAssets);
  }

  // Step 9: Serialize the sanitized document to XML string
  return serializeToXml(clonedDoc);
}

/**
 * Substitutes variable values into qti-printed-variable elements.
 * Replaces each qti-printed-variable element with a text node containing the variable value.
 * If the variable is missing or null/undefined, replaces with an empty text node.
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

    // Convert the value to a string representation (empty string if missing)
    const textValue = value === undefined || value === null ? '' : String(value);

    // Create a text node with the value
    const textNode = root.ownerDocument.createTextNode(textValue);

    // Replace the qti-printed-variable element with the text node
    const parent = printedVar.parentNode;
    if (parent) {
      parent.replaceChild(textNode, printedVar);
    }
  }
}

/**
 * Removes sensitive elements from the document that should not be exposed to the client.
 * This includes:
 * - qti-outcome-declaration
 * - qti-template-declaration
 * - qti-template-processing
 * - qti-response-processing
 *
 * Note: qti-response-declaration elements are kept but sanitized separately.
 */
function removeSensitiveElements(root: Element): void {
  const sensitiveTagNames = [
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
 * Processes qti-template-block and qti-template-inline elements for conditional visibility.
 *
 * These elements have a template-identifier attribute that should match values in template variables.
 * - If show-hide="show": element is visible only when template-identifier matches a variable value
 * - If show-hide="hide": element is hidden when template-identifier matches a variable value
 *
 * The matching is done by finding a variable (any variable) that contains the template-identifier.
 * Variables can be single values or arrays (multiple cardinality).
 */
function processTemplateConditionals(
  root: Element,
  variables: Record<string, unknown>
): void {
  // Process both template-block and template-inline elements
  const templateElements = [
    ...Array.from(root.getElementsByTagName('qti-template-block')),
    ...Array.from(root.getElementsByTagName('qti-template-inline')),
  ];

  for (const element of templateElements) {
    const templateIdentifier = element.getAttribute('template-identifier');
    const showHide = element.getAttribute('show-hide');

    if (!templateIdentifier) continue;

    // Check if any variable contains this template identifier
    const isMatch = checkVariableContains(variables, templateIdentifier);

    // Determine if element should be removed
    let shouldRemove = false;
    if (showHide === 'show') {
      // Remove if it doesn't match
      shouldRemove = !isMatch;
    } else if (showHide === 'hide') {
      // Remove if it does match
      shouldRemove = isMatch;
    }

    if (shouldRemove) {
      element.parentNode?.removeChild(element);
    }
  }
}

/**
 * Processes qti-feedback-block and qti-feedback-inline elements for conditional visibility.
 *
 * These elements have an outcome-identifier and identifier attribute.
 * - outcome-identifier: references the outcome variable to check
 * - identifier: the value to look for in that outcome variable
 * - show-hide: "show" means visible when identifier is in outcome variable,
 *              "hide" means hidden when identifier is in outcome variable
 */
function processFeedbackVisibility(
  root: Element,
  variables: Record<string, unknown>
): void {
  // Process feedback-block, feedback-inline, and modal-feedback elements
  const feedbackElements = [
    ...Array.from(root.getElementsByTagName('qti-feedback-block')),
    ...Array.from(root.getElementsByTagName('qti-feedback-inline')),
    ...Array.from(root.getElementsByTagName('qti-modal-feedback')),
  ];

  for (const element of feedbackElements) {
    const outcomeIdentifier = element.getAttribute('outcome-identifier');
    const identifier = element.getAttribute('identifier');
    const showHide = element.getAttribute('show-hide');

    if (!outcomeIdentifier || !identifier) continue;

    // Get the outcome variable value
    const outcomeValue = variables[outcomeIdentifier];

    // Check if the identifier is in the outcome variable
    const isMatch = valueContains(outcomeValue, identifier);

    // Determine if element should be removed
    let shouldRemove = false;
    if (showHide === 'show') {
      // Remove if it doesn't match
      shouldRemove = !isMatch;
    } else if (showHide === 'hide') {
      // Remove if it does match
      shouldRemove = isMatch;
    }

    if (shouldRemove) {
      element.parentNode?.removeChild(element);
    }
  }
}

/**
 * Substitutes template variables into MathML expressions.
 * Looks for <m:mi> and <m:mn> elements whose text content matches a variable identifier,
 * and replaces the content with the variable's value.
 */
function substituteMathVariables(
  root: Element,
  variables: Record<string, unknown>
): void {
  // Get all MathML identifier (mi) and number (mn) elements
  // MathML uses the namespace http://www.w3.org/1998/Math/MathML
  const mathElements = [
    ...Array.from(root.getElementsByTagName('m:mi')),
    ...Array.from(root.getElementsByTagName('m:mn')),
  ];

  for (const mathElement of mathElements) {
    const textContent = mathElement.textContent?.trim();
    if (!textContent) continue;

    // Check if this text content matches a variable identifier
    const value = variables[textContent];
    if (value === undefined || value === null) continue;

    // Replace the text content with the variable value
    mathElement.textContent = String(value);
  }
}

/**
 * Checks if any variable in the variables object contains the given identifier.
 * Handles both single values and arrays (multiple cardinality).
 */
function checkVariableContains(
  variables: Record<string, unknown>,
  identifier: string
): boolean {
  for (const value of Object.values(variables)) {
    if (valueContains(value, identifier)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a value contains the given identifier.
 * Handles both single values and arrays.
 */
function valueContains(value: unknown, identifier: string): boolean {
  if (Array.isArray(value)) {
    return value.includes(identifier);
  }
  return value === identifier;
}

/**
 * Sanitizes qti-response-declaration elements:
 * 1. Collects response-identifier attributes from interaction elements in the body
 * 2. Removes declarations for identifiers not used in the filtered body
 * 3. Strips sensitive children (qti-correct-response, qti-mapping, qti-area-mapping)
 * 4. Injects qti-default-value with current response values from state
 */
function sanitizeResponseDeclarations(
  root: Element,
  variables: Record<string, unknown>
): void {
  // Step 1: Find all response identifiers used in the item body
  const itemBody = root.getElementsByTagName('qti-item-body')[0];
  const usedIdentifiers = new Set<string>();

  if (itemBody) {
    // Get all elements in the body that might have response-identifier
    const allElements = itemBody.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      const responseId = element?.getAttribute('response-identifier');
      if (responseId) {
        usedIdentifiers.add(responseId);
      }
    }
  }

  // Step 2: Process all qti-response-declaration elements
  const declarations = Array.from(
    root.getElementsByTagName('qti-response-declaration')
  );

  for (const declaration of declarations) {
    const identifier = declaration.getAttribute('identifier');

    // Remove declarations not used in the body
    if (!identifier || !usedIdentifiers.has(identifier)) {
      declaration.parentNode?.removeChild(declaration);
      continue;
    }

    // Step 3: Remove sensitive child elements
    const sensitiveChildren = [
      'qti-correct-response',
      'qti-mapping',
      'qti-area-mapping',
    ];

    for (const tagName of sensitiveChildren) {
      const elements = Array.from(declaration.getElementsByTagName(tagName));
      for (const element of elements) {
        element.parentNode?.removeChild(element);
      }
    }

    // Step 4: Inject default value if response exists in state
    const responseValue = variables[identifier];
    if (responseValue !== undefined && responseValue !== null) {
      // Remove any existing qti-default-value first
      const existingDefaults = Array.from(
        declaration.getElementsByTagName('qti-default-value')
      );
      for (const existing of existingDefaults) {
        existing.parentNode?.removeChild(existing);
      }

      // Create new qti-default-value element
      const defaultValue = declaration.ownerDocument.createElement(
        'qti-default-value'
      );

      // Handle different cardinalities
      if (Array.isArray(responseValue)) {
        // Multiple or ordered cardinality
        for (const val of responseValue) {
          const valueElement = declaration.ownerDocument.createElement(
            'qti-value'
          );
          valueElement.textContent = String(val);
          defaultValue.appendChild(valueElement);
        }
      } else {
        // Single cardinality
        const valueElement = declaration.ownerDocument.createElement(
          'qti-value'
        );
        valueElement.textContent = String(responseValue);
        defaultValue.appendChild(valueElement);
      }

      // Append to declaration
      declaration.appendChild(defaultValue);
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
 * Resolves asset URLs in the document using the provided resolver.
 *
 * Collects all unique URLs from `src` and `data` attributes,
 * calls the resolver with the batch, and replaces the attribute
 * values with the resolved URLs.
 */
async function resolveAssetUrls(
  root: Element,
  resolver: (urls: string[]) => Promise<string[]>
): Promise<void> {
  // Collect all elements with src or data attributes
  const allElements = root.getElementsByTagName('*');
  const elementsWithAssets: Array<{ element: Element; attr: string }> = [];
  const urlSet = new Set<string>();

  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    if (!element) continue;

    const src = element.getAttribute('src');
    const data = element.getAttribute('data');

    if (src) {
      elementsWithAssets.push({ element, attr: 'src' });
      urlSet.add(src);
    }
    if (data) {
      elementsWithAssets.push({ element, attr: 'data' });
      urlSet.add(data);
    }
  }

  // If no assets found, nothing to resolve
  if (urlSet.size === 0) {
    return;
  }

  // Create ordered array of unique URLs
  const uniqueUrls = Array.from(urlSet);

  // Call resolver with all unique URLs
  const resolvedUrls = await resolver(uniqueUrls);

  // Create mapping from original URL to resolved URL
  const urlMap = new Map<string, string>();
  for (let i = 0; i < uniqueUrls.length; i++) {
    urlMap.set(uniqueUrls[i], resolvedUrls[i]);
  }

  // Replace attribute values with resolved URLs
  for (const { element, attr } of elementsWithAssets) {
    const originalUrl = element.getAttribute(attr);
    if (originalUrl) {
      const resolvedUrl = urlMap.get(originalUrl);
      if (resolvedUrl !== undefined) {
        element.setAttribute(attr, resolvedUrl);
      }
    }
  }
}

/**
 * Serializes the document to an XML string.
 */
function serializeToXml(doc: Document): string {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}
