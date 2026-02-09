import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
import { getExternalScoredInfo } from './externalScoring';

const parser = new DOMParser();

describe('getExternalScoredInfo', () => {
  test('returns null when no SCORE outcome has external-scored="human"', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
        <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
      </qti-assessment-item>`;

    const doc = parser.parseFromString(xml, 'application/xml');
    const result = getExternalScoredInfo(doc, {});

    expect(result).toBeNull();
  });

  test('returns maxScore from normal-maximum attribute', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
        <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"
                                 external-scored="human" normal-maximum="5.0"/>
      </qti-assessment-item>`;

    const doc = parser.parseFromString(xml, 'application/xml');
    const result = getExternalScoredInfo(doc, {});

    expect(result).not.toBeNull();
    expect(result!.maxScore).toBe(5);
  });

  test('falls back to deriveMaxScore when normal-maximum absent', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
        <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"
                                 external-scored="human"/>
        <qti-response-processing template="https://example.com/match_correct.xml"/>
      </qti-assessment-item>`;

    const doc = parser.parseFromString(xml, 'application/xml');
    const result = getExternalScoredInfo(doc, {});

    expect(result).not.toBeNull();
    expect(result!.maxScore).toBe(1);
  });

  test('returns null when externally scored but maxScore cannot be derived', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
        <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"
                                 external-scored="human"/>
      </qti-assessment-item>`;

    const doc = parser.parseFromString(xml, 'application/xml');
    const result = getExternalScoredInfo(doc, {});

    expect(result).toBeNull();
  });

  test('ignores external-scored on non-SCORE outcomes', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
        <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>
        <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"
                                 external-scored="human"/>
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
      </qti-assessment-item>`;

    const doc = parser.parseFromString(xml, 'application/xml');
    const result = getExternalScoredInfo(doc, {});

    expect(result).toBeNull();
  });

  test('uses MAXSCORE variable when available', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
        <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"
                                 external-scored="human"/>
        <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float"/>
      </qti-assessment-item>`;

    const doc = parser.parseFromString(xml, 'application/xml');
    const result = getExternalScoredInfo(doc, { MAXSCORE: 10 });

    expect(result).not.toBeNull();
    expect(result!.maxScore).toBe(10);
  });
});
