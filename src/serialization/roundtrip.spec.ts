import { describe, expect, it } from 'vitest';
import { serializeSlateToXml } from './slateToXml';
import { parseXmlToSlate } from './xmlToSlate';

/**
 * Normalize XML for comparison by removing whitespace between tags
 */
function normalizeXml(xml: string): string {
  return xml
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract content from qti-item-body for comparison
 */
function extractItemBodyContent(xml: string): string {
  const match = xml.match(/<qti-item-body[^>]*>(.*?)<\/qti-item-body>/s);
  return match ? match[1].trim() : xml;
}

describe('XML Round-trip Tests', () => {
  describe('XHTML elements', () => {
    it('should preserve simple paragraph', () => {
      const input = '<p>Hello world</p>';

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(input));
    });

    it('should preserve paragraph with bold text', () => {
      const input = '<p>Hello <strong>world</strong></p>';

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(input));
    });

    it('should preserve paragraph with italic text', () => {
      const input = '<p>Hello <em>world</em></p>';

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(input));
    });

    it('should preserve mixed formatting', () => {
      const input = '<p>Normal <strong>bold</strong> and <em>italic</em> text</p>';

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(input));
    });

    it('should preserve headings', () => {
      const input = '<h1>Title</h1><h2>Subtitle</h2>';

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(input));
    });

    it('should preserve div with attributes', () => {
      const input = '<div class="container" id="main">Content</div>';

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toContain('class="container"');
      expect(normalizeXml(output)).toContain('id="main"');
      expect(normalizeXml(output)).toContain('Content');
    });

    it('should preserve unordered lists', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(input));
    });

    it('should preserve ordered lists', () => {
      const input = '<ol><li>First</li><li>Second</li></ol>';

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(input));
    });
  });

  describe('QTI interactions', () => {
    it('should preserve text entry interaction with all attributes', () => {
      const input = '<qti-text-entry-interaction response-identifier="RESPONSE_1" expected-length="10" pattern-mask="[0-9]+" placeholder-text="Enter number"></qti-text-entry-interaction>';

      const slateNodes = parseXmlToSlate(input);
      const { xml, responseIdentifiers } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(output).toContain('response-identifier="RESPONSE_1"');
      expect(output).toContain('expected-length="10"');
      expect(output).toContain('pattern-mask="[0-9]+"');
      expect(output).toContain('placeholder-text="Enter number"');
      expect(responseIdentifiers).toEqual(['RESPONSE_1']);
    });

    it('should preserve extended text interaction', () => {
      const input = '<qti-extended-text-interaction response-identifier="RESPONSE_2" expected-lines="5"></qti-extended-text-interaction>';

      const slateNodes = parseXmlToSlate(input);
      const { xml, responseIdentifiers } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(output).toContain('response-identifier="RESPONSE_2"');
      expect(output).toContain('expected-lines="5"');
      expect(responseIdentifiers).toEqual(['RESPONSE_2']);
    });

    it('should preserve choice interaction with choices', () => {
      const input = `
        <qti-choice-interaction response-identifier="RESPONSE_3" max-choices="1" shuffle="true">
          <qti-simple-choice identifier="choice-1">First choice</qti-simple-choice>
          <qti-simple-choice identifier="choice-2">Second choice</qti-simple-choice>
        </qti-choice-interaction>
      `;

      const slateNodes = parseXmlToSlate(input);
      const { xml, responseIdentifiers } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(output).toContain('qti-choice-interaction');
      expect(output).toContain('response-identifier="RESPONSE_3"');
      expect(output).toContain('max-choices="1"');
      expect(output).toContain('qti-simple-choice');
      expect(output).toContain('identifier="choice-1"');
      expect(output).toContain('First choice');
      expect(responseIdentifiers).toEqual(['RESPONSE_3']);
    });

    it('should preserve choice interaction with prompt', () => {
      const input = `
        <qti-choice-interaction response-identifier="R1" max-choices="1">
          <qti-prompt>Select the correct answer:</qti-prompt>
          <qti-simple-choice identifier="a">Answer A</qti-simple-choice>
          <qti-simple-choice identifier="b">Answer B</qti-simple-choice>
        </qti-choice-interaction>
      `;

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(output).toContain('<qti-prompt>Select the correct answer:</qti-prompt>');
      expect(output).toContain('identifier="a"');
      expect(output).toContain('Answer A');
    });
  });

  describe('complex structures', () => {
    it('should preserve nested XHTML', () => {
      const input = '<div><p>Paragraph in <strong>div</strong></p></div>';

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(input));
    });

    it('should preserve mixed content with interactions', () => {
      const input = `
        <p>Enter your answer: <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction></p>
        <p>More text here</p>
      `;

      const slateNodes = parseXmlToSlate(input);
      const { xml, responseIdentifiers } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(output).toContain('Enter your answer:');
      expect(output).toContain('qti-text-entry-interaction');
      expect(output).toContain('More text here');
      expect(responseIdentifiers).toEqual(['R1']);
    });

    it('should preserve question with multiple interactions', () => {
      const input = `
        <div>
          <h2>Question 1</h2>
          <p>Part A: <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction></p>
          <p>Part B: <qti-text-entry-interaction response-identifier="R2"></qti-text-entry-interaction></p>
        </div>
      `;

      const slateNodes = parseXmlToSlate(input);
      const { xml, responseIdentifiers } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(output).toContain('Question 1');
      expect(output).toContain('Part A:');
      expect(output).toContain('Part B:');
      expect(responseIdentifiers).toEqual(['R1', 'R2']);
    });
  });

  describe('attribute preservation', () => {
    it('should preserve custom data attributes', () => {
      const input = '<div data-test="value" data-id="123">Content</div>';

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(output).toContain('data-test="value"');
      expect(output).toContain('data-id="123"');
    });

    it('should preserve style and class attributes', () => {
      const input = '<div class="highlight" style="color: red;">Styled</div>';

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(output).toContain('class="highlight"');
      expect(output).toContain('style="color: red;"');
    });
  });

  describe('unknown QTI elements', () => {
    it('should preserve unknown QTI elements with raw XML', () => {
      const input = '<qti-hotspot-interaction response-identifier="R1" max-choices="2"><qti-hotspot-choice identifier="h1">Hot 1</qti-hotspot-choice></qti-hotspot-interaction>';

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(output).toContain('qti-hotspot-interaction');
      expect(output).toContain('response-identifier="R1"');
      expect(output).toContain('qti-hotspot-choice');
    });
  });

  describe('complete QTI items', () => {
    it('should preserve a complete question', () => {
      const input = `
        <div class="question">
          <h3>Math Question</h3>
          <p>What is 2 + 2?</p>
          <qti-choice-interaction response-identifier="RESPONSE_1" max-choices="1">
            <qti-simple-choice identifier="choice-1">3</qti-simple-choice>
            <qti-simple-choice identifier="choice-2">4</qti-simple-choice>
            <qti-simple-choice identifier="choice-3">5</qti-simple-choice>
          </qti-choice-interaction>
        </div>
      `;

      const slateNodes = parseXmlToSlate(input);
      const { xml, responseIdentifiers, errors } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      // Check structure is preserved
      expect(output).toContain('class="question"');
      expect(output).toContain('Math Question');
      expect(output).toContain('What is 2 + 2?');
      expect(output).toContain('qti-choice-interaction');
      expect(output).toContain('qti-simple-choice');

      // Check all choices preserved
      expect(output).toContain('choice-1');
      expect(output).toContain('choice-2');
      expect(output).toContain('choice-3');

      // Check response ID tracked
      expect(responseIdentifiers).toEqual(['RESPONSE_1']);

      // Check no errors
      expect(errors).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty elements', () => {
      const input = '<p></p>';

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(input));
    });

    it('should handle self-closing tags', () => {
      const input = '<img src="test.jpg" alt="Test" />';

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(output).toContain('src="test.jpg"');
      expect(output).toContain('alt="Test"');
    });

    it('should handle special characters in text', () => {
      const input = '<p>Text with &lt;special&gt; &amp; "characters"</p>';

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      // XML should properly escape special characters
      expect(output).toContain('&lt;');
      expect(output).toContain('&gt;');
      expect(output).toContain('&amp;');
    });
  });
});
