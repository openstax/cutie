/* spell-checker: ignore hottext */
import type { Descendant } from 'slate';
import { describe, expect, it } from 'vitest';
import type { DocumentMetadata, ResponseProcessingMode } from '../types.js';
import { serializeSlateToQti, serializeSlateToXml } from './slateToXml.js';
import { parseXmlToSlate } from './xmlToSlate.js';

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
 * Parse XML string to Document
 */
function parseXml(xml: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(xml, 'application/xml');
}

/**
 * Serialize element's inner content to string (excluding the element's own tags)
 */
function serializeInnerXml(element: Element): string {
  const serializer = new XMLSerializer();
  let result = '';
  for (const child of element.childNodes) {
    result += serializer.serializeToString(child);
  }
  return result;
}

/**
 * Normalize XML for comparison by removing whitespace and namespace declarations
 */
function normalizeXml(xml: string): string {
  return xml
    .replace(/ xmlns="[^"]*"/g, '') // Strip namespace declarations
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract content from qti-item-body for comparison using DOM parsing
 */
function extractItemBodyContent(xml: string): string {
  const doc = parseXml(xml);
  const itemBody = doc.querySelector('qti-item-body');
  if (!itemBody) {
    return xml;
  }
  // Return empty string if body has no children
  if (itemBody.childNodes.length === 0) {
    return '';
  }
  return serializeInnerXml(itemBody).trim();
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

    it('should preserve simple-choice with inline feedback in same paragraph', () => {
      const content = `
        <qti-choice-interaction response-identifier="R1" max-choices="1">
          <qti-simple-choice identifier="a">Correct<qti-feedback-inline outcome-identifier="FEEDBACK" show-hide="show" identifier="correct">Good job!</qti-feedback-inline></qti-simple-choice>
        </qti-choice-interaction>
      `;
      const input = wrapInQtiItem(content);
      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      // Text and feedback should stay together, not be split into separate elements
      expect(output).toContain('Correct<qti-feedback-inline');
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

    it('should not score an unknown interaction the loaded rules did not score', () => {
      const input = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item" title="Test Item">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="END_ATTEMPT" cardinality="single" base-type="boolean"/>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-prompt>Pick one</qti-prompt>
      <qti-simple-choice identifier="A">A</qti-simple-choice>
    </qti-choice-interaction>
    <p><qti-end-attempt-interaction response-identifier="END_ATTEMPT" title="Done"/></p>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

      const item = parseXml(serializeSlateToQti(parseXmlToSlate(input), input).xml).documentElement;

      expect(item.querySelector('qti-response-declaration[identifier="END_ATTEMPT"]')).not.toBeNull();
      expect(item.querySelector('qti-response-processing')?.getAttribute('template')).toContain('match_correct');
      expect(item.querySelector('qti-response-processing [identifier="END_ATTEMPT"]')).toBeNull();
    });

    it('should keep declarations and scoring for unknown interactions', () => {
      const input = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item" title="Test Item">
  <qti-response-declaration identifier="R1" cardinality="multiple" base-type="identifier">
    <qti-correct-response><qti-value>h1</qti-value></qti-correct-response>
    <qti-mapping default-value="0"><qti-map-entry map-key="h1" mapped-value="1"/></qti-mapping>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <qti-hottext-interaction response-identifier="R1" max-choices="0">
      <p><qti-hottext identifier="h1">Hot 1</qti-hottext></p>
    </qti-hottext-interaction>
  </qti-item-body>
  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum><qti-map-response identifier="R1"/></qti-sum>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

      const { xml } = serializeSlateToQti(parseXmlToSlate(input), input);
      const item = parseXml(xml).documentElement;
      const declarations = Array.from(item.children)
        .map(child => child.localName)
        .filter(name => name.endsWith('-declaration'));

      expect(item.querySelector('qti-response-declaration[identifier="R1"] qti-map-entry')).not.toBeNull();
      // SCORE, and MAXSCORE from the hottext mapping
      expect(declarations).toEqual(['qti-response-declaration', 'qti-outcome-declaration', 'qti-outcome-declaration']);
      expect(item.querySelector('qti-outcome-declaration[identifier="MAXSCORE"] qti-value')?.textContent).toBe('1');
      expect(item.querySelector('qti-response-processing qti-sum > qti-map-response[identifier="R1"]')).not.toBeNull();
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
      // Trailing empty paragraphs are stripped during serialization
      // (they exist in the editor for cursor positioning only)
      const content = '<p></p>';
      const input = wrapInQtiItem(content);

      const slateNodes = parseXmlToSlate(input);
      const { xml } = serializeSlateToXml(slateNodes);
      const output = extractItemBodyContent(xml);

      // Empty paragraph at end should be stripped
      expect(normalizeXml(output)).toBe('');
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
      const slateNodes = getContentNodes(parseXmlToSlate(input));

      // Check Slate representation has single space
      expect(slateNodes[0]).toHaveProperty('children');
      const children = (slateNodes[0] as any).children;
      expect(children[0].text).toBe('Hello World');
    });

    it('should collapse newlines to spaces', () => {
      const content = '<p>Hello\n\nWorld</p>';
      const input = wrapInQtiItem(content);
      const slateNodes = getContentNodes(parseXmlToSlate(input));

      const children = (slateNodes[0] as any).children;
      expect(children[0].text).toBe('Hello World');
    });

    it('should collapse tabs to spaces', () => {
      const content = '<p>Hello\t\tWorld</p>';
      const input = wrapInQtiItem(content);
      const slateNodes = getContentNodes(parseXmlToSlate(input));

      const children = (slateNodes[0] as any).children;
      expect(children[0].text).toBe('Hello World');
    });

    it('should collapse mixed whitespace (spaces, tabs, newlines)', () => {
      const content = '<p>Hello \t\n  \t World</p>';
      const input = wrapInQtiItem(content);
      const slateNodes = getContentNodes(parseXmlToSlate(input));

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
      const slateNodes = getContentNodes(parseXmlToSlate(input));

      const children = (slateNodes[0] as any).children;
      // XML formatting (indentation, newlines) should collapse to single spaces
      expect(children[0].text).toBe(' This is a paragraph split across lines ');
    });

    it('should preserve space between inline elements', () => {
      const content = '<p><strong>Hello</strong> <em>World</em></p>';
      const input = wrapInQtiItem(content);
      const slateNodes = getContentNodes(parseXmlToSlate(input));

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
      const slateNodes = getContentNodes(parseXmlToSlate(input));

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
      const slateNodes = getContentNodes(parseXmlToSlate(input));

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
      const slateNodes = getContentNodes(parseXmlToSlate(input));

      const choiceInteraction = slateNodes[0] as any;
      const choices = choiceInteraction.children;

      // Each choice has choice-id-label and choice-content as children
      // Parser passes raw text; normalization wraps in paragraphs when loaded into editor
      const getChoiceText = (choice: any) => {
        const choiceContent = choice.children.find((c: any) => c.type === 'choice-content');
        return choiceContent.children[0].text;
      };

      expect(getChoiceText(choices[0])).toBe(' Option A ');
      expect(getChoiceText(choices[1])).toBe(' Option B ');
    });

    it('should preserve single spaces between words', () => {
      const content = '<p>This is a normal sentence with single spaces.</p>';
      const input = wrapInQtiItem(content);
      const slateNodes = getContentNodes(parseXmlToSlate(input));

      const children = (slateNodes[0] as any).children;
      expect(children[0].text).toBe('This is a normal sentence with single spaces.');
    });

    it('should handle whitespace around inline elements correctly', () => {
      const content = '<p>Start <strong>bold</strong> end</p>';
      const input = wrapInQtiItem(content);
      const slateNodes = getContentNodes(parseXmlToSlate(input));

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
      const slateNodes = getContentNodes(parseXmlToSlate(input));

      const divElement = slateNodes[0] as any;
      const paragraphs = divElement.children;

      expect(paragraphs[0].children[0].text).toBe(' Paragraph with multiple lines ');
      expect(paragraphs[1].children[0].text).toBe(' Another paragraph ');
    });
  });

  describe('outcome values', () => {
    it.each([
      ['CDATA sections separated by a space', '<![CDATA[first]]> <![CDATA[last]]>'],
      ['text separated by a comment', 'first <!-- note --> last'],
      ['a single space', ' '],
    ])('should keep %s verbatim', (_label, value) => {
      const input = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item" title="Test Item">
  <qti-outcome-declaration identifier="LABEL" cardinality="single" base-type="string">
    <qti-default-value><qti-value>${value}</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body><p>Text</p></qti-item-body>
</qti-assessment-item>`;
      const expected = parseXml(input).querySelector('qti-value')!.textContent;
      const item = parseXml(serializeSlateToQti(parseXmlToSlate(input), input).xml);

      expect(item.querySelector('qti-outcome-declaration[identifier="LABEL"] qti-value')?.textContent).toBe(expected);
    });
  });

  describe('CDATA sections', () => {
    it('should keep CDATA content in outcome declarations and body text', () => {
      const input = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item" title="Test Item">
  <qti-outcome-declaration identifier="LEVEL" cardinality="single" base-type="string">
    <qti-default-value><qti-value><![CDATA[a < b]]></qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>
    <p><![CDATA[Is a < b?]]></p>
  </qti-item-body>
</qti-assessment-item>`;
      const item = parseXml(serializeSlateToQti(parseXmlToSlate(input), input).xml);

      expect(item.querySelector('qti-outcome-declaration[identifier="LEVEL"] qti-value')?.textContent).toBe('a < b');
      expect(item.querySelector('qti-item-body p')?.textContent).toBe('Is a < b?');
    });
  });

  describe('prompts', () => {
    it('should keep a formatted paragraph in a match prompt', () => {
      const content = `
        <qti-match-interaction response-identifier="RESPONSE" max-associations="1">
          <qti-prompt><p class="note" style="text-align: right">Match the pairs.</p></qti-prompt>
          <qti-simple-match-set><qti-simple-associable-choice identifier="S" match-max="1">S</qti-simple-associable-choice></qti-simple-match-set>
          <qti-simple-match-set><qti-simple-associable-choice identifier="T" match-max="1">T</qti-simple-associable-choice></qti-simple-match-set>
        </qti-match-interaction>`;
      const input = wrapInQtiItem(content);
      const item = parseXml(serializeSlateToQti(parseXmlToSlate(input), input).xml);
      const paragraph = item.querySelector('qti-prompt > p');

      expect(paragraph?.getAttribute('class')).toBe('note');
      expect(paragraph?.getAttribute('style')).toContain('text-align: right');
      expect(paragraph?.textContent).toBe('Match the pairs.');
    });
  });

  describe('manually graded items', () => {
    const extendedTextItem = (scoreDeclaration: string, responseProcessing = '') => `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item" title="Test Item">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>
  ${scoreDeclaration}
  <qti-item-body>
    <qti-extended-text-interaction response-identifier="RESPONSE">
      <qti-prompt>Explain your answer.</qti-prompt>
    </qti-extended-text-interaction>
  </qti-item-body>
  ${responseProcessing}
</qti-assessment-item>`;

    /** Serialize an item, optionally switching its scoring mode first */
    const roundTrip = (input: string, mode?: ResponseProcessingMode) => {
      const nodes = parseXmlToSlate(input);
      if (mode) {
        (nodes[0] as DocumentMetadata).responseProcessing = { mode };
      }
      return parseXml(serializeSlateToQti(nodes, input).xml).documentElement;
    };

    it('should not add response processing to a human-scored item', () => {
      const item = roundTrip(extendedTextItem(
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" external-scored="human" normal-maximum="2"/>'
      ));
      const score = item.querySelector('qti-outcome-declaration[identifier="SCORE"]')!;

      expect(item.querySelector('qti-response-processing')).toBeNull();
      expect(score.getAttribute('external-scored')).toBe('human');
      expect(score.getAttribute('normal-maximum')).toBe('2');
    });

    it('should mark SCORE as human-scored when switching to manual', () => {
      const item = roundTrip(extendedTextItem(
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"><qti-default-value><qti-value>0</qti-value></qti-default-value></qti-outcome-declaration>',
        '<qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>'
      ), 'manual');
      const score = item.querySelector('qti-outcome-declaration[identifier="SCORE"]')!;

      expect(item.querySelector('qti-response-processing')).toBeNull();
      expect(score.getAttribute('external-scored')).toBe('human');
      expect(score.getAttribute('normal-maximum')).toBe('1.0');
      expect(score.querySelector('qti-default-value')).toBeNull();
    });

    it('should declare SCORE when switching to manual on an item without one', () => {
      const item = roundTrip(extendedTextItem(''), 'manual');
      const score = item.querySelector('qti-outcome-declaration[identifier="SCORE"]');

      expect(score?.getAttribute('external-scored')).toBe('human');
      expect(score?.getAttribute('normal-maximum')).toBe('1.0');
    });

    it('should clear externalMachine scoring only when switching to automatic scoring', () => {
      const input = extendedTextItem(
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" external-scored="externalMachine"/>'
      );
      const scoreOf = (item: Element) => item.querySelector('qti-outcome-declaration[identifier="SCORE"]')!;

      expect(scoreOf(roundTrip(input)).getAttribute('external-scored')).toBe('externalMachine');
      expect(scoreOf(roundTrip(input, 'allCorrect')).hasAttribute('external-scored')).toBe(false);
    });

    /**
     * Switch an item's scoring mode, then switch back the way the editor does:
     * each save is serialized against the previous save, and undo restores the
     * editor state, including the loaded config, but not the XML.
     */
    const switchAndBack = (input: string, mode: ResponseProcessingMode, back?: ResponseProcessingMode) => {
      const nodes = parseXmlToSlate(input);
      const metadata = nodes[0] as DocumentMetadata;
      const loadedConfig = metadata.responseProcessing;
      metadata.responseProcessing = { mode };
      const switched = serializeSlateToQti(nodes, input).xml;
      metadata.responseProcessing = back ? { mode: back } : loadedConfig;
      return parseXml(serializeSlateToQti(nodes, switched).xml)
        .querySelector('qti-outcome-declaration[identifier="SCORE"]');
    };

    it('should restore the points when undoing a switch away from manual', () => {
      const score = switchAndBack(extendedTextItem(
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" external-scored="human" normal-maximum="2"/>'
      ), 'allCorrect');

      expect(score?.getAttribute('normal-maximum')).toBe('2');
    });

    it('should restore the points when switching away from manual and back', () => {
      const score = switchAndBack(extendedTextItem(
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" external-scored="human" normal-maximum="2"/>'
      ), 'allCorrect', 'manual');

      expect(score?.getAttribute('normal-maximum')).toBe('2');
    });

    it.each(['allCorrect', 'manual'] as const)('should restore externalMachine scoring when undoing a switch to %s', (mode) => {
      const score = switchAndBack(extendedTextItem(
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" external-scored="externalMachine" normal-maximum="5"/>'
      ), mode);

      expect(score?.getAttribute('external-scored')).toBe('externalMachine');
      expect(score?.getAttribute('normal-maximum')).toBe('5');
    });

    it('should restore SCORE\'s default value when undoing a switch to manual', () => {
      const score = switchAndBack(extendedTextItem(
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"><qti-default-value><qti-value>0.5</qti-value></qti-default-value></qti-outcome-declaration>',
        '<qti-response-processing><qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value></qti-response-processing>'
      ), 'manual');

      expect(score?.querySelector('qti-default-value qti-value')?.textContent).toBe('0.5');
    });

    it('should drop an externally scored maximum when switching to automatic scoring', () => {
      const item = roundTrip(extendedTextItem(
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" external-scored="externalMachine" normal-maximum="5"/>'
      ), 'allCorrect');
      const score = item.querySelector('qti-outcome-declaration[identifier="SCORE"]')!;

      expect(score.hasAttribute('external-scored')).toBe(false);
      expect(score.hasAttribute('normal-maximum')).toBe(false);
    });

    it('should keep SCORE declared when switching an item without one from manual to automatic scoring', () => {
      const score = switchAndBack(extendedTextItem(''), 'manual', 'allCorrect');

      expect(score).not.toBeNull();
      expect(score?.hasAttribute('external-scored')).toBe(false);
      expect(score?.querySelector('qti-default-value qti-value')?.textContent).toBe('0');
    });

    it('should clear human scoring when switching away from manual', () => {
      const item = roundTrip(extendedTextItem(
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" external-scored="human" normal-maximum="1.0"/>'
      ), 'allCorrect');
      const score = item.querySelector('qti-outcome-declaration[identifier="SCORE"]')!;

      expect(item.querySelector('qti-response-processing')).not.toBeNull();
      expect(score.hasAttribute('external-scored')).toBe(false);
      expect(score.hasAttribute('normal-maximum')).toBe(false);
      expect(score.querySelector('qti-default-value qti-value')?.textContent).toBe('0');
    });
  });

  describe('maximum score declarations', () => {
    // A choice worth 2 points, scored with the map_response template
    const choiceItem = (outcomeDeclarations: string) => `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item" title="Test Item">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
    <qti-mapping default-value="0"><qti-map-entry map-key="A" mapped-value="2"/></qti-mapping>
  </qti-response-declaration>
  ${outcomeDeclarations}
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml"/>
</qti-assessment-item>`;

    /** Serialize an item, optionally switching its scoring mode first */
    const roundTrip = (input: string, mode?: ResponseProcessingMode) => {
      const nodes = parseXmlToSlate(input);
      if (mode) {
        (nodes[0] as DocumentMetadata).responseProcessing = { mode };
      }
      return parseXml(serializeSlateToQti(nodes, input).xml).documentElement;
    };
    const declaration = (item: Element, identifier: string) =>
      item.querySelector(`qti-outcome-declaration[identifier="${identifier}"]`);

    it('should declare the calculated maximum as a float MAXSCORE after SCORE', () => {
      const item = roundTrip(choiceItem('<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>'));
      const identifiers = Array.from(item.querySelectorAll('qti-outcome-declaration')).map((d) => d.getAttribute('identifier'));

      expect(identifiers).toEqual(['SCORE', 'MAXSCORE']);
      expect(declaration(item, 'MAXSCORE')?.getAttribute('base-type')).toBe('float');
      expect(declaration(item, 'MAXSCORE')?.querySelector('qti-value')?.textContent).toBe('2');
    });

    it('should make a loaded MAXSCORE a float, with its default before any lookup table', () => {
      const item = roundTrip(choiceItem(`
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
        <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="integer">
          <qti-match-table><qti-match-table-entry source-value="1" target-value="1"/></qti-match-table>
        </qti-outcome-declaration>`), 'allCorrect');
      const maxScore = declaration(item, 'MAXSCORE')!;

      expect(maxScore.getAttribute('base-type')).toBe('float');
      expect(Array.from(maxScore.children).map((child) => child.localName)).toEqual(['qti-default-value', 'qti-match-table']);
      expect(maxScore.querySelector('qti-value')?.textContent).toBe('1');
    });

    const maxScoreDeclaration = (value: string) => `
      <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
        <qti-default-value><qti-value>${value}</qti-value></qti-default-value>
      </qti-outcome-declaration>`;

    it('should update a SCORE normal-maximum to the maximum score, but never add one', () => {
      const withNormalMaximum = roundTrip(choiceItem(
        `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" normal-maximum="10"/>${maxScoreDeclaration('2')}`
      ));
      const withoutNormalMaximum = roundTrip(choiceItem('<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>'));

      expect(declaration(withNormalMaximum, 'SCORE')?.getAttribute('normal-maximum')).toBe('2');
      expect(declaration(withoutNormalMaximum, 'SCORE')?.hasAttribute('normal-maximum')).toBe(false);
    });

    it('should keep a SCORE normal-maximum that already matches as written', () => {
      const item = roundTrip(choiceItem(
        `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" normal-maximum="2.0"/>${maxScoreDeclaration('2')}`
      ));

      expect(declaration(item, 'SCORE')?.getAttribute('normal-maximum')).toBe('2.0');
    });

    it('should not read a SCORE normal-maximum as the maximum score', () => {
      const item = roundTrip(choiceItem('<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" normal-maximum="5"/>'));

      expect(declaration(item, 'SCORE')?.getAttribute('normal-maximum')).toBe('2');
      expect(declaration(item, 'MAXSCORE')?.querySelector('qti-value')?.textContent).toBe('2');
      expect(item.querySelector('qti-response-processing qti-min')).toBeNull();
    });

    it('should keep a MAXSCORE of 0 as the maximum score', () => {
      const item = roundTrip(choiceItem(
        `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>${maxScoreDeclaration('0')}`
      ));

      expect(declaration(item, 'MAXSCORE')?.querySelector('qti-value')?.textContent).toBe('0');
      expect(item.querySelector('qti-response-processing qti-min > qti-base-value')?.textContent).toBe('0');
    });

    it('should remove a SCORE normal-maximum when the maximum score is 0', () => {
      const nodes = parseXmlToSlate(choiceItem(
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" normal-maximum="2"/>'
      ));
      (nodes[0] as DocumentMetadata).responseProcessing = { mode: 'sumScores', maximumScore: 0 };
      const item = parseXml(serializeSlateToQti(nodes, choiceItem('')).xml).documentElement;

      expect(declaration(item, 'SCORE')?.hasAttribute('normal-maximum')).toBe(false);
      expect(declaration(item, 'MAXSCORE')?.querySelector('qti-value')?.textContent).toBe('0');
    });

    it('should give a manually graded item the points its MAXSCORE declares', () => {
      const item = roundTrip(choiceItem(
        `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>${maxScoreDeclaration('3')}`
      ), 'manual');

      expect(declaration(item, 'SCORE')?.getAttribute('normal-maximum')).toBe('3');
      expect(declaration(item, 'MAXSCORE')?.querySelector('qti-value')?.textContent).toBe('3');
    });

    it('should not count a previous intermediate score default in the maximum score', () => {
      // Two unmapped responses, each scored 0 or 1, with a stale RESPONSE_A_SCORE default of 5
      const input = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item" title="Test Item">
  <qti-response-declaration identifier="RESPONSE_A" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="RESPONSE_B" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>B</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-outcome-declaration identifier="RESPONSE_A_SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>5</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE_A" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
    </qti-choice-interaction>
    <qti-choice-interaction response-identifier="RESPONSE_B" max-choices="1">
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;
      const nodes = parseXmlToSlate(input);
      (nodes[0] as DocumentMetadata).responseProcessing = { mode: 'sumScores' };
      const item = parseXml(serializeSlateToQti(nodes, input).xml).documentElement;

      expect(declaration(item, 'MAXSCORE')?.querySelector('qti-value')?.textContent).toBe('2');
    });

    it('should give a manually graded item points when its normal-maximum is not positive', () => {
      const item = roundTrip(choiceItem(`
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" external-scored="human" normal-maximum="0"/>
        <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="integer">
          <qti-default-value><qti-value>3</qti-value></qti-default-value>
        </qti-outcome-declaration>`), 'manual');

      expect(declaration(item, 'SCORE')?.getAttribute('normal-maximum')).toBe('3');
      expect(declaration(item, 'MAXSCORE')?.getAttribute('base-type')).toBe('float');
    });

    it('should remove MAXSCORE when the item has no interactions left', () => {
      const input = choiceItem(`<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>${maxScoreDeclaration('2')}`);
      // Delete the interaction in the editor
      const nodes = parseXmlToSlate(input).filter(
        (node) => !('type' in node && node.type === 'qti-choice-interaction')
      );
      const item = parseXml(serializeSlateToQti(nodes, input).xml).documentElement;

      expect(declaration(item, 'MAXSCORE')).toBeNull();
    });

    it('should update a MAXSCORE to the points of a manually graded item, but never add one', () => {
      const withMaxScore = roundTrip(choiceItem(`
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" external-scored="human" normal-maximum="5"/>
        <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
          <qti-default-value><qti-value>2</qti-value></qti-default-value>
        </qti-outcome-declaration>`), 'manual');
      const withoutMaxScore = roundTrip(choiceItem(
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" external-scored="human" normal-maximum="5"/>'
      ), 'manual');

      expect(declaration(withMaxScore, 'MAXSCORE')?.querySelector('qti-value')?.textContent).toBe('5');
      expect(declaration(withoutMaxScore, 'MAXSCORE')).toBeNull();
    });
  });
});
