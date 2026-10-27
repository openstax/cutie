/* spell-checker: ignore hypovolemia hypoactive */
import {
  choiceText,
  correctResponse,
  outcomes,
  responseProcessingOrder,
  shuffle,
  workedSolution,
} from '../standard/conventions.js';
import type { Sample } from '../types.js';
import { clinicalScenario, maxScore, sumMapResponses, zeroOneMappedScoring } from './conventions.js';

const description = `\
NCLEX multiple response, select N: \`qti-choice-interaction\` with a \`multiple\` \
cardinality response where the prompt states exactly how many options to choose, \
such as "Select the 3 findings that require immediate follow-up." Use 5 to 10 \
options.

- ${clinicalScenario}
- Set \`min-choices="1"\` and \`max-choices\` to the number named in the prompt, so \
the learner can't select more than that.
- ${shuffle}
- ${choiceText}
- Every choice ends with its own \`qti-feedback-block\` with identifier \
\`RESPONSE_choice_<choiceId>\`, shown when that choice is selected, explaining why \
that finding or action is right or wrong. It has no \`data-feedback-type\` and no \
"Correct"/"Incorrect" prefix.
- ${workedSolution}
- ${zeroOneMappedScoring} Set \`upper-bound\` to the number of correct options.
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
identifier="sample-nclex-select-n" title="Postoperative Findings"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
      <qti-value>choiceB</qti-value>
      <qti-value>choiceC</qti-value>
    </qti-correct-response>
    <qti-mapping lower-bound="0" upper-bound="3" default-value="0">
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
    <p>A client returned to the surgical unit 2 hours ago after an open bowel resection. The nurse completes a focused assessment.</p>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="true" min-choices="1" max-choices="3">
      <qti-prompt>Select the 3 findings that require immediate follow-up.</qti-prompt>
      <qti-simple-choice identifier="choiceA">
        <p>Heart rate 122 beats/min</p>
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceA" show-hide="show">
          <qti-content-body>
            <p>Tachycardia is often the earliest sign of hypovolemia. The heart beats faster to maintain cardiac output as circulating volume drops.</p>
          </qti-content-body>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceB">
        <p>Blood pressure 88/50 mm Hg</p>
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceB" show-hide="show">
          <qti-content-body>
            <p>Hypotension means compensation is failing. Together with a fast heart rate, it suggests hemorrhage and possible shock.</p>
          </qti-content-body>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceC">
        <p>Skin cool and clammy</p>
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceC" show-hide="show">
          <qti-content-body>
            <p>Cool, clammy skin shows the body is shunting blood away from the skin to the vital organs, a sign of shock.</p>
          </qti-content-body>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceD">
        <p>Incision pain rated 4 on a 0 to 10 scale</p>
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceD" show-hide="show">
          <qti-content-body>
            <p>Moderate incision pain is expected 2 hours after abdominal surgery. The nurse manages it with the prescribed analgesics, but it doesn't need immediate follow-up.</p>
          </qti-content-body>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceE">
        <p>Temperature 37.4 °C (99.3 °F)</p>
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceE" show-hide="show">
          <qti-content-body>
            <p>A slight temperature rise is common in the first day after surgery as part of the inflammatory response.</p>
          </qti-content-body>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceF">
        <p>Hypoactive bowel sounds</p>
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceF" show-hide="show">
          <qti-content-body>
            <p>Anesthesia and handling of the bowel slow peristalsis, so hypoactive bowel sounds are expected soon after bowel surgery.</p>
          </qti-content-body>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceG">
        <p>Oxygen saturation 95% on 2 L/min by nasal cannula</p>
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceG" show-hide="show">
          <qti-content-body>
            <p>An oxygen saturation of 95% with supplemental oxygen is within the expected range after surgery.</p>
          </qti-content-body>
        </qti-feedback-block>
      </qti-simple-choice>
    </qti-choice-interaction>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <qti-content-body>
        <p>Hemorrhage is one of the most serious early complications after abdominal surgery, so look for cues that circulating volume is dropping. A heart rate of 122 beats/min, a blood pressure of 88/50 mm Hg, and cool, clammy skin together point to hypovolemia and early shock, which need immediate follow-up. Moderate incision pain, a slight temperature rise, hypoactive bowel sounds, and an oxygen saturation of 95% on oxygen are all expected 2 hours after surgery. The 3 findings that require immediate follow-up are the heart rate, the blood pressure, and the cool, clammy skin.</p>
      </qti-content-body>
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

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceG</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceG</qti-base-value>
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

export const selectN: Sample = {
  id: 'nclex-select-n',
  name: 'Multiple Response: Select N',
  summary: 'NCLEX select N: choose a stated number of options, scored +1 for each correct selection.',
  description,
  interactionTypes: ['choice'],
  item,
};
