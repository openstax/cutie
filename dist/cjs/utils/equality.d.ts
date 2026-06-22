/**
 * Deep equality check for comparing values
 */
export declare function deepEqual(a: unknown, b: unknown): boolean;
/**
 * Deep equality check for unordered containers (multiple cardinality)
 * Treats arrays as sets where order doesn't matter
 */
export declare function deepEqualUnordered(a: unknown, b: unknown): boolean;
