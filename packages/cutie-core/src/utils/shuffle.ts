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
export function generateShuffleOrder(items: ShuffleItem[]): string[] {
  if (items.length <= 1) {
    return items.map((item) => item.identifier);
  }

  const fixedPositions = new Map<number, string>();
  const nonFixedIdentifiers: string[] = [];

  items.forEach((item, index) => {
    if (item.fixed) {
      fixedPositions.set(index, item.identifier);
    } else {
      nonFixedIdentifiers.push(item.identifier);
    }
  });

  // Fisher-Yates shuffle for non-fixed items
  for (let i = nonFixedIdentifiers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nonFixedIdentifiers[i], nonFixedIdentifiers[j]] = [
      nonFixedIdentifiers[j],
      nonFixedIdentifiers[i],
    ];
  }

  // Build result array with fixed items in place and shuffled items filling gaps
  const result: string[] = new Array(items.length);
  let nonFixedIndex = 0;

  for (let i = 0; i < items.length; i++) {
    if (fixedPositions.has(i)) {
      result[i] = fixedPositions.get(i)!;
    } else {
      result[i] = nonFixedIdentifiers[nonFixedIndex++];
    }
  }

  return result;
}
