/* spell-checker: ignore hottext */
import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
import { deriveMaxScore, inferExpressionMaxScore, inferMaxScore, inferResponseMaxScore } from './deriveMaxScore.js';

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

  describe('Normal-maximum attribute on SCORE outcome', () => {
    test('should return normal-maximum when present on SCORE outcome declaration', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"
                                   normal-maximum="5.0"/>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {};

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBe(5.0);
    });

    test('should ignore normal-maximum on non-SCORE outcome declarations', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-outcome-declaration identifier="OTHER" cardinality="single" base-type="float"
                                   normal-maximum="10.0"/>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {};

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBeNull();
    });

    test('should prefer explicit MAXSCORE variable over normal-maximum', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"
                                   normal-maximum="5.0"/>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = { MAXSCORE: 10 };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBe(10);
    });
  });

  describe('Declared maximums that are not usable', () => {
    const scoreItem = (normalMaximum: string) => new DOMParser().parseFromString(`
      <qti-assessment-item>
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" normal-maximum="${normalMaximum}"/>
      </qti-assessment-item>
    `, 'text/xml');

    test('ignores a MAXSCORE that is not a finite number', () => {
      expect(deriveMaxScore(scoreItem('3'), { MAXSCORE: NaN })).toBe(3);
      expect(deriveMaxScore(scoreItem('3'), { MAXSCORE: Infinity })).toBe(3);
    });

    test('ignores a normal-maximum that is not positive', () => {
      expect(deriveMaxScore(scoreItem('-1'), {})).toBeNull();
      expect(deriveMaxScore(scoreItem('0'), {})).toBeNull();
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

  describe('Mapping bounds', () => {
    test('caps the mapped maximum at upper-bound', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
            <qti-mapping upper-bound="2">
              <qti-map-entry map-key="A" mapped-value="2"/>
              <qti-map-entry map-key="B" mapped-value="1"/>
            </qti-mapping>
          </qti-response-declaration>
          <qti-item-body>
            <qti-choice-interaction response-identifier="RESPONSE" max-choices="0">
              <qti-simple-choice identifier="A">A</qti-simple-choice>
              <qti-simple-choice identifier="B">B</qti-simple-choice>
            </qti-choice-interaction>
          </qti-item-body>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, {})).toBe(2);
    });

    test('ignores an upper-bound the mapping cannot reach', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
            <qti-mapping upper-bound="3">
              <qti-map-entry map-key="A" mapped-value="2"/>
              <qti-map-entry map-key="B" mapped-value="1"/>
            </qti-mapping>
          </qti-response-declaration>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, {})).toBe(2);
    });
  });

  describe('Mapping with negative entries', () => {
    test('sums only positive entries for multiple cardinality without lower-bound', () => {
      // Choosing A and B, and not C, scores 2
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
            <qti-mapping>
              <qti-map-entry map-key="A" mapped-value="1"/>
              <qti-map-entry map-key="B" mapped-value="1"/>
              <qti-map-entry map-key="C" mapped-value="-1"/>
            </qti-mapping>
          </qti-response-declaration>
          <qti-item-body>
            <qti-choice-interaction response-identifier="RESPONSE" max-choices="0">
              <qti-simple-choice identifier="A">A</qti-simple-choice>
              <qti-simple-choice identifier="B">B</qti-simple-choice>
              <qti-simple-choice identifier="C">C</qti-simple-choice>
            </qti-choice-interaction>
          </qti-item-body>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, {})).toBe(2);
    });

    test('counts a positive default-value for single cardinality', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
            <qti-mapping default-value="2">
              <qti-map-entry map-key="A" mapped-value="1"/>
            </qti-mapping>
          </qti-response-declaration>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, {})).toBe(2);
    });
  });

  describe('Area mapping', () => {
    test('returns the best area for single cardinality', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="point">
            <qti-area-mapping>
              <qti-area-map-entry shape="circle" coords="100,100,10" mapped-value="5"/>
              <qti-area-map-entry shape="circle" coords="200,200,10" mapped-value="2"/>
            </qti-area-mapping>
          </qti-response-declaration>
          <qti-response-processing template="map_response_point"/>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, {})).toBe(5);
    });

    test('sums the positive areas for multiple cardinality', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="point">
            <qti-area-mapping>
              <qti-area-map-entry shape="circle" coords="100,100,10" mapped-value="2"/>
              <qti-area-map-entry shape="circle" coords="200,200,10" mapped-value="3"/>
              <qti-area-map-entry shape="circle" coords="300,300,10" mapped-value="-1"/>
            </qti-area-mapping>
          </qti-response-declaration>
          <qti-item-body>
            <qti-select-point-interaction response-identifier="RESPONSE" max-choices="0"/>
          </qti-item-body>
          <qti-response-processing template="map_response_point"/>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, {})).toBe(5);
    });

    test('caps the maximum at upper-bound', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="point">
            <qti-area-mapping upper-bound="4">
              <qti-area-map-entry shape="circle" coords="100,100,10" mapped-value="2"/>
              <qti-area-map-entry shape="circle" coords="200,200,10" mapped-value="3"/>
            </qti-area-mapping>
          </qti-response-declaration>
          <qti-item-body>
            <qti-select-point-interaction response-identifier="RESPONSE" max-choices="0"/>
          </qti-item-body>
          <qti-response-processing template="map_response_point"/>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, {})).toBe(4);
    });

    test('makes no guess when an area mapping and a mapping are both present', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="POINT" cardinality="single" base-type="point">
            <qti-area-mapping>
              <qti-area-map-entry shape="circle" coords="100,100,10" mapped-value="1"/>
            </qti-area-mapping>
          </qti-response-declaration>
          <qti-response-declaration identifier="CHOICE" cardinality="single" base-type="identifier">
            <qti-mapping><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping>
          </qti-response-declaration>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, {})).toBeNull();
    });
  });

  describe('Several mappings', () => {
    test('makes no guess from mappings when several declarations have one', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="R1" cardinality="single" base-type="identifier">
            <qti-mapping><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping>
          </qti-response-declaration>
          <qti-response-declaration identifier="R2" cardinality="single" base-type="identifier">
            <qti-mapping><qti-map-entry map-key="B" mapped-value="1"/></qti-mapping>
          </qti-response-declaration>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, {})).toBeNull();
    });

    test('still uses MAXSCORE when several declarations have mappings', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="R1" cardinality="single" base-type="identifier">
            <qti-mapping><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping>
          </qti-response-declaration>
          <qti-response-declaration identifier="R2" cardinality="single" base-type="identifier">
            <qti-mapping><qti-map-entry map-key="B" mapped-value="1"/></qti-mapping>
          </qti-response-declaration>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, { MAXSCORE: 5 })).toBe(5);
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
          <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml"/>
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
          <qti-item-body>
            <qti-choice-interaction response-identifier="RESPONSE" max-choices="0">
              <qti-simple-choice identifier="A">A</qti-simple-choice>
              <qti-simple-choice identifier="B">B</qti-simple-choice>
            </qti-choice-interaction>
          </qti-item-body>
        </qti-assessment-item>
      `);

      const variables: Record<string, unknown> = {
        SCORE: 0
      };

      const result = deriveMaxScore(itemDoc, variables);
      expect(result).toBe(3); // sum: 1 + 2 for multiple cardinality
    });

    test('makes no guess for multiple cardinality with a positive default and no upper-bound', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="string">
            <qti-mapping default-value="0.5">
              <qti-map-entry map-key="A" mapped-value="1"/>
            </qti-mapping>
          </qti-response-declaration>
        </qti-assessment-item>
      `);

      // Every unmapped value earns the default, so there is no limit
      expect(deriveMaxScore(itemDoc, { SCORE: 0 })).toBeNull();
    });

    test('maps unmapped choices to a positive default', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
            <qti-mapping default-value="0.5" upper-bound="4">
              <qti-map-entry map-key="A" mapped-value="1"/>
            </qti-mapping>
          </qti-response-declaration>
          <qti-item-body>
            <qti-choice-interaction response-identifier="RESPONSE" max-choices="0">
              <qti-simple-choice identifier="A">A</qti-simple-choice>
              <qti-simple-choice identifier="B">B</qti-simple-choice>
              <qti-simple-choice identifier="C">C</qti-simple-choice>
              <qti-simple-choice identifier="D">D</qti-simple-choice>
            </qti-choice-interaction>
          </qti-item-body>
        </qti-assessment-item>
      `);

      // A (1) plus B, C and D at the default (0.5 each)
      expect(deriveMaxScore(itemDoc, { SCORE: 0 })).toBe(2.5);
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
          <qti-item-body>
            <qti-choice-interaction response-identifier="RESPONSE" max-choices="0">
              <qti-simple-choice identifier="A">A</qti-simple-choice>
              <qti-simple-choice identifier="B">B</qti-simple-choice>
              <qti-simple-choice identifier="C">C</qti-simple-choice>
            </qti-choice-interaction>
          </qti-item-body>
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

    test('makes no guess from the map_response_point template alone', () => {
      // Its maximum comes from the area mapping, not the template
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-processing template="map_response_point"/>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, {})).toBeNull();
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

  describe('Choice max-choices', () => {
    const selectItem = (maxChoices: string) => parseXML(`
      <qti-assessment-item>
        <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
          <qti-mapping default-value="-1" lower-bound="0">
            <qti-map-entry map-key="A" mapped-value="1"/>
            <qti-map-entry map-key="B" mapped-value="2"/>
            <qti-map-entry map-key="C" mapped-value="3"/>
          </qti-mapping>
        </qti-response-declaration>
        <qti-item-body>
          <qti-choice-interaction response-identifier="RESPONSE" max-choices="${maxChoices}">
            <qti-simple-choice identifier="A">A</qti-simple-choice>
            <qti-simple-choice identifier="B">B</qti-simple-choice>
            <qti-simple-choice identifier="C">C</qti-simple-choice>
            <qti-simple-choice identifier="D">D</qti-simple-choice>
          </qti-choice-interaction>
        </qti-item-body>
      </qti-assessment-item>
    `);

    test('sums the best max-choices positive values', () => {
      expect(deriveMaxScore(selectItem('2'), {})).toBe(5);
    });

    test('sums every positive value when max-choices is 0 or allows them all', () => {
      expect(deriveMaxScore(selectItem('0'), {})).toBe(6);
      expect(deriveMaxScore(selectItem('4'), {})).toBe(6);
    });
  });

  describe('Hottext max-choices', () => {
    test('sums the best max-choices positive values', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
            <qti-mapping default-value="-1" lower-bound="0">
              <qti-map-entry map-key="H1" mapped-value="1"/>
              <qti-map-entry map-key="H2" mapped-value="1"/>
              <qti-map-entry map-key="H3" mapped-value="1"/>
            </qti-mapping>
          </qti-response-declaration>
          <qti-item-body>
            <qti-hottext-interaction response-identifier="RESPONSE" max-choices="2">
              <p>
                <qti-hottext identifier="H1">one</qti-hottext>
                <qti-hottext identifier="H2">two</qti-hottext>
                <qti-hottext identifier="H3">three</qti-hottext>
                <qti-hottext identifier="H4">four</qti-hottext>
              </p>
            </qti-hottext-interaction>
          </qti-item-body>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, {})).toBe(2);
    });
  });

  describe('Select point max-choices', () => {
    const selectPointItem = (maxChoices: string, defaultValue = '0') => parseXML(`
      <qti-assessment-item>
        <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="point">
          <qti-area-mapping default-value="${defaultValue}">
            <qti-area-map-entry shape="circle" coords="100,100,10" mapped-value="1"/>
            <qti-area-map-entry shape="circle" coords="200,200,10" mapped-value="1"/>
          </qti-area-mapping>
        </qti-response-declaration>
        <qti-item-body>
          <qti-select-point-interaction response-identifier="RESPONSE" max-choices="${maxChoices}"/>
        </qti-item-body>
        <qti-response-processing template="map_response_point"/>
      </qti-assessment-item>
    `);

    test('sums the best max-choices areas', () => {
      expect(inferResponseMaxScore(selectPointItem('1'), 'RESPONSE')).toBe(1);
      expect(inferResponseMaxScore(selectPointItem('0'), 'RESPONSE')).toBe(2);
    });

    test('counts points outside the areas at a positive default', () => {
      expect(inferResponseMaxScore(selectPointItem('3', '0.5'), 'RESPONSE')).toBe(2.5);
    });

    test('has no limit without max-choices, the select point default', () => {
      const itemDoc = selectPointItem('1');
      itemDoc.getElementsByTagName('qti-select-point-interaction')[0].removeAttribute('max-choices');
      expect(inferResponseMaxScore(itemDoc, 'RESPONSE')).toBe(2);
    });

    test('falls back to the default for a negative max-choices', () => {
      expect(inferResponseMaxScore(selectPointItem('-1', '0.5'), 'RESPONSE')).toBeNull();
      expect(inferResponseMaxScore(selectPointItem('-1'), 'RESPONSE')).toBe(2);
    });
  });

  describe('Multiple cardinality outside choice interactions', () => {
    test('makes no guess for a gap match mapping', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
            <qti-mapping default-value="0">
              <qti-map-entry map-key="W G1" mapped-value="1"/>
              <qti-map-entry map-key="W G2" mapped-value="1"/>
            </qti-mapping>
          </qti-response-declaration>
          <qti-item-body>
            <qti-gap-match-interaction response-identifier="RESPONSE">
              <qti-gap-text identifier="W" match-max="1">winter</qti-gap-text>
              <p><qti-gap identifier="G1"/> <qti-gap identifier="G2"/></p>
            </qti-gap-match-interaction>
          </qti-item-body>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, {})).toBeNull();
    });

    test('makes no guess when the response has no interaction', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
            <qti-mapping><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping>
          </qti-response-declaration>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, {})).toBeNull();
    });
  });

  describe('Score expressions', () => {
    // SCORE = max(0, min(CAP, -2 + map(A) + map(B) + map(C))), with A worth 2 and B and C worth 1
    const offsetItem = (scoreAttributes: string, cap: string | null) => parseXML(`
      <qti-assessment-item>
        <qti-response-declaration identifier="A" cardinality="single" base-type="identifier">
          <qti-mapping><qti-map-entry map-key="a" mapped-value="2"/></qti-mapping>
        </qti-response-declaration>
        <qti-response-declaration identifier="B" cardinality="single" base-type="identifier">
          <qti-mapping><qti-map-entry map-key="b" mapped-value="1"/></qti-mapping>
        </qti-response-declaration>
        <qti-response-declaration identifier="C" cardinality="single" base-type="identifier">
          <qti-mapping><qti-map-entry map-key="c" mapped-value="1"/></qti-mapping>
        </qti-response-declaration>
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" ${scoreAttributes}/>
        <qti-response-processing>
          <qti-set-outcome-value identifier="SCORE">
            <qti-max>
              <qti-base-value base-type="float">0</qti-base-value>
              ${cap === null ? '' : `<qti-min><qti-base-value base-type="float">${cap}</qti-base-value>`}
                <qti-sum>
                  <qti-base-value base-type="float">-2</qti-base-value>
                  <qti-map-response identifier="A"/>
                  <qti-map-response identifier="B"/>
                  <qti-map-response identifier="C"/>
                </qti-sum>
              ${cap === null ? '' : '</qti-min>'}
            </qti-max>
          </qti-set-outcome-value>
        </qti-response-processing>
      </qti-assessment-item>
    `);

    test('adds the offset to the mapped maximums and applies the floor', () => {
      expect(deriveMaxScore(offsetItem('', null), {})).toBe(2);
    });

    test('applies a qti-min cap', () => {
      expect(deriveMaxScore(offsetItem('', '1'), {})).toBe(1);
    });

    test('prefers a declared normal-maximum', () => {
      expect(deriveMaxScore(offsetItem('normal-maximum="5"', null), {})).toBe(5);
    });

    test('inferMaxScore ignores a declared normal-maximum', () => {
      expect(inferMaxScore(offsetItem('normal-maximum="5"', null))).toBe(2);
    });

    test('inferExpressionMaxScore infers from the given expression only', () => {
      const itemDoc = offsetItem('', '1');
      const sum = itemDoc.getElementsByTagName('qti-sum')[0];

      expect(inferExpressionMaxScore(itemDoc, sum)).toBe(2);
    });

    test('reads intermediate scores from the expression\'s own response processing', () => {
      // Response processing that isn't part of the item yet, as an editor builds it
      const itemDoc = parseXML('<qti-assessment-item/>');
      const responseProcessing = parseXML(`
        <qti-response-processing>
          <qti-response-condition>
            <qti-response-if>
              <qti-match><qti-variable identifier="A"/><qti-correct identifier="A"/></qti-match>
              <qti-set-outcome-value identifier="A_SCORE">
                <qti-base-value base-type="float">1</qti-base-value>
              </qti-set-outcome-value>
            </qti-response-if>
          </qti-response-condition>
          <qti-set-outcome-value identifier="SCORE">
            <qti-sum>
              <qti-base-value base-type="float">1</qti-base-value>
              <qti-variable identifier="A_SCORE"/>
            </qti-sum>
          </qti-set-outcome-value>
        </qti-response-processing>
      `);
      const sum = responseProcessing.getElementsByTagName('qti-sum')[0];

      expect(inferExpressionMaxScore(itemDoc, sum)).toBe(2);
    });

    test('makes no guess when any part of the expression is unknown', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="A" cardinality="single" base-type="identifier">
            <qti-mapping><qti-map-entry map-key="a" mapped-value="2"/></qti-mapping>
          </qti-response-declaration>
          <qti-response-processing>
            <qti-set-outcome-value identifier="SCORE">
              <qti-sum>
                <qti-map-response identifier="A"/>
                <qti-product>
                  <qti-base-value base-type="float">2</qti-base-value>
                  <qti-base-value base-type="float">2</qti-base-value>
                </qti-product>
              </qti-sum>
            </qti-set-outcome-value>
          </qti-response-processing>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, {})).toBeNull();
    });
  });

  describe('Outcome variables in score expressions', () => {
    // SCORE = sum(map(A), B_SCORE), with A worth 3
    const variableItem = (bScoreDeclaration: string, bScoreRules: string) => parseXML(`
      <qti-assessment-item>
        <qti-response-declaration identifier="A" cardinality="single" base-type="identifier">
          <qti-mapping><qti-map-entry map-key="a" mapped-value="3"/></qti-mapping>
        </qti-response-declaration>
        ${bScoreDeclaration}
        <qti-response-processing>
          ${bScoreRules}
          <qti-set-outcome-value identifier="SCORE">
            <qti-sum>
              <qti-map-response identifier="A"/>
              <qti-variable identifier="B_SCORE"/>
            </qti-sum>
          </qti-set-outcome-value>
        </qti-response-processing>
      </qti-assessment-item>
    `);
    const conditional = (ifValue: string, elseValue: string) => `
      <qti-response-condition>
        <qti-response-if>
          <qti-match><qti-variable identifier="B"/><qti-correct identifier="B"/></qti-match>
          <qti-set-outcome-value identifier="B_SCORE">${ifValue}</qti-set-outcome-value>
        </qti-response-if>
        <qti-response-else>
          <qti-set-outcome-value identifier="B_SCORE">${elseValue}</qti-set-outcome-value>
        </qti-response-else>
      </qti-response-condition>`;
    const float = (value: string) => `<qti-base-value base-type="float">${value}</qti-base-value>`;

    test('takes the largest constant assigned, integer or float', () => {
      expect(inferMaxScore(variableItem('', conditional('<qti-base-value base-type="integer">2</qti-base-value>', float('0'))))).toBe(5);
    });

    test('counts the declared default when assignments only lower it', () => {
      const declaration = `
        <qti-outcome-declaration identifier="B_SCORE" cardinality="single" base-type="float">
          <qti-default-value><qti-value>1</qti-value></qti-default-value>
        </qti-outcome-declaration>`;
      expect(inferMaxScore(variableItem(declaration, conditional(float('-1'), float('0'))))).toBe(4);
    });

    test('can ignore declared defaults, for outcomes about to be declared again', () => {
      const declaration = `
        <qti-outcome-declaration identifier="B_SCORE" cardinality="single" base-type="float">
          <qti-default-value><qti-value>5</qti-value></qti-default-value>
        </qti-outcome-declaration>`;
      const itemDoc = variableItem(declaration, conditional(float('1'), float('0')));
      const sum = itemDoc.getElementsByTagName('qti-sum')[0];

      expect(inferExpressionMaxScore(itemDoc, sum)).toBe(8);
      expect(inferExpressionMaxScore(itemDoc, sum, { ignoreOutcomeDefaults: true })).toBe(4);
    });

    test('makes no guess when the outcome is also set by a lookup table', () => {
      const lookup = `
        <qti-lookup-outcome-value identifier="B_SCORE">
          <qti-variable identifier="B"/>
        </qti-lookup-outcome-value>`;
      expect(inferMaxScore(variableItem('', lookup + conditional(float('1'), float('0'))))).toBeNull();
    });

    test('makes no guess when an assignment is not a constant', () => {
      expect(inferMaxScore(variableItem('', conditional('<qti-map-response identifier="A"/>', float('0'))))).toBeNull();
      expect(inferMaxScore(variableItem('', conditional(`<qti-product>${float('0.5')}${float('3')}</qti-product>`, float('0'))))).toBeNull();
    });
  });

  describe('Conditionally set scores', () => {
    test('infers a sum of outcome variables with the same rules as score expressions', () => {
      // SCORE is set in a condition, so the sum of variables strategy applies. Two
      // mappings, so no single mapping is relied on instead.
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="A" cardinality="single" base-type="identifier">
            <qti-mapping><qti-map-entry map-key="a" mapped-value="1"/></qti-mapping>
          </qti-response-declaration>
          <qti-response-declaration identifier="B" cardinality="single" base-type="identifier">
            <qti-mapping><qti-map-entry map-key="b" mapped-value="1"/></qti-mapping>
          </qti-response-declaration>
          <qti-response-processing>
            <qti-set-outcome-value identifier="A_SCORE">
              <qti-product>
                <qti-base-value base-type="float">0.5</qti-base-value>
                <qti-base-value base-type="float">4</qti-base-value>
              </qti-product>
            </qti-set-outcome-value>
            <qti-response-condition>
              <qti-response-if>
                <qti-is-null><qti-variable identifier="A"/></qti-is-null>
                <qti-set-outcome-value identifier="SCORE">
                  <qti-base-value base-type="float">0</qti-base-value>
                </qti-set-outcome-value>
              </qti-response-if>
              <qti-response-else>
                <qti-set-outcome-value identifier="SCORE">
                  <qti-sum><qti-variable identifier="A_SCORE"/></qti-sum>
                </qti-set-outcome-value>
              </qti-response-else>
            </qti-response-condition>
          </qti-response-processing>
        </qti-assessment-item>
      `);

      // A_SCORE isn't set to a constant, so the 4 inside qti-product isn't its maximum
      expect(inferMaxScore(itemDoc)).toBeNull();
    });
  });

  describe('Constant scores', () => {
    test('makes no guess from a mapping when SCORE is set to a constant', () => {
      const itemDoc = parseXML(`
        <qti-assessment-item>
          <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
            <qti-mapping><qti-map-entry map-key="A" mapped-value="3"/></qti-mapping>
          </qti-response-declaration>
          <qti-response-processing>
            <qti-set-outcome-value identifier="SCORE">
              <qti-base-value base-type="float">1</qti-base-value>
            </qti-set-outcome-value>
          </qti-response-processing>
        </qti-assessment-item>
      `);

      expect(deriveMaxScore(itemDoc, {})).toBeNull();
    });
  });
});
