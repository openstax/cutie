import { useEffect } from 'react';

/**
 * React hook for registering CSS styles once per component type.
 * Inspired by cutie-client's StyleManager.
 *
 * This hook ensures styles are only added to the document once, even if
 * multiple instances of a component are mounted. The styles are automatically
 * cleaned up when the last instance unmounts.
 *
 * @param id - Unique identifier for this style block
 * @param css - CSS string to inject into the document
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useStyle('my-component', `
 *     .my-component {
 *       color: blue;
 *       padding: 16px;
 *     }
 *   `);
 *
 *   return <div className="my-component">Hello</div>;
 * }
 * ```
 */
export function useStyle(id: string, css: string): void {
  useEffect(() => {
    // Check if style already exists
    const existingStyle = document.querySelector(`style[data-style-id="${id}"]`);
    if (existingStyle) {
      return;
    }

    // Create and insert style element
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-style-id', id);
    styleElement.textContent = css;
    document.head.appendChild(styleElement);

    // Cleanup: Remove style element when component unmounts
    return () => {
      const el = document.querySelector(`style[data-style-id="${id}"]`);
      if (el) {
        el.remove();
      }
    };
  }, [id, css]);
}
