import { describe, expect, it } from 'vitest';
import { item as inlineChoiceMultiItem } from '../../../cutie-example/src/example-items/inline-choice-multi';
import { item as inlineFeedbackItem } from '../../../cutie-example/src/example-items/inline-feedback';
import { item as modalFeedbackItem } from '../../../cutie-example/src/example-items/modal-feedback';
import { item as choiceFeedbackItem } from '../../../cutie-example/src/example-items/standard-choice';
import { item as choiceMultipleFeedbackItem } from '../../../cutie-example/src/example-items/standard-choice-multiple';
import { item as choicePartialItem } from '../../../cutie-example/src/example-items/standard-choice-partial';
import { item as gapMatchFeedbackItem } from '../../../cutie-example/src/example-items/standard-gap-match';
import { item as inlineChoiceFeedbackItem } from '../../../cutie-example/src/example-items/standard-inline-choice';
import { item as matchFeedbackItem } from '../../../cutie-example/src/example-items/standard-match';
import { item as multiInteractionItem } from '../../../cutie-example/src/example-items/standard-multi-interaction';
import { item as textEntryItem } from '../../../cutie-example/src/example-items/standard-text-entry';
import { item as textEntryPartialItem } from '../../../cutie-example/src/example-items/standard-text-entry-partial';
import { item as textEntryMultiItem } from '../../../cutie-example/src/example-items/text-entry-multi';
import { classifyResponseProcessing } from './responseProcessingClassifier';

/**
 * Helper to create a minimal QTI document for testing
 */
function createQtiDoc(responseProcessingContent: string): Document {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test-item">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>correct</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>
  <qti-item-body>
    <p>Test item</p>
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
                <qti-variable identifier="RESPONSE"/>
                <qti-correct identifier="RESPONSE"/>
              </qti-match>
              <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
        </qti-response-processing>
      `);

      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('allCorrect');
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

      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should recognize multiple interaction allCorrect with mixed qti-match and qti-equal', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-and>
                <qti-match>
                  <qti-variable identifier="RESPONSE"/>
                  <qti-correct identifier="RESPONSE"/>
                </qti-match>
                <qti-equal>
                  <qti-map-response identifier="RESPONSE_2"/>
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

      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('allCorrect');
    });
  });

  describe('allCorrect pattern with feedback conditions', () => {
    it('should recognize allCorrect + correct/incorrect feedback conditions', () => {
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

          <!-- Correct feedback condition -->
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="RESPONSE"/>
                <qti-correct identifier="RESPONSE"/>
              </qti-match>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">RESPONSE_correct</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>

          <!-- Incorrect feedback condition -->
          <qti-response-condition>
            <qti-response-if>
              <qti-not>
                <qti-match>
                  <qti-variable identifier="RESPONSE"/>
                  <qti-correct identifier="RESPONSE"/>
                </qti-match>
              </qti-not>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">RESPONSE_incorrect</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
        </qti-response-processing>
      `);

      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should recognize allCorrect + multiple per-choice feedback conditions', () => {
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

          <!-- Feedback for choiceA -->
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

          <!-- Feedback for choiceB -->
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="RESPONSE"/>
                <qti-base-value base-type="identifier">choiceB</qti-base-value>
              </qti-match>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">RESPONSE_choice_choiceB</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>

          <!-- Feedback for choiceC -->
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="RESPONSE"/>
                <qti-base-value base-type="identifier">choiceC</qti-base-value>
              </qti-match>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">RESPONSE_choice_choiceC</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
        </qti-response-processing>
      `);

      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should recognize allCorrect with partial feedback (three-way condition)', () => {
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

          <qti-response-condition>
            <qti-response-if>
              <qti-equal>
                <qti-map-response identifier="RESPONSE"/>
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-equal>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">RESPONSE_correct</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else-if>
              <qti-gt>
                <qti-map-response identifier="RESPONSE"/>
                <qti-base-value base-type="float">0</qti-base-value>
              </qti-gt>
              <qti-set-outcome-value identifier="FEEDBACK">
                <qti-multiple>
                  <qti-variable identifier="FEEDBACK"/>
                  <qti-base-value base-type="identifier">RESPONSE_partial</qti-base-value>
                </qti-multiple>
              </qti-set-outcome-value>
            </qti-response-else-if>
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
      `);

      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('allCorrect');
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

      const result = classifyResponseProcessing(doc);
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

      const result = classifyResponseProcessing(doc);
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
      `);

      const result = classifyResponseProcessing(doc);
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
      `);

      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('sumScores');
    });

    it('should recognize sumScores with intermediate score conditions before sum', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="RESPONSE"/>
                <qti-correct identifier="RESPONSE"/>
              </qti-match>
              <qti-set-outcome-value identifier="RESPONSE_SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
              <qti-set-outcome-value identifier="RESPONSE_SCORE">
                <qti-base-value base-type="float">0</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-else>
          </qti-response-condition>

          <qti-set-outcome-value identifier="SCORE">
            <qti-sum>
              <qti-variable identifier="RESPONSE_SCORE"/>
            </qti-sum>
          </qti-set-outcome-value>
        </qti-response-processing>
      `);

      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('sumScores');
    });

    it('should recognize sumScores with intermediate score conditions + feedback after sum', () => {
      const doc = createQtiDoc(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="RESPONSE"/>
                <qti-correct identifier="RESPONSE"/>
              </qti-match>
              <qti-set-outcome-value identifier="RESPONSE_SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
              <qti-set-outcome-value identifier="RESPONSE_SCORE">
                <qti-base-value base-type="float">0</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-else>
          </qti-response-condition>

          <qti-set-outcome-value identifier="SCORE">
            <qti-sum>
              <qti-variable identifier="RESPONSE_SCORE"/>
            </qti-sum>
          </qti-set-outcome-value>

          <qti-response-condition>
            <qti-response-if>
              <qti-match>
                <qti-variable identifier="RESPONSE"/>
                <qti-correct identifier="RESPONSE"/>
              </qti-match>
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
      `);

      const result = classifyResponseProcessing(doc);
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

      const result = classifyResponseProcessing(doc);
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

      const result = classifyResponseProcessing(doc);
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

      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('custom');
    });
  });

  describe('example items round-trip', () => {
    function parseItem(item: string): Document {
      const parser = new DOMParser();
      return parser.parseFromString(item, 'application/xml');
    }

    it('should classify modal-feedback.ts as allCorrect', () => {
      const doc = parseItem(modalFeedbackItem);
      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should classify inline-feedback.ts as allCorrect', () => {
      const doc = parseItem(inlineFeedbackItem);
      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should classify choice-feedback.ts as allCorrect', () => {
      const doc = parseItem(choiceFeedbackItem);
      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should classify standard-text-entry.ts as allCorrect', () => {
      const doc = parseItem(textEntryItem);
      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should classify text-entry-multi.ts as allCorrect', () => {
      const doc = parseItem(textEntryMultiItem);
      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should classify standard-choice-multiple.ts as allCorrect', () => {
      const doc = parseItem(choiceMultipleFeedbackItem);
      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should classify standard-inline-choice.ts as allCorrect', () => {
      const doc = parseItem(inlineChoiceFeedbackItem);
      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should classify standard-match.ts as allCorrect', () => {
      const doc = parseItem(matchFeedbackItem);
      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should classify standard-gap-match.ts as allCorrect', () => {
      const doc = parseItem(gapMatchFeedbackItem);
      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('allCorrect');
    });

    it('should classify standard-multi-interaction.ts as sumScores', () => {
      const doc = parseItem(multiInteractionItem);
      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('sumScores');
    });

    it('should classify inline-choice-multi.ts as sumScores', () => {
      const doc = parseItem(inlineChoiceMultiItem);
      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('sumScores');
    });

    it('should classify standard-text-entry-partial.ts as sumScores', () => {
      const doc = parseItem(textEntryPartialItem);
      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('sumScores');
    });

    it('should classify standard-choice-partial.ts as sumScores', () => {
      const doc = parseItem(choicePartialItem);
      const result = classifyResponseProcessing(doc);
      expect(result.mode).toBe('sumScores');
    });
  });
});
