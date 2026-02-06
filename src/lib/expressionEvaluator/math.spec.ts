import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
import { compareMathExpressions, getFormulaComparisonMode } from './math';

const parser = new DOMParser();

describe('compareMathExpressions', () => {
  describe('strict mode', () => {
    test('matches identical expressions', () => {
      expect(compareMathExpressions('5x', '5x', 'strict')).toBe(true);
      expect(compareMathExpressions('x^2', 'x^2', 'strict')).toBe(true);
      expect(compareMathExpressions('\\frac{1}{2}', '\\frac{1}{2}', 'strict')).toBe(true);
    });

    test('rejects different ordering (not commutative)', () => {
      // In strict mode with canonical: false, operand order matters
      expect(compareMathExpressions('5*3', '3*5', 'strict')).toBe(false);
      expect(compareMathExpressions('a+b', 'b+a', 'strict')).toBe(false);
    });

    test('rejects algebraically equivalent but structurally different', () => {
      // In strict mode, unsimplified expressions don't match
      expect(compareMathExpressions('2x+3x', '5x', 'strict')).toBe(false);
      expect(compareMathExpressions('x^2+2x+1', '(x+1)^2', 'strict')).toBe(false);
    });

    test('rejects wrong answers', () => {
      expect(compareMathExpressions('5x', '6x', 'strict')).toBe(false);
      expect(compareMathExpressions('x^2', 'x^3', 'strict')).toBe(false);
    });
  });

  describe('canonical mode', () => {
    test('matches identical expressions', () => {
      expect(compareMathExpressions('5x', '5x', 'canonical')).toBe(true);
    });

    test('normalizes ordering (commutative)', () => {
      // Canonical form normalizes multiplication order
      expect(compareMathExpressions('x*5', '5*x', 'canonical')).toBe(true);
      expect(compareMathExpressions('x*5', '5x', 'canonical')).toBe(true);
    });

    test('rejects non-simplified forms', () => {
      // Canonical doesn't simplify 2x+3x to 5x
      expect(compareMathExpressions('2x+3x', '5x', 'canonical')).toBe(false);
    });

    test('rejects wrong answers', () => {
      expect(compareMathExpressions('5x', '6x', 'canonical')).toBe(false);
      expect(compareMathExpressions('x^2', 'x^3', 'canonical')).toBe(false);
    });
  });

  describe('algebraic mode', () => {
    test('matches identical expressions', () => {
      expect(compareMathExpressions('5x', '5x', 'algebraic')).toBe(true);
    });

    test('matches algebraically equivalent expressions', () => {
      expect(compareMathExpressions('2x+3x', '5x', 'algebraic')).toBe(true);
      expect(compareMathExpressions('x+x', '2x', 'algebraic')).toBe(true);
    });

    test('handles commutative operations', () => {
      expect(compareMathExpressions('a+b', 'b+a', 'algebraic')).toBe(true);
      expect(compareMathExpressions('a*b', 'b*a', 'algebraic')).toBe(true);
    });

    test('handles equivalent fractions', () => {
      expect(compareMathExpressions('\\frac{2}{4}', '\\frac{1}{2}', 'algebraic')).toBe(true);
    });

    test('handles polynomial equivalence', () => {
      expect(compareMathExpressions('(x+1)(x-1)', 'x^2-1', 'algebraic')).toBe(true);
    });

    test('rejects non-equivalent expressions', () => {
      expect(compareMathExpressions('5x', '6x', 'algebraic')).toBe(false);
      expect(compareMathExpressions('x^2', 'x^3', 'algebraic')).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('returns false for empty strings', () => {
      expect(compareMathExpressions('', '5x', 'canonical')).toBe(false);
      expect(compareMathExpressions('5x', '', 'canonical')).toBe(false);
      expect(compareMathExpressions('', '', 'canonical')).toBe(false);
    });

    test('returns false for whitespace-only strings', () => {
      expect(compareMathExpressions('   ', '5x', 'canonical')).toBe(false);
      expect(compareMathExpressions('5x', '   ', 'canonical')).toBe(false);
    });

    test('handles expressions with whitespace', () => {
      expect(compareMathExpressions(' 5x ', '5x', 'canonical')).toBe(true);
      expect(compareMathExpressions('5 x', '5x', 'canonical')).toBe(true);
    });

    test('handles invalid LaTeX gracefully', () => {
      // Invalid LaTeX should fall back to string comparison
      expect(compareMathExpressions('\\invalid{', '\\invalid{', 'canonical')).toBe(true);
      expect(compareMathExpressions('\\invalid{', '5x', 'canonical')).toBe(false);
    });

    test('defaults to canonical mode', () => {
      expect(compareMathExpressions('x*5', '5x')).toBe(true);
    });
  });
});

describe('getFormulaComparisonMode', () => {
  test('returns mode from formula response declaration', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item>
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"
    data-response-type="formula" data-comparison-mode="algebraic">
  </qti-response-declaration>
</qti-assessment-item>`;

    const itemDoc = parser.parseFromString(xml, 'text/xml');
    expect(getFormulaComparisonMode(itemDoc, 'RESPONSE')).toBe('algebraic');
  });

  test('returns canonical as default for formula without mode', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item>
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"
    data-response-type="formula">
  </qti-response-declaration>
</qti-assessment-item>`;

    const itemDoc = parser.parseFromString(xml, 'text/xml');
    expect(getFormulaComparisonMode(itemDoc, 'RESPONSE')).toBe('canonical');
  });

  test('returns null for non-formula response', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item>
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
  </qti-response-declaration>
</qti-assessment-item>`;

    const itemDoc = parser.parseFromString(xml, 'text/xml');
    expect(getFormulaComparisonMode(itemDoc, 'RESPONSE')).toBe(null);
  });

  test('returns null for non-existent response', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item>
  <qti-response-declaration identifier="OTHER" cardinality="single" base-type="string"
    data-response-type="formula">
  </qti-response-declaration>
</qti-assessment-item>`;

    const itemDoc = parser.parseFromString(xml, 'text/xml');
    expect(getFormulaComparisonMode(itemDoc, 'RESPONSE')).toBe(null);
  });

  test('handles all valid modes', () => {
    const modes = ['strict', 'canonical', 'algebraic'] as const;

    for (const mode of modes) {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item>
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"
    data-response-type="formula" data-comparison-mode="${mode}">
  </qti-response-declaration>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      expect(getFormulaComparisonMode(itemDoc, 'RESPONSE')).toBe(mode);
    }
  });
});
