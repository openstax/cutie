/* spell-checker: ignore Paris */
import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, test } from 'vitest';
import {
  type AttemptResult,
  beginAttempt,
  type DeliveryOptions,
  resumeAttempt,
  setScore,
  submitResponse,
} from './index';

const parser = new DOMParser();

function parseTemplate(template: string): Document {
  return parser.parseFromString(template, 'text/xml');
}

function feedbackIdentifiers(template: string): string[] {
  const doc = parseTemplate(template);
  return ['qti-feedback-block', 'qti-feedback-inline', 'qti-modal-feedback'].flatMap((tagName) =>
    Array.from(doc.getElementsByTagName(tagName)).map((el) => el.getAttribute('identifier') ?? '')
  );
}

function evaluationOf(template: string, responseIdentifier: string): string | null {
  const doc = parseTemplate(template);
  const interaction = Array.from(doc.getElementsByTagName('*')).find(
    (el) => el.getAttribute('response-identifier') === responseIdentifier
  );
  return interaction?.hasAttribute('data-evaluation')
    ? interaction.getAttribute('data-evaluation')
    : null;
}

function correctResponseOf(template: string, responseIdentifier: string): string[] | null {
  const doc = parseTemplate(template);
  const declaration = Array.from(doc.getElementsByTagName('qti-response-declaration')).find(
    (el) => el.getAttribute('identifier') === responseIdentifier
  );
  const correct = declaration?.getElementsByTagName('qti-correct-response')[0];
  if (!correct) return null;
  return Array.from(correct.getElementsByTagName('qti-value')).map((el) => el.textContent ?? '');
}

function choiceOrder(template: string): string[] {
  const doc = parseTemplate(template);
  return Array.from(doc.getElementsByTagName('qti-simple-choice')).map(
    (el) => el.getAttribute('identifier') ?? ''
  );
}

/**
 * Single-turn choice item: RIGHT or WRONG feedback once submitted.
 */
const feedbackChoiceItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="feedback-choice" title="Feedback Choice" adaptive="false" time-dependent="false">
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
      <qti-simple-choice identifier="C">Also wrong</qti-simple-choice>
    </qti-choice-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="INTRO" show-hide="hide"><p>Pick one</p></qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RIGHT" show-hide="show"><p>Well done</p></qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="WRONG" show-hide="show"><p>Not quite</p></qti-feedback-block>
  </qti-item-body>
  <qti-response-processing>
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
 * Adaptive item: a wrong answer shows a HINT and keeps the attempt open; the
 * right answer completes it with RIGHT feedback.
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
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">HINT</qti-base-value></qti-set-outcome-value>
        <qti-set-outcome-value identifier="completionStatus"><qti-base-value base-type="identifier">incomplete</qti-base-value></qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

/**
 * Multiple-response item scored by mapping, for partial credit.
 */
const mappedMultipleItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="mapped-multiple" title="Mapped Multiple" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value><qti-value>B</qti-value></qti-correct-response>
    <qti-mapping lower-bound="0" default-value="0">
      <qti-map-entry map-key="A" mapped-value="1"/>
      <qti-map-entry map-key="B" mapped-value="1"/>
      <qti-map-entry map-key="C" mapped-value="-1"/>
    </qti-mapping>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="3">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
      <qti-simple-choice identifier="C">C</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml"/>
</qti-assessment-item>`;

/**
 * Two text entries, each with its own declaration, scored together by custom
 * response processing. CITY is mapped case-insensitively; its correct
 * response is a single spelling.
 */
const multiInteractionItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="multi" title="Multi" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="CITY" cardinality="single" base-type="string">
    <qti-correct-response><qti-value>Paris</qti-value></qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="Paris" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>
  <qti-response-declaration identifier="COUNT" cardinality="single" base-type="integer">
    <qti-correct-response><qti-value>4</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="NOTES" cardinality="single" base-type="string"/>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>2</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>
    <p>Capital: <qti-text-entry-interaction response-identifier="CITY"/></p>
    <p>Count: <qti-text-entry-interaction response-identifier="COUNT"/></p>
    <p>Notes: <qti-text-entry-interaction response-identifier="NOTES"/></p>
  </qti-item-body>
  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum>
        <qti-map-response identifier="CITY"/>
        <qti-base-value base-type="float">0</qti-base-value>
      </qti-sum>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

/**
 * The correct response is chosen per attempt by template processing.
 */
const templatedCorrectItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="templated" title="Templated" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-template-declaration identifier="ANSWER" cardinality="single" base-type="identifier"/>
  <qti-template-processing>
    <qti-set-template-value identifier="ANSWER"><qti-base-value base-type="identifier">B</qti-base-value></qti-set-template-value>
    <qti-set-correct-response identifier="RESPONSE"><qti-variable identifier="ANSWER"/></qti-set-correct-response>
  </qti-template-processing>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

/**
 * Human-scored essay alongside an auto-scored choice.
 */
const externalScoredItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="essay" title="Essay" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="CHOICE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="ESSAY" cardinality="single" base-type="string"/>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"
                           external-scored="human" normal-maximum="5.0"/>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="CHOICE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
    <qti-extended-text-interaction response-identifier="ESSAY"/>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="SUBMITTED" show-hide="show"><p>Thanks</p></qti-feedback-block>
  </qti-item-body>
  <qti-response-processing>
    <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">SUBMITTED</qti-base-value></qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

/**
 * Item with every combination of shuffle attribute.
 */
function shuffleItem(): string {
  const choices = Array.from({ length: 12 }, (_, i) =>
    `<qti-simple-choice identifier="C${i}">${i}</qti-simple-choice>`
  ).join('');
  const interaction = (id: string, shuffle: string) =>
    `<qti-choice-interaction response-identifier="${id}" max-choices="1" ${shuffle}>${choices}</qti-choice-interaction>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="shuffle" title="Shuffle" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="ABSENT" cardinality="single" base-type="identifier"/>
  <qti-response-declaration identifier="TRUE" cardinality="single" base-type="identifier"/>
  <qti-response-declaration identifier="FALSE" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    ${interaction('ABSENT', '')}
    ${interaction('TRUE', 'shuffle="true"')}
    ${interaction('FALSE', 'shuffle="false"')}
  </qti-item-body>
</qti-assessment-item>`;
}

async function expectResumable(result: AttemptResult, itemXml: string): Promise<void> {
  const resumed = await resumeAttempt(structuredClone(result.state), itemXml);
  expect(resumed.template).toBe(result.template);
  expect(resumed.state).toEqual(result.state);
  expect(resumed.hasNewFeedback).toBe(false);
}

describe('delivery options', () => {
  describe('state.options', () => {
    test('records QTI-aligned defaults when no options are given', async () => {
      const { state } = await beginAttempt(feedbackChoiceItem);
      expect(state.options).toEqual({
        showFeedback: true,
        showEvaluation: 'none',
        shuffleOverride: 'none',
      });
    });

    test('records the options given, filling the rest with defaults', async () => {
      const { state } = await beginAttempt(feedbackChoiceItem, undefined, {
        showEvaluation: 'correctness',
      });
      expect(state.options).toEqual({
        showFeedback: true,
        showEvaluation: 'correctness',
        shuffleOverride: 'none',
      });
    });

    test('carries the options through submitResponse and setScore', async () => {
      const options: DeliveryOptions = {
        showFeedback: false,
        showEvaluation: 'correctResponse',
        shuffleOverride: 'never',
      };
      const begun = await beginAttempt(externalScoredItem, undefined, options);
      const submitted = await submitResponse({ CHOICE: 'A', ESSAY: 'Text' }, begun.state, externalScoredItem);
      const scored = await setScore(5, 'Good', submitted.state, externalScoredItem);

      expect(submitted.state.options).toEqual(options);
      expect(scored.state.options).toEqual(options);
    });

    test('never changes scoring or the lifecycle', async () => {
      const variants: DeliveryOptions[] = [
        {},
        { showFeedback: false, showEvaluation: 'none' },
        { showFeedback: false, showEvaluation: 'correctness' },
        { showFeedback: true, showEvaluation: 'correctResponse' },
      ];

      const results = await Promise.all(variants.map(async (options) => {
        const begun = await beginAttempt(mappedMultipleItem, undefined, options);
        return submitResponse({ RESPONSE: ['A', 'C'] }, begun.state, mappedMultipleItem);
      }));

      for (const { state } of results) {
        expect(state.score).toEqual(results[0].state.score);
        expect(state.completionStatus).toEqual(results[0].state.completionStatus);
        expect(state.variables).toEqual(results[0].state.variables);
      }
    });
  });

  describe('shuffleOverride', () => {
    const orderedIds = Array.from({ length: 12 }, (_, i) => `C${i}`);

    async function shuffledKeys(options: DeliveryOptions): Promise<string[]> {
      const { state } = await beginAttempt(shuffleItem(), undefined, options);
      return Object.keys(state.shuffleOrders ?? {}).sort();
    }

    test('\'none\' follows the item: only shuffle="true" is shuffled', async () => {
      expect(await shuffledKeys({ shuffleOverride: 'none' })).toEqual(['TRUE']);
    });

    test('\'shuffle\' shuffles everything except shuffle="false"', async () => {
      expect(await shuffledKeys({ shuffleOverride: 'shuffle' })).toEqual(['ABSENT', 'TRUE']);
    });

    test('\'never\' shuffles nothing', async () => {
      expect(await shuffledKeys({ shuffleOverride: 'never' })).toEqual([]);
      const { template } = await beginAttempt(shuffleItem(), undefined, { shuffleOverride: 'never' });
      expect(choiceOrder(template)).toEqual([...orderedIds, ...orderedIds, ...orderedIds]);
    });

    test('keeps the order the attempt began with on later turns', async () => {
      const begun = await beginAttempt(shuffleItem(), undefined, { shuffleOverride: 'shuffle' });
      const submitted = await submitResponse({ ABSENT: 'C1', TRUE: 'C2', FALSE: 'C3' }, begun.state, shuffleItem());
      expect(choiceOrder(submitted.template)).toEqual(choiceOrder(begun.template));
      expect(submitted.state.shuffleOrders).toEqual(begun.state.shuffleOrders);
    });
  });

  describe('showFeedback', () => {
    test('true shows feedback as the item decides', async () => {
      const begun = await beginAttempt(feedbackChoiceItem);
      const result = await submitResponse({ RESPONSE: 'B' }, begun.state, feedbackChoiceItem);
      expect(feedbackIdentifiers(result.template)).toEqual(['INTRO', 'WRONG']);
      expect(result.state.withheldFeedback).toBeUndefined();
    });

    test('false withholds feedback that appears when the attempt becomes terminal', async () => {
      const begun = await beginAttempt(feedbackChoiceItem, undefined, { showFeedback: false });
      expect(feedbackIdentifiers(begun.template)).toEqual(['INTRO']);

      const result = await submitResponse({ RESPONSE: 'B' }, begun.state, feedbackChoiceItem);
      // INTRO was visible before the terminal turn, so it stays
      expect(feedbackIdentifiers(result.template)).toEqual(['INTRO']);
      expect(result.state.withheldFeedback).toEqual([
        { tagName: 'qti-feedback-block', outcomeIdentifier: 'FEEDBACK', identifier: 'WRONG' },
      ]);
      expect(result.hasNewFeedback).toBe(false);
    });

    test('false keeps feedback shown on earlier turns of an adaptive item', async () => {
      const begun = await beginAttempt(adaptiveItem, undefined, { showFeedback: false });

      const first = await submitResponse({ RESPONSE: 'B' }, begun.state, adaptiveItem);
      expect(first.state.completionStatus).toBe('incomplete');
      expect(feedbackIdentifiers(first.template)).toEqual(['HINT']);
      expect(first.hasNewFeedback).toBe(true);

      const second = await submitResponse({ RESPONSE: 'A' }, first.state, adaptiveItem);
      expect(second.state.completionStatus).toBe('completed');
      expect(feedbackIdentifiers(second.template)).toEqual([]);
      expect(second.state.withheldFeedback).toEqual([
        { tagName: 'qti-feedback-block', outcomeIdentifier: 'FEEDBACK', identifier: 'RIGHT' },
      ]);
    });

    test('false withholds the final submission\'s feedback while manual scoring is pending', async () => {
      const begun = await beginAttempt(externalScoredItem, undefined, { showFeedback: false });
      const submitted = await submitResponse({ CHOICE: 'A', ESSAY: 'Text' }, begun.state, externalScoredItem);

      expect(submitted.state.pendingManualScoring).toBeDefined();
      expect(feedbackIdentifiers(submitted.template)).toEqual([]);
      expect(submitted.state.withheldFeedback).toEqual([
        { tagName: 'qti-feedback-block', outcomeIdentifier: 'FEEDBACK', identifier: 'SUBMITTED' },
      ]);
      expect(submitted.hasNewFeedback).toBe(false);

      // Withheld feedback stays withheld once the score is set
      const scored = await setScore(5, 'Good', submitted.state, externalScoredItem);
      expect(feedbackIdentifiers(scored.template)).toEqual([]);
      expect(scored.state.withheldFeedback).toEqual(submitted.state.withheldFeedback);
    });

    test('true shows feedback while manual scoring is pending', async () => {
      const begun = await beginAttempt(externalScoredItem);
      const submitted = await submitResponse({ CHOICE: 'A', ESSAY: 'Text' }, begun.state, externalScoredItem);

      expect(feedbackIdentifiers(submitted.template)).toEqual(['SUBMITTED']);
      expect(submitted.hasNewFeedback).toBe(true);
    });
  });

  describe('showEvaluation', () => {
    test('\'none\' adds no evaluation', async () => {
      const begun = await beginAttempt(feedbackChoiceItem);
      const result = await submitResponse({ RESPONSE: 'B' }, begun.state, feedbackChoiceItem);
      expect(evaluationOf(result.template, 'RESPONSE')).toBeNull();
      expect(correctResponseOf(result.template, 'RESPONSE')).toBeNull();
    });

    test('\'correctness\' marks each interaction without revealing the correct response', async () => {
      const begun = await beginAttempt(feedbackChoiceItem, undefined, { showEvaluation: 'correctness' });
      expect(evaluationOf(begun.template, 'RESPONSE')).toBeNull();

      const wrong = await submitResponse({ RESPONSE: 'B' }, begun.state, feedbackChoiceItem);
      expect(evaluationOf(wrong.template, 'RESPONSE')).toBe('incorrect');
      expect(correctResponseOf(wrong.template, 'RESPONSE')).toBeNull();

      const right = await submitResponse({ RESPONSE: 'A' }, begun.state, feedbackChoiceItem);
      expect(evaluationOf(right.template, 'RESPONSE')).toBe('correct');
    });

    test('\'correctResponse\' adds the correct response alongside the verdict', async () => {
      const begun = await beginAttempt(feedbackChoiceItem, undefined, { showEvaluation: 'correctResponse' });
      expect(correctResponseOf(begun.template, 'RESPONSE')).toBeNull();

      const result = await submitResponse({ RESPONSE: 'B' }, begun.state, feedbackChoiceItem);
      expect(evaluationOf(result.template, 'RESPONSE')).toBe('incorrect');
      expect(correctResponseOf(result.template, 'RESPONSE')).toEqual(['A']);
    });

    test('shows nothing until an adaptive attempt is terminal', async () => {
      const begun = await beginAttempt(adaptiveItem, undefined, { showEvaluation: 'correctResponse' });

      const first = await submitResponse({ RESPONSE: 'B' }, begun.state, adaptiveItem);
      expect(evaluationOf(first.template, 'RESPONSE')).toBeNull();
      expect(correctResponseOf(first.template, 'RESPONSE')).toBeNull();

      const second = await submitResponse({ RESPONSE: 'A' }, first.state, adaptiveItem);
      expect(evaluationOf(second.template, 'RESPONSE')).toBe('correct');
      expect(correctResponseOf(second.template, 'RESPONSE')).toEqual(['A']);
    });

    test('judges mapped responses as correct, partial or incorrect', async () => {
      const begun = await beginAttempt(mappedMultipleItem, undefined, { showEvaluation: 'correctResponse' });

      const cases: Array<[string[], string]> = [
        [['A', 'B'], 'correct'],
        [['A'], 'partial'],
        [['A', 'B', 'C'], 'partial'],
        [['C'], 'incorrect'],
        [[], 'incorrect'],
      ];
      for (const [response, expected] of cases) {
        const result = await submitResponse({ RESPONSE: response }, begun.state, mappedMultipleItem);
        expect(evaluationOf(result.template, 'RESPONSE')).toBe(expected);
      }

      const result = await submitResponse({ RESPONSE: ['A'] }, begun.state, mappedMultipleItem);
      const doc = parseTemplate(result.template);
      expect(doc.getElementsByTagName('qti-mapping').length).toBe(0);
    });

    test('judges area-mapped responses against the capped maximum', async () => {
      const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="points">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="point">
    <qti-area-mapping upper-bound="4">
      <qti-area-map-entry shape="circle" coords="100,100,30" mapped-value="2"/>
      <qti-area-map-entry shape="circle" coords="200,200,30" mapped-value="3"/>
    </qti-area-mapping>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <qti-select-point-interaction response-identifier="RESPONSE" max-choices="0">
      <object data="image.png" type="image/png"/>
    </qti-select-point-interaction>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response_point.xml"/>
</qti-assessment-item>`;
      const begun = await beginAttempt(itemXml, undefined, { showEvaluation: 'correctness' });

      const both = await submitResponse({ RESPONSE: ['100 100', '200 200'] }, begun.state, itemXml);
      expect(both.state.score?.max).toBe(4);
      expect(evaluationOf(both.template, 'RESPONSE')).toBe('correct');

      const one = await submitResponse({ RESPONSE: ['200 200', '205 195'] }, begun.state, itemXml);
      expect(evaluationOf(one.template, 'RESPONSE')).toBe('partial');
    });

    test('judges each interaction by its own declaration, as response processing compares', async () => {
      const begun = await beginAttempt(multiInteractionItem, undefined, { showEvaluation: 'correctResponse' });
      const result = await submitResponse({ CITY: 'paris', COUNT: '5', NOTES: 'x' }, begun.state, multiInteractionItem);

      // The mapping is case-insensitive, and takes precedence over the correct response
      expect(evaluationOf(result.template, 'CITY')).toBe('correct');
      // Submitted as a string, compared as the declared integer
      expect(evaluationOf(result.template, 'COUNT')).toBe('incorrect');
      // Neither a mapping nor a correct response: no verdict, no correct response
      expect(evaluationOf(result.template, 'NOTES')).toBeNull();
      expect(correctResponseOf(result.template, 'NOTES')).toBeNull();

      expect(correctResponseOf(result.template, 'CITY')).toEqual(['Paris']);
      expect(correctResponseOf(result.template, 'COUNT')).toEqual(['4']);
    });

    test('uses this attempt\'s correct response when template processing sets it', async () => {
      const begun = await beginAttempt(templatedCorrectItem, undefined, { showEvaluation: 'correctResponse' });
      const result = await submitResponse({ RESPONSE: 'B' }, begun.state, templatedCorrectItem);

      expect(evaluationOf(result.template, 'RESPONSE')).toBe('correct');
      expect(correctResponseOf(result.template, 'RESPONSE')).toEqual(['B']);
    });

    test('shows nothing while manual scoring is pending', async () => {
      const begun = await beginAttempt(externalScoredItem, undefined, { showEvaluation: 'correctResponse' });
      const submitted = await submitResponse({ CHOICE: 'A', ESSAY: 'Text' }, begun.state, externalScoredItem);
      expect(evaluationOf(submitted.template, 'CHOICE')).toBeNull();
      expect(correctResponseOf(submitted.template, 'CHOICE')).toBeNull();

      const scored = await setScore(5, 'Good', submitted.state, externalScoredItem);
      expect(evaluationOf(scored.template, 'CHOICE')).toBe('correct');
      expect(correctResponseOf(scored.template, 'CHOICE')).toEqual(['A']);
      expect(evaluationOf(scored.template, 'ESSAY')).toBeNull();
    });
  });

  describe('hasNewFeedback', () => {
    test('is false when an attempt begins, even with feedback visible', async () => {
      const begun = await beginAttempt(feedbackChoiceItem);
      expect(feedbackIdentifiers(begun.template)).toEqual(['INTRO']);
      expect(begun.hasNewFeedback).toBe(false);
    });

    test('is true when a feedback element appears', async () => {
      const begun = await beginAttempt(feedbackChoiceItem);
      const result = await submitResponse({ RESPONSE: 'B' }, begun.state, feedbackChoiceItem);
      expect(result.hasNewFeedback).toBe(true);
    });

    test('is false when the same feedback stays visible', async () => {
      const begun = await beginAttempt(feedbackChoiceItem);
      const first = await submitResponse({ RESPONSE: 'B' }, begun.state, feedbackChoiceItem);
      const second = await submitResponse({ RESPONSE: 'C' }, first.state, feedbackChoiceItem);
      expect(second.hasNewFeedback).toBe(false);
    });

    test('is true when only a verdict appears', async () => {
      const begun = await beginAttempt(mappedMultipleItem, undefined, { showEvaluation: 'correctness' });
      const result = await submitResponse({ RESPONSE: ['A'] }, begun.state, mappedMultipleItem);
      expect(feedbackIdentifiers(result.template)).toEqual([]);
      expect(result.hasNewFeedback).toBe(true);
    });

    test('is false when nothing new is shown', async () => {
      const begun = await beginAttempt(mappedMultipleItem);
      const result = await submitResponse({ RESPONSE: ['A'] }, begun.state, mappedMultipleItem);
      expect(result.hasNewFeedback).toBe(false);
    });
  });

  describe('resumeAttempt', () => {
    const optionSets: DeliveryOptions[] = [
      {},
      { showFeedback: false, showEvaluation: 'correctness', shuffleOverride: 'shuffle' },
      { showFeedback: true, showEvaluation: 'correctResponse', shuffleOverride: 'shuffle' },
    ];

    test.each(optionSets)('reproduces every result of an adaptive attempt (%o)', async (options) => {
      const begun = await beginAttempt(adaptiveItem, undefined, options);
      await expectResumable(begun, adaptiveItem);

      const first = await submitResponse({ RESPONSE: 'B' }, begun.state, adaptiveItem);
      await expectResumable(first, adaptiveItem);

      const second = await submitResponse({ RESPONSE: 'A' }, first.state, adaptiveItem);
      await expectResumable(second, adaptiveItem);
    });

    test.each(optionSets)('reproduces a shuffled attempt (%o)', async (options) => {
      const begun = await beginAttempt(shuffleItem(), undefined, options);
      await expectResumable(begun, shuffleItem());
    });

    test.each(optionSets)('reproduces an externally scored attempt (%o)', async (options) => {
      const begun = await beginAttempt(externalScoredItem, undefined, options);
      const submitted = await submitResponse({ CHOICE: 'B', ESSAY: 'Text' }, begun.state, externalScoredItem);
      await expectResumable(submitted, externalScoredItem);

      const scored = await setScore(5, 'Good', submitted.state, externalScoredItem);
      await expectResumable(scored, externalScoredItem);
    });

    test('resolves assets the same way', async () => {
      const itemXml = feedbackChoiceItem.replace('<p>Well done</p>', '<p><img src="a.png" alt=""/></p>');
      const processing = { resolveAssets: async (urls: string[]) => urls.map((url) => `https://cdn/${url}`) };

      const begun = await beginAttempt(itemXml, processing);
      const result = await submitResponse({ RESPONSE: 'A' }, begun.state, itemXml, processing);
      const resumed = await resumeAttempt(result.state, itemXml, processing);

      expect(result.template).toContain('https://cdn/a.png');
      expect(resumed.template).toBe(result.template);
    });
  });
});
