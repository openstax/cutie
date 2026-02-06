import { describe, expect, test } from 'vitest';
import { generateShuffleOrder, ShuffleItem } from './shuffle';

describe('generateShuffleOrder', () => {
  test('returns all identifiers when no items are fixed', () => {
    const items: ShuffleItem[] = [
      { identifier: 'A', fixed: false },
      { identifier: 'B', fixed: false },
      { identifier: 'C', fixed: false },
    ];

    const result = generateShuffleOrder(items);

    // Should contain all identifiers
    expect(result).toHaveLength(3);
    expect(result).toContain('A');
    expect(result).toContain('B');
    expect(result).toContain('C');
  });

  test('keeps fixed items in their original positions', () => {
    const items: ShuffleItem[] = [
      { identifier: 'A', fixed: true },
      { identifier: 'B', fixed: false },
      { identifier: 'C', fixed: true },
      { identifier: 'D', fixed: false },
    ];

    // Run multiple times to ensure fixed positions are always maintained
    for (let i = 0; i < 10; i++) {
      const result = generateShuffleOrder(items);

      expect(result).toHaveLength(4);
      expect(result[0]).toBe('A'); // Fixed at position 0
      expect(result[2]).toBe('C'); // Fixed at position 2

      // Non-fixed items should be somewhere in positions 1 and 3
      expect(['B', 'D']).toContain(result[1]);
      expect(['B', 'D']).toContain(result[3]);
    }
  });

  test('handles empty array', () => {
    const items: ShuffleItem[] = [];

    const result = generateShuffleOrder(items);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  test('handles all-fixed array (no shuffling)', () => {
    const items: ShuffleItem[] = [
      { identifier: 'A', fixed: true },
      { identifier: 'B', fixed: true },
      { identifier: 'C', fixed: true },
    ];

    const result = generateShuffleOrder(items);

    expect(result).toEqual(['A', 'B', 'C']);
  });

  test('handles single item', () => {
    const items: ShuffleItem[] = [{ identifier: 'A', fixed: false }];

    const result = generateShuffleOrder(items);

    expect(result).toEqual(['A']);
  });

  test('handles single fixed item', () => {
    const items: ShuffleItem[] = [{ identifier: 'A', fixed: true }];

    const result = generateShuffleOrder(items);

    expect(result).toEqual(['A']);
  });

  test('shuffles non-fixed items (statistical test)', () => {
    const items: ShuffleItem[] = [
      { identifier: 'A', fixed: false },
      { identifier: 'B', fixed: false },
      { identifier: 'C', fixed: false },
      { identifier: 'D', fixed: false },
    ];

    // Run many times and count how often position 0 has 'A'
    let aAtPosition0 = 0;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const result = generateShuffleOrder(items);
      if (result[0] === 'A') {
        aAtPosition0++;
      }
    }

    // If truly random, A should be at position 0 roughly 25% of the time
    // With 100 iterations, we expect ~25, but allow for variance
    // If no shuffling occurred, it would be 100
    expect(aAtPosition0).toBeLessThan(50);
  });

  test('returns correct identifiers for mixed fixed/non-fixed items', () => {
    const items: ShuffleItem[] = [
      { identifier: 'first', fixed: true },
      { identifier: 'second', fixed: false },
      { identifier: 'third', fixed: false },
      { identifier: 'fourth', fixed: true },
      { identifier: 'fifth', fixed: false },
    ];

    const result = generateShuffleOrder(items);

    expect(result).toHaveLength(5);
    expect(result[0]).toBe('first'); // Fixed at position 0
    expect(result[3]).toBe('fourth'); // Fixed at position 3

    // All identifiers should be present
    expect(result).toContain('first');
    expect(result).toContain('second');
    expect(result).toContain('third');
    expect(result).toContain('fourth');
    expect(result).toContain('fifth');

    // Non-fixed items should be in positions 1, 2, 4
    expect(['second', 'third', 'fifth']).toContain(result[1]);
    expect(['second', 'third', 'fifth']).toContain(result[2]);
    expect(['second', 'third', 'fifth']).toContain(result[4]);
  });
});
