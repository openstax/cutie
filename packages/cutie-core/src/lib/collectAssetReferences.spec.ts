import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
import {
  collectAssetReferences,
  uniqueAssetUrls,
} from './collectAssetReferences';

function parse(xml: string): Element {
  const parser = new DOMParser();
  return parser.parseFromString(xml.trim(), 'text/xml').documentElement;
}

describe('collectAssetReferences', () => {
  test('collects src attributes', () => {
    const root = parse(`
      <root>
        <img src="images/one.png"/>
        <img src="images/two.png"/>
      </root>
    `);

    expect(collectAssetReferences(root).map((ref) => ref.url)).toEqual([
      'images/one.png',
      'images/two.png',
    ]);
  });

  test('collects data attributes', () => {
    const root = parse(`
      <root>
        <object type="image/png" data="images/map.png">UK Map</object>
      </root>
    `);

    const references = collectAssetReferences(root);
    expect(references).toHaveLength(1);
    expect(references[0]?.attr).toBe('data');
    expect(references[0]?.url).toBe('images/map.png');
  });

  test('records both attributes when an element carries src and data', () => {
    const root = parse('<root><thing src="a.png" data="b.png"/></root>');

    expect(
      collectAssetReferences(root).map((ref) => [ref.attr, ref.url])
    ).toEqual([
      ['src', 'a.png'],
      ['data', 'b.png'],
    ]);
  });

  test('returns one reference per occurrence, including repeats', () => {
    const root = parse(`
      <root>
        <img src="images/same.png"/>
        <img src="images/same.png"/>
      </root>
    `);

    expect(collectAssetReferences(root)).toHaveLength(2);
  });

  test('returns the element carrying each reference', () => {
    const root = parse('<root><img id="target" src="images/one.png"/></root>');

    const reference = collectAssetReferences(root)[0];
    expect(reference?.element.getAttribute('id')).toBe('target');
  });

  test('ignores elements without asset attributes', () => {
    const root = parse('<root><p>text</p><span href="page.html"/></root>');

    expect(collectAssetReferences(root)).toEqual([]);
  });

  test('ignores empty attribute values', () => {
    const root = parse('<root><img src=""/><object data=""/></root>');

    expect(collectAssetReferences(root)).toEqual([]);
  });

  test('does not inspect the root element itself', () => {
    const root = parse('<root src="images/root.png"/>');

    expect(collectAssetReferences(root)).toEqual([]);
  });
});

describe('uniqueAssetUrls', () => {
  test('removes duplicates while preserving document order', () => {
    const root = parse(`
      <root>
        <img src="b.png"/>
        <img src="a.png"/>
        <img src="b.png"/>
        <object data="a.png"/>
        <object data="c.png"/>
      </root>
    `);

    expect(uniqueAssetUrls(collectAssetReferences(root))).toEqual([
      'b.png',
      'a.png',
      'c.png',
    ]);
  });

  test('returns an empty array when there are no references', () => {
    expect(uniqueAssetUrls([])).toEqual([]);
  });
});
