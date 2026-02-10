import { describe, expect, it } from 'vitest';
import { formatXmlDom } from './formatXmlDom';

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, 'application/xml');
}

function serialize(doc: Document): string {
  return new XMLSerializer().serializeToString(doc);
}

function formatAndSerialize(xml: string): string {
  const doc = parseXml(xml);
  formatXmlDom(doc.documentElement);
  return serialize(doc);
}

describe('formatXmlDom', () => {
  it('should indent block children of a block container', () => {
    const result = formatAndSerialize(
      '<qti-assessment-item><qti-response-declaration/><qti-item-body/></qti-assessment-item>'
    );
    expect(result).toContain('\n  <qti-response-declaration/>');
    expect(result).toContain('\n  <qti-item-body/>');
    // Closing tag should be on its own line
    expect(result).toMatch(/\n<\/qti-assessment-item>/);
  });

  it('should preserve mixed content as-is', () => {
    const xml = '<p>Hello <em>world</em> and more</p>';
    const result = formatAndSerialize(xml);
    // Mixed content should NOT be modified
    expect(result).toBe(xml);
  });

  it('should handle nested block elements with increasing depth', () => {
    const result = formatAndSerialize(
      '<qti-response-processing><qti-response-condition><qti-response-if/></qti-response-condition></qti-response-processing>'
    );
    expect(result).toContain('\n  <qti-response-condition>');
    expect(result).toContain('\n    <qti-response-if/>');
    expect(result).toContain('\n  </qti-response-condition>');
    expect(result).toContain('\n</qti-response-processing>');
  });

  it('should handle empty elements correctly', () => {
    const result = formatAndSerialize(
      '<qti-assessment-item><qti-response-declaration/></qti-assessment-item>'
    );
    expect(result).toContain('\n  <qti-response-declaration/>');
  });

  it('should treat elements with only whitespace text nodes as block containers', () => {
    const result = formatAndSerialize(
      '<qti-assessment-item>  \n  <qti-response-declaration/>  \n  <qti-item-body/>  </qti-assessment-item>'
    );
    // Whitespace text nodes should be replaced with proper indentation
    expect(result).toContain('\n  <qti-response-declaration/>');
    expect(result).toContain('\n  <qti-item-body/>');
  });

  it('should indent QTI structural elements', () => {
    const result = formatAndSerialize(
      '<qti-response-processing>' +
        '<qti-response-condition>' +
          '<qti-response-if><qti-set-outcome-value/></qti-response-if>' +
          '<qti-response-else><qti-set-outcome-value/></qti-response-else>' +
        '</qti-response-condition>' +
      '</qti-response-processing>'
    );
    expect(result).toContain('\n  <qti-response-condition>');
    expect(result).toContain('\n    <qti-response-if>');
    expect(result).toContain('\n      <qti-set-outcome-value/>');
    expect(result).toContain('\n    </qti-response-if>');
    expect(result).toContain('\n    <qti-response-else>');
  });

  it('should not modify inline element content within block elements', () => {
    const result = formatAndSerialize(
      '<qti-item-body><p>Some <strong>bold</strong> text</p></qti-item-body>'
    );
    // qti-item-body is block, p is block, but p has mixed content so stays flat
    expect(result).toContain('\n  <p>Some <strong>bold</strong> text</p>');
  });

  it('should handle a full QTI document structure', () => {
    const result = formatAndSerialize(
      '<qti-assessment-item>' +
        '<qti-response-declaration/>' +
        '<qti-outcome-declaration/>' +
        '<qti-item-body>' +
          '<qti-choice-interaction>' +
            '<qti-prompt><p>Question?</p></qti-prompt>' +
            '<qti-simple-choice>A</qti-simple-choice>' +
            '<qti-simple-choice>B</qti-simple-choice>' +
          '</qti-choice-interaction>' +
        '</qti-item-body>' +
        '<qti-response-processing/>' +
      '</qti-assessment-item>'
    );
    // Top level children indented
    expect(result).toContain('\n  <qti-response-declaration/>');
    expect(result).toContain('\n  <qti-outcome-declaration/>');
    expect(result).toContain('\n  <qti-item-body>');
    expect(result).toContain('\n  <qti-response-processing/>');
    // Nested block content indented further
    expect(result).toContain('\n    <qti-choice-interaction>');
    expect(result).toContain('\n      <qti-prompt>');
    // p has mixed content, stays flat
    expect(result).toContain('<p>Question?</p>');
    // simple-choice has text content, stays flat
    expect(result).toContain('<qti-simple-choice>A</qti-simple-choice>');
  });

  it('should handle elements with no children', () => {
    const xml = '<qti-assessment-item/>';
    const result = formatAndSerialize(xml);
    expect(result).toBe(xml);
  });

  it('should use custom indent string when provided', () => {
    const doc = parseXml(
      '<qti-assessment-item><qti-response-declaration/></qti-assessment-item>'
    );
    formatXmlDom(doc.documentElement, 0, '\t');
    const result = serialize(doc);
    expect(result).toContain('\n\t<qti-response-declaration/>');
  });
});
