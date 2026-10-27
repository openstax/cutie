/* spell-checker: ignore lispro */
import {
  correctResponse,
  outcomes,
  responseProcessingOrder,
  shuffle,
  workedSolution,
} from '../standard/conventions.js';
import type { Sample } from '../types.js';
import { clinicalScenario, maxScore, zeroOneDropDownScoring } from './conventions.js';

const description = `\
NCLEX drop-down cloze: a passage with several blanks, each a \
\`qti-inline-choice-interaction\` placed inline in the text with \
\`required="true"\`, and response identifiers \`RESPONSE\`, \`RESPONSE_2\`, \
\`RESPONSE_3\`, and so on. Use 3 to 5 options per drop-down.

- ${clinicalScenario}
- ${shuffle}
- Options contain plain text only. Don't add per-option feedback to inline \
interactions.
- ${workedSolution}
- ${zeroOneDropDownScoring}
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}
- ${maxScore}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-nclex-drop-down-cloze" title="Treating Hypoglycemia"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>checkGlucose</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_2" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>fastCarbohydrate</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_3" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>fifteenMinutes</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>3.0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>
  <qti-outcome-declaration identifier="RESPONSE_SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="RESPONSE_2_SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="RESPONSE_3_SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <p>A client with type 1 diabetes took insulin lispro before lunch 3 hours ago. The client is now shaky, sweating, and slow to answer questions. Complete the following sentences by choosing from the lists of options.</p>
    <p>
      The nurse should first
      <qti-inline-choice-interaction response-identifier="RESPONSE" shuffle="true" required="true">
        <qti-inline-choice identifier="checkGlucose">check the client's blood glucose</qti-inline-choice>
        <qti-inline-choice identifier="giveInsulin">give the next scheduled dose of insulin</qti-inline-choice>
        <qti-inline-choice identifier="encourageRest">encourage the client to lie down and rest</qti-inline-choice>
      </qti-inline-choice-interaction>.
      If the reading is below 70 mg/dL and the client can swallow safely, the nurse should give
      <qti-inline-choice-interaction response-identifier="RESPONSE_2" shuffle="true" required="true">
        <qti-inline-choice identifier="fastCarbohydrate">15 g of fast-acting carbohydrate</qti-inline-choice>
        <qti-inline-choice identifier="proteinSnack">a high-protein snack</qti-inline-choice>
        <qti-inline-choice identifier="water">a large glass of water</qti-inline-choice>
      </qti-inline-choice-interaction>
      and recheck the blood glucose in
      <qti-inline-choice-interaction response-identifier="RESPONSE_3" shuffle="true" required="true">
        <qti-inline-choice identifier="fifteenMinutes">15 minutes</qti-inline-choice>
        <qti-inline-choice identifier="oneHour">1 hour</qti-inline-choice>
        <qti-inline-choice identifier="fourHours">4 hours</qti-inline-choice>
      </qti-inline-choice-interaction>.
    </p>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <qti-content-body>
        <p>Shakiness, sweating, and slowed thinking a few hours after rapid-acting insulin are classic signs of hypoglycemia. The nurse first confirms the problem by checking the blood glucose; giving more insulin would lower it further, and resting does nothing to treat it. A reading below 70 mg/dL in a client who can swallow safely calls for the rule of 15: give 15 g of fast-acting carbohydrate, such as 4 oz of juice or glucose tablets, then recheck the blood glucose in 15 minutes and repeat if it is still low. Protein and fat slow absorption, so a high-protein snack doesn't raise glucose quickly enough. So the nurse should first check the blood glucose, give 15 g of fast-acting carbohydrate, and recheck in 15 minutes.</p>
      </qti-content-body>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-correct identifier="RESPONSE"/>
        </qti-match>
        <qti-set-outcome-value identifier="RESPONSE_SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="RESPONSE_SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE_2"/>
          <qti-correct identifier="RESPONSE_2"/>
        </qti-match>
        <qti-set-outcome-value identifier="RESPONSE_2_SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="RESPONSE_2_SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE_3"/>
          <qti-correct identifier="RESPONSE_3"/>
        </qti-match>
        <qti-set-outcome-value identifier="RESPONSE_3_SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="RESPONSE_3_SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum>
        <qti-variable identifier="RESPONSE_SCORE"/>
        <qti-variable identifier="RESPONSE_2_SCORE"/>
        <qti-variable identifier="RESPONSE_3_SCORE"/>
      </qti-sum>
    </qti-set-outcome-value>
    <qti-set-outcome-value identifier="FEEDBACK">
      <qti-multiple>
        <qti-variable identifier="FEEDBACK"/>
        <qti-base-value base-type="identifier">ITEM_completed</qti-base-value>
      </qti-multiple>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

export const dropDownCloze: Sample = {
  id: 'nclex-drop-down-cloze',
  name: 'Drop-Down: Cloze',
  summary: 'NCLEX drop-down cloze: complete a passage using several drop-downs, scored +1 for each correct drop-down.',
  description,
  interactionTypes: ['inline-choice'],
  item,
};
