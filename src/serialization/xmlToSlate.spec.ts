import { describe, expect, it } from 'vitest';
import type { SlateElement } from '../types';
import { parseXmlToSlate } from './xmlToSlate';

/**
 * Wrap content in a minimal QTI assessment item for testing
 */
function wrapInQtiItem(content: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item" title="Test Item">
  <qti-item-body>
${content}
  </qti-item-body>
</qti-assessment-item>`;
}

describe('parseXmlToSlate', () => {
  describe('basic XHTML elements', () => {
    it('should parse simple paragraph', () => {
      const xml = wrapInQtiItem('<p>Hello world</p>');
      const result = parseXmlToSlate(xml);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'paragraph',
        children: [{ text: 'Hello world' }],
      });
    });

    it('should parse paragraph with bold text', () => {
      const xml = wrapInQtiItem('<p>Hello <strong>world</strong></p>');
      const result = parseXmlToSlate(xml);

      expect(result).toHaveLength(1);
      const para = result[0] as SlateElement;
      expect(para.type).toBe('paragraph');
      expect(para.children).toHaveLength(2);
      expect(para.children[0]).toEqual({ text: 'Hello ' });
      expect(para.children[1]).toEqual({ text: 'world', bold: true });
    });

    it('should parse paragraph with italic text', () => {
      const xml = wrapInQtiItem('<p>Hello <em>world</em></p>');
      const result = parseXmlToSlate(xml);

      const para = result[0] as SlateElement;
      expect(para.children[1]).toEqual({ text: 'world', italic: true });
    });

    it('should parse multiple paragraphs', () => {
      const xml = wrapInQtiItem('<p>First</p><p>Second</p>');
      const result = parseXmlToSlate(xml);

      expect(result).toHaveLength(2);
      expect((result[0] as SlateElement).type).toBe('paragraph');
      expect((result[1] as SlateElement).type).toBe('paragraph');
    });

    it('should parse headings', () => {
      const xml = wrapInQtiItem('<h1>Title</h1><h2>Subtitle</h2>');
      const result = parseXmlToSlate(xml);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        type: 'heading',
        level: 1,
        children: [{ text: 'Title' }],
      });
      expect(result[1]).toMatchObject({
        type: 'heading',
        level: 2,
        children: [{ text: 'Subtitle' }],
      });
    });

    it('should parse div elements', () => {
      const xml = wrapInQtiItem('<div class="container">Content</div>');
      const result = parseXmlToSlate(xml);

      expect(result[0]).toMatchObject({
        type: 'div',
        children: [{ text: 'Content' }],
        attributes: { class: 'container' },
      });
    });

    it('should parse image elements', () => {
      const xml = wrapInQtiItem('<img src="test.jpg" alt="Test image" width="100" />');
      const result = parseXmlToSlate(xml);

      expect(result[0]).toMatchObject({
        type: 'image',
        children: [{ text: '' }],
        attributes: {
          src: 'test.jpg',
          alt: 'Test image',
          width: '100',
        },
      });
    });

    it('should parse lists', () => {
      const xml = wrapInQtiItem('<ul><li>Item 1</li><li>Item 2</li></ul>');
      const result = parseXmlToSlate(xml);

      expect(result[0]).toMatchObject({
        type: 'list',
        ordered: false,
        children: [
          { type: 'list-item', children: [{ text: 'Item 1' }] },
          { type: 'list-item', children: [{ text: 'Item 2' }] },
        ],
      });
    });
  });

  describe('QTI interactions', () => {
    it('should parse text entry interaction', () => {
      const xml = wrapInQtiItem('<qti-text-entry-interaction response-identifier="RESPONSE_1" expected-length="10" />');
      const result = parseXmlToSlate(xml);

      expect(result[0]).toMatchObject({
        type: 'qti-text-entry-interaction',
        children: [{ text: '' }],
        attributes: {
          'response-identifier': 'RESPONSE_1',
          'expected-length': '10',
        },
      });
    });

    it('should parse extended text interaction', () => {
      const xml = wrapInQtiItem('<qti-extended-text-interaction response-identifier="RESPONSE_1" expected-lines="5" />');
      const result = parseXmlToSlate(xml);

      expect(result[0]).toMatchObject({
        type: 'qti-extended-text-interaction',
        children: [{ text: '' }],
        attributes: {
          'response-identifier': 'RESPONSE_1',
          'expected-lines': '5',
        },
      });
    });

    it('should parse choice interaction with simple choices', () => {
      const xml = wrapInQtiItem(`
        <qti-choice-interaction response-identifier="RESPONSE_1" max-choices="1">
          <qti-simple-choice identifier="choice-1">First choice</qti-simple-choice>
          <qti-simple-choice identifier="choice-2">Second choice</qti-simple-choice>
        </qti-choice-interaction>
      `);
      const result = parseXmlToSlate(xml);

      expect(result[0]).toMatchObject({
        type: 'qti-choice-interaction',
        attributes: {
          'response-identifier': 'RESPONSE_1',
          'max-choices': '1',
        },
      });

      const choice = result[0] as SlateElement;
      expect(choice.children).toHaveLength(2);
      expect(choice.children[0]).toMatchObject({
        type: 'qti-simple-choice',
        attributes: { identifier: 'choice-1' },
        children: [{ text: 'First choice' }],
      });
    });

    it('should parse choice interaction with prompt', () => {
      const xml = wrapInQtiItem(`
        <qti-choice-interaction response-identifier="RESPONSE_1" max-choices="1">
          <qti-prompt>Select the correct answer:</qti-prompt>
          <qti-simple-choice identifier="choice-1">Answer</qti-simple-choice>
        </qti-choice-interaction>
      `);
      const result = parseXmlToSlate(xml);

      const choice = result[0] as SlateElement;
      expect(choice.children[0]).toMatchObject({
        type: 'qti-prompt',
        children: [{ text: 'Select the correct answer:' }],
      });
    });
  });

  describe('unknown QTI elements', () => {
    it('should preserve unknown QTI elements with warning', () => {
      const xml = wrapInQtiItem('<qti-hotspot-interaction response-identifier="RESPONSE_1">Content</qti-hotspot-interaction>');
      const result = parseXmlToSlate(xml);

      expect(result[0]).toMatchObject({
        type: 'qti-unknown',
        originalTagName: 'qti-hotspot-interaction',
        children: [{ text: 'Content' }],
        attributes: {
          'response-identifier': 'RESPONSE_1',
        },
      });

      const unknown = result[0] as SlateElement;
      expect(unknown).toHaveProperty('rawXml');
      expect((unknown as any).rawXml).toContain('qti-hotspot-interaction');
    });
  });

  describe('attribute preservation', () => {
    it('should preserve all XML attributes', () => {
      const xml = wrapInQtiItem('<div class="test" id="my-div" data-custom="value">Content</div>');
      const result = parseXmlToSlate(xml);

      expect((result[0] as SlateElement).attributes).toEqual({
        class: 'test',
        id: 'my-div',
        'data-custom': 'value',
      });
    });

    it('should preserve kebab-case attribute names', () => {
      const xml = wrapInQtiItem('<qti-text-entry-interaction response-identifier="R1" pattern-mask="[0-9]+" />');
      const result = parseXmlToSlate(xml);

      expect((result[0] as SlateElement).attributes).toMatchObject({
        'response-identifier': 'R1',
        'pattern-mask': '[0-9]+',
      });
    });
  });

  describe('nested structures', () => {
    it('should parse nested formatting', () => {
      const xml = wrapInQtiItem('<p>This is <strong>bold and <em>italic</em></strong> text</p>');
      const result = parseXmlToSlate(xml);

      const para = result[0] as SlateElement;
      expect(para.children).toHaveLength(4);
      expect(para.children[0]).toEqual({ text: 'This is ' });
      expect(para.children[1]).toEqual({ text: 'bold and ', bold: true });
      expect(para.children[2]).toEqual({ text: 'italic', bold: true, italic: true });
      expect(para.children[3]).toEqual({ text: ' text' });
    });

    it('should parse paragraph inside div', () => {
      const xml = wrapInQtiItem('<div><p>Nested paragraph</p></div>');
      const result = parseXmlToSlate(xml);

      const div = result[0] as SlateElement;
      expect(div.type).toBe('div');
      expect(div.children[0]).toMatchObject({
        type: 'paragraph',
        children: [{ text: 'Nested paragraph' }],
      });
    });
  });

  describe('qti-item-body handling', () => {
    it('should extract content from qti-item-body', () => {
      const xml = `
        <qti-assessment-item>
          <qti-item-body>
            <p>Question text</p>
          </qti-item-body>
        </qti-assessment-item>
      `;
      const result = parseXmlToSlate(xml);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'paragraph',
        children: [{ text: 'Question text' }],
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const xml = wrapInQtiItem('<p></p>');
      const result = parseXmlToSlate(xml);

      expect(result[0]).toMatchObject({
        type: 'paragraph',
        children: [{ text: '' }],
      });
    });

    it('should return default paragraph for invalid XML', () => {
      const xml = 'not valid xml <>';

      expect(() => parseXmlToSlate(xml)).toThrow();
    });

    it('should handle mixed content with text nodes', () => {
      const xml = wrapInQtiItem('<p>Start <strong>bold</strong> end</p>');
      const result = parseXmlToSlate(xml);

      const para = result[0] as SlateElement;
      expect(para.children).toHaveLength(3);
      expect(para.children[0]).toEqual({ text: 'Start ' });
      expect(para.children[1]).toEqual({ text: 'bold', bold: true });
      expect(para.children[2]).toEqual({ text: ' end' });
    });
  });
});
