import { describe, expect, it } from 'vitest';
import { xmlNodeToDom } from '../serialization/xmlNode.js';
import { parseXmlToSlate } from '../serialization/xmlToSlate.js';
import type { DocumentMetadata, ResponseProcessingConfig, XmlNode } from '../types.js';
import { ITEM_COMPLETED_FEEDBACK_ID } from './feedbackIdentifiers.js';
import { generateResponseProcessingXml } from './responseProcessingGenerator.js';

const QTI_NAMESPACE = 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0';

const responseDeclaration: XmlNode = {
  tagName: 'qti-response-declaration',
  attributes: { identifier: 'RESPONSE', cardinality: 'single', 'base-type': 'identifier' },
  children: [],
};

/**
 * Classify an item's response processing as the editor does on load
 */
function classify(doc: Document): ResponseProcessingConfig {
  const [metadata] = parseXmlToSlate(new XMLSerializer().serializeToString(doc));
  return (metadata as DocumentMetadata).responseProcessing;
}

/**
 * An item body with an interaction bound to each response, of a kind the
 * editor passes through
 */
function itemBody(doc: Document, responseIdentifiers: string[], feedbackIdentifiers: string[] = []): Element {
  const body = doc.createElementNS(QTI_NAMESPACE, 'qti-item-body');
  for (const identifier of responseIdentifiers) {
    const interaction = doc.createElementNS(QTI_NAMESPACE, 'qti-hotspot-interaction');
    interaction.setAttribute('response-identifier', identifier);
    body.appendChild(interaction);
  }
  for (const identifier of feedbackIdentifiers) {
    const feedback = doc.createElementNS(QTI_NAMESPACE, 'qti-feedback-block');
    feedback.setAttribute('outcome-identifier', 'FEEDBACK');
    feedback.setAttribute('identifier', identifier);
    feedback.setAttribute('show-hide', 'show');
    feedback.appendChild(doc.createElementNS(QTI_NAMESPACE, 'p')).textContent = 'Feedback';
    body.appendChild(feedback);
  }
  return body;
}

/**
 * Generate response processing for a single RESPONSE interaction inside a QTI document
 */
function generate(mode: 'allCorrect' | 'sumScores', feedbackIdentifiersUsed: string[]): Document {
  const doc = document.implementation.createDocument(QTI_NAMESPACE, 'qti-assessment-item', null);
  doc.documentElement.appendChild(xmlNodeToDom(responseDeclaration, doc));
  doc.documentElement.appendChild(itemBody(doc, ['RESPONSE'], feedbackIdentifiersUsed));
  const { responseProcessing } = generateResponseProcessingXml(
    { mode },
    ['RESPONSE'],
    new Map([['RESPONSE', responseDeclaration]]),
    new Map(),
    doc,
    new Set(feedbackIdentifiersUsed)
  );
  doc.documentElement.appendChild(responseProcessing!);
  return doc;
}

describe('responseProcessingGenerator', () => {
  describe('item-level feedback', () => {
    it.each(['allCorrect', 'sumScores'] as const)(
      'should add ITEM_completed unconditionally, last, in %s mode',
      (mode) => {
        const doc = generate(mode, ['RESPONSE_correct', ITEM_COMPLETED_FEEDBACK_ID]);
        const lastRule = doc.querySelector('qti-response-processing')!.lastElementChild!;

        expect(lastRule.tagName).toBe('qti-set-outcome-value');
        expect(lastRule.getAttribute('identifier')).toBe('FEEDBACK');
        expect(lastRule.querySelector('qti-base-value')!.textContent).toBe(ITEM_COMPLETED_FEEDBACK_ID);
      }
    );

    it.each(['allCorrect', 'sumScores'] as const)(
      'should round-trip through the classifier in %s mode',
      (mode) => {
        const doc = generate(mode, [ITEM_COMPLETED_FEEDBACK_ID]);
        expect(classify(doc).mode).toBe(mode);
      }
    );
  });

  describe('custom', () => {
    it('should keep custom response processing without interactions the editor knows', () => {
      const doc = document.implementation.createDocument(QTI_NAMESPACE, 'qti-assessment-item', null);
      const customXml: XmlNode = {
        tagName: 'qti-response-processing',
        attributes: { template: 'https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response_point.xml' },
        children: [],
      };
      const { responseProcessing } = generateResponseProcessingXml({ mode: 'custom', customXml }, [], new Map(), new Map(), doc);

      expect(responseProcessing?.getAttribute('template')).toMatch(/map_response_point/);
    });
  });

  describe('sumScores score offset, maximum score and floor', () => {
    // A response whose correct value maps to mappedValue
    const mapped = (
      identifier: string,
      mappedValue: string,
      mappingAttributes: Record<string, string> = {},
      cardinality = 'single'
    ): XmlNode => ({
      tagName: 'qti-response-declaration',
      attributes: { identifier, cardinality, 'base-type': 'identifier' },
      children: [{
        tagName: 'qti-mapping',
        attributes: { 'default-value': '0', ...mappingAttributes },
        children: [{
          tagName: 'qti-map-entry',
          attributes: { 'map-key': 'correct', 'mapped-value': mappedValue },
          children: [],
        }],
      }],
    });

    /**
     * Generate response processing into an item with the responses declared
     */
    const generateSumScores = (config: ResponseProcessingConfig, declarations: XmlNode[]) => {
      const doc = document.implementation.createDocument(QTI_NAMESPACE, 'qti-assessment-item', null);
      for (const declaration of declarations) {
        doc.documentElement.appendChild(xmlNodeToDom(declaration, doc));
      }
      doc.documentElement.appendChild(itemBody(doc, declarations.map((declaration) => declaration.attributes.identifier)));
      const generated = generateResponseProcessingXml(
        config,
        declarations.map((declaration) => declaration.attributes.identifier),
        new Map(declarations.map((declaration) => [declaration.attributes.identifier, declaration])),
        new Map(),
        doc
      );
      doc.documentElement.appendChild(generated.responseProcessing!);
      const expression = doc.querySelector('qti-set-outcome-value[identifier="SCORE"]')?.firstElementChild ?? null;
      return { doc, generated, expression };
    };
    // A cause worth 2 points and two effects worth 1
    const triad = [mapped('A', '2'), mapped('B', '1'), mapped('C', '1')];

    it('should add a negative offset to the sum and floor it at 0', () => {
      const { expression } = generateSumScores({ mode: 'sumScores', scoreOffset: -2 }, triad);

      expect(expression!.tagName).toBe('qti-max');
      const [floor, sum] = Array.from(expression!.children);
      expect(floor.tagName).toBe('qti-base-value');
      expect(floor.textContent).toBe('0');
      expect(sum.tagName).toBe('qti-sum');
      expect(Array.from(sum.children).map((child) => child.tagName)).toEqual([
        'qti-base-value', 'qti-map-response', 'qti-map-response', 'qti-map-response',
      ]);
      expect(sum.firstElementChild!.textContent).toBe('-2');
    });

    it('should infer the maximum score without a qti-min', () => {
      const { generated, expression } = generateSumScores({ mode: 'sumScores', scoreOffset: -2 }, triad);

      expect(generated.calculatedMaximumScore).toBe(2);
      expect(generated.declaredMaximumScore).toEqual({ value: 2 });
      expect(expression!.querySelector('qti-min')).toBeNull();
    });

    it('should cap the score at a maximum score set by the author', () => {
      const { generated, expression } = generateSumScores({ mode: 'sumScores', scoreOffset: -2, maximumScore: 1 }, triad);

      expect(generated.calculatedMaximumScore).toBe(2);
      expect(generated.declaredMaximumScore).toEqual({ value: 1 });
      const min = expression!.querySelector(':scope > qti-min')!;
      expect(min.firstElementChild!.textContent).toBe('1');
      expect(min.lastElementChild!.tagName).toBe('qti-sum');
    });

    it.each([
      ['a negative mapped value', [mapped('A', '2'), mapped('B', '-1')], true],
      ['a negative default value', [mapped('A', '2'), mapped('B', '1', { 'default-value': '-1' })], true],
      ['a single response with negative values and a lower-bound of 0', [mapped('A', '2', { 'default-value': '-1', 'lower-bound': '0' })], true],
      ['multiple responses with negative values and a lower-bound of 0', [mapped('A', '2', { 'default-value': '-1', 'lower-bound': '0' }, 'multiple')], false],
      ['no negative values', [mapped('A', '2'), mapped('B', '1')], false],
    ] as const)('should floor the score at 0 only when it could be negative: %s', (_name, declarations, floored) => {
      const { expression } = generateSumScores({ mode: 'sumScores' }, [...declarations]);
      expect(expression!.tagName === 'qti-max').toBe(floored);
    });

    it('should leave the maximum unknown when it cannot be inferred', () => {
      // A pairing response: its maximum depends on the interaction, so isn't inferred
      const pairs: XmlNode = {
        ...mapped('A', '1', {}, 'multiple'),
        attributes: { identifier: 'A', cardinality: 'multiple', 'base-type': 'directedPair' },
      };
      const { generated } = generateSumScores({ mode: 'sumScores', scoreOffset: 1 }, [pairs]);

      expect(generated.calculatedMaximumScore).toBeNull();
      expect(generated.declaredMaximumScore).toEqual({ value: null });
    });

    it('should floor the score at 0 under a negative maximum score', () => {
      const { generated, expression } = generateSumScores({ mode: 'sumScores', maximumScore: -1 }, [mapped('A', '2'), mapped('B', '1')]);

      expect(expression!.tagName).toBe('qti-max');
      expect(generated.declaredMaximumScore).toEqual({ value: 0 });
    });

    it('should leave the maximum unknown without interactions', () => {
      const doc = document.implementation.createDocument(QTI_NAMESPACE, 'qti-assessment-item', null);
      for (const mode of ['sumScores', 'allCorrect'] as const) {
        const generated = generateResponseProcessingXml({ mode, maximumScore: 3 }, [], new Map(), new Map(), doc);
        expect(generated.declaredMaximumScore).toEqual({ value: null });
      }
    });

    it('should not use the map_response template when an offset, maximum or floor is needed', () => {
      for (const [config, declaration] of [
        [{ mode: 'sumScores', scoreOffset: 1 }, mapped('RESPONSE', '1')],
        [{ mode: 'sumScores', maximumScore: 1 }, mapped('RESPONSE', '1')],
        [{ mode: 'sumScores' }, mapped('RESPONSE', '1', { 'default-value': '-1' })],
      ] as const) {
        const { doc } = generateSumScores(config, [declaration]);
        const responseProcessing = doc.querySelector('qti-response-processing')!;

        expect(responseProcessing.hasAttribute('template')).toBe(false);
        expect(responseProcessing.querySelector('qti-sum')).not.toBeNull();
      }
    });

    it('should infer the maximum score for the map_response template', () => {
      const { doc, generated } = generateSumScores({ mode: 'sumScores' }, [mapped('RESPONSE', '1')]);

      expect(doc.querySelector('qti-response-processing')!.getAttribute('template')).toMatch(/map_response/);
      expect(generated.calculatedMaximumScore).toBe(1);
      expect(generated.declaredMaximumScore).toEqual({ value: 1 });
    });

    it('should give allCorrect a maximum score of 1', () => {
      expect(generateSumScores({ mode: 'allCorrect' }, triad).generated.declaredMaximumScore).toEqual({ value: 1 });
    });

    it('should round away floating point noise in the calculated maximum', () => {
      const { generated } = generateSumScores({ mode: 'sumScores' }, [mapped('A', '0.1'), mapped('B', '0.2')]);

      expect(generated.calculatedMaximumScore).toBe(0.3);
      expect(generated.declaredMaximumScore).toEqual({ value: 0.3 });
    });

    it('should not set SCORE without responses', () => {
      const doc = document.implementation.createDocument(QTI_NAMESPACE, 'qti-assessment-item', null);
      const generated = generateResponseProcessingXml(
        { mode: 'sumScores', scoreOffset: 1 },
        [],
        new Map(),
        new Map(),
        doc,
        new Set([ITEM_COMPLETED_FEEDBACK_ID])
      );

      expect(generated.responseProcessing!.querySelector('qti-set-outcome-value[identifier="SCORE"]')).toBeNull();
      expect(generated.declaredMaximumScore).toEqual({ value: null });
    });

    it('should leave out a zero offset', () => {
      const { doc } = generateSumScores({ mode: 'sumScores', scoreOffset: 0 }, triad);
      expect(doc.querySelector('qti-sum > qti-base-value')).toBeNull();
    });

    it.each([
      { mode: 'sumScores', scoreOffset: -2 },
      { mode: 'sumScores', scoreOffset: -2, maximumScore: 1 },
      { mode: 'sumScores', scoreOffset: 1.5 },
      { mode: 'sumScores', maximumScore: 5 },
    ] as const)('should round-trip %o through the classifier', (config) => {
      const { doc } = generateSumScores(config, triad);
      expect(classify(doc)).toEqual(config);
    });
  });
});
