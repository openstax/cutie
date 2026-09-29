import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
import { evaluateResponse } from './evaluateResponses';

const parser = new DOMParser();

const itemWith = (mapping: string) => parser.parseFromString(`
  <qti-assessment-item>
    <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
      <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
      ${mapping}
    </qti-response-declaration>
  </qti-assessment-item>
`, 'text/xml');

describe('evaluateResponse', () => {
  test('judges a mapped response against the most the mapping can award', () => {
    const itemDoc = itemWith(`
      <qti-mapping default-value="0">
        <qti-map-entry map-key="A" mapped-value="1"/>
        <qti-map-entry map-key="B" mapped-value="1"/>
      </qti-mapping>`);
    expect(evaluateResponse(itemDoc, 'RESPONSE', { RESPONSE: ['A'] })).toBe('partial');
  });

  test('falls back to the correct response when the mapping has no known maximum', () => {
    const itemDoc = itemWith(`
      <qti-mapping default-value="0.5">
        <qti-map-entry map-key="A" mapped-value="1"/>
      </qti-mapping>`);
    expect(evaluateResponse(itemDoc, 'RESPONSE', { RESPONSE: ['A'] })).toBe('correct');
    expect(evaluateResponse(itemDoc, 'RESPONSE', { RESPONSE: ['A', 'B'] })).toBe('incorrect');
  });

  test('uses the upper-bound as the maximum for a positive default', () => {
    const itemDoc = itemWith(`
      <qti-mapping default-value="0.5" upper-bound="2">
        <qti-map-entry map-key="A" mapped-value="1"/>
      </qti-mapping>`);
    expect(evaluateResponse(itemDoc, 'RESPONSE', { RESPONSE: ['A'] })).toBe('partial');
    expect(evaluateResponse(itemDoc, 'RESPONSE', { RESPONSE: ['A', 'B', 'C'] })).toBe('correct');
  });
});
