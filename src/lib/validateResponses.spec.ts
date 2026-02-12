import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { ResponseValidationError, validateSubmission } from './validateResponses';

function parseItem(xml: string): Document {
  return new DOMParser().parseFromString(xml.trim(), 'text/xml');
}

const makeItem = (interactionAttrs: string) => `
  <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
    <qti-item-body>
      <qti-choice-interaction response-identifier="RESPONSE" ${interactionAttrs}>
        <qti-simple-choice identifier="A">A</qti-simple-choice>
        <qti-simple-choice identifier="B">B</qti-simple-choice>
        <qti-simple-choice identifier="C">C</qti-simple-choice>
      </qti-choice-interaction>
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
