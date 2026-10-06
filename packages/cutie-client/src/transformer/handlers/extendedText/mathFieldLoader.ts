/**
 * Async loader for MathLive library
 *
 * Provides a singleton pattern for loading MathLive and its fonts on demand,
 * avoiding bundling the large library with the main bundle.
 */

import type { MathLiveFont } from './mathLiveFonts';

// Promise that resolves when MathLive is loaded
let mathLivePromise: Promise<typeof import('mathlive')> | null = null;

/**
 * Register the bundled KaTeX fonts with the document. MathLive skips fetching
 * fonts from its fontsDirectory when every family it needs is already present.
 */
async function registerFonts(fonts: readonly MathLiveFont[]): Promise<void> {
  await Promise.all(fonts.map(({ family, style, weight, data }) => {
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
    mathLivePromise = Promise.all([import('mathlive'), import('./mathLiveFonts')])
      .then(async ([mathlive, { MATHLIVE_FONTS }]) => {
        await registerFonts(MATHLIVE_FONTS);
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
