import { describe, expect, it } from 'vitest';
import { serializeSlateToQti } from '../../serialization/slateToXml';
import { parseXmlToSlate } from '../../serialization/xmlToSlate';

const gapMatchXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="gapMatch" title="Richard III (Take 1)" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>W G1</qti-value>
      <qti-value>Su G2</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <qti-gap-match-interaction response-identifier="RESPONSE" shuffle="false">
      <qti-gap-text identifier="W" match-max="1">winter</qti-gap-text>
      <qti-gap-text identifier="Sp" match-max="1">spring</qti-gap-text>
      <qti-gap-text identifier="Su" match-max="1">summer</qti-gap-text>
      <qti-gap-text identifier="A" match-max="1">autumn</qti-gap-text>
      <blockquote>
        <p>Now is the <qti-gap identifier="G1"/> of our discontent<br/> Made glorious <qti-gap identifier="G2"/> by this sun of York;</p>
      </blockquote>
    </qti-gap-match-interaction>
  </qti-item-body>
</qti-assessment-item>`;

describe('Gap Match Interaction', () => {
  describe('parseXmlToSlate', () => {
    it('should parse gap-match interaction', () => {
      const parsed = parseXmlToSlate(gapMatchXml);

      // Should have document-metadata and the gap-match interaction
      expect(parsed.length).toBeGreaterThan(1);
      expect(parsed[0]).toHaveProperty('type', 'document-metadata');

      // Find the gap-match interaction
      const interaction = parsed.find(
        (n) => 'type' in n && n.type === 'qti-gap-match-interaction'
      ) as any;
      expect(interaction).toBeDefined();
      expect(interaction.type).toBe('qti-gap-match-interaction');
      expect(interaction.attributes['response-identifier']).toBe('RESPONSE');
      expect(interaction.attributes.shuffle).toBe('false');
    });

    it('should parse choices into gap-match-choices wrapper', () => {
      const parsed = parseXmlToSlate(gapMatchXml);
      const interaction = parsed.find(
        (n) => 'type' in n && n.type === 'qti-gap-match-interaction'
      ) as any;

      const choicesWrapper = interaction.children.find(
        (c: any) => c.type === 'gap-match-choices'
      );
      expect(choicesWrapper).toBeDefined();
      expect(choicesWrapper.children.length).toBe(4);

      const choices = choicesWrapper.children;
      expect(choices[0].type).toBe('qti-gap-text');
      expect(choices[0].attributes.identifier).toBe('W');
      expect(choices[1].attributes.identifier).toBe('Sp');
      expect(choices[2].attributes.identifier).toBe('Su');
      expect(choices[3].attributes.identifier).toBe('A');
    });

    it('should parse content with gaps into gap-match-content wrapper', () => {
      const parsed = parseXmlToSlate(gapMatchXml);
      const interaction = parsed.find(
        (n) => 'type' in n && n.type === 'qti-gap-match-interaction'
      ) as any;

      const contentWrapper = interaction.children.find(
        (c: any) => c.type === 'gap-match-content'
      );
      expect(contentWrapper).toBeDefined();

      // Should contain the blockquote with gaps
      const blockquote = contentWrapper.children.find(
        (c: any) => c.type === 'blockquote'
      );
      expect(blockquote).toBeDefined();
    });

    it('should parse qti-gap elements as inline voids', () => {
      const parsed = parseXmlToSlate(gapMatchXml);
      const interaction = parsed.find(
        (n) => 'type' in n && n.type === 'qti-gap-match-interaction'
      ) as any;

      // Find gaps recursively
      const findGaps = (node: any): any[] => {
        const gaps: any[] = [];
        if (node.type === 'qti-gap') {
          gaps.push(node);
        }
        if (node.children) {
          for (const child of node.children) {
            if (typeof child !== 'string' && 'type' in child) {
              gaps.push(...findGaps(child));
            }
          }
        }
        return gaps;
      };

      const gaps = findGaps(interaction);
      expect(gaps.length).toBe(2);
      expect(gaps[0].attributes.identifier).toBe('G1');
      expect(gaps[1].attributes.identifier).toBe('G2');
    });

    it('should preserve response declaration with correct values', () => {
      const parsed = parseXmlToSlate(gapMatchXml);
      const interaction = parsed.find(
        (n) => 'type' in n && n.type === 'qti-gap-match-interaction'
      ) as any;

      expect(interaction.responseDeclaration).toBeDefined();
      expect(interaction.responseDeclaration.attributes.identifier).toBe('RESPONSE');
      expect(interaction.responseDeclaration.attributes.cardinality).toBe('multiple');
      expect(interaction.responseDeclaration.attributes['base-type']).toBe('directedPair');

      // Check correct response values
      const correctResponse = interaction.responseDeclaration.children.find(
        (c: any) => c.tagName === 'qti-correct-response'
      );
      expect(correctResponse).toBeDefined();
      const values = correctResponse.children.map((v: any) => v.children[0]);
      expect(values).toContain('W G1');
      expect(values).toContain('Su G2');
    });
  });

  describe('serializeSlateToQti', () => {
    it('should round-trip gap-match interaction', () => {
      const parsed = parseXmlToSlate(gapMatchXml);
      const result = serializeSlateToQti(parsed, gapMatchXml);

      expect(result.errors).toBeUndefined();
      expect(result.responseIdentifiers).toContain('RESPONSE');
      expect(result.xml).toContain('qti-gap-match-interaction');
      expect(result.xml).toContain('qti-gap-text');
      expect(result.xml).toContain('qti-gap');
    });

    it('should preserve gap identifiers', () => {
      const parsed = parseXmlToSlate(gapMatchXml);
      const result = serializeSlateToQti(parsed, gapMatchXml);

      expect(result.xml).toContain('identifier="G1"');
      expect(result.xml).toContain('identifier="G2"');
    });

    it('should preserve choice identifiers and content', () => {
      const parsed = parseXmlToSlate(gapMatchXml);
      const result = serializeSlateToQti(parsed, gapMatchXml);

      expect(result.xml).toContain('identifier="W"');
      expect(result.xml).toContain('identifier="Sp"');
      expect(result.xml).toContain('identifier="Su"');
      expect(result.xml).toContain('identifier="A"');
      expect(result.xml).toContain('winter');
      expect(result.xml).toContain('spring');
      expect(result.xml).toContain('summer');
      expect(result.xml).toContain('autumn');
    });

    it('should unwrap editor-only wrappers during serialization', () => {
      const parsed = parseXmlToSlate(gapMatchXml);
      const result = serializeSlateToQti(parsed, gapMatchXml);

      // Editor-only wrappers should not appear in output
      expect(result.xml).not.toContain('gap-match-choices');
      expect(result.xml).not.toContain('gap-match-content');
    });

    it('should preserve response declaration with correct values', () => {
      const parsed = parseXmlToSlate(gapMatchXml);
      const result = serializeSlateToQti(parsed, gapMatchXml);

      expect(result.xml).toContain('base-type="directedPair"');
      expect(result.xml).toContain('cardinality="multiple"');
      expect(result.xml).toContain('<qti-value>W G1</qti-value>');
      expect(result.xml).toContain('<qti-value>Su G2</qti-value>');
    });
  });
});
