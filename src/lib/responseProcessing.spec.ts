import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
import { AttemptState } from '../types';
import { processResponse } from './responseProcessing';

const parser = new DOMParser();

describe('processResponse - Basic Response Processing', () => {
  test('scores correct response and updates state', () => {
    const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="choice-item"
                     title="Simple Choice Item"
                     adaptive="false"
                     time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <p>What is 2 + 2?</p>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">
      <qti-simple-choice identifier="choiceA">4</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">3</qti-simple-choice>
      <qti-simple-choice identifier="choiceC">5</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

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
      <qti-response-else>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

    const itemDoc = parser.parseFromString(itemXml, 'text/xml');
    const currentState = {
      variables: { SCORE: 0 },
      completionStatus: 'not_attempted' as const,
    };
    const submission = { RESPONSE: 'choiceA' };

    const newState = processResponse(itemDoc, submission, currentState);

    expect(newState.variables.RESPONSE).toBe('choiceA');
    expect(newState.variables.SCORE).toBe(1);
    expect(newState.completionStatus).toBe('completed');
  });

  test('scores incorrect response', () => {
    const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="choice-item">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <p>What is 2 + 2?</p>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">
      <qti-simple-choice identifier="choiceA">4</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">3</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

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
      <qti-response-else>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

    const itemDoc = parser.parseFromString(itemXml, 'text/xml');
    const currentState = {
      variables: { SCORE: 0 },
      completionStatus: 'not_attempted' as const,
    };
    const submission = { RESPONSE: 'choiceB' };

    const newState = processResponse(itemDoc, submission, currentState);

    expect(newState.variables.RESPONSE).toBe('choiceB');
    expect(newState.variables.SCORE).toBe(0);
    expect(newState.completionStatus).toBe('completed');
  });

  test('handles null response submission', () => {
    const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="choice-item">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">
      <qti-simple-choice identifier="choiceA">4</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-is-null>
          <qti-variable identifier="RESPONSE"/>
        </qti-is-null>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

    const itemDoc = parser.parseFromString(itemXml, 'text/xml');
    const currentState = {
      variables: { SCORE: 0 },
      completionStatus: 'not_attempted' as const,
    };
    const submission = {}; // No response submitted

    const newState = processResponse(itemDoc, submission, currentState);

    expect(newState.variables.RESPONSE).toBeUndefined();
    expect(newState.variables.SCORE).toBe(0);
    expect(newState.completionStatus).toBe('completed');
  });

  test('handles multiple response variables', () => {
    const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="multi-response-item">
  <qti-response-declaration identifier="RESPONSE1" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE2" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceX</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE1" max-choices="1">
      <qti-simple-choice identifier="choiceA">Answer A</qti-simple-choice>
    </qti-choice-interaction>
    <qti-choice-interaction response-identifier="RESPONSE2" max-choices="1">
      <qti-simple-choice identifier="choiceX">Answer X</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-and>
          <qti-match>
            <qti-variable identifier="RESPONSE1"/>
            <qti-correct identifier="RESPONSE1"/>
          </qti-match>
          <qti-match>
            <qti-variable identifier="RESPONSE2"/>
            <qti-correct identifier="RESPONSE2"/>
          </qti-match>
        </qti-and>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">2</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

    const itemDoc = parser.parseFromString(itemXml, 'text/xml');
    const currentState = {
      variables: { SCORE: 0 },
      completionStatus: 'not_attempted' as const,
    };
    const submission = { RESPONSE1: 'choiceA', RESPONSE2: 'choiceX' };

    const newState = processResponse(itemDoc, submission, currentState);

    expect(newState.variables.RESPONSE1).toBe('choiceA');
    expect(newState.variables.RESPONSE2).toBe('choiceX');
    expect(newState.variables.SCORE).toBe(2);
  });

  test('handles response-else-if branches', () => {
    const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="conditional-item">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choiceA">Perfect answer</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Partial answer</qti-simple-choice>
      <qti-simple-choice identifier="choiceC">Wrong answer</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="identifier">choiceA</qti-base-value>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="identifier">choiceB</qti-base-value>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0.5</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

    const itemDoc = parser.parseFromString(itemXml, 'text/xml');
    const currentState = {
      variables: { SCORE: 0 },
      completionStatus: 'not_attempted' as const,
    };
    const submission = { RESPONSE: 'choiceB' };

    const newState = processResponse(itemDoc, submission, currentState);

    expect(newState.variables.SCORE).toBe(0.5);
  });
});

describe('Standard Response Processing Templates', () => {
  describe('MATCH CORRECT Template', () => {
    test('uses match_correct template with single identifier response', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="match-correct-item">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceB</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choiceA">Wrong</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Correct</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: 'choiceB' };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(1);
      expect(newState.completionStatus).toBe('completed');
    });

    test('match_correct template scores 0 for incorrect response', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="match-correct-item">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceB</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choiceA">Wrong</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Correct</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: 'choiceA' };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(0);
    });

    test('match_correct template scores 0 for null response', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="match-correct-item">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceB</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choiceA">Wrong</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Correct</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = {}; // No response

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(0);
    });

    test('match_correct template with multiple cardinality (all correct)', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="match-correct-multiple">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
      <qti-value>choiceC</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="3">
      <qti-simple-choice identifier="choiceA">Correct 1</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Wrong</qti-simple-choice>
      <qti-simple-choice identifier="choiceC">Correct 2</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: ['choiceA', 'choiceC'] };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(1);
    });

    test('match_correct template with multiple cardinality (partially correct)', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="match-correct-multiple">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
      <qti-value>choiceC</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="3">
      <qti-simple-choice identifier="choiceA">Correct 1</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Wrong</qti-simple-choice>
      <qti-simple-choice identifier="choiceC">Correct 2</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      // Only selecting one of the two correct choices
      const submission = { RESPONSE: ['choiceA'] };

      const newState = processResponse(itemDoc, submission, currentState);

      // match_correct is all-or-nothing, so partial should score 0
      expect(newState.variables.SCORE).toBe(0);
    });

    test('match_correct template with ordered cardinality', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="match-correct-ordered">
  <qti-response-declaration identifier="RESPONSE" cardinality="ordered" base-type="identifier">
    <qti-correct-response>
      <qti-value>step1</qti-value>
      <qti-value>step2</qti-value>
      <qti-value>step3</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-order-interaction response-identifier="RESPONSE">
      <qti-simple-choice identifier="step1">First step</qti-simple-choice>
      <qti-simple-choice identifier="step2">Second step</qti-simple-choice>
      <qti-simple-choice identifier="step3">Third step</qti-simple-choice>
    </qti-order-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: ['step1', 'step2', 'step3'] };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(1);
    });

    test('match_correct template with string base-type', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="match-correct-string">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>Paris</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-text-entry-interaction response-identifier="RESPONSE"/>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: 'Paris' };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(1);
    });

    test('match_correct template uses Common Cartridge variant (CC2_match_basic.xml)', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="cc2-match-basic">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceB</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choiceA">Wrong</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Correct</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/CC2_match_basic.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: 'choiceB' };

      const newState = processResponse(itemDoc, submission, currentState);

      // CC2_match_basic should work the same as match_correct
      expect(newState.variables.SCORE).toBe(1);
    });

    test('match_correct template uses Common Cartridge variant (CC2_match.xml)', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="cc2-match">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceB</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choiceA">Wrong</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Correct</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/CC2_match.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: 'choiceB' };

      const newState = processResponse(itemDoc, submission, currentState);

      // CC2_match should work the same as match_correct
      expect(newState.variables.SCORE).toBe(1);
    });
  });

  describe('MAP RESPONSE Template', () => {
    test('uses map_response template with single identifier mapping', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="map-response-item">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceB</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="choiceA" mapped-value="0.25"/>
      <qti-map-entry map-key="choiceB" mapped-value="1.0"/>
      <qti-map-entry map-key="choiceC" mapped-value="0.5"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choiceA">Partially correct</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Fully correct</qti-simple-choice>
      <qti-simple-choice identifier="choiceC">Half credit</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: 'choiceC' };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(0.5);
    });

    test('map_response template sets score to 0.0 for null response', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="map-response-null">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceB</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="choiceB" mapped-value="1.0"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choiceA">Wrong</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Correct</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = {}; // No response

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(0.0);
    });

    test('map_response template with multiple cardinality sums values', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="map-response-multiple">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
      <qti-value>choiceC</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="choiceA" mapped-value="0.5"/>
      <qti-map-entry map-key="choiceB" mapped-value="-0.25"/>
      <qti-map-entry map-key="choiceC" mapped-value="0.5"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="3">
      <qti-simple-choice identifier="choiceA">Correct 1 (0.5)</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Wrong (-0.25)</qti-simple-choice>
      <qti-simple-choice identifier="choiceC">Correct 2 (0.5)</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      // Select both correct choices
      const submission = { RESPONSE: ['choiceA', 'choiceC'] };

      const newState = processResponse(itemDoc, submission, currentState);

      // Should sum: 0.5 + 0.5 = 1.0
      expect(newState.variables.SCORE).toBe(1.0);
    });

    test('map_response template with negative scoring for wrong choices', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="map-response-negative">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="choiceA" mapped-value="1.0"/>
      <qti-map-entry map-key="choiceB" mapped-value="-0.5"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="2">
      <qti-simple-choice identifier="choiceA">Correct</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Wrong (penalty)</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      // Select correct but also select wrong
      const submission = { RESPONSE: ['choiceA', 'choiceB'] };

      const newState = processResponse(itemDoc, submission, currentState);

      // Should sum: 1.0 + (-0.5) = 0.5
      expect(newState.variables.SCORE).toBe(0.5);
    });

    test('map_response template with lower-bound limit', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="map-response-lower-bound">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0" lower-bound="0">
      <qti-map-entry map-key="choiceA" mapped-value="1.0"/>
      <qti-map-entry map-key="choiceB" mapped-value="-2.0"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="2">
      <qti-simple-choice identifier="choiceA">Correct</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Wrong (big penalty)</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      // Only select the wrong answer with big penalty
      const submission = { RESPONSE: ['choiceB'] };

      const newState = processResponse(itemDoc, submission, currentState);

      // Would be -2.0, but lower-bound="0" should limit it to 0
      expect(newState.variables.SCORE).toBe(0);
    });

    test('map_response template with upper-bound limit', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="map-response-upper-bound">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
      <qti-value>choiceB</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0" upper-bound="1">
      <qti-map-entry map-key="choiceA" mapped-value="0.8"/>
      <qti-map-entry map-key="choiceB" mapped-value="0.8"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="2">
      <qti-simple-choice identifier="choiceA">Correct 1</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Correct 2</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: ['choiceA', 'choiceB'] };

      const newState = processResponse(itemDoc, submission, currentState);

      // Would be 1.6, but upper-bound="1" should limit it to 1
      expect(newState.variables.SCORE).toBe(1);
    });

    test('map_response template uses Common Cartridge variant (CC2_map_response.xml)', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="cc2-map-response">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceB</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="choiceA" mapped-value="0.5"/>
      <qti-map-entry map-key="choiceB" mapped-value="1.0"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choiceA">Partial</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Full</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/CC2_map_response.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: 'choiceA' };

      const newState = processResponse(itemDoc, submission, currentState);

      // CC2_map_response should work the same as map_response
      expect(newState.variables.SCORE).toBe(0.5);
    });
  });

  describe('MAP RESPONSE POINT Template', () => {
    test('uses map_response_point template with point base-type', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="map-response-point-item">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="point">
    <qti-area-mapping default-value="0">
      <qti-area-map-entry shape="circle" coords="100,100,50" mapped-value="1.0"/>
      <qti-area-map-entry shape="rect" coords="200,200,250,250" mapped-value="0.5"/>
    </qti-area-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-hotspot-interaction response-identifier="RESPONSE">
      <object data="image.png" type="image/png"/>
    </qti-hotspot-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response_point.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      // Click inside the circle (center at 100,100 with radius 50)
      const submission = { RESPONSE: '100 100' };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(1.0);
    });

    test('map_response_point template sets score to 0 for null response', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="map-response-point-null">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="point">
    <qti-area-mapping default-value="0">
      <qti-area-map-entry shape="circle" coords="100,100,50" mapped-value="1.0"/>
    </qti-area-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-hotspot-interaction response-identifier="RESPONSE">
      <object data="image.png" type="image/png"/>
    </qti-hotspot-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response_point.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = {}; // No click

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(0);
    });

    test('map_response_point template with multiple cardinality (multiple clicks)', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="map-response-point-multiple">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="point">
    <qti-area-mapping default-value="0">
      <qti-area-map-entry shape="circle" coords="100,100,30" mapped-value="0.5"/>
      <qti-area-map-entry shape="circle" coords="200,200,30" mapped-value="0.5"/>
    </qti-area-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-select-point-interaction response-identifier="RESPONSE" max-choices="2">
      <object data="image.png" type="image/png"/>
    </qti-select-point-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response_point.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      // Click both hotspots
      const submission = { RESPONSE: ['100 100', '200 200'] };

      const newState = processResponse(itemDoc, submission, currentState);

      // Should sum: 0.5 + 0.5 = 1.0
      expect(newState.variables.SCORE).toBe(1.0);
    });

    test('map_response_point template with rect shape', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="map-response-point-rect">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="point">
    <qti-area-mapping default-value="0">
      <qti-area-map-entry shape="rect" coords="50,50,150,150" mapped-value="1.0"/>
    </qti-area-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-hotspot-interaction response-identifier="RESPONSE">
      <object data="image.png" type="image/png"/>
    </qti-hotspot-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response_point.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      // Click inside rectangle (x between 50-150, y between 50-150)
      const submission = { RESPONSE: '100 100' };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(1.0);
    });

    test('map_response_point template with click outside any area', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="map-response-point-outside">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="point">
    <qti-area-mapping default-value="-0.5">
      <qti-area-map-entry shape="circle" coords="100,100,30" mapped-value="1.0"/>
    </qti-area-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-hotspot-interaction response-identifier="RESPONSE">
      <object data="image.png" type="image/png"/>
    </qti-hotspot-interaction>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response_point.xml"/>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      // Click far outside the circle
      const submission = { RESPONSE: '500 500' };

      const newState = processResponse(itemDoc, submission, currentState);

      // Should use default-value
      expect(newState.variables.SCORE).toBe(-0.5);
    });
  });
});

describe('Response Processing Operators and Expressions', () => {
  describe('qti-match operator', () => {
    test('matches single identifier values', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="match-identifier">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="identifier">A</qti-base-value>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: 'A' };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(1);
    });

    test('matches multiple identifier values (unordered)', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="match-multiple">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier"/>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="2">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
      <qti-simple-choice identifier="C">C</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-multiple>
            <qti-base-value base-type="identifier">B</qti-base-value>
            <qti-base-value base-type="identifier">A</qti-base-value>
          </qti-multiple>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      // Order doesn't matter for multiple cardinality
      const submission = { RESPONSE: ['A', 'B'] };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(1);
    });

    test('does not match ordered when order is wrong', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="match-ordered">
  <qti-response-declaration identifier="RESPONSE" cardinality="ordered" base-type="identifier"/>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-order-interaction response-identifier="RESPONSE">
      <qti-simple-choice identifier="A">First</qti-simple-choice>
      <qti-simple-choice identifier="B">Second</qti-simple-choice>
    </qti-order-interaction>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-ordered>
            <qti-base-value base-type="identifier">A</qti-base-value>
            <qti-base-value base-type="identifier">B</qti-base-value>
          </qti-ordered>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      // Wrong order
      const submission = { RESPONSE: ['B', 'A'] };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(0);
    });

    test('matches string values (case-sensitive)', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="match-string">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-text-entry-interaction response-identifier="RESPONSE"/>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="string">Paris</qti-base-value>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: 'paris' }; // lowercase

      const newState = processResponse(itemDoc, submission, currentState);

      // Should not match due to case difference
      expect(newState.variables.SCORE).toBe(0);
    });

    test('matches integer values', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="match-integer">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="integer"/>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-text-entry-interaction response-identifier="RESPONSE"/>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="integer">42</qti-base-value>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: 42 };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(1);
    });
  });

  describe('qti-correct operator', () => {
    test('retrieves correct response for single cardinality', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="correct-operator">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceC</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choiceA">A</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">B</qti-simple-choice>
      <qti-simple-choice identifier="choiceC">C</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

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
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: 'choiceC' };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(1);
    });
  });

  describe('qti-is-null operator', () => {
    test('returns true when variable is null/undefined', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="is-null-true">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="WAS_NULL" cardinality="single" base-type="boolean">
    <qti-default-value>
      <qti-value>false</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-is-null>
          <qti-variable identifier="RESPONSE"/>
        </qti-is-null>
        <qti-set-outcome-value identifier="WAS_NULL">
          <qti-base-value base-type="boolean">true</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0, WAS_NULL: false },
        completionStatus: 'not_attempted' as const,
      };
      const submission = {}; // No response

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.WAS_NULL).toBe(true);
    });

    test('returns false when variable has a value', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="is-null-false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>

  <qti-outcome-declaration identifier="WAS_NULL" cardinality="single" base-type="boolean">
    <qti-default-value>
      <qti-value>true</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-is-null>
          <qti-variable identifier="RESPONSE"/>
        </qti-is-null>
        <qti-set-outcome-value identifier="WAS_NULL">
          <qti-base-value base-type="boolean">true</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="WAS_NULL">
          <qti-base-value base-type="boolean">false</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { WAS_NULL: true },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: 'A' };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.WAS_NULL).toBe(false);
    });
  });

  describe('Boolean operators (qti-and, qti-or, qti-not)', () => {
    test('qti-and requires all conditions to be true', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="and-operator">
  <qti-response-declaration identifier="RESPONSE1" cardinality="single" base-type="identifier"/>
  <qti-response-declaration identifier="RESPONSE2" cardinality="single" base-type="identifier"/>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE1" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
    </qti-choice-interaction>
    <qti-choice-interaction response-identifier="RESPONSE2" max-choices="1">
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-and>
          <qti-match>
            <qti-variable identifier="RESPONSE1"/>
            <qti-base-value base-type="identifier">A</qti-base-value>
          </qti-match>
          <qti-match>
            <qti-variable identifier="RESPONSE2"/>
            <qti-base-value base-type="identifier">B</qti-base-value>
          </qti-match>
        </qti-and>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE1: 'A', RESPONSE2: 'B' };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(1);
    });

    test('qti-or requires at least one condition to be true', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="or-operator">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-or>
          <qti-match>
            <qti-variable identifier="RESPONSE"/>
            <qti-base-value base-type="identifier">A</qti-base-value>
          </qti-match>
          <qti-match>
            <qti-variable identifier="RESPONSE"/>
            <qti-base-value base-type="identifier">B</qti-base-value>
          </qti-match>
        </qti-or>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0.5</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: 'B' };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(0.5);
    });

    test('qti-not inverts boolean value', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="not-operator">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-not>
          <qti-match>
            <qti-variable identifier="RESPONSE"/>
            <qti-base-value base-type="identifier">A</qti-base-value>
          </qti-match>
        </qti-not>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      // Response is B, which is NOT A, so condition should be true
      const submission = { RESPONSE: 'B' };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(1);
    });
  });

  describe('Arithmetic operators', () => {
    test('qti-sum adds numeric values', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="sum-operator">
  <qti-outcome-declaration identifier="PARTIAL1" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0.3</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="PARTIAL2" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0.7</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <p>Question</p>
  </qti-item-body>

  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum>
        <qti-variable identifier="PARTIAL1"/>
        <qti-variable identifier="PARTIAL2"/>
      </qti-sum>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { PARTIAL1: 0.3, PARTIAL2: 0.7, SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = {};

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(1.0);
    });

    test('qti-product multiplies numeric values', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="product-operator">
  <qti-outcome-declaration identifier="RAW_SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>5</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="MULTIPLIER" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>2</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <p>Question</p>
  </qti-item-body>

  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE">
      <qti-product>
        <qti-variable identifier="RAW_SCORE"/>
        <qti-variable identifier="MULTIPLIER"/>
      </qti-product>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { RAW_SCORE: 5, MULTIPLIER: 2, SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = {};

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(10);
    });
  });

  describe('Container operators', () => {
    test('qti-member checks if value is in container', () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="member-operator">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier"/>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="3">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
      <qti-simple-choice identifier="C">C</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">B</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

      const itemDoc = parser.parseFromString(itemXml, 'text/xml');
      const currentState = {
        variables: { SCORE: 0 },
        completionStatus: 'not_attempted' as const,
      };
      const submission = { RESPONSE: ['A', 'B'] };

      const newState = processResponse(itemDoc, submission, currentState);

      expect(newState.variables.SCORE).toBe(1);
    });
  });
});

describe('Complex Response Processing Scenarios', () => {
  test('composite item with multiple interactions scored independently', () => {
    const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="composite-item">
  <qti-response-declaration identifier="RESPONSE_PART1" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>A</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="A" mapped-value="1.0"/>
      <qti-map-entry map-key="B" mapped-value="0.5"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_PART2" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>X</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="X" mapped-value="1.0"/>
      <qti-map-entry map-key="Y" mapped-value="0.5"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="SCORE_PART1" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="SCORE_PART2" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE_PART1" max-choices="1">
      <qti-simple-choice identifier="A">Part 1 Full</qti-simple-choice>
      <qti-simple-choice identifier="B">Part 1 Partial</qti-simple-choice>
    </qti-choice-interaction>
    <qti-choice-interaction response-identifier="RESPONSE_PART2" max-choices="1">
      <qti-simple-choice identifier="X">Part 2 Full</qti-simple-choice>
      <qti-simple-choice identifier="Y">Part 2 Partial</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE_PART1">
      <qti-map-response identifier="RESPONSE_PART1"/>
    </qti-set-outcome-value>
    <qti-set-outcome-value identifier="SCORE_PART2">
      <qti-map-response identifier="RESPONSE_PART2"/>
    </qti-set-outcome-value>
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum>
        <qti-variable identifier="SCORE_PART1"/>
        <qti-variable identifier="SCORE_PART2"/>
      </qti-sum>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

    const itemDoc = parser.parseFromString(itemXml, 'text/xml');
    const currentState = {
      variables: { SCORE: 0, SCORE_PART1: 0, SCORE_PART2: 0 },
      completionStatus: 'not_attempted' as const,
    };
    const submission = { RESPONSE_PART1: 'B', RESPONSE_PART2: 'X' };

    const newState = processResponse(itemDoc, submission, currentState);

    expect(newState.variables.SCORE_PART1).toBe(0.5);
    expect(newState.variables.SCORE_PART2).toBe(1.0);
    expect(newState.variables.SCORE).toBe(1.5);
  });

  test('adaptive item with custom feedback based on response', () => {
    const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="adaptive-item">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceC</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="FEEDBACK_ID" cardinality="single" base-type="identifier">
    <qti-default-value>
      <qti-value>none</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choiceA">Too low</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Close</qti-simple-choice>
      <qti-simple-choice identifier="choiceC">Correct</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="identifier">choiceC</qti-base-value>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK_ID">
          <qti-base-value base-type="identifier">correct</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="identifier">choiceB</qti-base-value>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK_ID">
          <qti-base-value base-type="identifier">close</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK_ID">
          <qti-base-value base-type="identifier">wrong</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

    const itemDoc = parser.parseFromString(itemXml, 'text/xml');
    const currentState = {
      variables: { SCORE: 0, FEEDBACK_ID: 'none' },
      completionStatus: 'not_attempted' as const,
    };
    const submission = { RESPONSE: 'choiceB' };

    const newState = processResponse(itemDoc, submission, currentState);

    expect(newState.variables.SCORE).toBe(0);
    expect(newState.variables.FEEDBACK_ID).toBe('close');
  });

  test('handles numAttempts tracking', () => {
    const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="attempts-item"
                     adaptive="true">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="numAttempts" cardinality="single" base-type="integer">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="choiceA">Right</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Wrong</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>

  <qti-response-processing>
    <qti-set-outcome-value identifier="numAttempts">
      <qti-sum>
        <qti-variable identifier="numAttempts"/>
        <qti-base-value base-type="integer">1</qti-base-value>
      </qti-sum>
    </qti-set-outcome-value>
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
</qti-assessment-item>`;

    const itemDoc = parser.parseFromString(itemXml, 'text/xml');

    // First attempt
    let currentState: AttemptState = {
      variables: { SCORE: 0, numAttempts: 0 },
      completionStatus: 'not_attempted' as const,
    };
    let submission = { RESPONSE: 'choiceB' };

    let newState = processResponse(itemDoc, submission, currentState);

    expect(newState.variables.numAttempts).toBe(1);
    expect(newState.variables.SCORE).toBe(0);

    // Second attempt
    currentState = newState;
    submission = { RESPONSE: 'choiceA' };

    newState = processResponse(itemDoc, submission, currentState);

    expect(newState.variables.numAttempts).toBe(2);
    expect(newState.variables.SCORE).toBe(1);
  });
});
