import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
import { AttemptState } from '../types.js';
import { resolveDeliveryOptions } from './deliveryOptions.js';
import { instantiateTemplate } from './templateInstance.js';

function state(correctResponses: Record<string, unknown>): AttemptState {
  return {
    variables: {},
    completionStatus: 'not_attempted',
    score: null,
    options: resolveDeliveryOptions(),
    triesAllowed: 1,
    triesUsed: 0,
    triesRemaining: 1,
    correctResponses,
  };
}

function childTags(doc: Document, identifier: string): string[] {
  const declaration = Array.from(doc.getElementsByTagName('qti-response-declaration')).find(
    (el) => el.getAttribute('identifier') === identifier
  );
  return Array.from(declaration?.childNodes ?? [])
    .filter((node): node is Element => node.nodeType === 1)
    .map((el) => el.tagName);
}

const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="i">
  <qti-response-declaration identifier="MAPPED" cardinality="single" base-type="identifier">
    <qti-default-value><qti-value>A</qti-value></qti-default-value>
    <qti-mapping default-value="0"><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping>
  </qti-response-declaration>
  <qti-response-declaration identifier="DECLARED" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-item-body><p>Item</p></qti-item-body>
</qti-assessment-item>`;

describe('instantiateTemplate', () => {
  test('puts the correct response before any mapping, as QTI orders them', () => {
    const doc = instantiateTemplate(new DOMParser().parseFromString(itemXml, 'text/xml'), state({ MAPPED: 'B' }));
    expect(childTags(doc, 'MAPPED')).toEqual(['qti-default-value', 'qti-correct-response', 'qti-mapping']);
  });

  test('replaces a declared correct response, and removes it for NULL', () => {
    const replaced = instantiateTemplate(new DOMParser().parseFromString(itemXml, 'text/xml'), state({ DECLARED: 'B' }));
    const correct = Array.from(replaced.getElementsByTagName('qti-correct-response'));
    expect(correct.map((el) => el.textContent)).toEqual(['B']);

    const removed = instantiateTemplate(new DOMParser().parseFromString(itemXml, 'text/xml'), state({ DECLARED: null }));
    expect(childTags(removed, 'DECLARED')).toEqual([]);
  });
});
