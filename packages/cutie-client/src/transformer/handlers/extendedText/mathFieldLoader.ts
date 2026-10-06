/**
 * Async loader for MathLive library
 *
 * Provides a singleton pattern for loading MathLive and its fonts on demand,
 * avoiding bundling the large library with the main bundle.
 */

import type { MathLiveFont } from './mathLiveFonts.js';

// Promise that resolves when MathLive is loaded
let mathLivePromise: Promise<typeof import('mathlive')> | null = null;

/**
 * Register the bundled KaTeX fonts with the document. MathLive skips fetching
 * fonts from its fontsDirectory when every family it needs is already present.
 *
 * The faces are added synchronously; the returned promise resolves once they
 * have finished loading.
 */
function registerFonts(fonts: readonly MathLiveFont[]): Promise<FontFace[]> {
  return Promise.all(fonts.map(({ family, style, weight, data }) => {
    const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
    const face = new FontFace(family, bytes, { style, weight });
    document.fonts.add(face);
    return face.load();
  }));
}

/**
 * Load MathLive library and its fonts asynchronously
 *
 * Returns a cached promise, ensuring the library is only loaded once
 */
export async function loadMathLive(): Promise<typeof import('mathlive')> {
  if (!mathLivePromise) {
    // The fonts must be registered before MathLive is imported: evaluating the
    // module upgrades any <math-span>/<math-div> already in the DOM, which
    // checks for the fonts immediately.
    mathLivePromise = import('./mathLiveFonts.js')
      .then(({ MATHLIVE_FONTS }) => Promise.all([registerFonts(MATHLIVE_FONTS), import('mathlive')]))
      .then(([, mathlive]) => {
        // The fonts are registered above, so never fetch them from a path relative to the library
        mathlive.MathfieldElement.fontsDirectory = null;
        // Sounds are not bundled; null disables them instead of fetching from a path relative to the library
        mathlive.MathfieldElement.soundsDirectory = null;
        return mathlive;
      });
  }
  return mathLivePromise;
}

/**
 * Check if MathLive is currently loaded
 */
export function isMathLiveLoaded(): boolean {
  return mathLivePromise !== null;
}

/**
 * Reset the loader (primarily for testing)
 */
export function resetMathLiveLoader(): void {
  mathLivePromise = null;
}
