/* spell-checker: ignore hottext hottexts */
import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
import { countGuessableOptions } from './guessableOptions.js';

const parser = new DOMParser();

/** The first interaction in an item with the given body and declarations */
function interaction(body: string, declarations = ''): [Element, Document] {
  const doc = parser.parseFromString(
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item">
      ${declarations}
      <qti-item-body>${body}</qti-item-body>
    </qti-assessment-item>`,
    'text/xml'
  );
  const element = Array.from(doc.getElementsByTagName('*')).find((el) => el.tagName.endsWith('-interaction'));
  if (!element) throw new Error('No interaction');
  return [element, doc];
}

function count(body: string, declarations = ''): number | null {
  return countGuessableOptions(...interaction(body, declarations));
}

const elements = (tagName: string, ids: string[], attrs: (id: string) => string = () => '') =>
  ids.map((id) => `<${tagName} identifier="${id}" ${attrs(id)}>${id}</${tagName}>`).join('');

const matchSets = (sources: string, targets: string) => `
  <qti-match-interaction response-identifier="R">
    <qti-simple-match-set>${sources}</qti-simple-match-set>
    <qti-simple-match-set>${targets}</qti-simple-match-set>
  </qti-match-interaction>`;

describe('countGuessableOptions', () => {
  test.each([
    ['qti-choice-interaction', 'qti-simple-choice'],
    ['qti-order-interaction', 'qti-simple-choice'],
    ['qti-inline-choice-interaction', 'qti-inline-choice'],
    ['qti-hotspot-interaction', 'qti-hotspot-choice'],
    ['qti-hottext-interaction', 'qti-hottext'],
  ])('counts the options of a %s', (tagName, optionTag) => {
    expect(count(`<${tagName} response-identifier="R">${elements(optionTag, ['A', 'B', 'C'])}</${tagName}>`)).toBe(3);
  });

  describe('a match interaction', () => {
    test('counts every pairing of a source with a target', () => {
      // A matrix: 6 rows, each choosing one of 2 columns
      const rows = elements('qti-simple-associable-choice', ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'], () => 'match-max="1"');
      const columns = elements('qti-simple-associable-choice', ['C1', 'C2'], () => 'match-max="0"');
      expect(count(matchSets(rows, columns))).toBe(12);
    });

    test('counts only the pairings a source\'s match-group allows', () => {
      // A bowtie: each option goes in its own column only
      const options = elements('qti-simple-associable-choice', ['A1', 'A2', 'A3'], () => 'match-group="actions"')
        + elements('qti-simple-associable-choice', ['C1', 'C2'], () => 'match-group="condition"');
      const columns = elements('qti-simple-associable-choice', ['actions', 'condition']);
      expect(count(matchSets(options, columns))).toBe(5);
    });

    test('counts only the pairings a target\'s match-group allows', () => {
      const sources = elements('qti-simple-associable-choice', ['S1', 'S2', 'S3']);
      const targets = elements('qti-simple-associable-choice', ['T1'], () => 'match-group="S1 S2"')
        + elements('qti-simple-associable-choice', ['T2']);
      expect(count(matchSets(sources, targets))).toBe(5);
    });

    test('can\'t be counted without both sets', () => {
      expect(count(`<qti-match-interaction response-identifier="R">
        <qti-simple-match-set>${elements('qti-simple-associable-choice', ['S1'])}</qti-simple-match-set>
      </qti-match-interaction>`)).toBeNull();
    });
  });

  describe('a gap match interaction', () => {
    test('counts every word or image in every gap', () => {
      expect(count(`<qti-gap-match-interaction response-identifier="R">
        ${elements('qti-gap-text', ['W1', 'W2', 'W3'], () => 'match-max="1"')}
        <qti-gap-img identifier="I1" match-max="1"><img src="a.png" alt="a"/></qti-gap-img>
        <p>A <qti-gap identifier="G1"/> and <qti-gap identifier="G2"/></p>
      </qti-gap-match-interaction>`)).toBe(8);
    });

    test('counts only the pairings match-groups allow, on either side', () => {
      expect(count(`<qti-gap-match-interaction response-identifier="R">
        <qti-gap-text identifier="W1" match-max="1" match-group="G1">W1</qti-gap-text>
        <qti-gap-text identifier="W2" match-max="1">W2</qti-gap-text>
        <qti-gap-text identifier="W3" match-max="1">W3</qti-gap-text>
        <p>A <qti-gap identifier="G1"/> and <qti-gap identifier="G2" match-group="W2"/></p>
      </qti-gap-match-interaction>`)).toBe(4);
    });
  });

  test('adds no options for a text entry', () => {
    expect(count('<p><qti-text-entry-interaction response-identifier="R"/></p>')).toBe(0);
  });

  test('adds no options for a formula entry', () => {
    expect(count(
      '<qti-extended-text-interaction response-identifier="R"/>',
      '<qti-response-declaration identifier="R" cardinality="single" base-type="string" data-response-type="formula"/>'
    )).toBe(0);
  });

  test.each([
    ['an essay', '<qti-extended-text-interaction response-identifier="R"/>'],
    ['an interaction with no counter', '<qti-upload-interaction response-identifier="R"/>'],
  ])('can\'t count %s', (_, body) => {
    expect(count(body)).toBeNull();
  });
});
