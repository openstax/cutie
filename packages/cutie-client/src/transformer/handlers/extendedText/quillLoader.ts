/**
 * Async loader for Quill rich text editor
 *
 * Provides a singleton pattern for loading Quill and its snow theme CSS on demand,
 * avoiding bundling either with the main bundle.
 */

export interface LoadedQuill {
  Quill: typeof import('quill').default;
  snowCss: string;
}

// Promise that resolves when Quill is loaded
let quillPromise: Promise<LoadedQuill> | null = null;

/**
 * Load Quill library and its snow theme CSS asynchronously
 *
 * Returns a cached promise, ensuring the library is only loaded once
 */
export async function loadQuill(): Promise<LoadedQuill> {
  if (!quillPromise) {
    quillPromise = Promise.all([import('quill'), import('./quillSnowCss.js')]).then(
      ([quillModule, cssModule]) => ({ Quill: quillModule.default, snowCss: cssModule.QUILL_SNOW_CSS }),
    );
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
