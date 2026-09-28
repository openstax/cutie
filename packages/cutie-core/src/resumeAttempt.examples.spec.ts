import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
// Test fixtures only: the example app's items exercise every supported feature
import { examples } from '../../cutie-example/src/example-items';
import {
  type AttemptResult,
  beginAttempt,
  type DeliveryOptions,
  ResponseValidationError,
  resumeAttempt,
  setScore,
  submitResponse,
} from './index';

const MAX_TURNS = 3;

const optionSets: DeliveryOptions[] = [
  {},
  { showFeedback: false, showEvaluation: 'correctness', shuffleOverride: 'shuffle' },
  { showFeedback: true, showEvaluation: 'correctResponse', shuffleOverride: 'shuffle' },
];

/**
 * A submission of every correct response (as template processing set it, or as
 * declared), which drives most items to completion and so to their feedback
 * and evaluation. Text responses with no correct response get filler text long
 * enough to pass length constraints.
 */
function correctSubmission(itemXml: string, variables: Record<string, unknown>): Record<string, unknown> {
  const doc = new DOMParser().parseFromString(itemXml.trim(), 'text/xml');
  const submission: Record<string, unknown> = {};

  for (const declaration of Array.from(doc.getElementsByTagName('qti-response-declaration'))) {
    const identifier = declaration.getAttribute('identifier');
    if (!identifier) continue;

    const templated = variables[`__correct_${identifier}`];
    const correct = declaration.getElementsByTagName('qti-correct-response')[0];
    if (templated !== undefined) {
      submission[identifier] = templated;
    } else if (correct) {
      const values = Array.from(correct.getElementsByTagName('qti-value')).map((el) => el.textContent ?? '');
      const cardinality = declaration.getAttribute('cardinality') || 'single';
      submission[identifier] = cardinality === 'single' ? values[0] : values;
    } else if (declaration.getAttribute('base-type') === 'string') {
      submission[identifier] = 'filler '.repeat(20).trim();
    }
  }

  return submission;
}

async function expectResumable(result: AttemptResult, itemXml: string): Promise<void> {
  const resumed = await resumeAttempt(structuredClone(result.state), itemXml);
  expect(resumed.template).toBe(result.template);
  expect(resumed.state).toEqual(result.state);
  expect(resumed.hasNewFeedback).toBe(false);
}

describe('resumeAttempt reproduces every result across the example items', () => {
  const cases = examples.flatMap((example) =>
    optionSets.map((options) => ({ name: example.name, item: example.item, options }))
  );

  test.each(cases)('$name with $options', async ({ item, options }) => {
    let result = await beginAttempt(item, undefined, options);
    await expectResumable(result, item);

    const submission = correctSubmission(item, result.state.variables);
    for (let turn = 0; turn < MAX_TURNS && result.state.completionStatus !== 'completed'; turn++) {
      try {
        result = await submitResponse(submission, result.state, item);
      } catch (error) {
        // The generic submission can't satisfy every item's constraints; the
        // states reached so far have been checked
        if (error instanceof ResponseValidationError) return;
        throw error;
      }
      await expectResumable(result, item);
    }

    if (result.state.pendingManualScoring) {
      result = await setScore(result.state.pendingManualScoring.maxScore, 'Scored', result.state, item);
      await expectResumable(result, item);
    }
  });
});
