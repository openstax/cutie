import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
import { initializeState } from './initializeState';

// from https://www.imsglobal.org/spec/qti/v3p0/impl#h.hs6z9wmqtzq7
const minimalItemXml = `<?xml version="1.0" encoding="UTF-8"?>
  <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation=" http://www.imsglobal.org/xsd/imsqtiasi_v3p0
  https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
  identifier="template_digging" title="Digging a Hole"
  adaptive="false" time-dependent="false" xml:lang="en" >
    <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="float"/>
    <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>

    <qti-template-declaration identifier="PEOPLE" cardinality="single" base-type="string" math-variable="false" param-variable="false"/>
    <qti-template-declaration identifier="A" cardinality="single" base-type="integer" math-variable="false" param-variable="false"/>
    <qti-template-declaration identifier="B" cardinality="single" base-type="integer" math-variable="false" param-variable="false"/>
    <qti-template-declaration identifier="MIN" cardinality="single" base-type="integer" math-variable="false" param-variable="false"/>

    <qti-template-processing>
      <qti-set-template-value identifier="PEOPLE">
        <qti-random>
          <qti-multiple>
            <qti-base-value base-type="string">men</qti-base-value>
            <qti-base-value base-type="string">women</qti-base-value>
            <qti-base-value base-type="string">children</qti-base-value>
          </qti-multiple>
        </qti-random>
      </qti-set-template-value>
      <qti-set-template-value identifier="A">
        <qti-random-integer min="2" max="4"/>
      </qti-set-template-value>
      <qti-template-condition>
        <qti-template-if>
          <qti-match>
            <qti-variable identifier="A"/>
            <qti-base-value base-type="integer">2</qti-base-value>
          </qti-match>
          <qti-set-template-value identifier="B">
            <qti-random-integer min="4" max="12" step="2"/>
          </qti-set-template-value>
        </qti-template-if>
        <qti-template-else-if>
          <qti-match>
            <qti-variable identifier="A"/>
            <qti-base-value base-type="integer">3</qti-base-value>
          </qti-match>
          <qti-set-template-value identifier="B">
            <qti-random>
              <qti-multiple>
                <qti-base-value base-type="integer">6</qti-base-value>
                <qti-base-value base-type="integer">12</qti-base-value>
              </qti-multiple>
            </qti-random>
          </qti-set-template-value>
        </qti-template-else-if>
        <qti-template-else>
          <qti-set-template-value identifier="B">
            <qti-random>
              <qti-multiple>
                <qti-base-value base-type="integer">8</qti-base-value>
                <qti-base-value base-type="integer">12</qti-base-value>
              </qti-multiple>
            </qti-random>
          </qti-set-template-value>
        </qti-template-else>
      </qti-template-condition>
      <qti-set-template-value identifier="MIN">
        <qti-integer-divide>
          <qti-base-value base-type="integer">120</qti-base-value>
          <qti-variable identifier="A"/>
        </qti-integer-divide>
      </qti-set-template-value>
      <qti-set-correct-response identifier="RESPONSE">
        <qti-integer-to-float>
          <qti-integer-divide>
            <qti-base-value base-type="integer">120</qti-base-value>
            <qti-variable identifier="B"/>
          </qti-integer-divide>
        </qti-integer-to-float>
      </qti-set-correct-response>
    </qti-template-processing>

    <qti-item-body>
      <p>If it takes <qti-printed-variable identifier="A"/>
      <qti-printed-variable identifier="PEOPLE"/>
      <qti-printed-variable identifier="MIN"/>
      minutes to dig a hole, how long would it take
      <qti-printed-variable identifier="B"/>
      <qti-printed-variable identifier="PEOPLE"/>
      to dig a similar hole?</p>
      <p>Answer: <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="8"/> minutes.</p>
    </qti-item-body>

    <qti-response-processing
    template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>
  </qti-assessment-item>
`;

describe('initializeState', () => {
  const parser = new DOMParser();

  describe('Basic Initialization', () => {
    test('returns initial state with not_attempted completion status', () => {
      const itemDoc = parser.parseFromString(minimalItemXml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.completionStatus).toBe('not_attempted');
      expect(state.variables).toBeDefined();
      expect(typeof state.variables).toBe('object');
    });

    test('initializes item with no template declarations', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="no-templates" title="No Templates">
          <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>
          <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
          <qti-item-body>
            <p>Simple item</p>
          </qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.completionStatus).toBe('not_attempted');
      expect(state.variables).toBeDefined();
    });

    test('initializes item with template declarations but no template processing', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="templates-no-processing" title="Templates No Processing">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="string"/>
          <qti-item-body>
            <p>Simple item</p>
          </qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.completionStatus).toBe('not_attempted');
      expect(state.variables.VAR1).toBeUndefined();
      expect(state.variables.VAR2).toBeUndefined();
    });
  });

  describe('Template Declarations - Base Types', () => {
    test('declares template variable with boolean base type', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="template-boolean" title="Boolean Template">
          <qti-template-declaration identifier="BOOL_VAR" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="BOOL_VAR">
              <qti-base-value base-type="boolean">true</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.BOOL_VAR).toBe(true);
    });

    test('declares template variable with integer base type', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="template-integer" title="Integer Template">
          <qti-template-declaration identifier="INT_VAR" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="INT_VAR">
              <qti-base-value base-type="integer">42</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.INT_VAR).toBe(42);
    });

    test('declares template variable with float base type', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="template-float" title="Float Template">
          <qti-template-declaration identifier="FLOAT_VAR" cardinality="single" base-type="float"/>
          <qti-template-processing>
            <qti-set-template-value identifier="FLOAT_VAR">
              <qti-base-value base-type="float">3.14159</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.FLOAT_VAR).toBe(3.14159);
    });

    test('declares template variable with string base type', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="template-string" title="String Template">
          <qti-template-declaration identifier="STR_VAR" cardinality="single" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="STR_VAR">
              <qti-base-value base-type="string">Hello World</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.STR_VAR).toBe('Hello World');
    });

    test('declares template variable with point base type', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="template-point" title="Point Template">
          <qti-template-declaration identifier="POINT_VAR" cardinality="single" base-type="point"/>
          <qti-template-processing>
            <qti-set-template-value identifier="POINT_VAR">
              <qti-base-value base-type="point">100 200</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.POINT_VAR).toEqual([100, 200]);
    });

    test('declares template variable with directedPair base type', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="template-directed-pair" title="DirectedPair Template">
          <qti-template-declaration identifier="DPAIR_VAR" cardinality="single" base-type="directedPair"/>
          <qti-template-processing>
            <qti-set-template-value identifier="DPAIR_VAR">
              <qti-base-value base-type="directedPair">A B</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.DPAIR_VAR).toEqual(['A', 'B']);
    });

    test('declares template variable with pair base type', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="template-pair" title="Pair Template">
          <qti-template-declaration identifier="PAIR_VAR" cardinality="single" base-type="pair"/>
          <qti-template-processing>
            <qti-set-template-value identifier="PAIR_VAR">
              <qti-base-value base-type="pair">A B</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.PAIR_VAR).toEqual(['A', 'B']);
    });

    test('declares template variable with duration base type', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="template-duration" title="Duration Template">
          <qti-template-declaration identifier="DUR_VAR" cardinality="single" base-type="duration"/>
          <qti-template-processing>
            <qti-set-template-value identifier="DUR_VAR">
              <qti-base-value base-type="duration">120.5</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.DUR_VAR).toBe(120.5);
    });

    test('declares template variable with file base type', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="template-file" title="File Template">
          <qti-template-declaration identifier="FILE_VAR" cardinality="single" base-type="file"/>
          <qti-template-processing>
            <qti-set-template-value identifier="FILE_VAR">
              <qti-base-value base-type="file">data:text/plain;base64,SGVsbG8gV29ybGQ=</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.FILE_VAR).toBe('data:text/plain;base64,SGVsbG8gV29ybGQ=');
    });

    test('declares template variable with uri base type', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="template-uri" title="URI Template">
          <qti-template-declaration identifier="URI_VAR" cardinality="single" base-type="uri"/>
          <qti-template-processing>
            <qti-set-template-value identifier="URI_VAR">
              <qti-base-value base-type="uri">https://example.com/resource</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.URI_VAR).toBe('https://example.com/resource');
    });
  });

  describe('Template Declarations - Cardinality Types', () => {
    test('declares template variable with single cardinality', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="cardinality-single" title="Single Cardinality">
          <qti-template-declaration identifier="SINGLE_VAR" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="SINGLE_VAR">
              <qti-base-value base-type="integer">5</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.SINGLE_VAR).toBe(5);
    });

    test('declares template variable with multiple cardinality', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="cardinality-multiple" title="Multiple Cardinality">
          <qti-template-declaration identifier="MULTI_VAR" cardinality="multiple" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="MULTI_VAR">
              <qti-multiple>
                <qti-base-value base-type="integer">1</qti-base-value>
                <qti-base-value base-type="integer">3</qti-base-value>
                <qti-base-value base-type="integer">5</qti-base-value>
              </qti-multiple>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.MULTI_VAR).toEqual(expect.arrayContaining([1, 3, 5]));
      expect(state.variables.MULTI_VAR).toHaveLength(3);
    });

    test('declares template variable with ordered cardinality', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="cardinality-ordered" title="Ordered Cardinality">
          <qti-template-declaration identifier="ORDERED_VAR" cardinality="ordered" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="ORDERED_VAR">
              <qti-ordered>
                <qti-base-value base-type="string">first</qti-base-value>
                <qti-base-value base-type="string">second</qti-base-value>
                <qti-base-value base-type="string">third</qti-base-value>
              </qti-ordered>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.ORDERED_VAR).toEqual(['first', 'second', 'third']);
    });

    test('declares template variable with record cardinality', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="cardinality-record" title="Record Cardinality">
          <qti-template-declaration identifier="RECORD_VAR" cardinality="record"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RECORD_VAR">
              <qti-record>
                <qti-field-value field-identifier="name">
                  <qti-base-value base-type="string">John</qti-base-value>
                </qti-field-value>
                <qti-field-value field-identifier="age">
                  <qti-base-value base-type="integer">30</qti-base-value>
                </qti-field-value>
              </qti-record>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RECORD_VAR).toEqual({
        name: 'John',
        age: 30
      });
    });

    test('declares empty multiple cardinality variable', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="empty-multiple" title="Empty Multiple">
          <qti-template-declaration identifier="EMPTY_MULTI" cardinality="multiple" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="EMPTY_MULTI">
              <qti-multiple></qti-multiple>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.EMPTY_MULTI).toEqual([]);
    });
  });

  describe('Template Processing - qti-set-template-value', () => {
    test('sets multiple template values in sequence', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="multiple-sets" title="Multiple Sets">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="string"/>
          <qti-template-declaration identifier="VAR3" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-base-value base-type="integer">10</qti-base-value>
            </qti-set-template-value>
            <qti-set-template-value identifier="VAR2">
              <qti-base-value base-type="string">test</qti-base-value>
            </qti-set-template-value>
            <qti-set-template-value identifier="VAR3">
              <qti-base-value base-type="boolean">false</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR1).toBe(10);
      expect(state.variables.VAR2).toBe('test');
      expect(state.variables.VAR3).toBe(false);
    });

    test('overwrites template variable value with subsequent set', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="overwrite-value" title="Overwrite Value">
          <qti-template-declaration identifier="VAR" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR">
              <qti-base-value base-type="integer">5</qti-base-value>
            </qti-set-template-value>
            <qti-set-template-value identifier="VAR">
              <qti-base-value base-type="integer">10</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR).toBe(10);
    });

    test('sets template value using qti-null', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="null-value" title="Null Value">
          <qti-template-declaration identifier="VAR" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR">
              <qti-null/>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR).toBeNull();
    });
  });

  describe('Template Processing - Randomization', () => {
    test('sets template value using qti-random-integer', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="random-integer" title="Random Integer">
          <qti-template-declaration identifier="RAND_VAR" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RAND_VAR">
              <qti-random-integer min="1" max="10"/>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RAND_VAR).toBeGreaterThanOrEqual(1);
      expect(state.variables.RAND_VAR).toBeLessThanOrEqual(10);
      expect(Number.isInteger(state.variables.RAND_VAR)).toBe(true);
    });

    test('sets template value using qti-random-integer with step', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="random-integer-step" title="Random Integer Step">
          <qti-template-declaration identifier="RAND_VAR" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RAND_VAR">
              <qti-random-integer min="2" max="10" step="2"/>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RAND_VAR).toBeGreaterThanOrEqual(2);
      expect(state.variables.RAND_VAR).toBeLessThanOrEqual(10);
      expect((state.variables.RAND_VAR as number) % 2).toBe(0);
    });

    test('sets template value using qti-random-float', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="random-float" title="Random Float">
          <qti-template-declaration identifier="RAND_VAR" cardinality="single" base-type="float"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RAND_VAR">
              <qti-random-float min="0.0" max="1.0"/>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RAND_VAR).toBeGreaterThanOrEqual(0.0);
      expect(state.variables.RAND_VAR).toBeLessThanOrEqual(1.0);
      expect(typeof state.variables.RAND_VAR).toBe('number');
    });

    test('sets template value using qti-random from multiple container', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="random-multiple" title="Random Multiple">
          <qti-template-declaration identifier="RAND_VAR" cardinality="single" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RAND_VAR">
              <qti-random>
                <qti-multiple>
                  <qti-base-value base-type="string">apple</qti-base-value>
                  <qti-base-value base-type="string">banana</qti-base-value>
                  <qti-base-value base-type="string">cherry</qti-base-value>
                </qti-multiple>
              </qti-random>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(['apple', 'banana', 'cherry']).toContain(state.variables.RAND_VAR);
    });

    test('sets template value using qti-random from ordered container', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="random-ordered" title="Random Ordered">
          <qti-template-declaration identifier="RAND_VAR" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RAND_VAR">
              <qti-random>
                <qti-ordered>
                  <qti-base-value base-type="integer">10</qti-base-value>
                  <qti-base-value base-type="integer">20</qti-base-value>
                  <qti-base-value base-type="integer">30</qti-base-value>
                </qti-ordered>
              </qti-random>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect([10, 20, 30]).toContain(state.variables.RAND_VAR);
    });
  });

  describe('Template Processing - qti-template-condition', () => {
    test('executes qti-template-if when condition is true', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="template-if-true" title="Template If True">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-base-value base-type="integer">5</qti-base-value>
            </qti-set-template-value>
            <qti-template-condition>
              <qti-template-if>
                <qti-match>
                  <qti-variable identifier="VAR1"/>
                  <qti-base-value base-type="integer">5</qti-base-value>
                </qti-match>
                <qti-set-template-value identifier="VAR2">
                  <qti-base-value base-type="string">matched</qti-base-value>
                </qti-set-template-value>
              </qti-template-if>
            </qti-template-condition>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR2).toBe('matched');
    });

    test('skips qti-template-if when condition is false', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="template-if-false" title="Template If False">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-base-value base-type="integer">10</qti-base-value>
            </qti-set-template-value>
            <qti-template-condition>
              <qti-template-if>
                <qti-match>
                  <qti-variable identifier="VAR1"/>
                  <qti-base-value base-type="integer">5</qti-base-value>
                </qti-match>
                <qti-set-template-value identifier="VAR2">
                  <qti-base-value base-type="string">matched</qti-base-value>
                </qti-set-template-value>
              </qti-template-if>
            </qti-template-condition>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR2).toBeUndefined();
    });

    test('executes qti-template-else-if when first condition is false and else-if is true', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="template-else-if" title="Template Else If">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-base-value base-type="integer">10</qti-base-value>
            </qti-set-template-value>
            <qti-template-condition>
              <qti-template-if>
                <qti-match>
                  <qti-variable identifier="VAR1"/>
                  <qti-base-value base-type="integer">5</qti-base-value>
                </qti-match>
                <qti-set-template-value identifier="VAR2">
                  <qti-base-value base-type="string">five</qti-base-value>
                </qti-set-template-value>
              </qti-template-if>
              <qti-template-else-if>
                <qti-match>
                  <qti-variable identifier="VAR1"/>
                  <qti-base-value base-type="integer">10</qti-base-value>
                </qti-match>
                <qti-set-template-value identifier="VAR2">
                  <qti-base-value base-type="string">ten</qti-base-value>
                </qti-set-template-value>
              </qti-template-else-if>
            </qti-template-condition>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR2).toBe('ten');
    });

    test('executes qti-template-else when all conditions are false', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="template-else" title="Template Else">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-base-value base-type="integer">15</qti-base-value>
            </qti-set-template-value>
            <qti-template-condition>
              <qti-template-if>
                <qti-match>
                  <qti-variable identifier="VAR1"/>
                  <qti-base-value base-type="integer">5</qti-base-value>
                </qti-match>
                <qti-set-template-value identifier="VAR2">
                  <qti-base-value base-type="string">five</qti-base-value>
                </qti-set-template-value>
              </qti-template-if>
              <qti-template-else-if>
                <qti-match>
                  <qti-variable identifier="VAR1"/>
                  <qti-base-value base-type="integer">10</qti-base-value>
                </qti-match>
                <qti-set-template-value identifier="VAR2">
                  <qti-base-value base-type="string">ten</qti-base-value>
                </qti-set-template-value>
              </qti-template-else-if>
              <qti-template-else>
                <qti-set-template-value identifier="VAR2">
                  <qti-base-value base-type="string">other</qti-base-value>
                </qti-set-template-value>
              </qti-template-else>
            </qti-template-condition>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR2).toBe('other');
    });

    test('handles multiple qti-template-else-if clauses', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="multiple-else-if" title="Multiple Else If">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-base-value base-type="integer">20</qti-base-value>
            </qti-set-template-value>
            <qti-template-condition>
              <qti-template-if>
                <qti-match>
                  <qti-variable identifier="VAR1"/>
                  <qti-base-value base-type="integer">5</qti-base-value>
                </qti-match>
                <qti-set-template-value identifier="VAR2">
                  <qti-base-value base-type="string">five</qti-base-value>
                </qti-set-template-value>
              </qti-template-if>
              <qti-template-else-if>
                <qti-match>
                  <qti-variable identifier="VAR1"/>
                  <qti-base-value base-type="integer">10</qti-base-value>
                </qti-match>
                <qti-set-template-value identifier="VAR2">
                  <qti-base-value base-type="string">ten</qti-base-value>
                </qti-set-template-value>
              </qti-template-else-if>
              <qti-template-else-if>
                <qti-match>
                  <qti-variable identifier="VAR1"/>
                  <qti-base-value base-type="integer">20</qti-base-value>
                </qti-match>
                <qti-set-template-value identifier="VAR2">
                  <qti-base-value base-type="string">twenty</qti-base-value>
                </qti-set-template-value>
              </qti-template-else-if>
              <qti-template-else>
                <qti-set-template-value identifier="VAR2">
                  <qti-base-value base-type="string">other</qti-base-value>
                </qti-set-template-value>
              </qti-template-else>
            </qti-template-condition>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR2).toBe('twenty');
    });

    test('handles nested qti-template-condition', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="nested-conditions" title="Nested Conditions">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-base-value base-type="integer">5</qti-base-value>
            </qti-set-template-value>
            <qti-set-template-value identifier="VAR2">
              <qti-base-value base-type="integer">10</qti-base-value>
            </qti-set-template-value>
            <qti-template-condition>
              <qti-template-if>
                <qti-match>
                  <qti-variable identifier="VAR1"/>
                  <qti-base-value base-type="integer">5</qti-base-value>
                </qti-match>
                <qti-template-condition>
                  <qti-template-if>
                    <qti-match>
                      <qti-variable identifier="VAR2"/>
                      <qti-base-value base-type="integer">10</qti-base-value>
                    </qti-match>
                    <qti-set-template-value identifier="RESULT">
                      <qti-base-value base-type="string">both-match</qti-base-value>
                    </qti-set-template-value>
                  </qti-template-if>
                </qti-template-condition>
              </qti-template-if>
            </qti-template-condition>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe('both-match');
    });
  });

  describe('Template Processing - qti-template-constraint', () => {
    test('continues processing when constraint is satisfied', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="constraint-satisfied" title="Constraint Satisfied">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-base-value base-type="integer">10</qti-base-value>
            </qti-set-template-value>
            <qti-template-constraint>
              <qti-gt>
                <qti-variable identifier="VAR1"/>
                <qti-base-value base-type="integer">5</qti-base-value>
              </qti-gt>
            </qti-template-constraint>
            <qti-set-template-value identifier="VAR2">
              <qti-base-value base-type="string">constraint-passed</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR2).toBe('constraint-passed');
    });

    test('restarts template processing when constraint is not satisfied', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="constraint-retry" title="Constraint Retry">
          <qti-template-declaration identifier="RAND_VAR" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RAND_VAR">
              <qti-random-integer min="1" max="20"/>
            </qti-set-template-value>
            <qti-template-constraint>
              <qti-gt>
                <qti-variable identifier="RAND_VAR"/>
                <qti-base-value base-type="integer">15</qti-base-value>
              </qti-gt>
            </qti-template-constraint>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      // The constraint should keep restarting until RAND_VAR > 15
      expect(state.variables.RAND_VAR).toBeGreaterThan(15);
    });

    test('handles multiple constraints in sequence', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="multiple-constraints" title="Multiple Constraints">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-random-integer min="1" max="100"/>
            </qti-set-template-value>
            <qti-template-constraint>
              <qti-gt>
                <qti-variable identifier="VAR1"/>
                <qti-base-value base-type="integer">50</qti-base-value>
              </qti-gt>
            </qti-template-constraint>
            <qti-set-template-value identifier="VAR2">
              <qti-random-integer min="1" max="100"/>
            </qti-set-template-value>
            <qti-template-constraint>
              <qti-lt>
                <qti-variable identifier="VAR2"/>
                <qti-base-value base-type="integer">50</qti-base-value>
              </qti-lt>
            </qti-template-constraint>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR1).toBeGreaterThan(50);
      expect(state.variables.VAR2).toBeLessThan(50);
    });

    test('handles constraint with complex boolean expression', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="complex-constraint" title="Complex Constraint">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-random-integer min="1" max="20"/>
            </qti-set-template-value>
            <qti-set-template-value identifier="VAR2">
              <qti-random-integer min="1" max="20"/>
            </qti-set-template-value>
            <qti-template-constraint>
              <qti-and>
                <qti-gt>
                  <qti-variable identifier="VAR1"/>
                  <qti-base-value base-type="integer">10</qti-base-value>
                </qti-gt>
                <qti-not>
                  <qti-equal>
                    <qti-variable identifier="VAR1"/>
                    <qti-variable identifier="VAR2"/>
                  </qti-equal>
                </qti-not>
              </qti-and>
            </qti-template-constraint>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR1).toBeGreaterThan(10);
      expect(state.variables.VAR1).not.toBe(state.variables.VAR2);
    });
  });

  describe('Template Processing - qti-exit-template', () => {
    test('exits template processing when exit-template is encountered', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="exit-template" title="Exit Template">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-base-value base-type="integer">10</qti-base-value>
            </qti-set-template-value>
            <qti-exit-template/>
            <qti-set-template-value identifier="VAR2">
              <qti-base-value base-type="integer">20</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR1).toBe(10);
      expect(state.variables.VAR2).toBeUndefined();
    });

    test('exits template processing conditionally', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="conditional-exit" title="Conditional Exit">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-base-value base-type="integer">5</qti-base-value>
            </qti-set-template-value>
            <qti-template-condition>
              <qti-template-if>
                <qti-match>
                  <qti-variable identifier="VAR1"/>
                  <qti-base-value base-type="integer">5</qti-base-value>
                </qti-match>
                <qti-exit-template/>
              </qti-template-if>
            </qti-template-condition>
            <qti-set-template-value identifier="VAR2">
              <qti-base-value base-type="string">should-not-set</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR1).toBe(5);
      expect(state.variables.VAR2).toBeUndefined();
    });

    test('does not exit when exit-template is in false branch', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="no-exit" title="No Exit">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-base-value base-type="integer">10</qti-base-value>
            </qti-set-template-value>
            <qti-template-condition>
              <qti-template-if>
                <qti-match>
                  <qti-variable identifier="VAR1"/>
                  <qti-base-value base-type="integer">5</qti-base-value>
                </qti-match>
                <qti-exit-template/>
              </qti-template-if>
            </qti-template-condition>
            <qti-set-template-value identifier="VAR2">
              <qti-base-value base-type="string">should-set</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR1).toBe(10);
      expect(state.variables.VAR2).toBe('should-set');
    });
  });

  describe('Template Processing - Variable References', () => {
    test('references template variable in expression', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="variable-reference" title="Variable Reference">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-base-value base-type="integer">10</qti-base-value>
            </qti-set-template-value>
            <qti-set-template-value identifier="VAR2">
              <qti-variable identifier="VAR1"/>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR2).toBe(10);
    });

    test('uses template variable in mathematical expression', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="variable-in-math" title="Variable in Math">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-base-value base-type="integer">5</qti-base-value>
            </qti-set-template-value>
            <qti-set-template-value identifier="VAR2">
              <qti-sum>
                <qti-variable identifier="VAR1"/>
                <qti-base-value base-type="integer">10</qti-base-value>
              </qti-sum>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR2).toBe(15);
    });

    test('chains multiple variable references', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="chained-variables" title="Chained Variables">
          <qti-template-declaration identifier="VAR1" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR2" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="VAR3" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="VAR1">
              <qti-base-value base-type="integer">2</qti-base-value>
            </qti-set-template-value>
            <qti-set-template-value identifier="VAR2">
              <qti-product>
                <qti-variable identifier="VAR1"/>
                <qti-base-value base-type="integer">3</qti-base-value>
              </qti-product>
            </qti-set-template-value>
            <qti-set-template-value identifier="VAR3">
              <qti-sum>
                <qti-variable identifier="VAR1"/>
                <qti-variable identifier="VAR2"/>
              </qti-sum>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.VAR1).toBe(2);
      expect(state.variables.VAR2).toBe(6);
      expect(state.variables.VAR3).toBe(8);
    });
  });

  describe('Mathematical Operators', () => {
    test('evaluates qti-sum operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="sum-operator" title="Sum Operator">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-sum>
                <qti-base-value base-type="integer">10</qti-base-value>
                <qti-base-value base-type="integer">20</qti-base-value>
                <qti-base-value base-type="integer">30</qti-base-value>
              </qti-sum>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(60);
    });

    test('evaluates qti-product operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="product-operator" title="Product Operator">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-product>
                <qti-base-value base-type="integer">2</qti-base-value>
                <qti-base-value base-type="integer">3</qti-base-value>
                <qti-base-value base-type="integer">4</qti-base-value>
              </qti-product>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(24);
    });

    test('evaluates qti-subtract operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="subtract-operator" title="Subtract Operator">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-subtract>
                <qti-base-value base-type="integer">50</qti-base-value>
                <qti-base-value base-type="integer">20</qti-base-value>
              </qti-subtract>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(30);
    });

    test('evaluates qti-divide operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="divide-operator" title="Divide Operator">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="float"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-divide>
                <qti-base-value base-type="float">100.0</qti-base-value>
                <qti-base-value base-type="float">4.0</qti-base-value>
              </qti-divide>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(25.0);
    });

    test('evaluates qti-integer-divide operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="integer-divide-operator" title="Integer Divide Operator">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-integer-divide>
                <qti-base-value base-type="integer">25</qti-base-value>
                <qti-base-value base-type="integer">4</qti-base-value>
              </qti-integer-divide>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(6);
    });

    test('evaluates qti-integer-modulus operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="modulus-operator" title="Modulus Operator">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-integer-modulus>
                <qti-base-value base-type="integer">25</qti-base-value>
                <qti-base-value base-type="integer">4</qti-base-value>
              </qti-integer-modulus>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(1);
    });

    test('evaluates qti-truncate operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="truncate-operator" title="Truncate Operator">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-truncate>
                <qti-base-value base-type="float">3.7</qti-base-value>
              </qti-truncate>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(3);
    });

    test('evaluates qti-round operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="round-operator" title="Round Operator">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-round>
                <qti-base-value base-type="float">3.5</qti-base-value>
              </qti-round>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(4);
    });

    test('evaluates qti-power operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="power-operator" title="Power Operator">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="float"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-power>
                <qti-base-value base-type="float">2.0</qti-base-value>
                <qti-base-value base-type="float">3.0</qti-base-value>
              </qti-power>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(8.0);
    });

    test('evaluates nested mathematical operators', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="nested-math" title="Nested Math">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-sum>
                <qti-product>
                  <qti-base-value base-type="integer">2</qti-base-value>
                  <qti-base-value base-type="integer">3</qti-base-value>
                </qti-product>
                <qti-subtract>
                  <qti-base-value base-type="integer">10</qti-base-value>
                  <qti-base-value base-type="integer">5</qti-base-value>
                </qti-subtract>
              </qti-sum>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(11); // (2 * 3) + (10 - 5)
    });
  });

  describe('Logical and Comparison Operators', () => {
    test('evaluates qti-match operator with true result', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="match-true" title="Match True">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-match>
                <qti-base-value base-type="integer">5</qti-base-value>
                <qti-base-value base-type="integer">5</qti-base-value>
              </qti-match>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(true);
    });

    test('evaluates qti-match operator with false result', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="match-false" title="Match False">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-match>
                <qti-base-value base-type="integer">5</qti-base-value>
                <qti-base-value base-type="integer">10</qti-base-value>
              </qti-match>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(false);
    });

    test('evaluates qti-equal operator for floats', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="equal-floats" title="Equal Floats">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-equal tolerance-mode="exact">
                <qti-base-value base-type="float">3.14</qti-base-value>
                <qti-base-value base-type="float">3.14</qti-base-value>
              </qti-equal>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(true);
    });

    test('evaluates qti-lt (less than) operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="less-than" title="Less Than">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-lt>
                <qti-base-value base-type="integer">5</qti-base-value>
                <qti-base-value base-type="integer">10</qti-base-value>
              </qti-lt>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(true);
    });

    test('evaluates qti-gt (greater than) operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="greater-than" title="Greater Than">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-gt>
                <qti-base-value base-type="integer">15</qti-base-value>
                <qti-base-value base-type="integer">10</qti-base-value>
              </qti-gt>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(true);
    });

    test('evaluates qti-lte (less than or equal) operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="less-than-equal" title="Less Than Equal">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-lte>
                <qti-base-value base-type="integer">10</qti-base-value>
                <qti-base-value base-type="integer">10</qti-base-value>
              </qti-lte>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(true);
    });

    test('evaluates qti-gte (greater than or equal) operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="greater-than-equal" title="Greater Than Equal">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-gte>
                <qti-base-value base-type="integer">15</qti-base-value>
                <qti-base-value base-type="integer">10</qti-base-value>
              </qti-gte>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(true);
    });

    test('evaluates qti-and operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="and-operator" title="And Operator">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-and>
                <qti-base-value base-type="boolean">true</qti-base-value>
                <qti-base-value base-type="boolean">true</qti-base-value>
                <qti-base-value base-type="boolean">true</qti-base-value>
              </qti-and>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(true);
    });

    test('evaluates qti-or operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="or-operator" title="Or Operator">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-or>
                <qti-base-value base-type="boolean">false</qti-base-value>
                <qti-base-value base-type="boolean">true</qti-base-value>
                <qti-base-value base-type="boolean">false</qti-base-value>
              </qti-or>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(true);
    });

    test('evaluates qti-not operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="not-operator" title="Not Operator">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-not>
                <qti-base-value base-type="boolean">false</qti-base-value>
              </qti-not>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(true);
    });
  });

  describe('Container Operators', () => {
    test('evaluates qti-index operator on ordered container', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="index-operator" title="Index Operator">
          <qti-template-declaration identifier="LIST" cardinality="ordered" base-type="string"/>
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="LIST">
              <qti-ordered>
                <qti-base-value base-type="string">first</qti-base-value>
                <qti-base-value base-type="string">second</qti-base-value>
                <qti-base-value base-type="string">third</qti-base-value>
              </qti-ordered>
            </qti-set-template-value>
            <qti-set-template-value identifier="RESULT">
              <qti-index n="2">
                <qti-variable identifier="LIST"/>
              </qti-index>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe('second');
    });

    test('evaluates qti-contains operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="contains-operator" title="Contains Operator">
          <qti-template-declaration identifier="LIST" cardinality="multiple" base-type="integer"/>
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="LIST">
              <qti-multiple>
                <qti-base-value base-type="integer">1</qti-base-value>
                <qti-base-value base-type="integer">5</qti-base-value>
                <qti-base-value base-type="integer">10</qti-base-value>
              </qti-multiple>
            </qti-set-template-value>
            <qti-set-template-value identifier="RESULT">
              <qti-contains>
                <qti-variable identifier="LIST"/>
                <qti-base-value base-type="integer">5</qti-base-value>
              </qti-contains>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(true);
    });

    test('evaluates qti-member operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="member-operator" title="Member Operator">
          <qti-template-declaration identifier="LIST" cardinality="multiple" base-type="string"/>
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="LIST">
              <qti-multiple>
                <qti-base-value base-type="string">apple</qti-base-value>
                <qti-base-value base-type="string">banana</qti-base-value>
              </qti-multiple>
            </qti-set-template-value>
            <qti-set-template-value identifier="RESULT">
              <qti-member>
                <qti-base-value base-type="string">apple</qti-base-value>
                <qti-variable identifier="LIST"/>
              </qti-member>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(true);
    });

    test('evaluates qti-ordered-size operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="container-size" title="Container Size">
          <qti-template-declaration identifier="LIST" cardinality="ordered" base-type="integer"/>
          <qti-template-declaration identifier="SIZE" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="LIST">
              <qti-ordered>
                <qti-base-value base-type="integer">1</qti-base-value>
                <qti-base-value base-type="integer">2</qti-base-value>
                <qti-base-value base-type="integer">3</qti-base-value>
                <qti-base-value base-type="integer">4</qti-base-value>
              </qti-ordered>
            </qti-set-template-value>
            <qti-set-template-value identifier="SIZE">
              <qti-container-size>
                <qti-variable identifier="LIST"/>
              </qti-container-size>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.SIZE).toBe(4);
    });

    test('evaluates qti-delete operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="delete-operator" title="Delete Operator">
          <qti-template-declaration identifier="LIST" cardinality="multiple" base-type="integer"/>
          <qti-template-declaration identifier="RESULT" cardinality="multiple" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="LIST">
              <qti-multiple>
                <qti-base-value base-type="integer">1</qti-base-value>
                <qti-base-value base-type="integer">2</qti-base-value>
                <qti-base-value base-type="integer">3</qti-base-value>
              </qti-multiple>
            </qti-set-template-value>
            <qti-set-template-value identifier="RESULT">
              <qti-delete>
                <qti-variable identifier="LIST"/>
                <qti-base-value base-type="integer">2</qti-base-value>
              </qti-delete>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toEqual(expect.arrayContaining([1, 3]));
      expect(state.variables.RESULT).toHaveLength(2);
    });

    test('evaluates qti-repeat operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="repeat-operator" title="Repeat Operator">
          <qti-template-declaration identifier="RESULT" cardinality="ordered" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-repeat number-repeats="3">
                <qti-base-value base-type="string">hello</qti-base-value>
              </qti-repeat>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toEqual(['hello', 'hello', 'hello']);
    });
  });

  describe('String Operators', () => {
    test('evaluates qti-substring operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="substring-operator" title="Substring Operator">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-substring case-sensitive="true">
                <qti-base-value base-type="string">hello world</qti-base-value>
                <qti-base-value base-type="string">world</qti-base-value>
              </qti-substring>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(true);
    });

    test('evaluates qti-string-match operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="string-match-operator" title="String Match Operator">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-string-match case-sensitive="false">
                <qti-base-value base-type="string">Hello</qti-base-value>
                <qti-base-value base-type="string">hello</qti-base-value>
              </qti-string-match>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(true);
    });

    test('evaluates qti-pattern-match operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="pattern-match-operator" title="Pattern Match Operator">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-pattern-match pattern="^[0-9]{3}-[0-9]{4}$">
                <qti-base-value base-type="string">123-4567</qti-base-value>
              </qti-pattern-match>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(true);
    });
  });

  describe('Type Conversion Operators', () => {
    test('evaluates qti-integer-to-float operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="int-to-float" title="Int to Float">
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="float"/>
          <qti-template-processing>
            <qti-set-template-value identifier="RESULT">
              <qti-integer-to-float>
                <qti-base-value base-type="integer">42</qti-base-value>
              </qti-integer-to-float>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(42.0);
      expect(typeof state.variables.RESULT).toBe('number');
    });

    test('evaluates qti-any-n operator', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="any-n-operator" title="Any N Operator">
          <qti-template-declaration identifier="LIST" cardinality="multiple" base-type="boolean"/>
          <qti-template-declaration identifier="RESULT" cardinality="single" base-type="boolean"/>
          <qti-template-processing>
            <qti-set-template-value identifier="LIST">
              <qti-multiple>
                <qti-base-value base-type="boolean">false</qti-base-value>
                <qti-base-value base-type="boolean">true</qti-base-value>
                <qti-base-value base-type="boolean">false</qti-base-value>
              </qti-multiple>
            </qti-set-template-value>
            <qti-set-template-value identifier="RESULT">
              <qti-any-n min="1" max="2">
                <qti-variable identifier="LIST"/>
              </qti-any-n>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESULT).toBe(true);
    });
  });

  describe('Outcome and Response Variable Initialization', () => {
    test('initializes outcome variables with default values', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="outcome-defaults" title="Outcome Defaults">
          <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
            <qti-default-value>
              <qti-value>0.0</qti-value>
            </qti-default-value>
          </qti-outcome-declaration>
          <qti-outcome-declaration identifier="MAX_SCORE" cardinality="single" base-type="float">
            <qti-default-value>
              <qti-value>100.0</qti-value>
            </qti-default-value>
          </qti-outcome-declaration>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.SCORE).toBe(0.0);
      expect(state.variables.MAX_SCORE).toBe(100.0);
    });

    test('sets correct response during template processing', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="set-correct-response" title="Set Correct Response">
          <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="integer"/>
          <qti-template-declaration identifier="ANSWER" cardinality="single" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="ANSWER">
              <qti-base-value base-type="integer">42</qti-base-value>
            </qti-set-template-value>
            <qti-set-correct-response identifier="RESPONSE">
              <qti-variable identifier="ANSWER"/>
            </qti-set-correct-response>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESPONSE).toBeUndefined(); // Response not set yet
      expect(state.variables.ANSWER).toBe(42);
      // Note: The correct response should be stored somewhere in state for later comparison
      // The exact implementation depends on how the system tracks correct responses
    });

    test('sets default value during template processing', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="set-default-value" title="Set Default Value">
          <qti-outcome-declaration identifier="FEEDBACK_MODE" cardinality="single" base-type="string"/>
          <qti-template-declaration identifier="MODE" cardinality="single" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="MODE">
              <qti-random>
                <qti-multiple>
                  <qti-base-value base-type="string">detailed</qti-base-value>
                  <qti-base-value base-type="string">brief</qti-base-value>
                </qti-multiple>
              </qti-random>
            </qti-set-template-value>
            <qti-set-default-value identifier="FEEDBACK_MODE">
              <qti-variable identifier="MODE"/>
            </qti-set-default-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(['detailed', 'brief']).toContain(state.variables.FEEDBACK_MODE);
    });

    test('does not initialize response variables during template processing', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="response-not-initialized" title="Response Not Initialized">
          <qti-response-declaration identifier="RESPONSE1" cardinality="single" base-type="string"/>
          <qti-response-declaration identifier="RESPONSE2" cardinality="multiple" base-type="integer"/>
          <qti-template-processing>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.RESPONSE1).toBeUndefined();
      expect(state.variables.RESPONSE2).toBeUndefined();
    });
  });

  describe('Complex Template Processing Example', () => {
    test('processes complex template from QTI spec example', () => {
      const itemDoc = parser.parseFromString(minimalItemXml, 'text/xml');
      const state = initializeState(itemDoc);

      // Check that variables are initialized
      expect(['men', 'women', 'children']).toContain(state.variables.PEOPLE);
      expect(state.variables.A).toBeGreaterThanOrEqual(2);
      expect(state.variables.A).toBeLessThanOrEqual(4);

      // Check conditional logic based on A value
      if (state.variables.A === 2) {
        expect(state.variables.B).toBeGreaterThanOrEqual(4);
        expect(state.variables.B).toBeLessThanOrEqual(12);
        expect((state.variables.B as number) % 2).toBe(0);
      } else if (state.variables.A === 3) {
        expect([6, 12]).toContain(state.variables.B);
      } else if (state.variables.A === 4) {
        expect([8, 12]).toContain(state.variables.B);
      }

      // Check MIN calculation
      expect(state.variables.MIN).toBe(120 / (state.variables.A as number));
    });
  });

  describe('Record Field Access', () => {
    test('accesses field from record using qti-field-value', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="field-access" title="Field Access">
          <qti-template-declaration identifier="PERSON" cardinality="record"/>
          <qti-template-declaration identifier="NAME" cardinality="single" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="PERSON">
              <qti-record>
                <qti-field-value field-identifier="name">
                  <qti-base-value base-type="string">Alice</qti-base-value>
                </qti-field-value>
                <qti-field-value field-identifier="age">
                  <qti-base-value base-type="integer">25</qti-base-value>
                </qti-field-value>
              </qti-record>
            </qti-set-template-value>
            <qti-set-template-value identifier="NAME">
              <qti-field-value field-identifier="name">
                <qti-variable identifier="PERSON"/>
              </qti-field-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.NAME).toBe('Alice');
    });
  });

  describe('Special Cases', () => {
    test('handles null values in containers', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="null-in-container" title="Null in Container">
          <qti-template-declaration identifier="LIST" cardinality="multiple" base-type="integer"/>
          <qti-template-processing>
            <qti-set-template-value identifier="LIST">
              <qti-multiple>
                <qti-base-value base-type="integer">1</qti-base-value>
                <qti-null/>
                <qti-base-value base-type="integer">3</qti-base-value>
              </qti-multiple>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.LIST).toEqual([1, null, 3]);
    });

    test('handles empty ordered container', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="empty-ordered" title="Empty Ordered">
          <qti-template-declaration identifier="LIST" cardinality="ordered" base-type="string"/>
          <qti-template-processing>
            <qti-set-template-value identifier="LIST">
              <qti-ordered></qti-ordered>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.LIST).toEqual([]);
    });

    test('handles template variable with math-variable attribute', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="math-variable" title="Math Variable">
          <qti-template-declaration identifier="X" cardinality="single" base-type="float" math-variable="true"/>
          <qti-template-processing>
            <qti-set-template-value identifier="X">
              <qti-base-value base-type="float">2.5</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.X).toBe(2.5);
    });

    test('handles template variable with param-variable attribute', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
          identifier="param-variable" title="Param Variable">
          <qti-template-declaration identifier="PARAM1" cardinality="single" base-type="string" param-variable="true"/>
          <qti-template-processing>
            <qti-set-template-value identifier="PARAM1">
              <qti-base-value base-type="string">default-value</qti-base-value>
            </qti-set-template-value>
          </qti-template-processing>
          <qti-item-body><p>Test</p></qti-item-body>
        </qti-assessment-item>`;

      const itemDoc = parser.parseFromString(xml, 'text/xml');
      const state = initializeState(itemDoc);

      expect(state.variables.PARAM1).toBe('default-value');
    });
  });
});
