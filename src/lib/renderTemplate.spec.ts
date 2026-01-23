/* spell-checker: ignore mrow COEFF */
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
import { renderTemplate } from './renderTemplate';

/**
 * Normalizes XML string by parsing and re-serializing it.
 * This ensures consistent formatting for comparison.
 */
function normalizeXml(xml: string): string {
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  const doc = parser.parseFromString(xml, 'text/xml');
  return serializer.serializeToString(doc);
}

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

describe('renderTemplate', () => {
  const parser = new DOMParser();

  describe('1. qti-printed-variable substitution', () => {
    test('returns template with variables substituted and sensitive content removed', () => {
      const itemDoc = parser.parseFromString(minimalItemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          PEOPLE: 'men',
          A: 3,
          B: 6,
          MIN: 40,
        },
        completionStatus: 'not_attempted',
      });

      // Expected output preserves the original formatting, with variables substituted literally
      const expectedXml = `<?xml version="1.0" encoding="UTF-8"?>
  <qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation=" http://www.imsglobal.org/xsd/imsqtiasi_v3p0
  https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
  identifier="template_digging" title="Digging a Hole"
  adaptive="false" time-dependent="false" xml:lang="en" >

    <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="float"/>

    <qti-item-body>
      <p>If it takes 3
      men
      40
      minutes to dig a hole, how long would it take
      6
      men
      to dig a similar hole?</p>
      <p>Answer: <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="8"/> minutes.</p>
    </qti-item-body>

  </qti-assessment-item>
`;

      // Normalize both strings through the same parser/serializer for consistent formatting
      expect(normalizeXml(template)).toBe(normalizeXml(expectedXml));
    });

    test('handles missing variables gracefully by leaving them as empty', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-item-body>
    <p>Value: <qti-printed-variable identifier="MISSING"/></p>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {},
        completionStatus: 'not_attempted',
      });

      expect(template).toContain('<p>Value: </p>');
    });

    test('substitutes numeric and string variables correctly', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-item-body>
    <p>Number: <qti-printed-variable identifier="NUM"/> Text: <qti-printed-variable identifier="TEXT"/></p>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          NUM: 42.5,
          TEXT: 'hello',
        },
        completionStatus: 'not_attempted',
      });

      expect(template).toContain('Number: 42.5 Text: hello');
    });
  });

  describe('2. qti-template-block conditional visibility', () => {
    test('shows template-block when template-identifier matches variable value', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-template-declaration identifier="SHOW_SECTION" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <qti-template-block template-identifier="section1" identifier="block1" show-hide="show">
      <p>This is section 1</p>
    </qti-template-block>
    <qti-template-block template-identifier="section2" identifier="block2" show-hide="show">
      <p>This is section 2</p>
    </qti-template-block>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          SHOW_SECTION: 'section1',
        },
        completionStatus: 'not_attempted',
      });

      expect(template).toContain('This is section 1');
      expect(template).not.toContain('This is section 2');
    });

    test('hides template-block when show-hide is "hide" and template-identifier matches', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-template-declaration identifier="HIDE_SECTION" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <qti-template-block template-identifier="secret" identifier="block1" show-hide="hide">
      <p>This should be hidden</p>
    </qti-template-block>
    <p>This should be visible</p>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          HIDE_SECTION: 'secret',
        },
        completionStatus: 'not_attempted',
      });

      expect(template).not.toContain('This should be hidden');
      expect(template).toContain('This should be visible');
    });

    test('handles multiple template-identifiers in a multiple cardinality variable', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-template-declaration identifier="VISIBLE_SECTIONS" cardinality="multiple" base-type="identifier"/>
  <qti-item-body>
    <qti-template-block template-identifier="intro" identifier="block1" show-hide="show">
      <p>Introduction</p>
    </qti-template-block>
    <qti-template-block template-identifier="details" identifier="block2" show-hide="show">
      <p>Details</p>
    </qti-template-block>
    <qti-template-block template-identifier="conclusion" identifier="block3" show-hide="show">
      <p>Conclusion</p>
    </qti-template-block>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          VISIBLE_SECTIONS: ['intro', 'conclusion'],
        },
        completionStatus: 'not_attempted',
      });

      expect(template).toContain('Introduction');
      expect(template).not.toContain('Details');
      expect(template).toContain('Conclusion');
    });
  });

  describe('3. qti-template-inline conditional visibility', () => {
    test('shows template-inline when template-identifier matches variable value', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-template-declaration identifier="WORD_CHOICE" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <p>The answer is <qti-template-inline template-identifier="correct" identifier="inline1" show-hide="show">definitely correct</qti-template-inline><qti-template-inline template-identifier="incorrect" identifier="inline2" show-hide="show">unfortunately incorrect</qti-template-inline>.</p>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          WORD_CHOICE: 'correct',
        },
        completionStatus: 'not_attempted',
      });

      expect(template).toContain('definitely correct');
      expect(template).not.toContain('unfortunately incorrect');
    });

    test('hides template-inline when show-hide is "hide" and template-identifier matches', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-template-declaration identifier="HIDE_WORD" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <p>The <qti-template-inline template-identifier="secret" identifier="inline1" show-hide="hide">SECRET</qti-template-inline> word is hidden.</p>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          HIDE_WORD: 'secret',
        },
        completionStatus: 'not_attempted',
      });

      expect(template).not.toContain('SECRET');
      expect(template).toContain('word is hidden');
    });
  });

  describe('4. Feedback visibility based on outcome variables', () => {
    test('shows feedback-block when outcome variable contains the identifier (show-hide="show")', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>
  <qti-item-body>
    <p>Question text here</p>
    <qti-feedback-block identifier="correct" outcome-identifier="FEEDBACK" show-hide="show">
      <p>Excellent work!</p>
    </qti-feedback-block>
    <qti-feedback-block identifier="incorrect" outcome-identifier="FEEDBACK" show-hide="show">
      <p>Try again.</p>
    </qti-feedback-block>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          FEEDBACK: ['correct'],
        },
        completionStatus: 'not_attempted',
      });

      expect(template).toContain('Excellent work!');
      expect(template).not.toContain('Try again.');
    });

    test('hides feedback-block when outcome variable contains the identifier (show-hide="hide")', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-outcome-declaration identifier="HINTS" cardinality="multiple" base-type="identifier"/>
  <qti-item-body>
    <p>Question text here</p>
    <qti-feedback-block identifier="hint1" outcome-identifier="HINTS" show-hide="hide">
      <p>This is a hint that should be hidden</p>
    </qti-feedback-block>
    <qti-feedback-block identifier="hint2" outcome-identifier="HINTS" show-hide="show">
      <p>This hint should be shown</p>
    </qti-feedback-block>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          HINTS: ['hint1', 'hint2'],
        },
        completionStatus: 'not_attempted',
      });

      expect(template).not.toContain('This is a hint that should be hidden');
      expect(template).toContain('This hint should be shown');
    });

    test('shows feedback-inline when outcome variable matches', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-outcome-declaration identifier="INLINE_FEEDBACK" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <p>Your answer is <qti-feedback-inline identifier="right" outcome-identifier="INLINE_FEEDBACK" show-hide="show">correct</qti-feedback-inline><qti-feedback-inline identifier="wrong" outcome-identifier="INLINE_FEEDBACK" show-hide="show">incorrect</qti-feedback-inline>!</p>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          INLINE_FEEDBACK: 'right',
        },
        completionStatus: 'not_attempted',
      });

      expect(template).toContain('correct');
      expect(template).not.toContain('incorrect');
    });

    test('handles feedback with single cardinality outcome variable', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-outcome-declaration identifier="STATUS" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <qti-feedback-block identifier="complete" outcome-identifier="STATUS" show-hide="show">
      <p>Task completed</p>
    </qti-feedback-block>
    <qti-feedback-block identifier="pending" outcome-identifier="STATUS" show-hide="show">
      <p>Task pending</p>
    </qti-feedback-block>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          STATUS: 'complete',
        },
        completionStatus: 'completed',
      });

      expect(template).toContain('Task completed');
      expect(template).not.toContain('Task pending');
    });
  });

  describe('5. Sensitive content removal', () => {
    test('keeps qti-response-declaration for used interactions', () => {
      const itemDoc = parser.parseFromString(minimalItemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {},
        completionStatus: 'not_attempted',
      });

      // Response declaration should be kept since RESPONSE is used in the body
      expect(template).toContain('qti-response-declaration');
      expect(template).toContain('identifier="RESPONSE"');
    });

    test('removes qti-outcome-declaration elements', () => {
      const itemDoc = parser.parseFromString(minimalItemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {},
        completionStatus: 'not_attempted',
      });

      expect(template).not.toContain('qti-outcome-declaration');
    });

    test('removes qti-template-declaration elements', () => {
      const itemDoc = parser.parseFromString(minimalItemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {},
        completionStatus: 'not_attempted',
      });

      expect(template).not.toContain('qti-template-declaration');
    });

    test('removes qti-template-processing elements', () => {
      const itemDoc = parser.parseFromString(minimalItemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {},
        completionStatus: 'not_attempted',
      });

      expect(template).not.toContain('qti-template-processing');
    });

    test('removes qti-response-processing elements', () => {
      const itemDoc = parser.parseFromString(minimalItemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {},
        completionStatus: 'not_attempted',
      });

      expect(template).not.toContain('qti-response-processing');
    });
  });

  describe('6. Response declaration sanitization', () => {
    test('removes qti-correct-response from response declarations', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>ChoiceA</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE">
      <qti-simple-choice identifier="ChoiceA">A</qti-simple-choice>
      <qti-simple-choice identifier="ChoiceB">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {},
        completionStatus: 'not_attempted',
      });

      expect(template).toContain('qti-response-declaration');
      expect(template).not.toContain('qti-correct-response');
      // ChoiceA should appear in the body choices but not in a correct-response element
      expect(template).toContain('identifier="ChoiceA"');
    });

    test('removes qti-mapping from response declarations', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-mapping default-value="0">
      <qti-map-entry map-key="ChoiceA" mapped-value="1"/>
      <qti-map-entry map-key="ChoiceB" mapped-value="0.5"/>
    </qti-mapping>
  </qti-response-declaration>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE">
      <qti-simple-choice identifier="ChoiceA">A</qti-simple-choice>
      <qti-simple-choice identifier="ChoiceB">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {},
        completionStatus: 'not_attempted',
      });

      expect(template).toContain('qti-response-declaration');
      expect(template).not.toContain('qti-mapping');
      expect(template).not.toContain('qti-map-entry');
    });

    test('removes response declarations not used in the filtered body', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-response-declaration identifier="RESPONSE1" cardinality="single" base-type="identifier"/>
  <qti-response-declaration identifier="RESPONSE2" cardinality="single" base-type="identifier"/>
  <qti-response-declaration identifier="UNUSED" cardinality="single" base-type="string"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
    </qti-choice-interaction>
    <qti-choice-interaction response-identifier="RESPONSE2">
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {},
        completionStatus: 'not_attempted',
      });

      expect(template).toContain('identifier="RESPONSE1"');
      expect(template).toContain('identifier="RESPONSE2"');
      expect(template).not.toContain('identifier="UNUSED"');
    });

    test('removes declarations for interactions hidden by template conditionals', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-response-declaration identifier="VISIBLE_RESPONSE" cardinality="single" base-type="identifier"/>
  <qti-response-declaration identifier="HIDDEN_RESPONSE" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="VISIBLE_RESPONSE">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
    </qti-choice-interaction>
    <qti-template-block template-identifier="showExtra" identifier="block1" show-hide="show">
      <qti-choice-interaction response-identifier="HIDDEN_RESPONSE">
        <qti-simple-choice identifier="B">B</qti-simple-choice>
      </qti-choice-interaction>
    </qti-template-block>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          // showExtra is not set, so template-block will be hidden
        },
        completionStatus: 'not_attempted',
      });

      expect(template).toContain('identifier="VISIBLE_RESPONSE"');
      expect(template).not.toContain('identifier="HIDDEN_RESPONSE"');
    });

    test('injects qti-default-value for single cardinality response with saved value', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE">
      <qti-simple-choice identifier="ChoiceA">A</qti-simple-choice>
      <qti-simple-choice identifier="ChoiceB">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          RESPONSE: 'ChoiceB',
        },
        completionStatus: 'incomplete',
      });

      expect(template).toContain('qti-default-value');
      expect(template).toContain('<qti-value>ChoiceB</qti-value>');
    });

    test('injects qti-default-value for multiple cardinality response with saved values', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="3">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
      <qti-simple-choice identifier="C">C</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          RESPONSE: ['A', 'C'],
        },
        completionStatus: 'incomplete',
      });

      expect(template).toContain('qti-default-value');
      expect(template).toContain('<qti-value>A</qti-value>');
      expect(template).toContain('<qti-value>C</qti-value>');
      expect(template).not.toContain('<qti-value>B</qti-value>');
    });

    test('does not inject qti-default-value when response variable is undefined', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {},
        completionStatus: 'not_attempted',
      });

      expect(template).toContain('qti-response-declaration');
      expect(template).not.toContain('qti-default-value');
    });

    test('replaces existing qti-default-value with value from state', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-default-value>
      <qti-value>OriginalDefault</qti-value>
    </qti-default-value>
  </qti-response-declaration>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE">
      <qti-simple-choice identifier="ChoiceA">A</qti-simple-choice>
      <qti-simple-choice identifier="ChoiceB">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          RESPONSE: 'ChoiceA',
        },
        completionStatus: 'incomplete',
      });

      expect(template).toContain('qti-default-value');
      expect(template).toContain('<qti-value>ChoiceA</qti-value>');
      expect(template).not.toContain('OriginalDefault');
    });
  });

  describe('7. Math variable substitution in MathML', () => {
    test('substitutes template variables within MathML mi elements', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     xmlns:m="http://www.w3.org/1998/Math/MathML"
                     identifier="test">
  <qti-template-declaration identifier="A" cardinality="single" base-type="integer" math-variable="true"/>
  <qti-template-declaration identifier="B" cardinality="single" base-type="integer" math-variable="true"/>
  <qti-item-body>
    <p>Solve for x:
      <m:math display="block">
        <m:mrow>
          <m:mi>A</m:mi>
          <m:mo>+</m:mo>
          <m:mi>x</m:mi>
          <m:mo>=</m:mo>
          <m:mi>B</m:mi>
        </m:mrow>
      </m:math>
    </p>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          A: 5,
          B: 12,
        },
        completionStatus: 'not_attempted',
      });

      // The variables should be substituted into MathML
      expect(template).toContain('<m:mi>5</m:mi>');
      expect(template).toContain('<m:mi>12</m:mi>');
      expect(template).not.toContain('<m:mi>A</m:mi>');
      expect(template).not.toContain('<m:mi>B</m:mi>');
    });

    test('substitutes template variables in MathML mn (number) elements', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     xmlns:m="http://www.w3.org/1998/Math/MathML"
                     identifier="test">
  <qti-template-declaration identifier="COEFF" cardinality="single" base-type="float" math-variable="true"/>
  <qti-item-body>
    <m:math>
      <m:mn>COEFF</m:mn>
    </m:math>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          COEFF: 3.14,
        },
        completionStatus: 'not_attempted',
      });

      expect(template).toContain('<m:mn>3.14</m:mn>');
      expect(template).not.toContain('<m:mn>COEFF</m:mn>');
    });

    test('leaves non-variable MathML content unchanged', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     xmlns:m="http://www.w3.org/1998/Math/MathML"
                     identifier="test">
  <qti-template-declaration identifier="VAR" cardinality="single" base-type="integer" math-variable="true"/>
  <qti-item-body>
    <m:math>
      <m:mrow>
        <m:mi>VAR</m:mi>
        <m:mo>+</m:mo>
        <m:mi>x</m:mi>
      </m:mrow>
    </m:math>
  </qti-item-body>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const template = renderTemplate(itemDoc, {
        variables: {
          VAR: 7,
        },
        completionStatus: 'not_attempted',
      });

      expect(template).toContain('<m:mi>7</m:mi>');
      expect(template).toContain('<m:mi>x</m:mi>'); // x should remain unchanged
      expect(template).toContain('<m:mo>+</m:mo>'); // operators unchanged
    });
  });
});
