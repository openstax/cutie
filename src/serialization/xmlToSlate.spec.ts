import type { Descendant } from 'slate';
import { describe, expect, it } from 'vitest';
import type { DocumentMetadata, SlateElement } from '../types';
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

/**
 * Helper to extract content nodes from parse result, excluding document-metadata.
 * The document-metadata node is always at position [0], so this returns nodes from [1] onwards.
 */
function getContentNodes(result: Descendant[]): Descendant[] {
  if (result.length > 0 && 'type' in result[0] && result[0].type === 'document-metadata') {
    return result.slice(1);
  }
  return result;
}

/**
 * Helper to get the document metadata from parse result
 */
function getMetadata(result: Descendant[]): DocumentMetadata | null {
  if (result.length > 0 && 'type' in result[0] && result[0].type === 'document-metadata') {
    return result[0] as DocumentMetadata;
  }
  return null;
}

describe('parseXmlToSlate', () => {
  describe('empty document handling', () => {
    it('should return default structure for empty string', () => {
      const result = parseXmlToSlate('');
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        type: 'document-metadata',
        responseProcessing: { mode: 'allCorrect' },
      });
      expect(result[1]).toMatchObject({
        type: 'paragraph',
        children: [{ text: '' }],
      });
    });

    it('should return default structure for whitespace-only string', () => {
      const result = parseXmlToSlate('   \n\t  ');
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        type: 'document-metadata',
        responseProcessing: { mode: 'allCorrect' },
      });
      expect(result[1]).toMatchObject({
        type: 'paragraph',
        children: [{ text: '' }],
      });
    });
  });

  describe('document metadata', () => {
    it('should include document-metadata node at position [0]', () => {
      const xml = wrapInQtiItem('<p>Hello world</p>');
      const result = parseXmlToSlate(xml);

      const metadata = getMetadata(result);
      expect(metadata).not.toBeNull();
      expect(metadata?.type).toBe('document-metadata');
      expect(metadata?.responseProcessing).toBeDefined();
    });

    it('should default to allCorrect mode when no response processing present', () => {
      const xml = wrapInQtiItem('<p>Hello world</p>');
      const result = parseXmlToSlate(xml);

      const metadata = getMetadata(result);
      expect(metadata?.responseProcessing.mode).toBe('allCorrect');
    });
  });

  describe('basic XHTML elements', () => {
    it('should parse simple paragraph', () => {
      const xml = wrapInQtiItem('<p>Hello world</p>');
      const result = getContentNodes(parseXmlToSlate(xml));

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'paragraph',
        children: [{ text: 'Hello world' }],
      });
    });

    it('should parse paragraph with bold text', () => {
      const xml = wrapInQtiItem('<p>Hello <strong>world</strong></p>');
      const result = getContentNodes(parseXmlToSlate(xml));

      expect(result).toHaveLength(1);
      const para = result[0] as SlateElement;
      expect(para.type).toBe('paragraph');
      expect(para.children).toHaveLength(2);
      expect(para.children[0]).toEqual({ text: 'Hello ' });
      expect(para.children[1]).toEqual({ text: 'world', bold: true });
    });

    it('should parse paragraph with italic text', () => {
      const xml = wrapInQtiItem('<p>Hello <em>world</em></p>');
      const result = getContentNodes(parseXmlToSlate(xml));

      const para = result[0] as SlateElement;
      expect(para.children[1]).toEqual({ text: 'world', italic: true });
    });

    it('should parse multiple paragraphs', () => {
      const xml = wrapInQtiItem('<p>First</p><p>Second</p>');
      const result = getContentNodes(parseXmlToSlate(xml));

      expect(result).toHaveLength(2);
      expect((result[0] as SlateElement).type).toBe('paragraph');
      expect((result[1] as SlateElement).type).toBe('paragraph');
    });

    it('should parse headings', () => {
      const xml = wrapInQtiItem('<h1>Title</h1><h2>Subtitle</h2>');
      const result = getContentNodes(parseXmlToSlate(xml));

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
      const result = getContentNodes(parseXmlToSlate(xml));

      expect(result[0]).toMatchObject({
        type: 'div',
        children: [{ text: 'Content' }],
        attributes: { class: 'container' },
      });
    });

    it('should parse image elements (standalone images wrapped in paragraph)', () => {
      const xml = wrapInQtiItem('<img src="test.jpg" alt="Test image" width="100" />');
      const result = getContentNodes(parseXmlToSlate(xml));

      // Standalone images are wrapped in paragraphs since images are inline
      expect(result[0]).toMatchObject({
        type: 'paragraph',
        children: [
          {
            type: 'image',
            children: [{ text: '' }],
            attributes: {
              src: 'test.jpg',
              alt: 'Test image',
              width: '100',
            },
          },
        ],
      });
    });

    it('should parse lists', () => {
      const xml = wrapInQtiItem('<ul><li>Item 1</li><li>Item 2</li></ul>');
      const result = getContentNodes(parseXmlToSlate(xml));

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
    it('should parse text entry interaction (standalone wrapped in paragraph)', () => {
      const xml = wrapInQtiItem('<qti-text-entry-interaction response-identifier="RESPONSE_1" expected-length="10" />');
      const result = getContentNodes(parseXmlToSlate(xml));

      // Standalone inline interactions are wrapped in paragraphs
      expect(result[0]).toMatchObject({
        type: 'paragraph',
        children: [
          {
            type: 'qti-text-entry-interaction',
            children: [{ text: '' }],
            attributes: {
              'response-identifier': 'RESPONSE_1',
              'expected-length': '10',
            },
          },
        ],
      });
    });

    it('should parse extended text interaction', () => {
      const xml = wrapInQtiItem('<qti-extended-text-interaction response-identifier="RESPONSE_1" expected-lines="5" />');
      const result = getContentNodes(parseXmlToSlate(xml));

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
      const result = getContentNodes(parseXmlToSlate(xml));

      expect(result[0]).toMatchObject({
        type: 'qti-choice-interaction',
        attributes: {
          'response-identifier': 'RESPONSE_1',
          'max-choices': '1',
        },
      });

      const choice = result[0] as SlateElement;
      expect(choice.children).toHaveLength(2);
      // qti-simple-choice now has choice-id-label (void with identifier in attributes) and choice-content children
      // Parser passes raw children; normalization wraps text in paragraphs when loaded into editor
      expect(choice.children[0]).toMatchObject({
        type: 'qti-simple-choice',
        attributes: { identifier: 'choice-1' },
        children: [
          { type: 'choice-id-label', children: [{ text: '' }], attributes: { identifier: 'choice-1' } },
          { type: 'choice-content', children: [{ text: 'First choice' }] },
        ],
      });
    });

    it('should parse choice interaction with prompt', () => {
      const xml = wrapInQtiItem(`
        <qti-choice-interaction response-identifier="RESPONSE_1" max-choices="1">
          <qti-prompt>Select the correct answer:</qti-prompt>
          <qti-simple-choice identifier="choice-1">Answer</qti-simple-choice>
        </qti-choice-interaction>
      `);
      const result = getContentNodes(parseXmlToSlate(xml));

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
      const result = getContentNodes(parseXmlToSlate(xml));

      // qti-unknown elements are inline, so they get wrapped in a paragraph
      const para = result[0] as SlateElement;
      expect(para.type).toBe('paragraph');

      const unknown = para.children[0] as SlateElement;
      expect(unknown).toMatchObject({
        type: 'qti-unknown',
        originalTagName: 'qti-hotspot-interaction',
        children: [{ text: 'Content' }],
        attributes: {
          'response-identifier': 'RESPONSE_1',
        },
      });

      expect(unknown).toHaveProperty('rawXml');
      expect((unknown as any).rawXml).toContain('qti-hotspot-interaction');
    });
  });

  describe('attribute preservation', () => {
    it('should preserve all XML attributes', () => {
      const xml = wrapInQtiItem('<div class="test" id="my-div" data-custom="value">Content</div>');
      const result = getContentNodes(parseXmlToSlate(xml));

      expect((result[0] as SlateElement & { attributes: Record<string, string> }).attributes).toEqual({
        class: 'test',
        id: 'my-div',
        'data-custom': 'value',
      });
    });

    it('should preserve kebab-case attribute names', () => {
      const xml = wrapInQtiItem('<qti-text-entry-interaction response-identifier="R1" pattern-mask="[0-9]+" />');
      const result = getContentNodes(parseXmlToSlate(xml));

      // Standalone inline interaction is wrapped in paragraph
      const para = result[0] as SlateElement;
      expect(para.type).toBe('paragraph');
      const interaction = para.children[0] as SlateElement & { attributes: Record<string, string> };
      expect(interaction.attributes).toMatchObject({
        'response-identifier': 'R1',
        'pattern-mask': '[0-9]+',
      });
    });
  });

  describe('nested structures', () => {
    it('should parse nested formatting', () => {
      const xml = wrapInQtiItem('<p>This is <strong>bold and <em>italic</em></strong> text</p>');
      const result = getContentNodes(parseXmlToSlate(xml));

      const para = result[0] as SlateElement;
      expect(para.children).toHaveLength(4);
      expect(para.children[0]).toEqual({ text: 'This is ' });
      expect(para.children[1]).toEqual({ text: 'bold and ', bold: true });
      expect(para.children[2]).toEqual({ text: 'italic', bold: true, italic: true });
      expect(para.children[3]).toEqual({ text: ' text' });
    });

    it('should parse paragraph inside div', () => {
      const xml = wrapInQtiItem('<div><p>Nested paragraph</p></div>');
      const result = getContentNodes(parseXmlToSlate(xml));

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
      const result = getContentNodes(parseXmlToSlate(xml));

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
      const result = getContentNodes(parseXmlToSlate(xml));

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
      const result = getContentNodes(parseXmlToSlate(xml));

      const para = result[0] as SlateElement;
      expect(para.children).toHaveLength(3);
      expect(para.children[0]).toEqual({ text: 'Start ' });
      expect(para.children[1]).toEqual({ text: 'bold', bold: true });
      expect(para.children[2]).toEqual({ text: ' end' });
    });
  });
});
