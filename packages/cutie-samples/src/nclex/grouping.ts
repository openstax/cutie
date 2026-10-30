/* spell-checker: ignore arthroplasty fullwidth */
import {
  choiceText,
  correctResponse,
  outcomes,
  responseProcessingOrder,
  shuffle,
  workedSolution,
} from '../standard/conventions.js';
import type { Sample } from '../types.js';
import { clinicalScenario, maxScore, sumMapResponses } from './conventions.js';

const description = `\
NCLEX multiple response, grouping: a \`table\` with \`class="qti-fullwidth"\` \
where each row is a group, such as a body system or an assessment area. The \
row's first cell is a \`th\` with \`scope="row"\` naming the group, and its \
second cell holds a \`qti-choice-interaction\` with a \`multiple\` cardinality \
response, \`min-choices="1"\`, and \`max-choices="0"\`. Response identifiers are \
\`RESPONSE\`, \`RESPONSE_2\`, \`RESPONSE_3\`, and so on, in row order. Use 2 to 5 \
groups, each with the same number of options, 2 to 4, and at least one correct \
option in every group.

- ${clinicalScenario}
- After the scenario, a paragraph asks the question for every group and says that \
each group needs at least one selection and may have more than one.
- Give the table a \`caption\` and a header row of \`th\` cells with \
\`scope="col"\`. The interactions have no \`qti-prompt\`: each one is named by its \
row and column headers, so the row header must name the group on its own.
- ${shuffle}
- ${choiceText}
- Every choice ends with its own \`qti-feedback-block\` with identifier \
\`<responseId>_choice_<choiceId>\`, shown when that choice is selected, explaining \
why that option is right or wrong. It has no \`data-feedback-type\` and no \
"Correct"/"Incorrect" prefix.
- ${workedSolution}
- Score each group with the NCLEX +/- rule, and add the groups' scores: in a group, \
each correct selection earns 1 point, each incorrect selection loses 1 point, and \
the group's score can't go below 0. Give each response declaration a \
\`qti-mapping\` with \`mapped-value="1"\` for each correct option, \
\`default-value="-1"\`, \`lower-bound="0"\`, and \`upper-bound\` set to the number \
of correct options in that group. The bounds apply to each group's mapping, so a \
group with more incorrect than correct selections scores 0 without taking points \
from the other groups.
- ${sumMapResponses}
- Each per-choice feedback condition uses \`qti-member\` to check whether the choice \
identifier is in that group's response.
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}
- ${maxScore}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-nclex-grouping" title="Findings After Hip Replacement"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
    </qti-correct-response>
    <qti-mapping lower-bound="0" upper-bound="1" default-value="-1">
      <qti-map-entry map-key="choiceA" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_2" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
      <qti-value>choiceB</qti-value>
    </qti-correct-response>
    <qti-mapping lower-bound="0" upper-bound="2" default-value="-1">
      <qti-map-entry map-key="choiceA" mapped-value="1"/>
      <qti-map-entry map-key="choiceB" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_3" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
    </qti-correct-response>
    <qti-mapping lower-bound="0" upper-bound="1" default-value="-1">
      <qti-map-entry map-key="choiceA" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>4.0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

  <qti-item-body>
    <p>A client is on day 2 after a right total hip arthroplasty. The client reports sudden shortness of breath and says it hurts to take a deep breath. The nurse assesses the client.</p>
    <p>For each assessment area, select the findings that require follow-up. Select at least one finding in each area; an area may have more than one.</p>
    <table class="qti-fullwidth">
      <caption>Assessment findings on day 2</caption>
      <thead>
        <tr>
          <th scope="col">Assessment area</th>
          <th scope="col">Findings</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Cardiovascular</th>
          <td>
            <qti-choice-interaction response-identifier="RESPONSE" shuffle="true" min-choices="1" max-choices="0">
              <qti-simple-choice identifier="choiceA">
                <p>Heart rate 118/min</p>
                <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceA" show-hide="show">
                  <qti-content-body>
                    <p>A heart rate of 118/min is tachycardia. With new shortness of breath after hip surgery, it can be the heart compensating for low oxygen from a pulmonary embolism.</p>
                  </qti-content-body>
                </qti-feedback-block>
              </qti-simple-choice>
              <qti-simple-choice identifier="choiceB">
                <p>Blood pressure 126/78 mm Hg</p>
                <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceB" show-hide="show">
                  <qti-content-body>
                    <p>A blood pressure of 126/78 mm Hg is within the expected range and doesn't need follow-up on its own.</p>
                  </qti-content-body>
                </qti-feedback-block>
              </qti-simple-choice>
              <qti-simple-choice identifier="choiceC">
                <p>Pedal pulses 2+ in both feet</p>
                <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceC" show-hide="show">
                  <qti-content-body>
                    <p>Pedal pulses of 2+ in both feet are normal and show good blood flow to both legs.</p>
                  </qti-content-body>
                </qti-feedback-block>
              </qti-simple-choice>
            </qti-choice-interaction>
          </td>
        </tr>
        <tr>
          <th scope="row">Respiratory</th>
          <td>
            <qti-choice-interaction response-identifier="RESPONSE_2" shuffle="true" min-choices="1" max-choices="0">
              <qti-simple-choice identifier="choiceA">
                <p>Respiratory rate 28/min</p>
                <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_2_choice_choiceA" show-hide="show">
                  <qti-content-body>
                    <p>A respiratory rate of 28/min is above the normal range of 12 to 20/min. Fast breathing is a common sign of a pulmonary embolism.</p>
                  </qti-content-body>
                </qti-feedback-block>
              </qti-simple-choice>
              <qti-simple-choice identifier="choiceB">
                <p>Oxygen saturation 89% on room air</p>
                <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_2_choice_choiceB" show-hide="show">
                  <qti-content-body>
                    <p>An oxygen saturation of 89% is below the expected 95% or higher. A clot in the lungs blocks blood flow to part of the lung, so less oxygen reaches the blood.</p>
                  </qti-content-body>
                </qti-feedback-block>
              </qti-simple-choice>
              <qti-simple-choice identifier="choiceC">
                <p>Breath sounds clear in all lung fields</p>
                <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_2_choice_choiceC" show-hide="show">
                  <qti-content-body>
                    <p>Clear breath sounds are a normal finding. A pulmonary embolism often leaves the lungs sounding clear, so this doesn't rule one out, but it isn't a finding that needs follow-up.</p>
                  </qti-content-body>
                </qti-feedback-block>
              </qti-simple-choice>
            </qti-choice-interaction>
          </td>
        </tr>
        <tr>
          <th scope="row">Right leg</th>
          <td>
            <qti-choice-interaction response-identifier="RESPONSE_3" shuffle="true" min-choices="1" max-choices="0">
              <qti-simple-choice identifier="choiceA">
                <p>Calf is warm, red, and swollen</p>
                <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_3_choice_choiceA" show-hide="show">
                  <qti-content-body>
                    <p>Warmth, redness, and swelling in one calf are signs of a deep vein thrombosis. A clot that breaks loose from the leg can travel to the lungs.</p>
                  </qti-content-body>
                </qti-feedback-block>
              </qti-simple-choice>
              <qti-simple-choice identifier="choiceB">
                <p>Incision edges together with no drainage</p>
                <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_3_choice_choiceB" show-hide="show">
                  <qti-content-body>
                    <p>Incision edges that stay together with no drainage show the wound is healing as expected.</p>
                  </qti-content-body>
                </qti-feedback-block>
              </qti-simple-choice>
              <qti-simple-choice identifier="choiceC">
                <p>Hip pain rated 3 out of 10 after an oral analgesic</p>
                <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_3_choice_choiceC" show-hide="show">
                  <qti-content-body>
                    <p>Pain of 3 out of 10 after an analgesic is expected on day 2 after hip surgery and shows the pain is controlled.</p>
                  </qti-content-body>
                </qti-feedback-block>
              </qti-simple-choice>
            </qti-choice-interaction>
          </td>
        </tr>
      </tbody>
    </table>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <qti-content-body>
        <p>After hip surgery, reduced mobility raises the risk of a deep vein thrombosis, and a clot from the leg can travel to the lungs as a pulmonary embolism. The client's sudden shortness of breath and pain on deep breathing point to that complication, so look in each area for findings that fit it. In the right leg, a warm, red, swollen calf suggests a clot. In the respiratory findings, a respiratory rate of 28/min and an oxygen saturation of 89% show the client isn't getting enough oxygen. In the cardiovascular findings, a heart rate of 118/min shows the heart compensating. The blood pressure, pedal pulses, clear breath sounds, healing incision, and controlled pain are all expected. The findings that require follow-up are the heart rate, the respiratory rate, the oxygen saturation, and the calf.</p>
      </qti-content-body>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum>
        <qti-map-response identifier="RESPONSE"/>
        <qti-map-response identifier="RESPONSE_2"/>
        <qti-map-response identifier="RESPONSE_3"/>
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
          <qti-base-value base-type="identifier">choiceA</qti-base-value>
          <qti-variable identifier="RESPONSE_2"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_2_choice_choiceA</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceB</qti-base-value>
          <qti-variable identifier="RESPONSE_2"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_2_choice_choiceB</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceC</qti-base-value>
          <qti-variable identifier="RESPONSE_2"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_2_choice_choiceC</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceA</qti-base-value>
          <qti-variable identifier="RESPONSE_3"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_3_choice_choiceA</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceB</qti-base-value>
          <qti-variable identifier="RESPONSE_3"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_3_choice_choiceB</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceC</qti-base-value>
          <qti-variable identifier="RESPONSE_3"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_3_choice_choiceC</qti-base-value>
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

export const grouping: Sample = {
  id: 'nclex-grouping',
  name: 'Multiple Response: Grouping',
  summary: 'NCLEX grouping, a table of select all that apply groups, each scored +1 for each correct and -1 for each incorrect selection, minimum 0 per group.',
  description,
  interactionTypes: ['choice'],
  item,
};
