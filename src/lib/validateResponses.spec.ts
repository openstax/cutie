import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { ResponseValidationError, validateSubmission } from './validateResponses';

function parseItem(xml: string): Document {
  return new DOMParser().parseFromString(xml.trim(), 'text/xml');
}

const NS = 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0';

const makeItem = (interactionAttrs: string) => `
  <qti-assessment-item xmlns="${NS}">
    <qti-item-body>
      <qti-choice-interaction response-identifier="RESPONSE" ${interactionAttrs}>
        <qti-simple-choice identifier="A">A</qti-simple-choice>
        <qti-simple-choice identifier="B">B</qti-simple-choice>
        <qti-simple-choice identifier="C">C</qti-simple-choice>
      </qti-choice-interaction>
    </qti-item-body>
  </qti-assessment-item>
`;

const makeTextEntryItem = (attrs: string) => `
  <qti-assessment-item xmlns="${NS}">
    <qti-item-body>
      <qti-text-entry-interaction response-identifier="RESPONSE" ${attrs} />
    </qti-item-body>
  </qti-assessment-item>
`;

const makeExtendedTextItem = (attrs: string) => `
  <qti-assessment-item xmlns="${NS}">
    <qti-item-body>
      <qti-extended-text-interaction response-identifier="RESPONSE" ${attrs} />
    </qti-item-body>
  </qti-assessment-item>
`;

const makeInlineChoiceItem = (attrs: string) => `
  <qti-assessment-item xmlns="${NS}">
    <qti-item-body>
      <p>
        <qti-inline-choice-interaction response-identifier="RESPONSE" ${attrs}>
          <qti-inline-choice identifier="A">A</qti-inline-choice>
          <qti-inline-choice identifier="B">B</qti-inline-choice>
        </qti-inline-choice-interaction>
      </p>
    </qti-item-body>
  </qti-assessment-item>
`;

const makeGapMatchItem = (attrs: string) => `
  <qti-assessment-item xmlns="${NS}">
    <qti-item-body>
      <qti-gap-match-interaction response-identifier="RESPONSE" ${attrs}>
        <qti-gap-text identifier="G1" match-max="1">Word1</qti-gap-text>
        <qti-gap-text identifier="G2" match-max="1">Word2</qti-gap-text>
      </qti-gap-match-interaction>
    </qti-item-body>
  </qti-assessment-item>
`;

const makeMatchItem = (attrs: string) => `
  <qti-assessment-item xmlns="${NS}">
    <qti-item-body>
      <qti-match-interaction response-identifier="RESPONSE" ${attrs}>
        <qti-simple-match-set>
          <qti-simple-associable-choice identifier="S1" match-max="1">S1</qti-simple-associable-choice>
        </qti-simple-match-set>
        <qti-simple-match-set>
          <qti-simple-associable-choice identifier="T1" match-max="1">T1</qti-simple-associable-choice>
        </qti-simple-match-set>
      </qti-match-interaction>
    </qti-item-body>
  </qti-assessment-item>
`;

describe('validateSubmission', () => {
  it('does not throw when no constraints are set', () => {
    const doc = parseItem(makeItem('max-choices="0"'));
    expect(() => validateSubmission({ RESPONSE: 'A' }, doc)).not.toThrow();
  });

  it('does not throw when min-choices is satisfied', () => {
    const doc = parseItem(makeItem('max-choices="3" min-choices="2"'));
    expect(() => validateSubmission({ RESPONSE: ['A', 'B'] }, doc)).not.toThrow();
  });

  it('throws ResponseValidationError when too few choices selected', () => {
    const doc = parseItem(makeItem('max-choices="3" min-choices="2"'));
    expect(() => validateSubmission({ RESPONSE: ['A'] }, doc)).toThrow(ResponseValidationError);

    try {
      validateSubmission({ RESPONSE: ['A'] }, doc);
    } catch (e) {
      const err = e as ResponseValidationError;
      expect(err.errors).toHaveLength(1);
      expect(err.errors[0]!.responseIdentifier).toBe('RESPONSE');
      expect(err.errors[0]!.constraint).toBe('min-choices');
    }
  });

  it('throws when null response violates min-choices', () => {
    const doc = parseItem(makeItem('max-choices="3" min-choices="1"'));
    expect(() => validateSubmission({ RESPONSE: null }, doc)).toThrow(ResponseValidationError);
  });

  it('throws when response is missing for min-choices', () => {
    const doc = parseItem(makeItem('max-choices="3" min-choices="1"'));
    expect(() => validateSubmission({}, doc)).toThrow(ResponseValidationError);
  });

  it('throws when too many choices selected (server guard)', () => {
    const doc = parseItem(makeItem('max-choices="2"'));
    expect(() => validateSubmission({ RESPONSE: ['A', 'B', 'C'] }, doc)).toThrow(
      ResponseValidationError
    );

    try {
      validateSubmission({ RESPONSE: ['A', 'B', 'C'] }, doc);
    } catch (e) {
      const err = e as ResponseValidationError;
      expect(err.errors[0]!.constraint).toBe('max-choices');
    }
  });

  it('validates multiple interactions independently', () => {
    const xml = `
      <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
        <qti-item-body>
          <qti-choice-interaction response-identifier="R1" max-choices="3" min-choices="2">
            <qti-simple-choice identifier="A">A</qti-simple-choice>
            <qti-simple-choice identifier="B">B</qti-simple-choice>
          </qti-choice-interaction>
          <qti-choice-interaction response-identifier="R2" max-choices="1" min-choices="1">
            <qti-simple-choice identifier="X">X</qti-simple-choice>
            <qti-simple-choice identifier="Y">Y</qti-simple-choice>
          </qti-choice-interaction>
        </qti-item-body>
      </qti-assessment-item>
    `;
    const doc = parseItem(xml);

    // Both invalid
    try {
      validateSubmission({ R1: ['A'], R2: null }, doc);
    } catch (e) {
      const err = e as ResponseValidationError;
      expect(err.errors).toHaveLength(2);
      expect(err.errors[0]!.responseIdentifier).toBe('R1');
      expect(err.errors[1]!.responseIdentifier).toBe('R2');
    }
  });

  it('passes when single-select max-choices="1" with one selection', () => {
    const doc = parseItem(makeItem('max-choices="1"'));
    expect(() => validateSubmission({ RESPONSE: 'A' }, doc)).not.toThrow();
  });
});

describe('validateTextEntryInteractions', () => {
  it('passes when value matches pattern-mask', () => {
    const doc = parseItem(makeTextEntryItem('pattern-mask="^\\d{3}$"'));
    expect(() => validateSubmission({ RESPONSE: '123' }, doc)).not.toThrow();
  });

  it('fails when value does not match pattern-mask', () => {
    const doc = parseItem(makeTextEntryItem('pattern-mask="^\\d{3}$"'));
    expect(() => validateSubmission({ RESPONSE: 'abc' }, doc)).toThrow(ResponseValidationError);

    try {
      validateSubmission({ RESPONSE: 'abc' }, doc);
    } catch (e) {
      const err = e as ResponseValidationError;
      expect(err.errors).toHaveLength(1);
      expect(err.errors[0]!.constraint).toBe('pattern-mask');
    }
  });

  it('fails when null response does not match pattern-mask', () => {
    const doc = parseItem(makeTextEntryItem('pattern-mask="^\\d{3}$"'));
    expect(() => validateSubmission({ RESPONSE: null }, doc)).toThrow(ResponseValidationError);
  });

  it('passes when no pattern-mask is set', () => {
    const doc = parseItem(makeTextEntryItem(''));
    expect(() => validateSubmission({ RESPONSE: 'anything' }, doc)).not.toThrow();
  });
});

describe('validateExtendedTextInteractions', () => {
  it('passes when min-strings is satisfied', () => {
    const doc = parseItem(makeExtendedTextItem('min-strings="1"'));
    expect(() => validateSubmission({ RESPONSE: 'Some text' }, doc)).not.toThrow();
  });

  it('fails when value is empty and min-strings requires input', () => {
    const doc = parseItem(makeExtendedTextItem('min-strings="1"'));
    expect(() => validateSubmission({ RESPONSE: '' }, doc)).toThrow(ResponseValidationError);

    try {
      validateSubmission({ RESPONSE: '' }, doc);
    } catch (e) {
      const err = e as ResponseValidationError;
      expect(err.errors).toHaveLength(1);
      expect(err.errors[0]!.constraint).toBe('min-strings');
    }
  });

  it('fails when value is whitespace only', () => {
    const doc = parseItem(makeExtendedTextItem('min-strings="1"'));
    expect(() => validateSubmission({ RESPONSE: '   ' }, doc)).toThrow(ResponseValidationError);
  });

  it('fails when response is null', () => {
    const doc = parseItem(makeExtendedTextItem('min-strings="1"'));
    expect(() => validateSubmission({ RESPONSE: null }, doc)).toThrow(ResponseValidationError);
  });

  it('passes when no min-strings is set', () => {
    const doc = parseItem(makeExtendedTextItem(''));
    expect(() => validateSubmission({ RESPONSE: '' }, doc)).not.toThrow();
  });

  it('passes when value matches pattern-mask', () => {
    const doc = parseItem(makeExtendedTextItem('pattern-mask="^\\d{3}$"'));
    expect(() => validateSubmission({ RESPONSE: '123' }, doc)).not.toThrow();
  });

  it('fails when value does not match pattern-mask', () => {
    const doc = parseItem(makeExtendedTextItem('pattern-mask="^\\d{3}$"'));
    expect(() => validateSubmission({ RESPONSE: 'abc' }, doc)).toThrow(ResponseValidationError);

    try {
      validateSubmission({ RESPONSE: 'abc' }, doc);
    } catch (e) {
      const err = e as ResponseValidationError;
      expect(err.errors).toHaveLength(1);
      expect(err.errors[0]!.constraint).toBe('pattern-mask');
    }
  });

  it('fails when null response does not match pattern-mask', () => {
    const doc = parseItem(makeExtendedTextItem('pattern-mask="^\\d{3}$"'));
    expect(() => validateSubmission({ RESPONSE: null }, doc)).toThrow(ResponseValidationError);
  });

  it('passes when no pattern-mask is set', () => {
    const doc = parseItem(makeExtendedTextItem(''));
    expect(() => validateSubmission({ RESPONSE: 'anything' }, doc)).not.toThrow();
  });

  it('reports both min-strings and pattern-mask errors independently', () => {
    const doc = parseItem(makeExtendedTextItem('min-strings="1" pattern-mask="^\\d+$"'));
    try {
      validateSubmission({ RESPONSE: '' }, doc);
    } catch (e) {
      const err = e as ResponseValidationError;
      expect(err.errors).toHaveLength(2);
      expect(err.errors[0]!.constraint).toBe('min-strings');
      expect(err.errors[1]!.constraint).toBe('pattern-mask');
    }
  });

  describe('data-min-characters', () => {
    it('passes when text meets minimum', () => {
      const doc = parseItem(makeExtendedTextItem('data-min-characters="5"'));
      expect(() => validateSubmission({ RESPONSE: 'hello' }, doc)).not.toThrow();
    });

    it('passes when text exceeds minimum', () => {
      const doc = parseItem(makeExtendedTextItem('data-min-characters="5"'));
      expect(() => validateSubmission({ RESPONSE: 'hello world' }, doc)).not.toThrow();
    });

    it('fails when text is under minimum', () => {
      const doc = parseItem(makeExtendedTextItem('data-min-characters="10"'));
      expect(() => validateSubmission({ RESPONSE: 'short' }, doc)).toThrow(ResponseValidationError);

      try {
        validateSubmission({ RESPONSE: 'short' }, doc);
      } catch (e) {
        const err = e as ResponseValidationError;
        expect(err.errors).toHaveLength(1);
        expect(err.errors[0]!.constraint).toBe('data-min-characters');
      }
    });

    it('fails when response is empty (implies required)', () => {
      const doc = parseItem(makeExtendedTextItem('data-min-characters="5"'));
      expect(() => validateSubmission({ RESPONSE: '' }, doc)).toThrow(ResponseValidationError);
    });

    it('fails when response is null', () => {
      const doc = parseItem(makeExtendedTextItem('data-min-characters="5"'));
      expect(() => validateSubmission({ RESPONSE: null }, doc)).toThrow(ResponseValidationError);
    });

    it('trims whitespace before checking length', () => {
      const doc = parseItem(makeExtendedTextItem('data-min-characters="5"'));
      expect(() => validateSubmission({ RESPONSE: '  hi  ' }, doc)).toThrow(ResponseValidationError);
    });

    it('strips HTML tags for xhtml format', () => {
      const doc = parseItem(makeExtendedTextItem('format="xhtml" data-min-characters="10"'));
      // "Short" is only 5 chars of text content
      expect(() => validateSubmission({ RESPONSE: '<p>Short</p>' }, doc)).toThrow(
        ResponseValidationError
      );
    });

    it('passes for xhtml when text content meets minimum', () => {
      const doc = parseItem(makeExtendedTextItem('format="xhtml" data-min-characters="5"'));
      expect(() =>
        validateSubmission({ RESPONSE: '<p>Hello world</p>' }, doc)
      ).not.toThrow();
    });
  });

  describe('data-max-characters', () => {
    it('passes when text is under limit', () => {
      const doc = parseItem(makeExtendedTextItem('data-max-characters="20"'));
      expect(() => validateSubmission({ RESPONSE: 'short' }, doc)).not.toThrow();
    });

    it('passes when text is at exactly the limit', () => {
      const doc = parseItem(makeExtendedTextItem('data-max-characters="5"'));
      expect(() => validateSubmission({ RESPONSE: 'hello' }, doc)).not.toThrow();
    });

    it('fails when text exceeds limit', () => {
      const doc = parseItem(makeExtendedTextItem('data-max-characters="5"'));
      expect(() => validateSubmission({ RESPONSE: 'hello world' }, doc)).toThrow(
        ResponseValidationError
      );

      try {
        validateSubmission({ RESPONSE: 'hello world' }, doc);
      } catch (e) {
        const err = e as ResponseValidationError;
        expect(err.errors).toHaveLength(1);
        expect(err.errors[0]!.constraint).toBe('data-max-characters');
      }
    });

    it('passes when response is empty', () => {
      const doc = parseItem(makeExtendedTextItem('data-max-characters="5"'));
      expect(() => validateSubmission({ RESPONSE: '' }, doc)).not.toThrow();
    });

    it('trims whitespace before checking length', () => {
      const doc = parseItem(makeExtendedTextItem('data-max-characters="5"'));
      // "hello" is 5 chars, padding shouldn't cause failure
      expect(() => validateSubmission({ RESPONSE: '  hello  ' }, doc)).not.toThrow();
    });

    it('strips HTML tags for xhtml format', () => {
      const doc = parseItem(makeExtendedTextItem('format="xhtml" data-max-characters="5"'));
      // "Hello world" is 11 chars of text content
      expect(() => validateSubmission({ RESPONSE: '<p>Hello world</p>' }, doc)).toThrow(
        ResponseValidationError
      );
    });

    it('passes for xhtml when text content is under limit', () => {
      const doc = parseItem(makeExtendedTextItem('format="xhtml" data-max-characters="20"'));
      expect(() =>
        validateSubmission({ RESPONSE: '<p>Short</p>' }, doc)
      ).not.toThrow();
    });
  });

  describe('combined data-min-characters + data-max-characters', () => {
    it('passes when text is in range', () => {
      const doc = parseItem(
        makeExtendedTextItem('data-min-characters="5" data-max-characters="20"')
      );
      expect(() => validateSubmission({ RESPONSE: 'hello world' }, doc)).not.toThrow();
    });

    it('reports both errors when empty (under min, but max passes since 0 <= max)', () => {
      const doc = parseItem(
        makeExtendedTextItem('data-min-characters="5" data-max-characters="20"')
      );
      try {
        validateSubmission({ RESPONSE: '' }, doc);
      } catch (e) {
        const err = e as ResponseValidationError;
        // Only min-characters fails (0 < 5), max-characters passes (0 <= 20)
        expect(err.errors).toHaveLength(1);
        expect(err.errors[0]!.constraint).toBe('data-min-characters');
      }
    });
  });

  describe('xhtml format', () => {
    it('strips HTML tags for min-strings empty check', () => {
      const doc = parseItem(makeExtendedTextItem('format="xhtml" min-strings="1"'));
      // HTML with only tags and whitespace should be treated as empty
      expect(() => validateSubmission({ RESPONSE: '<p><br></p>' }, doc)).toThrow(
        ResponseValidationError
      );
    });

    it('passes min-strings when HTML contains text content', () => {
      const doc = parseItem(makeExtendedTextItem('format="xhtml" min-strings="1"'));
      expect(() =>
        validateSubmission({ RESPONSE: '<p>Some text</p>' }, doc)
      ).not.toThrow();
    });

    it('skips pattern-mask validation for xhtml format', () => {
      const doc = parseItem(makeExtendedTextItem('format="xhtml" pattern-mask="^\\d+$"'));
      // This would fail pattern-mask for plain text, but xhtml skips it
      expect(() =>
        validateSubmission({ RESPONSE: '<p>not digits</p>' }, doc)
      ).not.toThrow();
    });

    it('reports only min-strings error (not pattern-mask) for empty xhtml', () => {
      const doc = parseItem(
        makeExtendedTextItem('format="xhtml" min-strings="1" pattern-mask="^\\d+$"')
      );
      try {
        validateSubmission({ RESPONSE: '<p></p>' }, doc);
      } catch (e) {
        const err = e as ResponseValidationError;
        // Only min-strings error, pattern-mask is skipped for xhtml
        expect(err.errors).toHaveLength(1);
        expect(err.errors[0]!.constraint).toBe('min-strings');
      }
    });
  });
});

describe('validateInlineChoiceInteractions', () => {
  it('passes when required and value is provided', () => {
    const doc = parseItem(makeInlineChoiceItem('required="true"'));
    expect(() => validateSubmission({ RESPONSE: 'A' }, doc)).not.toThrow();
  });

  it('fails when required and value is null', () => {
    const doc = parseItem(makeInlineChoiceItem('required="true"'));
    expect(() => validateSubmission({ RESPONSE: null }, doc)).toThrow(ResponseValidationError);

    try {
      validateSubmission({ RESPONSE: null }, doc);
    } catch (e) {
      const err = e as ResponseValidationError;
      expect(err.errors).toHaveLength(1);
      expect(err.errors[0]!.constraint).toBe('required');
    }
  });

  it('fails when required and value is empty string', () => {
    const doc = parseItem(makeInlineChoiceItem('required="true"'));
    expect(() => validateSubmission({ RESPONSE: '' }, doc)).toThrow(ResponseValidationError);
  });

  it('fails when min-choices >= 1 and no value', () => {
    const doc = parseItem(makeInlineChoiceItem('min-choices="1"'));
    expect(() => validateSubmission({ RESPONSE: null }, doc)).toThrow(ResponseValidationError);

    try {
      validateSubmission({ RESPONSE: null }, doc);
    } catch (e) {
      const err = e as ResponseValidationError;
      expect(err.errors[0]!.constraint).toBe('min-choices');
    }
  });

  it('passes when not required and no value', () => {
    const doc = parseItem(makeInlineChoiceItem(''));
    expect(() => validateSubmission({ RESPONSE: null }, doc)).not.toThrow();
  });
});

describe('validateGapMatchInteractions', () => {
  it('passes when min-associations is satisfied', () => {
    const doc = parseItem(makeGapMatchItem('min-associations="1" max-associations="2"'));
    expect(() => validateSubmission({ RESPONSE: ['G1 gap1'] }, doc)).not.toThrow();
  });

  it('fails when too few associations', () => {
    const doc = parseItem(makeGapMatchItem('min-associations="2" max-associations="3"'));
    expect(() => validateSubmission({ RESPONSE: ['G1 gap1'] }, doc)).toThrow(
      ResponseValidationError
    );

    try {
      validateSubmission({ RESPONSE: ['G1 gap1'] }, doc);
    } catch (e) {
      const err = e as ResponseValidationError;
      expect(err.errors).toHaveLength(1);
      expect(err.errors[0]!.constraint).toBe('min-associations');
    }
  });

  it('fails when too many associations', () => {
    const doc = parseItem(makeGapMatchItem('max-associations="1"'));
    expect(() =>
      validateSubmission({ RESPONSE: ['G1 gap1', 'G2 gap2'] }, doc)
    ).toThrow(ResponseValidationError);

    try {
      validateSubmission({ RESPONSE: ['G1 gap1', 'G2 gap2'] }, doc);
    } catch (e) {
      const err = e as ResponseValidationError;
      expect(err.errors[0]!.constraint).toBe('max-associations');
    }
  });

  it('fails when null response violates min-associations', () => {
    const doc = parseItem(makeGapMatchItem('min-associations="1"'));
    expect(() => validateSubmission({ RESPONSE: null }, doc)).toThrow(ResponseValidationError);
  });

  it('passes with no constraints', () => {
    const doc = parseItem(makeGapMatchItem(''));
    expect(() => validateSubmission({ RESPONSE: [] }, doc)).not.toThrow();
  });
});

describe('validateMatchInteractions', () => {
  it('passes when min-associations is satisfied', () => {
    const doc = parseItem(makeMatchItem('min-associations="1" max-associations="2"'));
    expect(() => validateSubmission({ RESPONSE: ['S1 T1'] }, doc)).not.toThrow();
  });

  it('fails when too few associations', () => {
    const doc = parseItem(makeMatchItem('min-associations="2" max-associations="3"'));
    expect(() => validateSubmission({ RESPONSE: ['S1 T1'] }, doc)).toThrow(
      ResponseValidationError
    );

    try {
      validateSubmission({ RESPONSE: ['S1 T1'] }, doc);
    } catch (e) {
      const err = e as ResponseValidationError;
      expect(err.errors).toHaveLength(1);
      expect(err.errors[0]!.constraint).toBe('min-associations');
    }
  });

  it('fails when too many associations', () => {
    const doc = parseItem(makeMatchItem('max-associations="1"'));
    expect(() =>
      validateSubmission({ RESPONSE: ['S1 T1', 'S1 T2'] }, doc)
    ).toThrow(ResponseValidationError);

    try {
      validateSubmission({ RESPONSE: ['S1 T1', 'S1 T2'] }, doc);
    } catch (e) {
      const err = e as ResponseValidationError;
      expect(err.errors[0]!.constraint).toBe('max-associations');
    }
  });

  it('fails when null response violates min-associations', () => {
    const doc = parseItem(makeMatchItem('min-associations="1"'));
    expect(() => validateSubmission({ RESPONSE: null }, doc)).toThrow(ResponseValidationError);
  });

  it('passes with no constraints', () => {
    const doc = parseItem(makeMatchItem(''));
    expect(() => validateSubmission({ RESPONSE: [] }, doc)).not.toThrow();
  });
});
