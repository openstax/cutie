import type { Descendant } from 'slate';
import { describe, expect, it } from 'vitest';
import { serializeSlateToXml } from './slateToXml';

describe('serializeSlateToXml', () => {
  describe('basic XHTML elements', () => {
    it('should serialize simple paragraph', () => {
      const nodes: Descendant[] = [
        {
          type: 'paragraph',
          children: [{ text: 'Hello world' }],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('<p>Hello world</p>');
    });

    it('should serialize paragraph with bold text', () => {
      const nodes: Descendant[] = [
        {
          type: 'paragraph',
          children: [
            { text: 'Hello ' },
            { text: 'world', bold: true },
          ],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('<p>Hello <strong>world</strong></p>');
    });

    it('should serialize paragraph with italic text', () => {
      const nodes: Descendant[] = [
        {
          type: 'paragraph',
          children: [
            { text: 'Hello ' },
            { text: 'world', italic: true },
          ],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('<p>Hello <em>world</em></p>');
    });

    it('should serialize multiple formatting marks', () => {
      const nodes: Descendant[] = [
        {
          type: 'paragraph',
          children: [
            { text: 'Text', bold: true, italic: true, underline: true },
          ],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('<strong>');
      expect(xml).toContain('<em>');
      expect(xml).toContain('<u>');
    });

    it('should serialize headings', () => {
      const nodes: Descendant[] = [
        {
          type: 'heading',
          level: 1,
          children: [{ text: 'Title' }],
        } as any,
        {
          type: 'heading',
          level: 2,
          children: [{ text: 'Subtitle' }],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('<h1>Title</h1>');
      expect(xml).toContain('<h2>Subtitle</h2>');
    });

    it('should serialize div with attributes', () => {
      const nodes: Descendant[] = [
        {
          type: 'div',
          attributes: { class: 'container', id: 'main' },
          children: [{ text: 'Content' }],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('<div');
      expect(xml).toContain('class="container"');
      expect(xml).toContain('id="main"');
      expect(xml).toContain('>Content</div>');
    });

    it('should serialize image', () => {
      const nodes: Descendant[] = [
        {
          type: 'image',
          attributes: { src: 'test.jpg', alt: 'Test' },
          children: [{ text: '' }],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('<img');
      expect(xml).toContain('src="test.jpg"');
      expect(xml).toContain('alt="Test"');
    });

    it('should serialize lists', () => {
      const nodes: Descendant[] = [
        {
          type: 'list',
          ordered: false,
          children: [
            { type: 'list-item', children: [{ text: 'Item 1' }] },
            { type: 'list-item', children: [{ text: 'Item 2' }] },
          ],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('<ul>');
      expect(xml).toContain('<li>Item 1</li>');
      expect(xml).toContain('<li>Item 2</li>');
      expect(xml).toContain('</ul>');
    });

    it('should serialize ordered lists', () => {
      const nodes: Descendant[] = [
        {
          type: 'list',
          ordered: true,
          children: [
            { type: 'list-item', children: [{ text: 'First' }] },
          ],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('<ol>');
      expect(xml).toContain('</ol>');
    });
  });

  describe('QTI interactions', () => {
    it('should serialize text entry interaction', () => {
      const nodes: Descendant[] = [
        {
          type: 'qti-text-entry-interaction',
          attributes: {
            'response-identifier': 'RESPONSE_1',
            'expected-length': '10',
          },
          children: [{ text: '' }],
        } as any,
      ];

      const { xml, responseIdentifiers } = serializeSlateToXml(nodes);

      expect(xml).toContain('<qti-text-entry-interaction');
      expect(xml).toContain('response-identifier="RESPONSE_1"');
      expect(xml).toContain('expected-length="10"');
      expect(responseIdentifiers).toEqual(['RESPONSE_1']);
    });

    it('should serialize extended text interaction', () => {
      const nodes: Descendant[] = [
        {
          type: 'qti-extended-text-interaction',
          attributes: {
            'response-identifier': 'RESPONSE_2',
            'expected-lines': '5',
          },
          children: [{ text: '' }],
        } as any,
      ];

      const { xml, responseIdentifiers } = serializeSlateToXml(nodes);

      expect(xml).toContain('<qti-extended-text-interaction');
      expect(xml).toContain('response-identifier="RESPONSE_2"');
      expect(xml).toContain('expected-lines="5"');
      expect(responseIdentifiers).toEqual(['RESPONSE_2']);
    });

    it('should serialize choice interaction', () => {
      const nodes: Descendant[] = [
        {
          type: 'qti-choice-interaction',
          attributes: {
            'response-identifier': 'RESPONSE_3',
            'max-choices': '1',
          },
          children: [
            {
              type: 'qti-simple-choice',
              attributes: { identifier: 'choice-1' },
              children: [{ text: 'First choice' }],
            },
            {
              type: 'qti-simple-choice',
              attributes: { identifier: 'choice-2' },
              children: [{ text: 'Second choice' }],
            },
          ],
        } as any,
      ];

      const { xml, responseIdentifiers } = serializeSlateToXml(nodes);

      expect(xml).toContain('<qti-choice-interaction');
      expect(xml).toContain('response-identifier="RESPONSE_3"');
      expect(xml).toContain('<qti-simple-choice');
      expect(xml).toContain('identifier="choice-1"');
      expect(xml).toContain('First choice');
      expect(responseIdentifiers).toEqual(['RESPONSE_3']);
    });

    it('should serialize choice interaction with prompt', () => {
      const nodes: Descendant[] = [
        {
          type: 'qti-choice-interaction',
          attributes: { 'response-identifier': 'R1', 'max-choices': '1' },
          children: [
            {
              type: 'qti-prompt',
              children: [{ text: 'Select an answer:' }],
            },
            {
              type: 'qti-simple-choice',
              attributes: { identifier: 'choice-1' },
              children: [{ text: 'Answer' }],
            },
          ],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('<qti-prompt>Select an answer:</qti-prompt>');
    });
  });

  describe('unknown QTI elements', () => {
    it('should serialize unknown QTI element from raw XML', () => {
      const rawXml = '<qti-hotspot-interaction response-identifier="R1">Content</qti-hotspot-interaction>';
      const nodes: Descendant[] = [
        {
          type: 'qti-unknown',
          originalTagName: 'qti-hotspot-interaction',
          attributes: { 'response-identifier': 'R1' },
          rawXml,
          children: [{ text: 'Content' }],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('qti-hotspot-interaction');
      expect(xml).toContain('response-identifier="R1"');
    });

    it('should reconstruct unknown QTI element without raw XML', () => {
      const nodes: Descendant[] = [
        {
          type: 'qti-unknown',
          originalTagName: 'qti-custom-element',
          attributes: { 'custom-attr': 'value' },
          children: [{ text: 'Content' }],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('qti-custom-element');
      expect(xml).toContain('custom-attr="value"');
      expect(xml).toContain('Content');
    });
  });

  describe('validation', () => {
    it('should detect duplicate response identifiers', () => {
      const nodes: Descendant[] = [
        {
          type: 'qti-text-entry-interaction',
          attributes: { 'response-identifier': 'RESPONSE_1' },
          children: [{ text: '' }],
        } as any,
        {
          type: 'qti-text-entry-interaction',
          attributes: { 'response-identifier': 'RESPONSE_1' },
          children: [{ text: '' }],
        } as any,
      ];

      const { errors, responseIdentifiers } = serializeSlateToXml(nodes);

      expect(responseIdentifiers).toEqual(['RESPONSE_1', 'RESPONSE_1']);
      expect(errors).toHaveLength(1);
      expect(errors![0].type).toBe('duplicate-identifier');
      expect(errors![0].responseIdentifier).toBe('RESPONSE_1');
    });

    it('should detect missing response identifier', () => {
      const nodes: Descendant[] = [
        {
          type: 'qti-text-entry-interaction',
          attributes: {},
          children: [{ text: '' }],
        } as any,
      ];

      const { errors } = serializeSlateToXml(nodes);

      expect(errors).toHaveLength(1);
      expect(errors![0].type).toBe('missing-identifier');
    });

    it('should not report errors for valid document', () => {
      const nodes: Descendant[] = [
        {
          type: 'paragraph',
          children: [{ text: 'Hello' }],
        } as any,
      ];

      const { errors } = serializeSlateToXml(nodes);

      expect(errors).toBeUndefined();
    });
  });

  describe('attribute handling', () => {
    it('should preserve kebab-case attribute names', () => {
      const nodes: Descendant[] = [
        {
          type: 'qti-text-entry-interaction',
          attributes: {
            'response-identifier': 'R1',
            'pattern-mask': '[0-9]+',
            'placeholder-text': 'Enter number',
          },
          children: [{ text: '' }],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('response-identifier="R1"');
      expect(xml).toContain('pattern-mask="[0-9]+"');
      expect(xml).toContain('placeholder-text="Enter number"');
    });

    it('should skip undefined attribute values', () => {
      const nodes: Descendant[] = [
        {
          type: 'qti-text-entry-interaction',
          attributes: {
            'response-identifier': 'R1',
            'expected-length': undefined,
          },
          children: [{ text: '' }],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('response-identifier="R1"');
      expect(xml).not.toContain('expected-length');
    });
  });

  describe('nested structures', () => {
    it('should serialize nested elements', () => {
      const nodes: Descendant[] = [
        {
          type: 'div',
          children: [
            {
              type: 'paragraph',
              children: [{ text: 'Nested' }],
            },
          ],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('<div><p>Nested</p></div>');
    });

    it('should serialize complex nested formatting', () => {
      const nodes: Descendant[] = [
        {
          type: 'paragraph',
          children: [
            { text: 'Normal ' },
            { text: 'bold', bold: true },
            { text: ' and ' },
            { text: 'italic', italic: true },
          ],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('Normal <strong>bold</strong> and <em>italic</em>');
    });
  });

  describe('QTI namespace', () => {
    it('should wrap output in qti-item-body', () => {
      const nodes: Descendant[] = [
        {
          type: 'paragraph',
          children: [{ text: 'Content' }],
        } as any,
      ];

      const { xml } = serializeSlateToXml(nodes);

      expect(xml).toContain('<qti-item-body');
      expect(xml).toContain('xmlns=');
      expect(xml).toContain('</qti-item-body>');
    });
  });
});
