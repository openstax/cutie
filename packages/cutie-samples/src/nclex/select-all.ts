/* spell-checker: ignore furosemide Henle hypokalemia */
import {
  choiceText,
  correctResponse,
  outcomes,
  responseProcessingOrder,
  shuffle,
  workedSolution,
} from '../standard/conventions.js';
import type { Sample } from '../types.js';
import { clinicalScenario, maxScore, plusMinusScoring, sumMapResponses } from './conventions.js';

const description = `\
NCLEX multiple response, select all that apply: \`qti-choice-interaction\` with \
a \`multiple\` cardinality response, \`min-choices="1"\`, and \`max-choices="0"\`. \
The prompt ends with "Select all that apply." Use 5 to 10 options with at least \
one correct.

- ${clinicalScenario}
- ${shuffle}
- ${choiceText}
- Every choice ends with its own \`qti-feedback-block\` with identifier \
\`RESPONSE_choice_<choiceId>\`, shown when that choice is selected, explaining why \
that finding or action is right or wrong. It has no \`data-feedback-type\` and no \
"Correct"/"Incorrect" prefix.
- ${workedSolution}
- ${plusMinusScoring}
- ${sumMapResponses}
- Each per-choice feedback condition uses \`qti-member\` to check whether the choice \
identifier is in the response.
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}
- ${maxScore}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-nclex-select-all" title="Response to a Loop Diuretic"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
      <qti-value>choiceB</qti-value>
      <qti-value>choiceC</qti-value>
    </qti-correct-response>
    <qti-mapping lower-bound="0" upper-bound="3" default-value="-1">
      <qti-map-entry map-key="choiceA" mapped-value="1"/>
      <qti-map-entry map-key="choiceB" mapped-value="1"/>
      <qti-map-entry map-key="choiceC" mapped-value="1"/>
    </qti-mapping>
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

  <qti-item-body>
    <p>A client with heart failure was admitted with shortness of breath and swelling in both legs. The nurse gave furosemide 40 mg IV 2 hours ago.</p>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="true" min-choices="1" max-choices="0">
      <qti-prompt>Which findings indicate that the medication is having the desired effect? Select all that apply.</qti-prompt>
      <qti-simple-choice identifier="choiceA">
        <p>Fewer crackles heard in the lung bases</p>
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceA" show-hide="show">
          <p>Crackles in the lung bases come from fluid in the alveoli. Fewer crackles means pulmonary congestion is easing as the diuretic removes excess fluid.</p>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceB">
        <p>Weight down 1.2 kg (2.6 lb) since yesterday</p>
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceB" show-hide="show">
          <p>Daily weight is the most reliable measure of fluid balance. A loss of about 1 kg reflects about 1 L of fluid removed, which is the goal of diuresis.</p>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceC">
        <p>Urine output increased after the dose</p>
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceC" show-hide="show">
          <p>Furosemide blocks sodium and water reabsorption in the loop of Henle, so increased urine output shows the drug is working.</p>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceD">
        <p>Serum potassium 3.1 mEq/L</p>
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceD" show-hide="show">
          <p>A potassium level below 3.5 mEq/L is hypokalemia, a common adverse effect of loop diuretics. It needs follow-up, but it isn't a sign of the desired effect.</p>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceE">
        <p>New 2+ pitting edema in both ankles</p>
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceE" show-hide="show">
          <p>New or worsening edema means fluid is still building up, so the diuretic isn't yet having the desired effect.</p>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceF">
        <p>Respiratory rate 28 breaths/min</p>
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceF" show-hide="show">
          <p>A respiratory rate of 28 breaths/min is above the normal range and suggests the client is still working hard to breathe. It doesn't show improvement.</p>
        </qti-feedback-block>
      </qti-simple-choice>
    </qti-choice-interaction>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <p>Furosemide is a loop diuretic given to remove the excess fluid that causes congestion in heart failure. To decide whether it is working, look for signs that fluid is leaving the body and congestion is easing. Increased urine output shows diuresis is happening. A weight loss of 1.2 kg reflects about 1.2 L of fluid removed. Fewer crackles in the lung bases means less fluid in the lungs. New ankle edema and a fast respiratory rate point to ongoing fluid overload, and a potassium of 3.1 mEq/L is an adverse effect that needs follow-up. The findings that show the desired effect are fewer crackles, the weight loss, and the increased urine output.</p>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum>
        <qti-map-response identifier="RESPONSE"/>
      </qti-sum>
    </qti-set-outcome-value>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceA</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceA</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceB</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceB</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceC</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceC</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceD</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceD</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceE</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceE</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceF</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceF</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
    <qti-set-outcome-value identifier="FEEDBACK">
      <qti-multiple>
        <qti-variable identifier="FEEDBACK"/>
        <qti-base-value base-type="identifier">ITEM_completed</qti-base-value>
      </qti-multiple>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

export const selectAll: Sample = {
  id: 'nclex-select-all',
  name: 'Multiple Response: Select All That Apply',
  summary: 'NCLEX select all that apply, scored +1 for each correct and -1 for each incorrect selection.',
  description,
  interactionTypes: ['choice'],
  item,
};
