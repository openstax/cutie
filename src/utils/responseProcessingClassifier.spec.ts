import { describe, expect, it } from 'vitest';
import { item as choiceFeedbackItem } from '../../../cutie-example/src/example-items/choice-feedback';
import { item as inlineFeedbackItem } from '../../../cutie-example/src/example-items/inline-feedback';
import { item as modalFeedbackItem } from '../../../cutie-example/src/example-items/modal-feedback';
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
  });
});
