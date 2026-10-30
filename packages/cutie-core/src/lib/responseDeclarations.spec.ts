import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
import { canMappingBeNegative } from './responseDeclarations.js';

const parseXML = (xml: string): Document => new DOMParser().parseFromString(xml, 'text/xml');

describe('canMappingBeNegative', () => {
  const mappedItem = (cardinality: string, mappingAttributes: string, mappedValue: string) => parseXML(`
    <qti-assessment-item>
      <qti-response-declaration identifier="RESPONSE" cardinality="${cardinality}" base-type="identifier">
        <qti-mapping ${mappingAttributes}><qti-map-entry map-key="A" mapped-value="${mappedValue}"/></qti-mapping>
      </qti-response-declaration>
      <qti-response-declaration identifier="UNMAPPED" cardinality="single" base-type="identifier"/>
    </qti-assessment-item>
  `);

  test.each([
    ['a negative entry', '', '-1', true],
    ['a negative default', 'default-value="-1"', '1', true],
    ['a negative upper-bound', 'upper-bound="-1"', '1', true],
    ['negatives with a lower-bound of 0', 'default-value="-1" lower-bound="0"', '-1', false],
    ['no negatives', '', '1', false],
  ])('multiple cardinality with %s', (_name, mappingAttributes, mappedValue, expected) => {
    expect(canMappingBeNegative(mappedItem('multiple', mappingAttributes, mappedValue), 'RESPONSE')).toBe(expected);
  });

  test('single cardinality with negatives, whatever its lower-bound', () => {
    expect(canMappingBeNegative(mappedItem('single', 'lower-bound="0"', '-1'), 'RESPONSE')).toBe(true);
  });

  test('a response without a mapping', () => {
    expect(canMappingBeNegative(mappedItem('single', '', '1'), 'UNMAPPED')).toBe(false);
  });
});
