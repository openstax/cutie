/**
 * Render transformed content into a DOM container
 */
export function renderToContainer(
  container: HTMLElement,
  content: DocumentFragment
): () => void {
  // Clear existing content
  container.innerHTML = '';

  // Add base CSS class
  container.classList.add('qti-item-container');

  // Append transformed content
  container.appendChild(content);

  // Return cleanup function
  return () => {
    container.innerHTML = '';
    container.classList.remove('qti-item-container');
  };
}
