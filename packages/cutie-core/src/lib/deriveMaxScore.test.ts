import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
import { deriveMaxScore } from './deriveMaxScore';

describe('deriveMaxScore', () => {
  // Helper to create Document from XML string
  const parseXML = (xml: string): Document => {
    return new DOMParser().parseFromString(xml, 'text/xml');
  };

  describe('Explicit MAXSCORE variable (highest priority)', () => {
    test('should return explicit MAXSCORE when present', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-processing>
            <qti-set-outcome-value identifier="SCORE">
              <qti-base-value base-type="float">1.0</qti-base-value>
            </qti-set-outcome-value>
          </qti-response-processing>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0,
        MAXSCORE: 5.0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBe(5.0);
    });
  });

  describe('Composite sum pattern (official QTI v3 multi-input.xml)', () => {
    test('should derive maxScore from sum of component scores with literal values', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-processing>
            <qti-response-condition>
              <qti-response-if>
                <qti-match>
                  <qti-variable identifier="RESPONSE1"/>
                  <qti-correct identifier="RESPONSE1"/>
                </qti-match>
                <qti-set-outcome-value identifier="SCORE1">
                  <qti-base-value base-type="float">1.0</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-if>
              <qti-response-else>
                <qti-set-outcome-value identifier="SCORE1">
                  <qti-base-value base-type="float">0.0</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-else>
            </qti-response-condition>
            <qti-response-condition>
              <qti-response-if>
                <qti-match>
                  <qti-variable identifier="RESPONSE2"/>
                  <qti-correct identifier="RESPONSE2"/>
                </qti-match>
                <qti-set-outcome-value identifier="SCORE2">
                  <qti-base-value base-type="float">1.0</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-if>
              <qti-response-else>
                <qti-set-outcome-value identifier="SCORE2">
                  <qti-base-value base-type="float">0.0</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-else>
            </qti-response-condition>
            <qti-response-condition>
              <qti-response-if>
                <qti-match>
                  <qti-variable identifier="RESPONSE3"/>
                  <qti-base-value base-type="identifier">good king</qti-base-value>
                </qti-match>
                <qti-set-outcome-value identifier="SCORE3">
                  <qti-base-value base-type="float">1.0</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-if>
              <qti-response-else-if>
                <qti-match>
                  <qti-variable identifier="RESPONSE3"/>
                  <qti-base-value base-type="identifier">bad king</qti-base-value>
                </qti-match>
                <qti-set-outcome-value identifier="SCORE3">
                  <qti-base-value base-type="float">0.5</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-else-if>
              <qti-response-else-if>
                <qti-match>
                  <qti-variable identifier="RESPONSE3"/>
                  <qti-base-value base-type="identifier">king</qti-base-value>
                </qti-match>
                <qti-set-outcome-value identifier="SCORE3">
                  <qti-base-value base-type="float">0.2</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-else-if>
              <qti-response-else>
                <qti-set-outcome-value identifier="SCORE3">
                  <qti-base-value base-type="float">0.0</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-else>
            </qti-response-condition>
            <qti-response-condition>
              <qti-response-if>
                <qti-match>
                  <qti-variable identifier="RESPONSE4"/>
                  <qti-correct identifier="RESPONSE4"/>
                </qti-match>
                <qti-set-outcome-value identifier="SCORE4">
                  <qti-base-value base-type="float">1.0</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-if>
              <qti-response-else>
                <qti-set-outcome-value identifier="SCORE4">
                  <qti-base-value base-type="float">0.0</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-else>
            </qti-response-condition>
            <qti-set-outcome-value identifier="SCORE">
              <qti-sum>
                <qti-variable identifier="SCORE1"/>
                <qti-variable identifier="SCORE2"/>
                <qti-variable identifier="SCORE3"/>
                <qti-variable identifier="SCORE4"/>
              </qti-sum>
            </qti-set-outcome-value>
          </qti-response-processing>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBe(4.0); // max of each: 1.0 + 1.0 + 1.0 + 1.0
    });

    test('should handle partial credit with different maximums', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-processing>
            <qti-response-condition>
              <qti-response-if>
                <qti-match>
                  <qti-variable identifier="RESPONSE1"/>
                  <qti-correct identifier="RESPONSE1"/>
                </qti-match>
                <qti-set-outcome-value identifier="SCORE1">
                  <qti-base-value base-type="float">2.0</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-if>
              <qti-response-else>
                <qti-set-outcome-value identifier="SCORE1">
                  <qti-base-value base-type="float">0.0</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-else>
            </qti-response-condition>
            <qti-response-condition>
              <qti-response-if>
                <qti-match>
                  <qti-variable identifier="RESPONSE2"/>
                  <qti-correct identifier="RESPONSE2"/>
                </qti-match>
                <qti-set-outcome-value identifier="SCORE2">
                  <qti-base-value base-type="float">1.0</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-if>
              <qti-response-else>
                <qti-set-outcome-value identifier="SCORE2">
                  <qti-base-value base-type="float">0.0</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-else>
            </qti-response-condition>
            <qti-response-condition>
              <qti-response-if>
                <qti-match>
                  <qti-variable identifier="RESPONSE3"/>
                  <qti-correct identifier="RESPONSE3"/>
                </qti-match>
                <qti-set-outcome-value identifier="SCORE3">
                  <qti-base-value base-type="float">0.5</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-if>
              <qti-response-else>
                <qti-set-outcome-value identifier="SCORE3">
                  <qti-base-value base-type="float">0.0</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-else>
            </qti-response-condition>
            <qti-set-outcome-value identifier="SCORE">
              <qti-sum>
                <qti-variable identifier="SCORE1"/>
                <qti-variable identifier="SCORE2"/>
                <qti-variable identifier="SCORE3"/>
              </qti-sum>
            </qti-set-outcome-value>
          </qti-response-processing>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBe(3.5); // 2.0 + 1.0 + 0.5
    });
  });

  describe('Mapping with upper-bound (existing behavior)', () => {
    test('should return mapping upper-bound when present', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
            <qti-correct-response>
              <qti-value>A</qti-value>
            </qti-correct-response>
            <qti-mapping upper-bound="3">
              <qti-map-entry map-key="A" mapped-value="2"/>
              <qti-map-entry map-key="B" mapped-value="1"/>
            </qti-mapping>
          </qti-response-declaration>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBe(3);
    });
  });

  describe('Mapping with map-entries', () => {
    test('should return max of mapped values for single cardinality', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
            <qti-correct-response>
              <qti-value>A</qti-value>
            </qti-correct-response>
            <qti-mapping>
              <qti-map-entry map-key="A" mapped-value="1"/>
              <qti-map-entry map-key="B" mapped-value="2"/>
            </qti-mapping>
          </qti-response-declaration>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBe(2); // max of 1, 2 for single cardinality
    });

    test('should return max of mapped values for single cardinality text entry with partial credit', () => {
      // This is the Richard III text entry example where "York" = 1, "york" = 0.5
      // With single cardinality, only one answer can be given, so maxScore = 1 (not 1.5)
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
            <qti-correct-response>
              <qti-value>York</qti-value>
            </qti-correct-response>
            <qti-mapping default-value="0">
              <qti-map-entry map-key="York" mapped-value="1"/>
              <qti-map-entry map-key="york" mapped-value="0.5"/>
            </qti-mapping>
          </qti-response-declaration>
          <qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/map_response.xml"/>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBe(1); // max of 1, 0.5 for single cardinality (not sum of 1.5)
    });

    test('should return sum of mapped values for multiple cardinality', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
            <qti-correct-response>
              <qti-value>A</qti-value>
              <qti-value>B</qti-value>
            </qti-correct-response>
            <qti-mapping>
              <qti-map-entry map-key="A" mapped-value="1"/>
              <qti-map-entry map-key="B" mapped-value="2"/>
            </qti-mapping>
          </qti-response-declaration>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBe(3); // sum: 1 + 2 for multiple cardinality
    });

    test('should return sum of positive mapped values for multiple cardinality with lower-bound', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
            <qti-correct-response>
              <qti-value>A</qti-value>
            </qti-correct-response>
            <qti-mapping lower-bound="0">
              <qti-map-entry map-key="A" mapped-value="2"/>
              <qti-map-entry map-key="B" mapped-value="-1"/>
              <qti-map-entry map-key="C" mapped-value="1"/>
            </qti-mapping>
          </qti-response-declaration>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBe(3); // sum of positive values: 2 + 1 for multiple cardinality
    });

    test('should return max of positive mapped values for single cardinality with lower-bound', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
            <qti-correct-response>
              <qti-value>A</qti-value>
            </qti-correct-response>
            <qti-mapping lower-bound="0">
              <qti-map-entry map-key="A" mapped-value="2"/>
              <qti-map-entry map-key="B" mapped-value="-1"/>
            </qti-mapping>
          </qti-response-declaration>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBe(2); // max positive value for single cardinality
    });
  });

  describe('Template patterns (existing behavior)', () => {
    test('should return 1 for match_correct template', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-processing template="match_correct"/>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBe(1);
    });

    test('should return 1 for map_response_point template', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-processing template="map_response_point"/>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBe(1);
    });
  });

  describe('Edge cases', () => {
    test('should return null for complex expression with product', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-processing>
            <qti-set-outcome-value identifier="SCORE">
              <qti-product>
                <qti-variable identifier="BASE_SCORE"/>
                <qti-variable identifier="MULTIPLIER"/>
              </qti-product>
            </qti-set-outcome-value>
          </qti-response-processing>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBeNull();
    });

    test('should return null when no derivable maxScore exists', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-processing>
            <qti-set-outcome-value identifier="SCORE">
              <qti-base-value base-type="float">0</qti-base-value>
            </qti-set-outcome-value>
          </qti-response-processing>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBeNull();
    });

    test('should handle sum pattern with no component variables found', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-processing>
            <qti-set-outcome-value identifier="SCORE">
              <qti-sum>
                <qti-variable identifier="UNKNOWN1"/>
                <qti-variable identifier="UNKNOWN2"/>
              </qti-sum>
            </qti-set-outcome-value>
          </qti-response-processing>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBeNull();
    });

    test('should handle empty response processing', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-processing>
          </qti-response-processing>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBeNull();
    });
  });
});
