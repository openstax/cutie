/**
 * Async loader for MathLive library
 *
 * Provides a singleton pattern for loading MathLive on demand,
 * avoiding bundling the large library with the main bundle.
 */
// Promise that resolves when MathLive is loaded
let mathLivePromise = null;
/**
 * Load MathLive library asynchronously
 *
 * Returns a cached promise, ensuring the library is only loaded once
 */
export async function loadMathLive() {
    if (!mathLivePromise) {
        mathLivePromise = import('mathlive');
    }
    return mathLivePromise;
}
/**
 * Check if MathLive is currently loaded
 */
export function isMathLiveLoaded() {
    return mathLivePromise !== null;
}
/**
 * Reset the loader (primarily for testing)
 */
export function resetMathLiveLoader() {
    mathLivePromise = null;
}
