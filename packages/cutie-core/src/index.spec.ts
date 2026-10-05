import { describe, expect, test } from 'vitest';
import { resolveDeliveryOptions } from './lib/deliveryOptions';
import type { AttemptState } from './types';
import {
  beginAttempt,
  listItemDependencies,
  renderPreview,
  ResponseValidationError,
  setScore,
  submitResponse,
} from './index';

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
  options: resolveDeliveryOptions(),
  triesAllowed: 1,
  triesUsed: 0,
  triesRemaining: 1,
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

describe('submitResponse - response validation', () => {
  const minChoicesItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="multi" title="Multi" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>A</qti-value>
      <qti-value>B</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="3" min-choices="2">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
      <qti-simple-choice identifier="C">C</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="https://example.com/match_correct.xml"/>
</qti-assessment-item>`;

  test('throws ResponseValidationError when min-choices violated', async () => {
    await expect(
      submitResponse({ RESPONSE: ['A'] }, baseState, minChoicesItem)
    ).rejects.toThrow(ResponseValidationError);
  });

  test('passes validation when min-choices satisfied', async () => {
    const result = await submitResponse(
      { RESPONSE: ['A', 'B'] },
      baseState,
      minChoicesItem,
    );
    expect(result.state).toBeDefined();
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

const assetItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="assets" title="Assets" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>A</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <object type="image/png" data="images/map.png">Map</object>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">
        <img src="images/visible.png" alt="Visible"/>
      </qti-simple-choice>
      <qti-simple-choice identifier="B" template-identifier="NEVER" show-hide="show">
        <img src="images/conditional.png" alt="Conditional"/>
      </qti-simple-choice>
    </qti-choice-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="CORRECT" show-hide="show">
      <img src="images/correct.png" alt="Correct"/>
    </qti-feedback-block>
  </qti-item-body>
  <qti-response-processing/>
</qti-assessment-item>`;

describe('listItemDependencies assets', () => {
  test('lists src and data references from the raw definition', () => {
    expect(listItemDependencies(assetItem).assets).toEqual([
      'images/map.png',
      'images/visible.png',
      'images/conditional.png',
      'images/correct.png',
    ]);
  });

  test('includes assets the rendered template withholds', async () => {
    const { template } = await beginAttempt(assetItem);

    // Hidden behind an unmatched conditional and undisplayed feedback
    expect(template).not.toContain('images/conditional.png');
    expect(template).not.toContain('images/correct.png');

    expect(listItemDependencies(assetItem).assets).toContain('images/conditional.png');
    expect(listItemDependencies(assetItem).assets).toContain('images/correct.png');
  });

  test('returns unresolved URLs, ignoring any asset resolver', () => {
    expect(listItemDependencies(assetItem).assets[0]).toBe('images/map.png');
  });

  test('collapses repeated references to a single entry', () => {
    const repeated = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="repeat" title="Repeat" adaptive="false" time-dependent="false">
  <qti-item-body>
    <img src="images/same.png" alt="One"/>
    <img src="images/same.png" alt="Two"/>
  </qti-item-body>
</qti-assessment-item>`;

    expect(listItemDependencies(repeated).assets).toEqual(['images/same.png']);
  });

  test('returns an empty array for an item with no assets', () => {
    expect(listItemDependencies(externalScoredItem).assets).toEqual([]);
  });
});

describe('pair values from base values', () => {
  const pairItem = (templateProcessing: string, condition: string) => `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="pairs" title="Pairs" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair"/>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>
    <qti-match-interaction response-identifier="RESPONSE" max-associations="2">
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="S1" match-max="1">a</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="S2" match-max="1">b</qti-simple-associable-choice>
      </qti-simple-match-set>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="T1" match-max="1">x</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="T2" match-max="1">y</qti-simple-associable-choice>
      </qti-simple-match-set>
    </qti-match-interaction>
  </qti-item-body>
  ${templateProcessing}
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        ${condition}
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

  const pairs = `
    <qti-multiple>
      <qti-base-value base-type="directedPair">S1 T2</qti-base-value>
      <qti-base-value base-type="directedPair">S2 T1</qti-base-value>
    </qti-multiple>`;
  const templatedCorrect = `
  <qti-template-processing>
    <qti-set-correct-response identifier="RESPONSE">${pairs}</qti-set-correct-response>
  </qti-template-processing>`;
  const matchCorrect =
    '<qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>';

  async function scoreOf(itemXml: string): Promise<unknown> {
    const { state } = await beginAttempt(itemXml);
    const result = await submitResponse({ RESPONSE: ['S2 T1', 'S1 T2'] }, state, itemXml);
    return result.state.variables.SCORE;
  }

  test('matches a response against a correct response set by template processing', async () => {
    expect(await scoreOf(pairItem(templatedCorrect, matchCorrect))).toBe(1);
  });

  test('matches a response against a container of pair literals', async () => {
    const condition = `<qti-match><qti-variable identifier="RESPONSE"/>${pairs}</qti-match>`;
    expect(await scoreOf(pairItem('', condition))).toBe(1);
  });

  test('finds a pair literal in a response', async () => {
    const condition = `
      <qti-member>
        <qti-base-value base-type="directedPair">S1 T2</qti-base-value>
        <qti-variable identifier="RESPONSE"/>
      </qti-member>`;
    expect(await scoreOf(pairItem('', condition))).toBe(1);
  });

  test('shows a templated correct response as one value per pair', async () => {
    const itemXml = pairItem(templatedCorrect, matchCorrect);
    const { state } = await beginAttempt(itemXml, undefined, { showEvaluation: 'correctResponse' });
    const { template } = await submitResponse({ RESPONSE: ['S1 T1'] }, state, itemXml);
    expect(template).toContain(
      '<qti-correct-response><qti-value>S1 T2</qti-value><qti-value>S2 T1</qti-value></qti-correct-response>'
    );
  });
});

describe('undirected pairs', () => {
  const pairItem = (declaration: string, processing: string) => `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="pairs" title="Pairs" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="pair">
    ${declaration}
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>
    <qti-associate-interaction response-identifier="RESPONSE" max-associations="2">
      <qti-simple-associable-choice identifier="A" match-max="1">a</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="B" match-max="1">b</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="C" match-max="1">c</qti-simple-associable-choice>
      <qti-simple-associable-choice identifier="D" match-max="1">d</qti-simple-associable-choice>
    </qti-associate-interaction>
  </qti-item-body>
  ${processing}
</qti-assessment-item>`;

  // Each pair is given in the opposite order to the item's own values
  async function scoreOf(itemXml: string): Promise<unknown> {
    const { state } = await beginAttempt(itemXml);
    const result = await submitResponse({ RESPONSE: ['B A', 'D C'] }, state, itemXml);
    return result.state.variables.SCORE;
  }

  test('matches the correct response in either order', async () => {
    const itemXml = pairItem(
      '<qti-correct-response><qti-value>A B</qti-value><qti-value>C D</qti-value></qti-correct-response>',
      '<qti-response-processing template="https://example.com/match_correct.xml"/>'
    );
    expect(await scoreOf(itemXml)).toBe(1);
  });

  test('maps a pair in either order', async () => {
    const itemXml = pairItem(
      `<qti-mapping default-value="0">
        <qti-map-entry map-key="A B" mapped-value="1"/>
        <qti-map-entry map-key="C D" mapped-value="2"/>
      </qti-mapping>`,
      '<qti-response-processing template="https://example.com/map_response.xml"/>'
    );
    expect(await scoreOf(itemXml)).toBe(3);
  });

  test('finds a pair literal in either order', async () => {
    const itemXml = pairItem('', `
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="pair">A B</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>`);
    expect(await scoreOf(itemXml)).toBe(1);
  });

  test('keeps the order of a directed pair', async () => {
    const itemXml = pairItem('', '').replace('base-type="pair"', 'base-type="directedPair"');
    const { state } = await beginAttempt(itemXml);
    const result = await submitResponse({ RESPONSE: ['B A'] }, state, itemXml);
    expect(result.state.variables.RESPONSE).toEqual(['B A']);
  });
});

const previewItem = (adaptive: boolean) => `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="preview" title="Preview" adaptive="${adaptive}" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>A</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="A" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>
  <qti-template-declaration identifier="NAME" cardinality="single" base-type="string"/>
  <qti-template-processing>
    <qti-set-template-value identifier="NAME">
      <qti-base-value base-type="string">Ada</qti-base-value>
    </qti-set-template-value>
  </qti-template-processing>
  <qti-item-body>
    <p>Hello <qti-printed-variable identifier="NAME"/>, you scored <qti-printed-variable identifier="SCORE"/>.</p>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="true" max-choices="1">
      <qti-simple-choice identifier="A">Right<qti-feedback-inline outcome-identifier="FEEDBACK" identifier="A" show-hide="show">Choice A feedback</qti-feedback-inline></qti-simple-choice>
      <qti-simple-choice identifier="B">Wrong</qti-simple-choice>
      <qti-simple-choice identifier="C">Also wrong</qti-simple-choice>
      <qti-simple-choice identifier="D">Still wrong</qti-simple-choice>
    </qti-choice-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="DONE" show-hide="show"><p>Detailed feedback</p></qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="DONE" show-hide="hide"><p>Before submission</p></qti-feedback-block>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
  <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="DONE" show-hide="show">Modal feedback</qti-modal-feedback>
</qti-assessment-item>`;

describe('renderPreview', () => {
  test('shows every feedback element and the correct response, with no verdict', async () => {
    const template = await renderPreview(previewItem(false));

    expect(template).toContain('Choice A feedback');
    expect(template).toContain('Detailed feedback');
    expect(template).toContain('Before submission');
    expect(template).toContain('Modal feedback');
    expect(template).toContain('<qti-correct-response><qti-value>A</qti-value></qti-correct-response>');
    expect(template).not.toContain('data-cutie-evaluation');
  });

  test('shows modal feedback as block feedback at the end of the item body', async () => {
    const template = await renderPreview(previewItem(false));

    expect(template).not.toContain('qti-modal-feedback');
    expect(template).toContain(
      '<qti-feedback-block outcome-identifier="FEEDBACK" identifier="DONE" show-hide="show">Modal feedback</qti-feedback-block></qti-item-body>'
    );
  });

  test('marks the item body as a preview', async () => {
    const template = await renderPreview(previewItem(false));

    expect(template).toMatch(/<qti-item-body[^>]* data-cutie-preview="true"/);
  });

  test('strips what is not needed to show the item', async () => {
    const template = await renderPreview(previewItem(false));

    expect(template).not.toContain('qti-mapping');
    expect(template).not.toContain('qti-response-processing');
    expect(template).not.toContain('qti-outcome-declaration');
    expect(template).not.toContain('qti-template-processing');
  });

  test('prints template variables, and a placeholder for outcome variables', async () => {
    const template = await renderPreview(previewItem(false));

    expect(template).toContain('Hello Ada, you scored [SCORE].');
  });

  test('keeps choices in their authored order', async () => {
    for (let i = 0; i < 10; i++) {
      const template = await renderPreview(previewItem(false));
      const order = [...template.matchAll(/qti-simple-choice identifier="(\w)"/g)].map((m) => m[1]);
      expect(order).toEqual(['A', 'B', 'C', 'D']);
    }
  });

  test('compact shows only the feedback the attempt begins with', async () => {
    const template = await renderPreview(previewItem(false), undefined, { compact: true });

    expect(template).not.toContain('Choice A feedback');
    expect(template).not.toContain('Detailed feedback');
    expect(template).not.toContain('Modal feedback');
    expect(template).toContain('Before submission');
    expect(template).toContain('<qti-correct-response><qti-value>A</qti-value></qti-correct-response>');
  });

  test('previews an adaptive item compact', async () => {
    const template = await renderPreview(previewItem(true));

    expect(template).not.toContain('Detailed feedback');
    expect(template).toContain('Before submission');
    expect(template).toContain('<qti-correct-response><qti-value>A</qti-value></qti-correct-response>');
  });

  test('shows the correct response template processing sets', async () => {
    const item = previewItem(false).replace(
      '</qti-template-processing>',
      `  <qti-set-correct-response identifier="RESPONSE">
      <qti-base-value base-type="identifier">B</qti-base-value>
    </qti-set-correct-response>
  </qti-template-processing>`
    );
    const template = await renderPreview(item);

    expect(template).toContain('<qti-correct-response><qti-value>B</qti-value></qti-correct-response>');
  });
});
