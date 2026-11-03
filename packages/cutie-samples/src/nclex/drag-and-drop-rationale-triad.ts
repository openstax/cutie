/* spell-checker: ignore lispro diaphoresis diaphoretic ketoacidosis */
import {
  correctResponse,
  outcomes,
  responseProcessingOrder,
  workedSolution,
} from '../standard/conventions.js';
import type { Sample } from '../types.js';
import { clinicalScenario, rationaleTriad, rationaleWordBanks } from './conventions.js';

const description = `\
NCLEX drag-and-drop rationale: one sentence that links a cause to two effects, \
such as "The client is showing signs of ___ as evidenced by ___ and ___." Use a \
\`qti-gap-match-interaction\` with a \`qti-prompt\`, a \`qti-gap-text\` for each \
option, and the sentence with a \`qti-gap\` for the cause (\`G1\`) and one for \
each effect (\`G2\` and \`G3\`). The response is a \`multiple\` cardinality \
\`directedPair\` of "option gap" identifiers. Include 3 cause options and 4 to 5 \
effect options. Each effect option should be a finding from the scenario.

- ${rationaleTriad} The two effects can go in either order.
- ${clinicalScenario}
- ${rationaleWordBanks}
- Set \`shuffle="true"\` so the option bank order varies.
- Set \`match-max="1"\` on every \`qti-gap-text\`, so each option is used at \
most once. Without it, one correct effect placed in both effect gaps would earn \
both points.
- Set \`min-associations="3"\`, so every blank must be filled before submitting.
- Don't add per-gap feedback.
- ${workedSolution}
- Score with a \`qti-mapping\` on the response with \`default-value="0"\`: map \
the correct cause in the cause gap to 2, and each correct effect to 1 in both \
effect gaps, so either order earns the points. Set \`SCORE\` to a \`qti-sum\` \
of the offset \`<qti-base-value base-type="float">-2</qti-base-value>\` and the \
\`qti-map-response\`, capped with a \`qti-min\` at 2 and floored with a \
\`qti-max\` at 0: \
\`<qti-max><qti-base-value base-type="float">0</qti-base-value><qti-min><qti-base-value base-type="float">2</qti-base-value><qti-sum>…</qti-sum></qti-min></qti-max>\`. \
A wrong cause leaves at most 1 + 1 - 2 = 0 points, and the correct cause leaves \
1 point for each correct effect. The mapping's entries add up to more than 2, \
so the \`qti-min\` states the maximum. Set the \`MAXSCORE\` default to 2.
- ${responseProcessingOrder}
- ${correctResponse} List the effects in either order.
- ${outcomes}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-nclex-drag-and-drop-rationale-triad" title="Low Blood Glucose After Insulin"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>hypoglycemia G1</qti-value>
      <qti-value>glucose G2</qti-value>
      <qti-value>tremors G3</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="hypoglycemia G1" mapped-value="2"/>
      <qti-map-entry map-key="glucose G2" mapped-value="1"/>
      <qti-map-entry map-key="glucose G3" mapped-value="1"/>
      <qti-map-entry map-key="tremors G2" mapped-value="1"/>
      <qti-map-entry map-key="tremors G3" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>2.0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

  <qti-item-body>
    <p>A client with type 1 diabetes received insulin lispro before lunch but ate only a few bites. One hour later, the client is trembling and diaphoretic. The client's capillary blood glucose is 52 mg/dL, blood pressure is 126/78 mm Hg, respiratory rate is 16/min, and mucous membranes are moist.</p>
    <qti-gap-match-interaction response-identifier="RESPONSE" shuffle="true" min-associations="3">
      <qti-prompt>Complete the sentence by dragging an option into each blank.</qti-prompt>
      <qti-gap-text identifier="hypoglycemia" match-max="1" match-group="cause">hypoglycemia</qti-gap-text>
      <qti-gap-text identifier="hyperglycemia" match-max="1" match-group="cause">hyperglycemia</qti-gap-text>
      <qti-gap-text identifier="deficientFluid" match-max="1" match-group="cause">deficient fluid volume</qti-gap-text>
      <qti-gap-text identifier="glucose" match-max="1" match-group="effect">a capillary blood glucose of 52 mg/dL</qti-gap-text>
      <qti-gap-text identifier="tremors" match-max="1" match-group="effect">trembling and diaphoresis</qti-gap-text>
      <qti-gap-text identifier="respiratoryRate" match-max="1" match-group="effect">a respiratory rate of 16/min</qti-gap-text>
      <qti-gap-text identifier="mucousMembranes" match-max="1" match-group="effect">moist mucous membranes</qti-gap-text>
      <qti-gap-text identifier="bloodPressure" match-max="1" match-group="effect">a blood pressure of 126/78 mm Hg</qti-gap-text>
      <h3 data-for-match-group="cause">Condition</h3>
      <h3 data-for-match-group="effect">Findings</h3>
      <p>
        The client is showing signs of <qti-gap identifier="G1" match-group="cause"/> as evidenced by <qti-gap identifier="G2" match-group="effect"/> and <qti-gap identifier="G3" match-group="effect"/>.
      </p>
    </qti-gap-match-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <qti-content-body>
        <p>Insulin lispro starts working within about 15 minutes and peaks about 1 hour after the dose, so taking it and then eating only a few bites can drop blood glucose too low. A blood glucose below 70 mg/dL is hypoglycemia, so 52 mg/dL confirms it. As blood glucose falls, the body releases epinephrine, which causes trembling and sweating (diaphoresis). A respiratory rate of 16/min is normal, so it doesn't suggest the deep, rapid breathing of diabetic ketoacidosis from hyperglycemia, and moist mucous membranes and a normal blood pressure don't point to deficient fluid volume. The client is showing signs of hypoglycemia as evidenced by a capillary blood glucose of 52 mg/dL and trembling and diaphoresis.</p>
      </qti-content-body>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE">
      <qti-max>
        <qti-base-value base-type="float">0</qti-base-value>
        <qti-min>
          <qti-base-value base-type="float">2</qti-base-value>
          <qti-sum>
            <qti-base-value base-type="float">-2</qti-base-value>
            <qti-map-response identifier="RESPONSE"/>
          </qti-sum>
        </qti-min>
      </qti-max>
    </qti-set-outcome-value>
    <qti-set-outcome-value identifier="FEEDBACK">
      <qti-multiple>
        <qti-variable identifier="FEEDBACK"/>
        <qti-base-value base-type="identifier">ITEM_completed</qti-base-value>
      </qti-multiple>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

export const dragAndDropRationaleTriad: Sample = {
  id: 'nclex-drag-and-drop-rationale-triad',
  name: 'Drag-and-Drop: Rationale (Triad)',
  summary: 'NCLEX drag-and-drop rationale (triad): drag a cause and two findings that support it from separate word banks into a sentence, with a point for each correct finding once the cause is correct.',
  description,
  interactionTypes: ['gap-match'],
  item,
};
