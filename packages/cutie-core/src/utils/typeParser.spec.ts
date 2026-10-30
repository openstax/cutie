import { describe, expect, it } from 'vitest';
import { parseNumber } from './typeParser.js';

describe('parseNumber', () => {
  it.each([
    ['2', 2],
    [' 2.5 ', 2.5],
    ['+1', 1],
    ['-.5', -0.5],
    ['5.', 5],
    ['1E3', 1000],
  ])('parses the decimal number %j', (text, expected) => {
    expect(parseNumber(text)).toBe(expected);
  });

  it.each(['', '  ', '-', '1e', '0x10', '0b11', '1abc', 'Infinity', 'INF', 'NaN', '1e999'])(
    'rejects %j',
    (text) => {
      expect(parseNumber(text)).toBeNull();
    }
  );
});
