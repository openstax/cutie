/**
 * Shuffles items while respecting fixed positions.
 * Items with fixed=true remain in their original positions,
 * while other items are shuffled into the remaining positions.
 */
export function shuffleWithFixed<T extends { fixed: boolean }>(items: T[]): T[] {
  if (items.length <= 1) return [...items];

  const fixedPositions = new Map<number, T>();
  const nonFixedItems: T[] = [];

  items.forEach((item, index) => {
    if (item.fixed) {
      fixedPositions.set(index, item);
    } else {
      nonFixedItems.push(item);
    }
  });

  // Fisher-Yates shuffle
  for (let i = nonFixedItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nonFixedItems[i], nonFixedItems[j]] = [nonFixedItems[j], nonFixedItems[i]];
  }

  const result: T[] = new Array(items.length);
  let nonFixedIndex = 0;

  for (let i = 0; i < items.length; i++) {
    if (fixedPositions.has(i)) {
      result[i] = fixedPositions.get(i)!;
    } else {
      result[i] = nonFixedItems[nonFixedIndex++];
    }
  }

  return result;
}
