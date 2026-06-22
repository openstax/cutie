/**
 * Represents an item that can be shuffled.
 */
export interface ShuffleItem {
    identifier: string;
    fixed: boolean;
}
/**
 * Generates a shuffle order for items while respecting fixed positions.
 * Items with fixed=true remain in their original positions,
 * while other items are shuffled into the remaining positions.
 *
 * @param items - Array of items with identifier and fixed properties
 * @returns Array of identifiers in shuffled order
 */
export declare function generateShuffleOrder(items: ShuffleItem[]): string[];
