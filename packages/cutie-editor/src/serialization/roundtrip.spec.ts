import { describe, expect, it } from 'vitest';
import { serializeSlateToXml } from './slateToXml';
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
      const content = '<p>Hello world</p>';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(content));
    });

    it('should preserve paragraph with bold text', () => {
      const content = '<p>Hello <strong>world</strong></p>';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(content));
    });

    it('should preserve paragraph with italic text', () => {
      const content = '<p>Hello <em>world</em></p>';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(content));
    });

    it('should preserve mixed formatting', () => {
      const content = '<p>Normal <strong>bold</strong> and <em>italic</em> text</p>';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(content));
    });

    it('should preserve headings', () => {
      const content = '<h1>Title</h1><h2>Subtitle</h2>';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(content));
    });

    it('should preserve div with attributes', () => {
      const content = '<div class="container" id="main">Content</div>';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toContain('class="container"');
      expect(normalizeXml(output)).toContain('id="main"');
      expect(normalizeXml(output)).toContain('Content');
    });

    it('should preserve unordered lists', () => {
      const content = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(content));
    });

    it('should preserve ordered lists', () => {
      const content = '<ol><li>First</li><li>Second</li></ol>';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(content));
    });
  });

  describe('QTI interactions', () => {
    it('should preserve text entry interaction with all attributes', () => {
      const content = '<qti-text-entry-interaction response-identifier="RESPONSE_1" expected-length="10" pattern-mask="[0-9]+" placeholder-text="Enter number"></qti-text-entry-interaction>';
      const input = wrapInQtiItem(content);

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
      const content = '<qti-extended-text-interaction response-identifier="RESPONSE_2" expected-lines="5"></qti-extended-text-interaction>';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml, responseIdentifiers } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(output).toContain('response-identifier="RESPONSE_2"');
      expect(output).toContain('expected-lines="5"');
      expect(responseIdentifiers).toEqual(['RESPONSE_2']);
    });

    it('should preserve choice interaction with choices', () => {
      const content = `
        <qti-choice-interaction response-identifier="RESPONSE_3" max-choices="1" shuffle="true">
          <qti-simple-choice identifier="choice-1">First choice</qti-simple-choice>
          <qti-simple-choice identifier="choice-2">Second choice</qti-simple-choice>
        </qti-choice-interaction>
      `;
      const input = wrapInQtiItem(content);

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
      const content = `
        <qti-choice-interaction response-identifier="R1" max-choices="1">
          <qti-prompt>Select the correct answer:</qti-prompt>
          <qti-simple-choice identifier="a">Answer A</qti-simple-choice>
          <qti-simple-choice identifier="b">Answer B</qti-simple-choice>
        </qti-choice-interaction>
      `;
      const input = wrapInQtiItem(content);

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
      const content = '<div><p>Paragraph in <strong>div</strong></p></div>';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(content));
    });

    it('should preserve mixed content with interactions', () => {
      const content = `
        <p>Enter your answer: <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction></p>
        <p>More text here</p>
      `;
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml, responseIdentifiers } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(output).toContain('Enter your answer:');
      expect(output).toContain('qti-text-entry-interaction');
      expect(output).toContain('More text here');
      expect(responseIdentifiers).toEqual(['R1']);
    });

    it('should preserve question with multiple interactions', () => {
      const content = `
        <div>
          <h2>Question 1</h2>
          <p>Part A: <qti-text-entry-interaction response-identifier="R1"></qti-text-entry-interaction></p>
          <p>Part B: <qti-text-entry-interaction response-identifier="R2"></qti-text-entry-interaction></p>
        </div>
      `;
      const input = wrapInQtiItem(content);

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
      const content = '<div data-test="value" data-id="123">Content</div>';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(output).toContain('data-test="value"');
      expect(output).toContain('data-id="123"');
    });

    it('should preserve style and class attributes', () => {
      const content = '<div class="highlight" style="color: red;">Styled</div>';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(output).toContain('class="highlight"');
      expect(output).toContain('style="color: red;"');
    });
  });

  describe('unknown QTI elements', () => {
    it('should preserve unknown QTI elements with raw XML', () => {
      const content = '<qti-hotspot-interaction response-identifier="R1" max-choices="2"><qti-hotspot-choice identifier="h1">Hot 1</qti-hotspot-choice></qti-hotspot-interaction>';
      const input = wrapInQtiItem(content);

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
      const content = `
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
      const input = wrapInQtiItem(content);

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
      const content = '<p></p>';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(normalizeXml(output)).toBe(normalizeXml(content));
    });

    it('should handle self-closing tags', () => {
      const content = '<img src="test.jpg" alt="Test" />';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      expect(output).toContain('src="test.jpg"');
      expect(output).toContain('alt="Test"');
    });

    it('should handle special characters in text', () => {
      const content = '<p>Text with &lt;special&gt; &amp; "characters"</p>';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      // XML should properly escape special characters
      expect(output).toContain('&lt;');
      expect(output).toContain('&gt;');
      expect(output).toContain('&amp;');
    });
  });

  describe('whitespace handling', () => {
    it('should collapse consecutive spaces in text', () => {
      const content = '<p>Hello    World</p>';
      const input = wrapInQtiItem(content);
      const slateNodes = parseXmlToSlate(input);

      // Check Slate representation has single space
      expect(slateNodes[0]).toHaveProperty('children');
      const children = (slateNodes[0] as any).children;
      expect(children[0].text).toBe('Hello World');
    });

    it('should collapse newlines to spaces', () => {
      const content = '<p>Hello\n\nWorld</p>';
      const input = wrapInQtiItem(content);
      const slateNodes = parseXmlToSlate(input);

      const children = (slateNodes[0] as any).children;
      expect(children[0].text).toBe('Hello World');
    });

    it('should collapse tabs to spaces', () => {
      const content = '<p>Hello\t\tWorld</p>';
      const input = wrapInQtiItem(content);
      const slateNodes = parseXmlToSlate(input);

      const children = (slateNodes[0] as any).children;
      expect(children[0].text).toBe('Hello World');
    });

    it('should collapse mixed whitespace (spaces, tabs, newlines)', () => {
      const content = '<p>Hello \t\n  \t World</p>';
      const input = wrapInQtiItem(content);
      const slateNodes = parseXmlToSlate(input);

      const children = (slateNodes[0] as any).children;
      expect(children[0].text).toBe('Hello World');
    });

    it('should handle XML formatting indentation', () => {
      const content = `
        <p>
          This is a paragraph
          split across lines
        </p>
      `;
      const input = wrapInQtiItem(content);
      const slateNodes = parseXmlToSlate(input);

      const children = (slateNodes[0] as any).children;
      // XML formatting (indentation, newlines) should collapse to single spaces
      expect(children[0].text).toBe(' This is a paragraph split across lines ');
    });

    it('should preserve space between inline elements', () => {
      const content = '<p><strong>Hello</strong> <em>World</em></p>';
      const input = wrapInQtiItem(content);
      const slateNodes = parseXmlToSlate(input);

      const children = (slateNodes[0] as any).children;
      // Should have three children: "Hello" (bold), " " (space), "World" (italic)
      expect(children).toHaveLength(3);
      expect(children[0].text).toBe('Hello');
      expect(children[0].bold).toBe(true);
      expect(children[1].text).toBe(' ');
      expect(children[2].text).toBe('World');
      expect(children[2].italic).toBe(true);
    });

    it('should only create line breaks with br elements', () => {
      const content = '<p>Line 1<br/>Line 2</p>';
      const input = wrapInQtiItem(content);
      const slateNodes = parseXmlToSlate(input);

      const children = (slateNodes[0] as any).children;
      // Should have three children: text "Line 1", line-break element, text "Line 2"
      expect(children).toHaveLength(3);
      expect(children[0].text).toBe('Line 1');
      expect(children[1].type).toBe('line-break');
      expect(children[2].text).toBe('Line 2');
    });

    it('should not create line breaks from newlines in source', () => {
      const content = '<p>Line 1\nLine 2</p>';
      const input = wrapInQtiItem(content);
      const slateNodes = parseXmlToSlate(input);

      const children = (slateNodes[0] as any).children;
      // Should have single text node with space instead of newline
      expect(children).toHaveLength(1);
      expect(children[0].text).toBe('Line 1 Line 2');
    });

    it('should handle whitespace in choice interactions', () => {
      const content = `
        <qti-choice-interaction response-identifier="R1" max-choices="1">
          <qti-simple-choice identifier="a">
            Option A
          </qti-simple-choice>
          <qti-simple-choice identifier="b">
            Option B
          </qti-simple-choice>
        </qti-choice-interaction>
      `;
      const input = wrapInQtiItem(content);
      const slateNodes = parseXmlToSlate(input);

      const choiceInteraction = slateNodes[0] as any;
      const choices = choiceInteraction.children;

      // Each choice should have normalized text
      expect(choices[0].children[0].text).toBe(' Option A ');
      expect(choices[1].children[0].text).toBe(' Option B ');
    });

    it('should preserve single spaces between words', () => {
      const content = '<p>This is a normal sentence with single spaces.</p>';
      const input = wrapInQtiItem(content);
      const slateNodes = parseXmlToSlate(input);

      const children = (slateNodes[0] as any).children;
      expect(children[0].text).toBe('This is a normal sentence with single spaces.');
    });

    it('should handle whitespace around inline elements correctly', () => {
      const content = '<p>Start <strong>bold</strong> end</p>';
      const input = wrapInQtiItem(content);
      const slateNodes = parseXmlToSlate(input);

      const children = (slateNodes[0] as any).children;
      expect(children).toHaveLength(3);
      expect(children[0].text).toBe('Start ');
      expect(children[1].text).toBe('bold');
      expect(children[1].bold).toBe(true);
      expect(children[2].text).toBe(' end');
    });

    it('should collapse whitespace in complex nested structures', () => {
      const content = `
        <div>
          <p>
            Paragraph with
            multiple lines
          </p>
          <p>
            Another paragraph
          </p>
        </div>
      `;
      const input = wrapInQtiItem(content);
      const slateNodes = parseXmlToSlate(input);

      const divElement = slateNodes[0] as any;
      const paragraphs = divElement.children;

      expect(paragraphs[0].children[0].text).toBe(' Paragraph with multiple lines ');
      expect(paragraphs[1].children[0].text).toBe(' Another paragraph ');
    });
  });
});
