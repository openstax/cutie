/**
 * Async loader for MathLive library
 *
 * Provides a singleton pattern for loading MathLive on demand,
 * avoiding bundling the large library with the main bundle.
 */
/**
 * Load MathLive library asynchronously
 *
 * Returns a cached promise, ensuring the library is only loaded once
 */
export declare function loadMathLive(): Promise<typeof import('mathlive')>;
/**
 * Check if MathLive is currently loaded
 */
export declare function isMathLiveLoaded(): boolean;
/**
 * Reset the loader (primarily for testing)
 */
export declare function resetMathLiveLoader(): void;
