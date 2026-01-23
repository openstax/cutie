/**
 * Create a generic error display element
 *
 * @param title - The error title text
 * @param message - The detailed error message
 * @returns HTMLElement configured with error styling
 */
export function createErrorElement(title: string, message: string): HTMLElement {
  const container = document.createElement('div');

  // Apply inline styles for consistent appearance
  Object.assign(container.style, {
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '4px',
    padding: '12px 16px',
    margin: '8px 0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  });

  // Create title
  const titleEl = document.createElement('strong');
  titleEl.textContent = title;
  titleEl.style.display = 'block';
  titleEl.style.marginBottom = '4px';
  titleEl.style.color = '#856404';

  // Create message
  const messageEl = document.createElement('div');
  messageEl.textContent = message;
  messageEl.style.color = '#856404';
  messageEl.style.fontSize = '14px';

  container.appendChild(titleEl);
  container.appendChild(messageEl);

  return container;
}

/**
 * Create a visual error display for unsupported elements
 */
export function createUnsupportedElement(elementName: string): HTMLElement {
  return createErrorElement(
    'Unsupported Element',
    `The element '${elementName}' is not yet implemented.`
  );
}

/**
 * Create an error display for a missing required attribute
 *
 * @param elementName - The QTI element name (e.g., 'qti-choice-interaction')
 * @param attributeName - The missing attribute name (e.g., 'response-identifier')
 * @returns HTMLElement configured with error styling
 */
export function createMissingAttributeError(
  elementName: string,
  attributeName: string
): HTMLElement {
  return createErrorElement(
    'Configuration Error',
    `${elementName} is missing required attribute: ${attributeName}`
  );
}

/**
 * Create an error display for an invalid attribute value
 *
 * @param elementName - The QTI element name
 * @param attributeName - The attribute name
 * @param value - The invalid value
 * @param reason - Optional explanation of why the value is invalid
 * @returns HTMLElement configured with error styling
 */
export function createInvalidAttributeError(
  elementName: string,
  attributeName: string,
  value: string,
  reason?: string
): HTMLElement {
  const message = reason
    ? `${elementName} has invalid ${attributeName} value: ${value}. ${reason}`
    : `${elementName} has invalid ${attributeName} value: ${value}`;

  return createErrorElement('Configuration Error', message);
}
