import { describe, expect, it } from 'vitest';
import { item as inlineChoiceMultiItem } from '../../../cutie-example/src/example-items/inline-choice-multi.js';
import { item as inlineFeedbackItem } from '../../../cutie-example/src/example-items/inline-feedback.js';
import { item as modalFeedbackItem } from '../../../cutie-example/src/example-items/modal-feedback.js';
import { item as choiceMultipleFeedbackItem } from '../../../cutie-example/src/example-items/standard-choice-multiple-wrong-choice-feedback.js';
import { item as choicePartialItem } from '../../../cutie-example/src/example-items/standard-choice-partial.js';
import { item as gapMatchRationaleDyadItem } from '../../../cutie-example/src/example-items/standard-gap-match-rationale-dyad.js';
import { item as gapMatchRationaleTriadItem } from '../../../cutie-example/src/example-items/standard-gap-match-rationale-triad.js';
import { item as multiInteractionItem } from '../../../cutie-example/src/example-items/standard-multi-interaction.js';
import { item as textEntryPartialItem } from '../../../cutie-example/src/example-items/standard-text-entry-partial.js';
import { item as textEntryMultiItem } from '../../../cutie-example/src/example-items/text-entry-multi.js';
import { serializeSlateToQti } from '../serialization/slateToXml.js';
import { parseXmlToSlate } from '../serialization/xmlToSlate.js';
import type { DocumentMetadata, ResponseProcessingConfig } from '../types.js';
import { getScoredResponseIdentifiers } from './responseProcessingClassifier.js';

/**
 * Classify an item's response processing as the editor does on load
 */
function classify(doc: Document): ResponseProcessingConfig {
  const [metadata] = parseXmlToSlate(new XMLSerializer().serializeToString(doc));
  return (metadata as DocumentMetadata).responseProcessing;
}

/**
 * An interaction the editor passes through: bound to a response, which response
 * processing may score or not
 */
const passthroughInteraction = (identifier: string) =>
  `<qti-hotspot-interaction response-identifier="${identifier}" max-choices="1"/>`;

/**
 * A feedback block shown for a FEEDBACK identifier
 */
const feedbackBlock = (identifier: string) =>
  `<qti-feedback-block outcome-identifier="FEEDBACK" identifier="${identifier}" show-hide="show"><p>Feedback</p></qti-feedback-block>`;

/**
 * Helper to create a minimal QTI document for testing, with mapped responses
 * RESPONSE, A, B and C, and unmapped X and Y, each bound to an interaction the
 * editor passes through, for response processing to score, and a feedback
 * block for each of the feedback identifiers
 */
function createQtiDoc(responseProcessingContent: string, feedbackIdentifiers: string[] = []): Document {
  const declaration = (identifier: string, mapping: string) => `
  <qti-response-declaration identifier="${identifier}" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>correct</qti-value></qti-correct-response>${mapping}
  </qti-response-declaration>`;
  const mapped = (identifier: string) =>
    declaration(identifier, '<qti-mapping><qti-map-entry map-key="correct" mapped-value="1"/></qti-mapping>');
  const responses = ['RESPONSE', 'A', 'B', 'C', 'X', 'Y'];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item">
${mapped('RESPONSE')}${mapped('A')}${mapped('B')}${mapped('C')}${declaration('X', '')}${declaration('Y', '')}
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>
  <qti-item-body>
    <p>Test item</p>
    ${responses.map(passthroughInteraction).join('')}
    ${feedbackIdentifiers.map(feedbackBlock).join('')}
  </qti-item-body>
  ${responseProcessingContent}
</qti-assessment-item>`;

  const parser = new DOMParser();
  return parser.parseFromString(xml, 'application/xml');
}

describe('responseProcessingClassifier', () => {
  describe('allCorrect pattern without feedback', () => {
    it('should recognize single interaction allCorrect pattern', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-correct identifier="X"/>
              </qti-match>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">0</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-else>
          </qti-response-condition>
        </qti-response-processing>
      `);

      const result = classify(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should classify all-or-nothing without an else as custom', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-correct identifier="X"/>
              </qti-match>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
        </qti-response-processing>
      `);

      const result = classify(doc);
      expect(result.mode).toBe('custom');
    });

    it('should recognize single interaction allCorrect with qti-equal(qti-map-response)', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-equal>
                <qti-map-response identifier="RESPONSE"/>
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-equal>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">0</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-else>
          </qti-response-condition>
        </qti-response-processing>
      `);

      const result = classify(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should recognize multiple interaction allCorrect with mixed qti-match and qti-equal', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-and>
                <qti-match>
                  <qti-variable identifier="X"/>
                  <qti-correct identifier="X"/>
                </qti-match>
                <qti-equal>
                  <qti-map-response identifier="A"/>
                  <qti-base-value base-type="float">1</qti-base-value>
                </qti-equal>
              </qti-and>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">0</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-else>
          </qti-response-condition>
        </qti-response-processing>
      `);

      const result = classify(doc);
      expect(result.mode).toBe('allCorrect');
    });
  });

  describe('allCorrect pattern with feedback conditions', () => {
    it('should recognize allCorrect + correct/incorrect feedback conditions', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-correct identifier="X"/>
              </qti-match>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">0</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-else>
          </qti-response-condition>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-correct identifier="X"/>
              </qti-match>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">X_correct</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">X_incorrect</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-else>
          </qti-response-condition>
        </qti-response-processing>
      `, ['X_correct', 'X_incorrect']);

      const result = classify(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should classify correct/incorrect feedback written as two conditions as custom', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-correct identifier="X"/>
              </qti-match>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">0</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-else>
          </qti-response-condition>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-correct identifier="X"/>
              </qti-match>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">X_correct</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
          <qti-response-condition>
            <qti-response-if>
              <qti-not>
                <qti-match>
                  <qti-variable identifier="X"/>
                  <qti-correct identifier="X"/>
                </qti-match>
              </qti-not>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">X_incorrect</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
        </qti-response-processing>
      `, ['X_correct', 'X_incorrect']);

      expect(classify(doc).mode).toBe('custom');
    });

    it('should recognize allCorrect + multiple per-choice feedback conditions', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-correct identifier="X"/>
              </qti-match>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">0</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-else>
          </qti-response-condition>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-base-value base-type="identifier">choiceA</qti-base-value>
              </qti-match>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">X_choice_choiceA</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-base-value base-type="identifier">choiceB</qti-base-value>
              </qti-match>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">X_choice_choiceB</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-base-value base-type="identifier">choiceC</qti-base-value>
              </qti-match>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">X_choice_choiceC</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
        </qti-response-processing>
      `, ['X_choice_choiceA', 'X_choice_choiceB', 'X_choice_choiceC']);

      const result = classify(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should classify feedback conditions in a different order as custom', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-correct identifier="X"/>
              </qti-match>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">0</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-else>
          </qti-response-condition>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-base-value base-type="identifier">choiceB</qti-base-value>
              </qti-match>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">X_choice_choiceB</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-base-value base-type="identifier">choiceA</qti-base-value>
              </qti-match>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">X_choice_choiceA</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
        </qti-response-processing>
      `, ['X_choice_choiceA', 'X_choice_choiceB']);

      expect(classify(doc).mode).toBe('custom');
    });


    it('should reject if feedback condition sets non-FEEDBACK outcome', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <!-- Scoring condition -->
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="RESPONSE"/>
                <qti-correct identifier="RESPONSE"/>
              </qti-match>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>

          <!-- Condition that sets a non-FEEDBACK outcome (should fall to custom) -->
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="RESPONSE"/>
                <qti-base-value base-type="identifier">choiceA</qti-base-value>
              </qti-match>
              <qti-set-outcome-value identifier="CUSTOM_OUTCOME">
                <qti-base-value base-type="float">5</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
        </qti-response-processing>
      `);

      const result = classify(doc);
      expect(result.mode).toBe('custom');
    });

    it('should reject if feedback condition uses non-standard pattern', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <!-- Scoring condition -->
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="RESPONSE"/>
                <qti-correct identifier="RESPONSE"/>
              </qti-match>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>

          <!-- Feedback with non-standard identifier pattern -->
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="RESPONSE"/>
                <qti-base-value base-type="identifier">choiceA</qti-base-value>
              </qti-match>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">nonStandardIdentifier</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
        </qti-response-processing>
      `);

      const result = classify(doc);
      expect(result.mode).toBe('custom');
    });
  });

  describe('sumScores pattern with feedback conditions', () => {
    it('should recognize sumScores + feedback conditions', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <!-- sumScores pattern -->
          <qti-set-outcome-value identifier="SCORE">
            <qti-sum>
              <qti-map-response identifier="RESPONSE"/>
            </qti-sum>
          </qti-set-outcome-value>

          <!-- Feedback condition -->
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="RESPONSE"/>
                <qti-base-value base-type="identifier">choiceA</qti-base-value>
              </qti-match>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">RESPONSE_choice_choiceA</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
        </qti-response-processing>
      `, ['RESPONSE_choice_choiceA']);

      const result = classify(doc);
      expect(result.mode).toBe('sumScores');
    });

    it('should recognize sumScores + mapped response feedback (qti-gt > qti-map-response)', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-set-outcome-value identifier="SCORE">
            <qti-sum>
              <qti-map-response identifier="RESPONSE"/>
            </qti-sum>
          </qti-set-outcome-value>

          <qti-response-condition>
            <qti-response-if>
              <qti-gt>
                <qti-map-response identifier="RESPONSE"/>
                <qti-base-value base-type="float">0</qti-base-value>
              </qti-gt>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">RESPONSE_correct</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">RESPONSE_incorrect</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-else>
          </qti-response-condition>
        </qti-response-processing>
      `, ['RESPONSE_correct', 'RESPONSE_incorrect']);

      const result = classify(doc);
      expect(result.mode).toBe('sumScores');
    });

    it('should recognize sumScores with intermediate score conditions before sum', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-correct identifier="X"/>
              </qti-match>
              <qti-set-outcome-value identifier="X_SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
              <qti-set-outcome-value identifier="X_SCORE">
                <qti-base-value base-type="float">0</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-else>
          </qti-response-condition>

          <qti-set-outcome-value identifier="SCORE">
            <qti-sum>
              <qti-variable identifier="X_SCORE"/>
            </qti-sum>
          </qti-set-outcome-value>
        </qti-response-processing>
      `);

      const result = classify(doc);
      expect(result.mode).toBe('sumScores');
    });

    it('should recognize sumScores with intermediate score conditions + feedback after sum', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-correct identifier="X"/>
              </qti-match>
              <qti-set-outcome-value identifier="X_SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
              <qti-set-outcome-value identifier="X_SCORE">
                <qti-base-value base-type="float">0</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-else>
          </qti-response-condition>

          <qti-set-outcome-value identifier="SCORE">
            <qti-sum>
              <qti-variable identifier="X_SCORE"/>
            </qti-sum>
          </qti-set-outcome-value>

          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="X"/>
                <qti-correct identifier="X"/>
              </qti-match>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">X_correct</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">X_incorrect</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-else>
          </qti-response-condition>
        </qti-response-processing>
      `, ['X_correct', 'X_incorrect']);

      const result = classify(doc);
      expect(result.mode).toBe('sumScores');
    });

    it('should not classify as sumScores when condition before sum sets SCORE', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="RESPONSE"/>
                <qti-correct identifier="RESPONSE"/>
              </qti-match>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>

          <qti-set-outcome-value identifier="SCORE">
            <qti-sum>
              <qti-variable identifier="RESPONSE_SCORE"/>
            </qti-sum>
          </qti-set-outcome-value>
        </qti-response-processing>
      `);

      const result = classify(doc);
      // Falls through to allCorrect since the first condition matches that pattern
      expect(result.mode).not.toBe('sumScores');
    });

    it('should not classify as sumScores when condition before sum sets FEEDBACK', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="RESPONSE"/>
                <qti-correct identifier="RESPONSE"/>
              </qti-match>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">RESPONSE_correct</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>

          <qti-set-outcome-value identifier="SCORE">
            <qti-sum>
              <qti-variable identifier="RESPONSE_SCORE"/>
            </qti-sum>
          </qti-set-outcome-value>
        </qti-response-processing>
      `);

      const result = classify(doc);
      // Condition sets both SCORE and FEEDBACK, which is not a valid intermediate score condition
      expect(result.mode).not.toBe('sumScores');
    });

    it('should reject sumScores if additional condition sets non-FEEDBACK outcome', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <!-- sumScores pattern -->
          <qti-set-outcome-value identifier="SCORE">
            <qti-sum>
              <qti-map-response identifier="RESPONSE"/>
            </qti-sum>
          </qti-set-outcome-value>

          <!-- Condition that sets non-FEEDBACK outcome -->
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="RESPONSE"/>
                <qti-base-value base-type="identifier">choiceA</qti-base-value>
              </qti-match>
              <qti-set-outcome-value identifier="CUSTOM_OUTCOME">
                <qti-base-value base-type="float">10</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
        </qti-response-processing>
      `);

      const result = classify(doc);
      expect(result.mode).toBe('custom');
    });
  });

  describe('sumScores pattern with a score offset, maximum score and floor', () => {
    const scoreSetter = (expression: string) => createQtiDoc(`
      <qti-response-processing>
        <qti-set-outcome-value identifier="SCORE">${expression}</qti-set-outcome-value>
      </qti-response-processing>
    `);
    const sum = `
      <qti-sum>
        <qti-base-value base-type="float">-2</qti-base-value>
        <qti-map-response identifier="RESPONSE"/>
      </qti-sum>`;

    it('should recognize an offset sum floored at 0', () => {
      const doc = scoreSetter(`
        <qti-max>
          <qti-base-value base-type="float">0</qti-base-value>
          <qti-sum>
            <qti-base-value base-type="float">-2</qti-base-value>
            <qti-map-response identifier="A"/>
            <qti-map-response identifier="B"/>
            <qti-map-response identifier="C"/>
          </qti-sum>
        </qti-max>
      `);

      expect(classify(doc)).toEqual({ mode: 'sumScores', scoreOffset: -2 });
    });

    it('should recognize a maximum score inside or outside the floor', () => {
      const expected = { mode: 'sumScores', scoreOffset: -2, maximumScore: 2 };

      expect(classify(scoreSetter(`
        <qti-max>
          <qti-base-value base-type="float">0</qti-base-value>
          <qti-min><qti-base-value base-type="float">2</qti-base-value>${sum}</qti-min>
        </qti-max>
      `))).toEqual(expected);
      expect(classify(scoreSetter(`
        <qti-min>
          <qti-max>${sum}<qti-base-value base-type="integer">0</qti-base-value></qti-max>
          <qti-base-value base-type="float">2</qti-base-value>
        </qti-min>
      `))).toEqual(expected);
    });

    it('should recognize an offset without a floor', () => {
      const doc = scoreSetter(`
        <qti-sum>
          <qti-map-response identifier="RESPONSE"/>
          <qti-base-value base-type="float">0.5</qti-base-value>
        </qti-sum>
      `);

      expect(classify(doc)).toEqual({ mode: 'sumScores', scoreOffset: 0.5 });
    });

    describe('declared MAXSCORE', () => {
      // A worth 2 and B worth 1, so the inferred maximum is 3 - 2 = 1
      const withMaxScore = (maxScore: string | null, expression: string) => new DOMParser().parseFromString(`
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item">
          <qti-response-declaration identifier="A" cardinality="single" base-type="identifier">
            <qti-mapping><qti-map-entry map-key="a" mapped-value="2"/></qti-mapping>
          </qti-response-declaration>
          <qti-response-declaration identifier="B" cardinality="single" base-type="identifier">
            <qti-mapping><qti-map-entry map-key="b" mapped-value="1"/></qti-mapping>
          </qti-response-declaration>
          <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
          ${maxScore === null ? '' : `
          <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
            <qti-default-value><qti-value>${maxScore}</qti-value></qti-default-value>
          </qti-outcome-declaration>`}
          <qti-item-body><p>Test item</p>${passthroughInteraction('A')}${passthroughInteraction('B')}</qti-item-body>
          <qti-response-processing>
            <qti-set-outcome-value identifier="SCORE">${expression}</qti-set-outcome-value>
          </qti-response-processing>
        </qti-assessment-item>
      `, 'application/xml');
      const offsetSum = `
        <qti-sum>
          <qti-base-value base-type="float">-2</qti-base-value>
          <qti-map-response identifier="A"/>
          <qti-map-response identifier="B"/>
        </qti-sum>`;
      const floored = (inner: string) => `<qti-max><qti-base-value base-type="float">0</qti-base-value>${inner}</qti-max>`;
      const capped = (cap: number) => `<qti-min><qti-base-value base-type="float">${cap}</qti-base-value>${offsetSum}</qti-min>`;

      it('should leave the maximum to inference when MAXSCORE matches it', () => {
        expect(classify(withMaxScore('1.0', floored(offsetSum))))
          .toEqual({ mode: 'sumScores', scoreOffset: -2 });
      });

      it('should leave the maximum to inference without a MAXSCORE', () => {
        expect(classify(withMaxScore(null, floored(offsetSum))))
          .toEqual({ mode: 'sumScores', scoreOffset: -2 });
      });

      it('should keep a MAXSCORE that differs from inference without a cap as custom', () => {
        expect(classify(withMaxScore('4', offsetSum)).mode).toBe('custom');
        expect(classify(withMaxScore('0.5', floored(offsetSum))).mode).toBe('custom');
      });

      it('should accept a MAXSCORE matching the cap', () => {
        expect(classify(withMaxScore('0.5', floored(capped(0.5)))))
          .toEqual({ mode: 'sumScores', scoreOffset: -2, maximumScore: 0.5 });
      });

      it('should match a MAXSCORE without floating point noise', () => {
        const doc = new DOMParser().parseFromString(`
          <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item">
            <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
              <qti-mapping>
                <qti-map-entry map-key="A" mapped-value="0.1"/>
                <qti-map-entry map-key="B" mapped-value="0.2"/>
              </qti-mapping>
            </qti-response-declaration>
            <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
            <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
              <qti-default-value><qti-value>0.3</qti-value></qti-default-value>
            </qti-outcome-declaration>
            <qti-item-body>
              <qti-choice-interaction response-identifier="RESPONSE" max-choices="0">
                <qti-simple-choice identifier="A">A</qti-simple-choice>
                <qti-simple-choice identifier="B">B</qti-simple-choice>
              </qti-choice-interaction>
            </qti-item-body>
            <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml"/>
          </qti-assessment-item>
        `, 'application/xml');

        expect(classify(doc)).toEqual({ mode: 'sumScores' });
      });

      it('should read MAXSCORE as delivery does: only with single cardinality', () => {
        const doc = withMaxScore('4', floored(offsetSum));
        doc.querySelector('qti-outcome-declaration[identifier="MAXSCORE"]')!.setAttribute('cardinality', 'multiple');

        expect(classify(doc)).toEqual({ mode: 'sumScores', scoreOffset: -2 });
      });

      it('should classify as custom when MAXSCORE differs from the cap', () => {
        expect(classify(withMaxScore('2', floored(capped(0.5)))).mode).toBe('custom');
      });
    });

    it.each([
      ['two offsets', `
        <qti-sum>
          <qti-base-value base-type="float">-1</qti-base-value>
          <qti-base-value base-type="float">-1</qti-base-value>
          <qti-map-response identifier="RESPONSE"/>
        </qti-sum>`],
      ['only an offset', `
        <qti-sum>
          <qti-base-value base-type="float">-1</qti-base-value>
        </qti-sum>`],
      ['another operator in the sum', `
        <qti-sum>
          <qti-map-response identifier="RESPONSE"/>
          <qti-product>
            <qti-map-response identifier="RESPONSE"/>
            <qti-base-value base-type="float">2</qti-base-value>
          </qti-product>
        </qti-sum>`],
      ['a sum nested in another operator', `
        <qti-product>
          <qti-sum>
            <qti-map-response identifier="RESPONSE"/>
          </qti-sum>
          <qti-base-value base-type="float">2</qti-base-value>
        </qti-product>`],
      ['two qti-min caps', `
        <qti-min>
          <qti-base-value base-type="float">2</qti-base-value>
          <qti-min>
            <qti-base-value base-type="float">3</qti-base-value>
            <qti-sum>
              <qti-map-response identifier="RESPONSE"/>
            </qti-sum>
          </qti-min>
        </qti-min>`],
      ['qti-max without a constant', `
        <qti-max>
          <qti-variable identifier="OTHER"/>
          <qti-sum>
            <qti-map-response identifier="RESPONSE"/>
          </qti-sum>
        </qti-max>`],
      ['a floor other than 0', `
        <qti-max>
          <qti-base-value base-type="float">-1</qti-base-value>
          <qti-sum>
            <qti-map-response identifier="RESPONSE"/>
          </qti-sum>
        </qti-max>`],
      ['qti-max with three operands', `
        <qti-max>
          <qti-base-value base-type="float">0</qti-base-value>
          <qti-base-value base-type="float">1</qti-base-value>
          <qti-sum>
            <qti-map-response identifier="RESPONSE"/>
          </qti-sum>
        </qti-max>`],
      ['a non-numeric offset', `
        <qti-sum>
          <qti-base-value base-type="identifier">A</qti-base-value>
          <qti-map-response identifier="RESPONSE"/>
        </qti-sum>`],
    ])('should classify %s as custom', (_name, expression) => {
      expect(classify(scoreSetter(expression)).mode).toBe('custom');
    });
  });

  describe('item-level feedback', () => {
    const itemCompletedRule = `
      <qti-set-outcome-value identifier="FEEDBACK">
        <qti-multiple>
          <qti-variable identifier="FEEDBACK"/>
          <qti-base-value base-type="identifier">ITEM_completed</qti-base-value>
        </qti-multiple>
      </qti-set-outcome-value>`;

    const allCorrectScoring = `
      <qti-response-condition>
        <qti-response-if>
          <qti-match>
            <qti-variable identifier="X"/>
            <qti-correct identifier="X"/>
          </qti-match>
          <qti-set-outcome-value identifier="SCORE">
            <qti-base-value base-type="float">1</qti-base-value>
          </qti-set-outcome-value>
        </qti-response-if>
        <qti-response-else>
          <qti-set-outcome-value identifier="SCORE">
            <qti-base-value base-type="float">0</qti-base-value>
          </qti-set-outcome-value>
        </qti-response-else>
      </qti-response-condition>`;

    it('should recognize allCorrect + unconditional ITEM_completed rule', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          ${allCorrectScoring}
          ${itemCompletedRule}
        </qti-response-processing>
      `, ['ITEM_completed']);

      expect(classify(doc).mode).toBe('allCorrect');
    });

    it('should recognize sumScores + unconditional ITEM_completed rule', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-set-outcome-value identifier="SCORE">
            <qti-sum>
              <qti-map-response identifier="RESPONSE"/>
            </qti-sum>
          </qti-set-outcome-value>
          ${itemCompletedRule}
        </qti-response-processing>
      `, ['ITEM_completed']);

      expect(classify(doc).mode).toBe('sumScores');
    });

    it('should classify ITEM_completed set inside a condition as custom', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          ${allCorrectScoring}
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="RESPONSE"/>
                <qti-correct identifier="RESPONSE"/>
              </qti-match>
              ${itemCompletedRule}
            </qti-response-if>
          </qti-response-condition>
        </qti-response-processing>
      `);

      expect(classify(doc).mode).toBe('custom');
    });

    it.each(['ITEM_completed', 'RESPONSE_correct'])(
      'should classify %s set inside the scoring condition as custom',
      (feedbackId) => {
        const doc = createQtiDoc(`
          <qti-response-processing>
            ${allCorrectScoring.replace(
              '</qti-response-if>',
              `${itemCompletedRule.replace('ITEM_completed', feedbackId)}</qti-response-if>`
            )}
          </qti-response-processing>
        `);

        expect(classify(doc).mode).toBe('custom');
      }
    );

    it('should classify other unconditional FEEDBACK rules as custom', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          ${allCorrectScoring}
          ${itemCompletedRule.replace('ITEM_completed', 'RESPONSE_correct')}
        </qti-response-processing>
      `);

      expect(classify(doc).mode).toBe('custom');
    });
  });

  describe('example items round-trip', () => {
    function parseItem(item: string): Document {
      const parser = new DOMParser();
      return parser.parseFromString(item, 'application/xml');
    }

    it('should classify modal-feedback.ts as custom, since it scores MAXSCORE (10), not 1', () => {
      const doc = parseItem(modalFeedbackItem);
      const result = classify(doc);
      expect(result.mode).toBe('custom');
    });

    it('should classify inline-feedback.ts as custom, since it scores MAXSCORE (10), not 1', () => {
      const doc = parseItem(inlineFeedbackItem);
      const result = classify(doc);
      expect(result.mode).toBe('custom');
    });

    it('should classify text-entry-multi.ts as allCorrect', () => {
      const doc = parseItem(textEntryMultiItem);
      const result = classify(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should classify standard-choice-multiple-wrong-choice-feedback.ts as allCorrect', () => {
      const doc = parseItem(choiceMultipleFeedbackItem);
      const result = classify(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should classify standard-gap-match-rationale-dyad.ts as custom, since the editor does not generate its per-gap feedback', () => {
      const doc = parseItem(gapMatchRationaleDyadItem);
      const result = classify(doc);
      expect(result.mode).toBe('custom');
    });

    it('should classify standard-gap-match-rationale-triad.ts as custom', () => {
      const doc = parseItem(gapMatchRationaleTriadItem);
      const result = classify(doc);
      expect(result.mode).toBe('custom');
    });

    it('should classify standard-multi-interaction.ts as sumScores', () => {
      const doc = parseItem(multiInteractionItem);
      const result = classify(doc);
      expect(result.mode).toBe('sumScores');
    });

    it('should classify inline-choice-multi.ts as sumScores', () => {
      const doc = parseItem(inlineChoiceMultiItem);
      const result = classify(doc);
      expect(result.mode).toBe('sumScores');
    });

    it('should classify standard-text-entry-partial.ts as sumScores', () => {
      const doc = parseItem(textEntryPartialItem);
      const result = classify(doc);
      expect(result.mode).toBe('sumScores');
    });

    it('should classify standard-choice-partial.ts as sumScores', () => {
      const doc = parseItem(choicePartialItem);
      const result = classify(doc);
      expect(result.mode).toBe('sumScores');
    });
  });

  describe('sumScores intermediate scores', () => {
    const intermediate = (response: string, correctValue = '1') => `
      <qti-response-condition>
        <qti-response-if>
          <qti-match><qti-variable identifier="${response}"/><qti-correct identifier="${response}"/></qti-match>
          <qti-set-outcome-value identifier="${response}_SCORE"><qti-base-value base-type="float">${correctValue}</qti-base-value></qti-set-outcome-value>
        </qti-response-if>
        <qti-response-else>
          <qti-set-outcome-value identifier="${response}_SCORE"><qti-base-value base-type="float">0</qti-base-value></qti-set-outcome-value>
        </qti-response-else>
      </qti-response-condition>`;
    const sumOf = (...operands: string[]) => `
      <qti-set-outcome-value identifier="SCORE"><qti-sum>${operands.join('')}</qti-sum></qti-set-outcome-value>`;
    const variable = (identifier: string) => `<qti-variable identifier="${identifier}"/>`;
    const mapResponse = (identifier: string) => `<qti-map-response identifier="${identifier}"/>`;
    const classifyRules = (rules: string) =>
      classify(createQtiDoc(`<qti-response-processing>${rules}</qti-response-processing>`)).mode;

    it('should recognize intermediate scores as the generator writes them', () => {
      expect(classifyRules(intermediate('X') + sumOf(mapResponse('A'), variable('X_SCORE')))).toBe('sumScores');
    });

    it.each([
      ['an intermediate score worth more than 1', intermediate('X', '3') + sumOf(variable('X_SCORE'))],
      ['a summed variable without an intermediate score condition', intermediate('X') + sumOf(variable('X_SCORE'), variable('BONUS'))],
      ['an intermediate score that is not summed', intermediate('X') + intermediate('Y') + sumOf(variable('X_SCORE'))],
      ['a mapped score for a response without a mapping', sumOf(mapResponse('X'))],
    ])('should classify %s as custom', (_name, rules) => {
      expect(classifyRules(rules)).toBe('custom');
    });
  });

  describe('scoring every interaction', () => {
    // Two text entries the editor edits: A mapped, B unmapped
    const textEntryItem = (responseProcessing: string) => new DOMParser().parseFromString(`
      <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item">
        <qti-response-declaration identifier="A" cardinality="single" base-type="string">
          <qti-correct-response><qti-value>a</qti-value></qti-correct-response>
          <qti-mapping><qti-map-entry map-key="a" mapped-value="2"/></qti-mapping>
        </qti-response-declaration>
        <qti-response-declaration identifier="B" cardinality="single" base-type="string">
          <qti-correct-response><qti-value>b</qti-value></qti-correct-response>
        </qti-response-declaration>
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
        <qti-item-body>
          <p><qti-text-entry-interaction response-identifier="A"/> <qti-text-entry-interaction response-identifier="B"/></p>
        </qti-item-body>
        <qti-response-processing>${responseProcessing}</qti-response-processing>
      </qti-assessment-item>
    `, 'application/xml');
    const bScore = `
      <qti-response-condition>
        <qti-response-if>
          <qti-match><qti-variable identifier="B"/><qti-correct identifier="B"/></qti-match>
          <qti-set-outcome-value identifier="B_SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>
        </qti-response-if>
        <qti-response-else>
          <qti-set-outcome-value identifier="B_SCORE"><qti-base-value base-type="float">0</qti-base-value></qti-set-outcome-value>
        </qti-response-else>
      </qti-response-condition>`;
    const sumOf = (...operands: string[]) =>
      `<qti-set-outcome-value identifier="SCORE"><qti-sum>${operands.join('')}</qti-sum></qti-set-outcome-value>`;
    const allCorrectOf = (...checks: string[]) => `
      <qti-response-condition>
        <qti-response-if>
          <qti-and>${checks.join('')}</qti-and>
          <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>
        </qti-response-if>
        <qti-response-else>
          <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">0</qti-base-value></qti-set-outcome-value>
        </qti-response-else>
      </qti-response-condition>`;
    const matchCorrect = (identifier: string) =>
      `<qti-match><qti-variable identifier="${identifier}"/><qti-correct identifier="${identifier}"/></qti-match>`;
    const mapA = '<qti-map-response identifier="A"/>';
    const equalA = `<qti-equal>${mapA}<qti-base-value base-type="float">2</qti-base-value></qti-equal>`;
    const classifyRules = (responseProcessing: string) => classify(textEntryItem(responseProcessing)).mode;

    it('should recognize rules that score every interaction once', () => {
      expect(classifyRules(bScore + sumOf(mapA, '<qti-variable identifier="B_SCORE"/>'))).toBe('sumScores');
      expect(classifyRules(allCorrectOf(equalA, matchCorrect('B')))).toBe('allCorrect');
    });

    it.each([
      ['a sum leaving an interaction out', sumOf(mapA)],
      ['a sum scoring a response twice', bScore + sumOf(mapA, mapA, '<qti-variable identifier="B_SCORE"/>')],
      ['a mapped response scored by an intermediate condition', bScore.replace(/"B"/g, '"A"').replace(/B_SCORE/g, 'A_SCORE') +
        bScore + sumOf('<qti-variable identifier="A_SCORE"/>', '<qti-variable identifier="B_SCORE"/>')],
      ['all-or-nothing leaving an interaction out', allCorrectOf(equalA)],
      ['all-or-nothing checking a response twice', allCorrectOf(equalA, equalA, matchCorrect('B'))],
      ['all-or-nothing matching a mapped response', allCorrectOf(matchCorrect('A'), matchCorrect('B'))],
    ])('should classify %s as custom', (_name, responseProcessing) => {
      expect(classifyRules(responseProcessing)).toBe('custom');
    });

    it('should classify a map_response template on an unmapped response as custom', () => {
      const doc = createQtiDoc('<qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml"/>');
      doc.querySelector('qti-response-declaration[identifier="RESPONSE"] qti-mapping')!.remove();

      expect(classify(doc).mode).toBe('custom');
    });
  });

  describe('templates', () => {
    const withTemplate = (url: string, mappedResponse: boolean) => {
      const doc = createQtiDoc(`<qti-response-processing template="${url}"/>`);
      if (!mappedResponse) doc.querySelector('qti-response-declaration[identifier="RESPONSE"] qti-mapping')!.remove();
      return doc;
    };

    it.each([
      ['https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml', false, 'allCorrect'],
      ['https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml', false, 'allCorrect'],
      ['https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct', false, 'allCorrect'],
      ['https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml', true, 'sumScores'],
      ['https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/CC2_map_response.xml', true, 'custom'],
      ['https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/CC2_match.xml', false, 'custom'],
      ['https://example.com/rptemplates/match_correct.xml', false, 'custom'],
      ['https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml', true, 'custom'],
    ])('should classify %s (mapped response: %s) as %s', (url, mappedResponse, mode) => {
      expect(classify(withTemplate(url, mappedResponse)).mode).toBe(mode);
    });
  });

  describe('external scoring', () => {
    const withScore = (scoreAttributes: string, responseProcessing: string) => createQtiDoc(responseProcessing)
      .documentElement.outerHTML.replace(
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
        `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" ${scoreAttributes}/>`
      );
    const parse = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml');

    it('should classify a human-scored SCORE without response processing as manual', () => {
      const doc = parse(withScore('external-scored="human" normal-maximum="2"', ''));
      expect(classify(doc)).toEqual({ mode: 'manual' });
    });

    it('should preserve externalMachine scoring as custom', () => {
      const doc = parse(withScore('external-scored="externalMachine"', ''));
      expect(classify(doc)).toEqual({ mode: 'custom' });
    });
  });

  describe('saved response processing', () => {
    // Save each item in a mode, then load it again
    const saveAs = (item: string, config: ResponseProcessingConfig) => {
      const nodes = parseXmlToSlate(item);
      (nodes[0] as DocumentMetadata).responseProcessing = config;
      return new DOMParser().parseFromString(serializeSlateToQti(nodes, item).xml, 'application/xml');
    };

    it.each([
      ['standard-multi-interaction.ts', multiInteractionItem],
      ['standard-text-entry-partial.ts', textEntryPartialItem],
      ['standard-choice-multiple-wrong-choice-feedback.ts', choiceMultipleFeedbackItem],
      ['inline-choice-multi.ts', inlineChoiceMultiItem],
    ])('should load %s in the mode it was saved in', (_name, item) => {
      const configs: ResponseProcessingConfig[] = [
        { mode: 'allCorrect' },
        { mode: 'sumScores' },
        { mode: 'sumScores', scoreOffset: -1 },
        { mode: 'sumScores', maximumScore: 2 },
        { mode: 'sumScores', scoreOffset: -1, maximumScore: 1 },
      ];
      for (const config of configs) {
        expect(classify(saveAs(item, config))).toEqual(config);
      }
    });
  });

  describe('response processing the editor would write differently', () => {
    const scoreX = (ifRules: string, otherBranches: string) => `
      <qti-response-condition>
        <qti-response-if>
          <qti-match><qti-variable identifier="X"/><qti-correct identifier="X"/></qti-match>
          ${ifRules}
        </qti-response-if>
        ${otherBranches}
      </qti-response-condition>`;
    const setScore = (value: string) =>
      `<qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">${value}</qti-base-value></qti-set-outcome-value>`;
    const elseScore = (value: string) => `<qti-response-else>${setScore(value)}</qti-response-else>`;
    const sumA = '<qti-set-outcome-value identifier="SCORE"><qti-sum><qti-map-response identifier="A"/></qti-sum></qti-set-outcome-value>';

    it('should recognize the rule as the editor writes it', () => {
      expect(classify(createQtiDoc(`<qti-response-processing>${scoreX(setScore('1'), elseScore('0'))}</qti-response-processing>`)).mode)
        .toBe('allCorrect');
    });

    it.each([
      ['all-or-nothing scoring other than 1', scoreX(setScore('2'), elseScore('0'))],
      ['all-or-nothing with an else-if', scoreX(setScore('1'),
        `<qti-response-else-if><qti-match><qti-variable identifier="Y"/><qti-correct identifier="Y"/></qti-match>${setScore('0.5')}</qti-response-else-if>${elseScore('0')}`)],
      ['all-or-nothing checking a mapped response for less than its maximum',
        `<qti-response-condition><qti-response-if><qti-equal><qti-map-response identifier="A"/><qti-base-value base-type="float">0.5</qti-base-value></qti-equal>${setScore('1')}</qti-response-if>${elseScore('0')}</qti-response-condition>`],
      ['a top-level qti-exit-response', scoreX(setScore('1'), elseScore('0')) + '<qti-exit-response/>'],
      ['a rule after the sum', sumA + '<qti-lookup-outcome-value identifier="GRADE"><qti-variable identifier="SCORE"/></qti-lookup-outcome-value>'],
      ['a sum with a different floor', '<qti-set-outcome-value identifier="SCORE"><qti-max><qti-base-value base-type="float">1</qti-base-value><qti-sum><qti-map-response identifier="A"/></qti-sum></qti-max></qti-set-outcome-value>'],
    ])('should classify %s as custom', (_name, rules) => {
      expect(classify(createQtiDoc(`<qti-response-processing>${rules}</qti-response-processing>`)).mode).toBe('custom');
    });

    it('should classify two interactions bound to the same response as custom', () => {
      const doc = new DOMParser().parseFromString(`
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item">
          <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
            <qti-correct-response><qti-value>a</qti-value></qti-correct-response>
          </qti-response-declaration>
          <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
          <qti-item-body>
            <p><qti-text-entry-interaction response-identifier="RESPONSE"/> <qti-text-entry-interaction response-identifier="RESPONSE"/></p>
          </qti-item-body>
          <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
        </qti-assessment-item>`, 'application/xml');

      expect(classify(doc).mode).toBe('custom');
    });

    it('should recognize item feedback without scored interactions', () => {
      const doc = new DOMParser().parseFromString(`
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item">
          <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>
          <qti-item-body>
            <p>Read this.</p>
            ${feedbackBlock('ITEM_completed')}
          </qti-item-body>
          <qti-response-processing>
            <qti-set-outcome-value identifier="FEEDBACK">
              <qti-multiple><qti-variable identifier="FEEDBACK"/><qti-base-value base-type="identifier">ITEM_completed</qti-base-value></qti-multiple>
            </qti-set-outcome-value>
          </qti-response-processing>
        </qti-assessment-item>`, 'application/xml');

      expect(classify(doc).mode).toBe('allCorrect');
    });
  });

  describe('getScoredResponseIdentifiers', () => {
    const doc = (responseProcessing: string) => new DOMParser().parseFromString(`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item">
  <qti-response-declaration identifier="R1" cardinality="single" base-type="identifier"/>
  <qti-response-declaration identifier="R2" cardinality="single" base-type="identifier"/>
  <qti-item-body><p>Test</p></qti-item-body>
  ${responseProcessing}
</qti-assessment-item>`, 'application/xml');

    it('should report responses in scoring rules but not in feedback-only conditions', () => {
      const scored = getScoredResponseIdentifiers(doc(`<qti-response-processing>
        <qti-set-outcome-value identifier="SCORE"><qti-sum><qti-map-response identifier="R1"/></qti-sum></qti-set-outcome-value>
        <qti-response-condition><qti-response-if>
          <qti-match><qti-variable identifier="R2"/><qti-base-value base-type="identifier">A</qti-base-value></qti-match>
          <qti-set-outcome-value identifier="FEEDBACK"><qti-multiple><qti-variable identifier="FEEDBACK"/><qti-base-value base-type="identifier">R2_A</qti-base-value></qti-multiple></qti-set-outcome-value>
        </qti-response-if></qti-response-condition>
      </qti-response-processing>`));

      expect([...scored]).toEqual(['R1']);
    });
  });
});
