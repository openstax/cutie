import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
import { buildScore, extractStandardOutcomes } from './scoreUtils';

describe('buildScore', () => {
  test('builds score with correct scaled value', () => {
    const score = buildScore(5, 10);

    expect(score.raw).toBe(5);
    expect(score.min).toBe(0);
    expect(score.max).toBe(10);
    expect(score.scaled).toBe(0.5);
  });

  test('handles zero raw score', () => {
    const score = buildScore(0, 10);

    expect(score.raw).toBe(0);
    expect(score.min).toBe(0);
    expect(score.max).toBe(10);
    expect(score.scaled).toBe(0);
  });

  test('handles full score', () => {
    const score = buildScore(10, 10);

    expect(score.raw).toBe(10);
    expect(score.min).toBe(0);
    expect(score.max).toBe(10);
    expect(score.scaled).toBe(1);
  });

  test('handles zero max score by setting scaled to 0', () => {
    const score = buildScore(0, 0);

    expect(score.raw).toBe(0);
    expect(score.min).toBe(0);
    expect(score.max).toBe(0);
    expect(score.scaled).toBe(0);
  });

  test('handles fractional scores', () => {
    const score = buildScore(3.5, 7);

    expect(score.raw).toBe(3.5);
    expect(score.min).toBe(0);
    expect(score.max).toBe(7);
    expect(score.scaled).toBe(0.5);
  });
});

describe('extractStandardOutcomes', () => {
  const parser = new DOMParser();

  test('returns null when SCORE variable is missing', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
        <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>
        <qti-response-processing template="https://example.com/match_correct.xml"/>
      </qti-assessment-item>`;

    const doc = parser.parseFromString(xml, 'application/xml');
    const variables: Record<string, unknown> = {};

    const result = extractStandardOutcomes(variables, doc);

    expect(result).toBeNull();
  });

  test('returns null when MAXSCORE cannot be derived', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
        <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
      </qti-assessment-item>`;

    const doc = parser.parseFromString(xml, 'application/xml');
    const variables: Record<string, unknown> = { SCORE: 5 };

    const result = extractStandardOutcomes(variables, doc);

    expect(result).toBeNull();
  });

  test('returns Score when SCORE exists and MAXSCORE can be derived from template', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
        <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
        <qti-response-processing template="https://example.com/match_correct.xml"/>
      </qti-assessment-item>`;

    const doc = parser.parseFromString(xml, 'application/xml');
    const variables: Record<string, unknown> = { SCORE: 1 };

    const result = extractStandardOutcomes(variables, doc);

    expect(result).not.toBeNull();
    expect(result!.raw).toBe(1);
    expect(result!.min).toBe(0);
    expect(result!.max).toBe(1);
    expect(result!.scaled).toBe(1);
  });

  test('returns Score when MAXSCORE is explicitly set', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
        <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
        <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float"/>
      </qti-assessment-item>`;

    const doc = parser.parseFromString(xml, 'application/xml');
    const variables: Record<string, unknown> = { SCORE: 5, MAXSCORE: 10 };

    const result = extractStandardOutcomes(variables, doc);

    expect(result).not.toBeNull();
    expect(result!.raw).toBe(5);
    expect(result!.min).toBe(0);
    expect(result!.max).toBe(10);
    expect(result!.scaled).toBe(0.5);
  });

  test('returns Score when MAXSCORE derived from mapping upper-bound', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
        <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
          <qti-mapping lower-bound="0" upper-bound="5">
            <qti-map-entry map-key="A" mapped-value="1"/>
            <qti-map-entry map-key="B" mapped-value="2"/>
            <qti-map-entry map-key="C" mapped-value="-1"/>
          </qti-mapping>
        </qti-response-declaration>
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
      </qti-assessment-item>`;

    const doc = parser.parseFromString(xml, 'application/xml');
    const variables: Record<string, unknown> = { SCORE: 3 };

    const result = extractStandardOutcomes(variables, doc);

    expect(result).not.toBeNull();
    expect(result!.raw).toBe(3);
    expect(result!.min).toBe(0);
    expect(result!.max).toBe(5);
    expect(result!.scaled).toBe(0.6);
  });
});
