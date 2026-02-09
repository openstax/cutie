import { describe, expect, test } from 'vitest';
import type { AttemptState } from './types';
import { setScore, submitResponse } from './index';

const externalScoredItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="essay" title="Essay" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"
                           external-scored="human" normal-maximum="5.0"/>
  <qti-item-body>
    <qti-extended-text-interaction response-identifier="RESPONSE" expected-length="200">
      <qti-prompt>Write an essay.</qti-prompt>
    </qti-extended-text-interaction>
  </qti-item-body>
</qti-assessment-item>`;

const regularScoredItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="choice" title="Choice" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>A</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">
      <qti-simple-choice identifier="A">Correct</qti-simple-choice>
      <qti-simple-choice identifier="B">Wrong</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="https://example.com/match_correct.xml"/>
</qti-assessment-item>`;

const baseState: AttemptState = {
  variables: {},
  completionStatus: 'not_attempted',
  score: null,
};

describe('submitResponse - external scoring', () => {
  test('returns pendingManualScoring for externally-scored item', async () => {
    const result = await submitResponse(
      { RESPONSE: 'Photosynthesis converts light energy into chemical energy.' },
      baseState,
      externalScoredItem,
    );

    expect(result.state.pendingManualScoring).toEqual({ maxScore: 5 });
    expect(result.state.score).toBeNull();
    expect(result.state.comments).toBeUndefined();
  });

  test('does not set pendingManualScoring for regular item', async () => {
    const result = await submitResponse(
      { RESPONSE: 'A' },
      baseState,
      regularScoredItem,
    );

    expect(result.state.pendingManualScoring).toBeUndefined();
    expect(result.state.score).not.toBeNull();
    expect(result.state.score!.raw).toBe(1);
    expect(result.state.score!.max).toBe(1);
  });
});

describe('setScore', () => {
  test('applies score and comments, clears pendingManualScoring', async () => {
    // First submit to get a state with pendingManualScoring
    const submitResult = await submitResponse(
      { RESPONSE: 'Some essay text' },
      baseState,
      externalScoredItem,
    );
    expect(submitResult.state.pendingManualScoring).toEqual({ maxScore: 5 });

    // Now apply a score
    const scoreResult = await setScore(
      4,
      'Good explanation of photosynthesis.',
      submitResult.state,
      externalScoredItem,
    );

    expect(scoreResult.state.pendingManualScoring).toBeUndefined();
    expect(scoreResult.state.comments).toBe('Good explanation of photosynthesis.');
    expect(scoreResult.state.score).not.toBeNull();
    expect(scoreResult.state.score!.raw).toBe(4);
    expect(scoreResult.state.score!.max).toBe(5);
    expect(scoreResult.state.score!.scaled).toBe(0.8);
    expect(scoreResult.state.score!.min).toBe(0);
    expect(scoreResult.template).toBeTruthy();
  });
});
