/**
 * Create a visual error display for unsupported elements
 */
export function createUnsupportedElement(elementName: string): HTMLElement {
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
  const title = document.createElement('strong');
  title.textContent = 'Unsupported Element';
  title.style.display = 'block';
  title.style.marginBottom = '4px';
  title.style.color = '#856404';

  // Create message
  const message = document.createElement('div');
  message.textContent = `The element '${elementName}' is not yet implemented.`;
  message.style.color = '#856404';
  message.style.fontSize = '14px';

  container.appendChild(title);
  container.appendChild(message);

  return container;
}
