import { describe, expect, it } from 'vitest';
import type { XmlNode } from '../types';
import { ITEM_COMPLETED_FEEDBACK_ID } from './feedbackIdentifiers';
import { classifyResponseProcessing } from './responseProcessingClassifier';
import { generateResponseProcessingXml } from './responseProcessingGenerator';

const QTI_NAMESPACE = 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0';

const responseDeclaration: XmlNode = {
  tagName: 'qti-response-declaration',
  attributes: { identifier: 'RESPONSE', cardinality: 'single', 'base-type': 'identifier' },
  children: [],
};

/**
 * Generate response processing for a single RESPONSE interaction inside a QTI document
 */
function generate(mode: 'allCorrect' | 'sumScores', feedbackIdentifiersUsed: string[]): Document {
  const doc = document.implementation.createDocument(QTI_NAMESPACE, 'qti-assessment-item', null);
  const responseProcessing = generateResponseProcessingXml(
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
        expect(classifyResponseProcessing(doc).mode).toBe(mode);
      }
    );
  });
});
