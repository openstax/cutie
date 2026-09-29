import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
import { deriveSmartMaxTries } from './lib/maxTries';
import {
  type AttemptResult,
  beginAttempt,
  type DeliveryOptions,
  resumeAttempt,
  submitResponse,
} from './index';

const parser = new DOMParser();

function parseTemplate(template: string): Document {
  return parser.parseFromString(template, 'text/xml');
}

function feedbackIdentifiers(template: string): string[] {
  const doc = parseTemplate(template);
  return Array.from(doc.getElementsByTagName('qti-feedback-block')).map(
    (el) => el.getAttribute('identifier') ?? ''
  );
}

function evaluationOf(template: string, responseIdentifier: string): string | null {
  const doc = parseTemplate(template);
  const interaction = Array.from(doc.getElementsByTagName('*')).find(
    (el) => el.getAttribute('response-identifier') === responseIdentifier
  );
  return interaction?.getAttribute('data-evaluation') || null;
}

function itemVerdictOf(template: string): string | null {
  const itemBody = parseTemplate(template).getElementsByTagName('qti-item-body')[0];
  return itemBody?.getAttribute('data-evaluation') || null;
}

function defaultValueOf(template: string, responseIdentifier: string): string[] {
  const doc = parseTemplate(template);
  const declaration = Array.from(doc.getElementsByTagName('qti-response-declaration')).find(
    (el) => el.getAttribute('identifier') === responseIdentifier
  );
  const defaultValue = declaration?.getElementsByTagName('qti-default-value')[0];
  if (!defaultValue) return [];
  return Array.from(defaultValue.getElementsByTagName('qti-value')).map((el) => el.textContent ?? '');
}

function retryMessageOf(template: string): { verdict: string; text: string } | null {
  const doc = parseTemplate(template);
  const message = Array.from(doc.getElementsByTagName('div')).find((el) => el.hasAttribute('data-cutie-retry'));
  return message ? { verdict: message.getAttribute('data-cutie-retry') ?? '', text: message.textContent ?? '' } : null;
}

async function expectResumable(result: AttemptResult, itemXml: string): Promise<void> {
  const resumed = await resumeAttempt(structuredClone(result.state), itemXml);
  expect(resumed.template).toBe(result.template);
  expect(resumed.state).toEqual(result.state);
}

function choices(count: number): string {
  return Array.from({ length: count }, (_, i) => `<qti-simple-choice identifier="C${i}">${i}</qti-simple-choice>`).join('');
}

function itemWithBody(body: string, extra = ''): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="smart" title="Smart">
  ${extra}
  <qti-item-body>${body}</qti-item-body>
</qti-assessment-item>`;
}

/**
 * Four-choice item: RIGHT or WRONG feedback once submitted. A template
 * processing default for BONUS shows outcome defaults surviving a fresh try.
 */
const choiceItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="choice" title="Choice" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>1</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>
  <qti-outcome-declaration identifier="BONUS" cardinality="single" base-type="integer"/>
  <qti-template-processing>
    <qti-set-default-value identifier="BONUS"><qti-base-value base-type="integer">7</qti-base-value></qti-set-default-value>
  </qti-template-processing>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">Right</qti-simple-choice>
      <qti-simple-choice identifier="B">Wrong</qti-simple-choice>
      <qti-simple-choice identifier="C">Also wrong</qti-simple-choice>
      <qti-simple-choice identifier="D">Still wrong</qti-simple-choice>
    </qti-choice-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RIGHT" show-hide="show"><p>Well done</p></qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="WRONG" show-hide="show"><p>Not quite</p></qti-feedback-block>
  </qti-item-body>
  <qti-response-processing>
    <qti-set-outcome-value identifier="BONUS"><qti-base-value base-type="integer">0</qti-base-value></qti-set-outcome-value>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>
        <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">RIGHT</qti-base-value></qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">WRONG</qti-base-value></qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

/**
 * Multiple-response item scored by mapping, for partial credit.
 */
const mappedItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="mapped" title="Mapped" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value><qti-value>B</qti-value></qti-correct-response>
    <qti-mapping lower-bound="0" default-value="0">
      <qti-map-entry map-key="A" mapped-value="1"/>
      <qti-map-entry map-key="B" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="4">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
      <qti-simple-choice identifier="C">C</qti-simple-choice>
      <qti-simple-choice identifier="D">D</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml"/>
</qti-assessment-item>`;

/**
 * Adaptive item: a first wrong answer shows a HINT and keeps the try open; a
 * second wrong answer (numAttempts 2) completes the try with half credit. The
 * right answer completes it with full credit.
 */
const adaptiveItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="adaptive" title="Adaptive" adaptive="true" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>1</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">Right</qti-simple-choice>
      <qti-simple-choice identifier="B">Wrong</qti-simple-choice>
    </qti-choice-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="HINT" show-hide="show"><p>Hint</p></qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RIGHT" show-hide="show"><p>Well done</p></qti-feedback-block>
  </qti-item-body>
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>
        <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">RIGHT</qti-base-value></qti-set-outcome-value>
        <qti-set-outcome-value identifier="completionStatus"><qti-base-value base-type="identifier">completed</qti-base-value></qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else-if>
        <qti-gte><qti-variable identifier="numAttempts"/><qti-base-value base-type="integer">2</qti-base-value></qti-gte>
        <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">0.5</qti-base-value></qti-set-outcome-value>
        <qti-set-outcome-value identifier="completionStatus"><qti-base-value base-type="identifier">completed</qti-base-value></qti-set-outcome-value>
      </qti-response-else-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">HINT</qti-base-value></qti-set-outcome-value>
        <qti-set-outcome-value identifier="completionStatus"><qti-base-value base-type="identifier">incomplete</qti-base-value></qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

/**
 * Human-scored essay.
 */
const essayItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="essay" title="Essay" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="ESSAY" cardinality="single" base-type="string"/>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"
                           external-scored="human" normal-maximum="5.0"/>
  <qti-item-body>
    <qti-extended-text-interaction response-identifier="ESSAY"/>
  </qti-item-body>
</qti-assessment-item>`;

async function begin(itemXml: string, options: DeliveryOptions): Promise<AttemptResult> {
  return beginAttempt(itemXml, undefined, options);
}

describe('tries', () => {
  describe('maxTries', () => {
    test('defaults to one try, which ends the attempt', async () => {
      const begun = await beginAttempt(choiceItem);
      expect(begun.state.triesRemaining).toBe(1);
      expect(begun.tryConsumed).toBe(false);

      const result = await submitResponse({ RESPONSE: 'B' }, begun.state, choiceItem);
      expect(result.tryConsumed).toBe(true);
      expect(result.state.completionStatus).toBe('completed');
      expect(result.state.triesRemaining).toBe(0);
      expect(result.state.retryVerdict).toBeUndefined();
      expect(feedbackIdentifiers(result.template)).toEqual(['WRONG']);
    });

    test.each([0, -1, 1.5, NaN])('rejects %s', async (maxTries) => {
      await expect(begin(choiceItem, { maxTries })).rejects.toThrow(/maxTries/);
    });
  });

  describe('a non-adaptive item', () => {
    test('continues with a fresh try after a wrong answer', async () => {
      const begun = await begin(choiceItem, { maxTries: 2 });
      expect(begun.state.triesRemaining).toBe(2);

      const result = await submitResponse({ RESPONSE: 'B' }, begun.state, choiceItem);
      expect(result.tryConsumed).toBe(true);
      expect(result.hasNewFeedback).toBe(true);
      expect(result.state.completionStatus).toBe('incomplete');
      expect(result.state.triesRemaining).toBe(1);
      expect(result.state.retryVerdict).toBe('incorrect');

      // The last try's score stands until the next try ends
      expect(result.state.score?.raw).toBe(0);

      // Feedback waits; the response stays, marked with its verdict
      expect(feedbackIdentifiers(result.template)).toEqual([]);
      expect(defaultValueOf(result.template, 'RESPONSE')).toEqual(['B']);
      expect(evaluationOf(result.template, 'RESPONSE')).toBe('incorrect');
      expect(itemVerdictOf(result.template)).toBe('incorrect');
      expect(retryMessageOf(result.template)).toBeNull();

      await expectResumable(result, choiceItem);
    });

    test('resets outcomes and numAttempts for the fresh try, keeping template defaults', async () => {
      const begun = await begin(choiceItem, { maxTries: 2 });
      expect(begun.state.variables.BONUS).toBe(7);
      expect(begun.state.variables.numAttempts).toBe(0);

      const result = await submitResponse({ RESPONSE: 'B' }, begun.state, choiceItem);
      expect(result.state.variables.BONUS).toBe(7);
      expect(result.state.variables.FEEDBACK).toBeUndefined();
      expect(result.state.variables.SCORE).toBe(0);
      expect(result.state.variables.numAttempts).toBe(0);
    });

    test('ends the attempt on a correct try, with feedback', async () => {
      const begun = await begin(choiceItem, { maxTries: 3 });
      const retry = await submitResponse({ RESPONSE: 'B' }, begun.state, choiceItem);
      const result = await submitResponse({ RESPONSE: 'A' }, retry.state, choiceItem);

      expect(result.tryConsumed).toBe(true);
      expect(result.state.completionStatus).toBe('completed');
      expect(result.state.triesRemaining).toBe(0);
      expect(result.state.retryVerdict).toBeUndefined();
      expect(result.state.score?.raw).toBe(1);
      expect(feedbackIdentifiers(result.template)).toEqual(['RIGHT']);
      // Terminal evaluation follows showEvaluation, 'none' by default
      expect(evaluationOf(result.template, 'RESPONSE')).toBeNull();
      expect(itemVerdictOf(result.template)).toBeNull();
    });

    test('ends the attempt when the tries run out', async () => {
      const begun = await begin(choiceItem, { maxTries: 2 });
      const retry = await submitResponse({ RESPONSE: 'B' }, begun.state, choiceItem);
      const result = await submitResponse({ RESPONSE: 'C' }, retry.state, choiceItem);

      expect(result.tryConsumed).toBe(true);
      expect(result.state.completionStatus).toBe('completed');
      expect(result.state.triesRemaining).toBe(0);
      expect(feedbackIdentifiers(result.template)).toEqual(['WRONG']);
      expect(evaluationOf(result.template, 'RESPONSE')).toBeNull();
    });

    test('withholds terminal feedback under showFeedback: false after a retry', async () => {
      const options = { maxTries: 2, showFeedback: false, showEvaluation: 'correctness' } as const;
      const begun = await begin(choiceItem, options);
      const retry = await submitResponse({ RESPONSE: 'B' }, begun.state, choiceItem);
      const result = await submitResponse({ RESPONSE: 'A' }, retry.state, choiceItem);

      expect(feedbackIdentifiers(result.template)).toEqual([]);
      expect(evaluationOf(result.template, 'RESPONSE')).toBe('correct');
      expect(itemVerdictOf(result.template)).toBe('correct');
      expect(result.hasNewFeedback).toBe(true);
    });

    test('gives partial credit a fresh try, as partial', async () => {
      const begun = await begin(mappedItem, { maxTries: 2 });
      const result = await submitResponse({ RESPONSE: ['A'] }, begun.state, mappedItem);

      expect(result.state.completionStatus).toBe('incomplete');
      expect(result.state.retryVerdict).toBe('partial');
      expect(evaluationOf(result.template, 'RESPONSE')).toBe('partial');
      expect(itemVerdictOf(result.template)).toBe('partial');
    });

    test('ends a try on every submission, even when response processing says incomplete', async () => {
      // Only adaptive items decide their completion (QTI 2.1 §5.2.1)
      const item = choiceItem.replace(
        '<qti-response-processing>',
        `<qti-response-processing>
    <qti-set-outcome-value identifier="completionStatus"><qti-base-value base-type="identifier">incomplete</qti-base-value></qti-set-outcome-value>`
      );
      const begun = await begin(item, { maxTries: 2 });
      const retry = await submitResponse({ RESPONSE: 'B' }, begun.state, item);
      expect(retry.tryConsumed).toBe(true);
      expect(retry.state.triesRemaining).toBe(1);

      const result = await submitResponse({ RESPONSE: 'C' }, retry.state, item);
      expect(result.tryConsumed).toBe(true);
      expect(result.state.completionStatus).toBe('completed');
    });

    test('starts another fresh try after another try that falls short', async () => {
      const begun = await begin(choiceItem, { maxTries: 3 });
      const first = await submitResponse({ RESPONSE: 'B' }, begun.state, choiceItem);
      const second = await submitResponse({ RESPONSE: 'C' }, first.state, choiceItem);

      // A second fresh try: still new feedback, though the marks look the same
      expect(second.state.retryVerdict).toBe('incorrect');
      expect(second.state.triesRemaining).toBe(1);
      expect(second.hasNewFeedback).toBe(true);
      expect(defaultValueOf(second.template, 'RESPONSE')).toEqual(['C']);
    });
  });

  describe('an adaptive item', () => {
    test('ends a try only when the item completes itself', async () => {
      const begun = await begin(adaptiveItem, { maxTries: 2 });
      const hinted = await submitResponse({ RESPONSE: 'B' }, begun.state, adaptiveItem);

      expect(hinted.tryConsumed).toBe(false);
      expect(hinted.state.triesRemaining).toBe(2);
      expect(hinted.state.completionStatus).toBe('incomplete');
      expect(feedbackIdentifiers(hinted.template)).toEqual(['HINT']);
    });

    test('starts over with the retry message after a try that falls short', async () => {
      const begun = await begin(adaptiveItem, { maxTries: 2 });
      const hinted = await submitResponse({ RESPONSE: 'B' }, begun.state, adaptiveItem);
      const result = await submitResponse({ RESPONSE: 'B' }, hinted.state, adaptiveItem);

      expect(result.tryConsumed).toBe(true);
      expect(result.hasNewFeedback).toBe(true);
      expect(result.state.completionStatus).toBe('incomplete');
      expect(result.state.triesRemaining).toBe(1);
      expect(result.state.retryVerdict).toBe('partial');
      expect(result.state.score?.raw).toBe(0.5);
      expect(result.state.variables.RESPONSE).toBeUndefined();
      expect(result.state.variables.numAttempts).toBe(0);

      expect(feedbackIdentifiers(result.template)).toEqual([]);
      expect(defaultValueOf(result.template, 'RESPONSE')).toEqual([]);
      expect(evaluationOf(result.template, 'RESPONSE')).toBeNull();
      expect(itemVerdictOf(result.template)).toBeNull();
      expect(retryMessageOf(result.template)).toEqual({
        verdict: 'partial',
        text: 'That wasn\'t quite right. Tries remaining: 1',
      });

      await expectResumable(result, adaptiveItem);
    });

    test('runs the fresh try from the start, keeping the last try\'s verdict and score until it ends', async () => {
      const begun = await begin(adaptiveItem, { maxTries: 2 });
      const hinted = await submitResponse({ RESPONSE: 'B' }, begun.state, adaptiveItem);
      const retry = await submitResponse({ RESPONSE: 'B' }, hinted.state, adaptiveItem);
      const result = await submitResponse({ RESPONSE: 'B' }, retry.state, adaptiveItem);

      // numAttempts started over, so the item hints again rather than completing
      expect(result.tryConsumed).toBe(false);
      expect(result.state.completionStatus).toBe('incomplete');
      expect(feedbackIdentifiers(result.template)).toEqual(['HINT']);
      // The message only leads the fresh try
      expect(retryMessageOf(result.template)).toBeNull();
      expect(result.hasNewFeedback).toBe(true);

      // The step's score belongs to a try in progress; the last try's stands
      expect(result.state.retryVerdict).toBe('partial');
      expect(result.state.score?.raw).toBe(0.5);
      expect(result.state.triesRemaining).toBe(1);

      // The fresh try's end replaces both
      const ended = await submitResponse({ RESPONSE: 'A' }, result.state, adaptiveItem);
      expect(ended.state.completionStatus).toBe('completed');
      expect(ended.state.retryVerdict).toBeUndefined();
      expect(ended.state.score?.raw).toBe(1);
    });

    test('recognizes adaptive="1"', async () => {
      const item = adaptiveItem.replace('adaptive="true"', 'adaptive="1"');
      const begun = await begin(item, { maxTries: 2 });
      const hinted = await submitResponse({ RESPONSE: 'B' }, begun.state, item);

      expect(hinted.tryConsumed).toBe(false);
      expect(hinted.state.completionStatus).toBe('incomplete');
    });

    test('uses the adaptiveRetryMessage given', async () => {
      const begun = await begin(adaptiveItem, { maxTries: 3, adaptiveRetryMessage: '{n} left. {n}!' });
      const hinted = await submitResponse({ RESPONSE: 'B' }, begun.state, adaptiveItem);
      const result = await submitResponse({ RESPONSE: 'B' }, hinted.state, adaptiveItem);

      expect(retryMessageOf(result.template)?.text).toBe('2 left. 2!');
    });

    test('ends the attempt on a correct try', async () => {
      const begun = await begin(adaptiveItem, { maxTries: 2 });
      const result = await submitResponse({ RESPONSE: 'A' }, begun.state, adaptiveItem);

      expect(result.tryConsumed).toBe(true);
      expect(result.state.completionStatus).toBe('completed');
      expect(result.state.triesRemaining).toBe(0);
      expect(feedbackIdentifiers(result.template)).toEqual(['RIGHT']);
    });
  });

  describe('a finished attempt', () => {
    test('takes no further submissions', async () => {
      const begun = await beginAttempt(choiceItem);
      const result = await submitResponse({ RESPONSE: 'B' }, begun.state, choiceItem);
      await expect(submitResponse({ RESPONSE: 'A' }, result.state, choiceItem)).rejects.toThrow(/complete/);
    });
  });

  describe('without a score to judge by', () => {
    /** Without a score, tries are judged by the interactions' own verdicts */
    const noScoreItem = (body: string, declarations: string, templateProcessing = '') => `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="no-score" title="No score">
  <qti-response-declaration identifier="CHOICE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  ${declarations}
  ${templateProcessing}
  <qti-item-body>
    <qti-choice-interaction response-identifier="CHOICE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
    ${body}
  </qti-item-body>
</qti-assessment-item>`;

    test('is not correct while a response can\'t be judged', async () => {
      const item = noScoreItem(
        '<qti-extended-text-interaction response-identifier="ESSAY"/>',
        '<qti-response-declaration identifier="ESSAY" cardinality="single" base-type="string"/>'
      );
      const begun = await begin(item, { maxTries: 2, showEvaluation: 'correctness' });
      const result = await submitResponse({ CHOICE: 'A', ESSAY: 'Words' }, begun.state, item);

      // Unknown, so the attempt ends, without claiming the response is correct
      expect(result.state.completionStatus).toBe('completed');
      expect(evaluationOf(result.template, 'CHOICE')).toBe('correct');
      expect(itemVerdictOf(result.template)).toBeNull();
    });

    test('ignores the responses of interactions this variant hides', async () => {
      const item = noScoreItem(
        `<qti-template-block template-identifier="HARD" show-hide="show">
          <p><qti-text-entry-interaction response-identifier="EXTRA"/></p>
        </qti-template-block>`,
        `<qti-response-declaration identifier="EXTRA" cardinality="single" base-type="string">
          <qti-correct-response><qti-value>x</qti-value></qti-correct-response>
        </qti-response-declaration>`
      );
      const begun = await begin(item, { maxTries: 2, showEvaluation: 'correctness' });
      const result = await submitResponse({ CHOICE: 'A' }, begun.state, item);

      expect(result.state.completionStatus).toBe('completed');
      expect(itemVerdictOf(result.template)).toBe('correct');
    });
  });

  describe('manual scoring', () => {
    test('ends the attempt on the first try, and resubmissions edit it', async () => {
      const begun = await begin(essayItem, { maxTries: 3 });
      const submitted = await submitResponse({ ESSAY: 'Draft' }, begun.state, essayItem);

      expect(submitted.tryConsumed).toBe(true);
      expect(submitted.state.pendingManualScoring).toBeDefined();
      expect(submitted.state.triesRemaining).toBe(0);

      const edited = await submitResponse({ ESSAY: 'Final' }, submitted.state, essayItem);
      expect(edited.tryConsumed).toBe(false);
      expect(edited.state.triesRemaining).toBe(0);
    });
  });

  describe('\'smart\'', () => {
    test('resolves when the attempt begins', async () => {
      const { state } = await begin(choiceItem, { maxTries: 'smart' });
      expect(state.options.maxTries).toBe('smart');
      expect(state.triesRemaining).toBe(2);
    });

    test.each([
      [2, 1],
      [3, 1],
      [4, 2],
      [5, 2],
      [6, 3],
    ])('allows a choice interaction with %i choices %i tries', (count, tries) => {
      const item = itemWithBody(`<qti-choice-interaction response-identifier="R">${choices(count)}</qti-choice-interaction>`);
      expect(deriveSmartMaxTries(parser.parseFromString(item, 'text/xml'), {})).toBe(tries);
    });

    test('takes the fewest any interaction allows', () => {
      const item = itemWithBody(`
        <qti-choice-interaction response-identifier="R1">${choices(6)}</qti-choice-interaction>
        <p><qti-inline-choice-interaction response-identifier="R2">
          <qti-inline-choice identifier="a">a</qti-inline-choice><qti-inline-choice identifier="b">b</qti-inline-choice>
          <qti-inline-choice identifier="c">c</qti-inline-choice><qti-inline-choice identifier="d">d</qti-inline-choice>
        </qti-inline-choice-interaction></p>`);
      expect(deriveSmartMaxTries(parser.parseFromString(item, 'text/xml'), {})).toBe(2);
    });

    test('counts the target set of a match interaction, and the choices of a gap match', () => {
      const match = itemWithBody(`
        <qti-match-interaction response-identifier="R">
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="S1" match-max="1">1</qti-simple-associable-choice>
            <qti-simple-associable-choice identifier="S2" match-max="1">2</qti-simple-associable-choice>
          </qti-simple-match-set>
          <qti-simple-match-set>
            ${['T1', 'T2', 'T3', 'T4', 'T5', 'T6'].map((id) => `<qti-simple-associable-choice identifier="${id}" match-max="1">${id}</qti-simple-associable-choice>`).join('')}
          </qti-simple-match-set>
        </qti-match-interaction>`);
      expect(deriveSmartMaxTries(parser.parseFromString(match, 'text/xml'), {})).toBe(3);

      const gapMatch = itemWithBody(`
        <qti-gap-match-interaction response-identifier="R">
          ${['W1', 'W2', 'W3', 'W4'].map((id) => `<qti-gap-text identifier="${id}" match-max="1">${id}</qti-gap-text>`).join('')}
          <p>A <qti-gap identifier="G1"/> and <qti-gap identifier="G2"/></p>
        </qti-gap-match-interaction>`);
      expect(deriveSmartMaxTries(parser.parseFromString(gapMatch, 'text/xml'), {})).toBe(2);
    });

    test('counts only the choices and interactions this variant shows', () => {
      const conditional = (id: string, showHide: string) =>
        `<qti-simple-choice identifier="${id}" template-identifier="${id}" show-hide="${showHide}">${id}</qti-simple-choice>`;
      const item = itemWithBody(`
        <qti-choice-interaction response-identifier="R1">
          ${choices(2)}${conditional('X1', 'show')}${conditional('X2', 'show')}${conditional('X3', 'hide')}${conditional('X4', 'hide')}
        </qti-choice-interaction>
        <qti-template-block template-identifier="HARD" show-hide="show">
          <qti-choice-interaction response-identifier="R2">${choices(2)}</qti-choice-interaction>
        </qti-template-block>`);
      const doc = parser.parseFromString(item, 'text/xml');

      // The plain choices, X3 and X4 show: 4 choices, 2 tries; the block is hidden
      expect(deriveSmartMaxTries(doc, {})).toBe(2);
      // All six show: 3 tries
      expect(deriveSmartMaxTries(doc, { SHOWN: ['X1', 'X2'] })).toBe(3);
      // Only the plain choices show: 1 try
      expect(deriveSmartMaxTries(doc, { HIDDEN: ['X3', 'X4'] })).toBe(1);
      // The block's two-choice interaction shows too, and limits the item: 1 try
      expect(deriveSmartMaxTries(doc, { SHOWN: ['X1', 'X2', 'HARD'] })).toBe(1);
    });

    test('ignores text entries', () => {
      const item = itemWithBody(`
        <qti-choice-interaction response-identifier="R1">${choices(6)}</qti-choice-interaction>
        <p><qti-text-entry-interaction response-identifier="R2"/></p>`);
      expect(deriveSmartMaxTries(parser.parseFromString(item, 'text/xml'), {})).toBe(3);
    });

    test.each([
      ['only text entries', itemWithBody('<p><qti-text-entry-interaction response-identifier="R"/></p>')],
      ['no interactions', itemWithBody('<p>Read this</p>')],
      [
        'an extended text',
        itemWithBody(`
          <qti-choice-interaction response-identifier="R1">${choices(6)}</qti-choice-interaction>
          <qti-extended-text-interaction response-identifier="R2"/>`),
      ],
      [
        'external machine scoring',
        itemWithBody(
          `<qti-choice-interaction response-identifier="R">${choices(6)}</qti-choice-interaction>`,
          '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" external-scored="externalMachine"/>'
        ),
      ],
      [
        'external scoring',
        itemWithBody(
          `<qti-choice-interaction response-identifier="R">${choices(6)}</qti-choice-interaction>`,
          '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" external-scored="human"/>'
        ),
      ],
    ])('allows one try for an item with %s', (_, item) => {
      expect(deriveSmartMaxTries(parser.parseFromString(item, 'text/xml'), {})).toBe(1);
    });
  });
});
