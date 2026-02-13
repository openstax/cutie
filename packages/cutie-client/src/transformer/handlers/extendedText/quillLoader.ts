/**
 * Async loader for Quill rich text editor
 *
 * Provides a singleton pattern for loading Quill on demand,
 * avoiding bundling the library with the main bundle.
 */

// Promise that resolves when Quill is loaded
let quillPromise: Promise<typeof import('quill')> | null = null;

/**
 * Load Quill library asynchronously
 *
 * Returns a cached promise, ensuring the library is only loaded once
 */
export async function loadQuill(): Promise<typeof import('quill')> {
  if (!quillPromise) {
    quillPromise = import('quill');
  }
  return quillPromise;
}

/**
 * Check if Quill is currently loaded
 */
export function isQuillLoaded(): boolean {
  return quillPromise !== null;
}

/**
 * Reset the loader (primarily for testing)
 */
export function resetQuillLoader(): void {
  quillPromise = null;
}
