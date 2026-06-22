/**
 * Async loader for Quill rich text editor
 *
 * Provides a singleton pattern for loading Quill on demand,
 * avoiding bundling the library with the main bundle.
 */
/**
 * Load Quill library asynchronously
 *
 * Returns a cached promise, ensuring the library is only loaded once
 */
export declare function loadQuill(): Promise<typeof import('quill')>;
/**
 * Check if Quill is currently loaded
 */
export declare function isQuillLoaded(): boolean;
/**
 * Reset the loader (primarily for testing)
 */
export declare function resetQuillLoader(): void;
