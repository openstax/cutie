import { describe, expect, it } from 'vitest';
import { analyzeMatchGroups } from './matchGroupAnalysis';

function parseInteraction(qti: string): Element {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<html><body>${qti}</body></html>`, 'text/html');
  return doc.querySelector('qti-gap-match-interaction')!;
}

describe('analyzeMatchGroups', () => {
  it('derives tray groups and block groups when blocks partition the gaps', () => {
    const analysis = analyzeMatchGroups(parseInteraction(`
      <qti-gap-match-interaction response-identifier="R1">
        <qti-prompt>Prompt</qti-prompt>
        <qti-gap-text identifier="A1" match-group="a">A</qti-gap-text>
        <qti-gap-text identifier="B1" match-group="b">B</qti-gap-text>
        <p>A<qti-gap identifier="GA" match-group="a"></qti-gap></p>
        <p>B<qti-gap identifier="GB" match-group="b"></qti-gap></p>
      </qti-gap-match-interaction>
    `));

    expect(analysis.trayGroups).toEqual(['a', 'b']);
    expect(analysis.blockGroups).toEqual(['a', 'b']);
  });

  it('orders tray groups by first gap appearance, not choice order', () => {
    const analysis = analyzeMatchGroups(parseInteraction(`
      <qti-gap-match-interaction response-identifier="R1">
        <qti-gap-text identifier="B1" match-group="b">B</qti-gap-text>
        <qti-gap-text identifier="A1" match-group="a">A</qti-gap-text>
        <p>A<qti-gap identifier="GA" match-group="a"></qti-gap></p>
        <p>B<qti-gap identifier="GB" match-group="b"></qti-gap></p>
      </qti-gap-match-interaction>
    `));

    expect(analysis.trayGroups).toEqual(['a', 'b']);
  });

  it('derives no column layout when a gap declares multiple groups', () => {
    const analysis = analyzeMatchGroups(parseInteraction(`
      <qti-gap-match-interaction response-identifier="R1">
        <qti-gap-text identifier="A1" match-group="a">A</qti-gap-text>
        <qti-gap-text identifier="B1" match-group="b">B</qti-gap-text>
        <p>A<qti-gap identifier="GA" match-group="a b"></qti-gap></p>
        <p>B<qti-gap identifier="GB" match-group="b"></qti-gap></p>
      </qti-gap-match-interaction>
    `));

    expect(analysis.trayGroups).toEqual(['a', 'b']);
    expect(analysis.blockGroups).toBeNull();
  });

  it('derives no column layout for a single content block', () => {
    const analysis = analyzeMatchGroups(parseInteraction(`
      <qti-gap-match-interaction response-identifier="R1">
        <qti-gap-text identifier="A1" match-group="a">A</qti-gap-text>
        <qti-gap-text identifier="B1" match-group="b">B</qti-gap-text>
        <p><qti-gap identifier="GA" match-group="a"></qti-gap><qti-gap identifier="GB" match-group="b"></qti-gap></p>
      </qti-gap-match-interaction>
    `));

    expect(analysis.trayGroups).toEqual(['a', 'b']);
    expect(analysis.blockGroups).toBeNull();
  });

  it('derives no column layout when a group spans two blocks', () => {
    const analysis = analyzeMatchGroups(parseInteraction(`
      <qti-gap-match-interaction response-identifier="R1">
        <qti-gap-text identifier="A1" match-group="a">A</qti-gap-text>
        <qti-gap-text identifier="B1" match-group="b">B</qti-gap-text>
        <p>A<qti-gap identifier="GA" match-group="a"></qti-gap></p>
        <p>B<qti-gap identifier="GB" match-group="b"></qti-gap></p>
        <p>A again<qti-gap identifier="GA2" match-group="a"></qti-gap></p>
      </qti-gap-match-interaction>
    `));

    expect(analysis.blockGroups).toBeNull();
  });

  it('derives no column layout when a block has no gaps', () => {
    const analysis = analyzeMatchGroups(parseInteraction(`
      <qti-gap-match-interaction response-identifier="R1">
        <qti-gap-text identifier="A1" match-group="a">A</qti-gap-text>
        <qti-gap-text identifier="B1" match-group="b">B</qti-gap-text>
        <p>Just prose</p>
        <p>A<qti-gap identifier="GA" match-group="a"></qti-gap></p>
        <p>B<qti-gap identifier="GB" match-group="b"></qti-gap></p>
      </qti-gap-match-interaction>
    `));

    expect(analysis.trayGroups).toEqual(['a', 'b']);
    expect(analysis.blockGroups).toBeNull();
  });

  it('derives no grouping when a choice has no group', () => {
    const analysis = analyzeMatchGroups(parseInteraction(`
      <qti-gap-match-interaction response-identifier="R1">
        <qti-gap-text identifier="A1" match-group="a">A</qti-gap-text>
        <qti-gap-text identifier="B1">B</qti-gap-text>
        <p>A<qti-gap identifier="GA" match-group="a"></qti-gap></p>
        <p>B<qti-gap identifier="GB" match-group="b"></qti-gap></p>
      </qti-gap-match-interaction>
    `));

    expect(analysis.trayGroups).toBeNull();
    expect(analysis.blockGroups).toBeNull();
  });

  it('derives no grouping when there are no choices', () => {
    const analysis = analyzeMatchGroups(parseInteraction(`
      <qti-gap-match-interaction response-identifier="R1">
        <p>A<qti-gap identifier="GA" match-group="a"></qti-gap></p>
      </qti-gap-match-interaction>
    `));

    expect(analysis.trayGroups).toBeNull();
  });
});
