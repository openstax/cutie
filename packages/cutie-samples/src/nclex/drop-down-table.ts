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
NCLEX drop-down table: a \`table\` where each row ends with a cell holding one \
\`qti-inline-choice-interaction\` with \`required="true"\`. Response identifiers \
are \`RESPONSE\`, \`RESPONSE_2\`, \`RESPONSE_3\`, and so on, in row order. Every \
drop-down in the table offers the same options, such as "Improved", "No change", \
and "Declined".

- ${clinicalScenario}
- Give the table a \`caption\`, a header row of \`th\` cells with \`scope="col"\`, \
and a \`th\` with \`scope="row"\` naming each row's finding, so assistive \
technology can announce which row each drop-down belongs to.
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
identifier="sample-nclex-drop-down-table" title="Evaluating Pneumonia Treatment"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>improved</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_2" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>improved</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_3" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>noChange</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_4" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>declined</qti-value>
    </qti-correct-response>
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
  <qti-outcome-declaration identifier="RESPONSE_4_SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <p>A client was admitted with community-acquired pneumonia and is on day 3 of IV antibiotics. The nurse compares today's findings with those from admission. For each finding, choose whether the client's condition has improved, has not changed, or has declined.</p>
    <table>
      <caption>Findings on admission and on day 3</caption>
      <thead>
        <tr>
          <th scope="col">Finding</th>
          <th scope="col">Admission</th>
          <th scope="col">Day 3</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Temperature</th>
          <td>39.2 °C (102.6 °F)</td>
          <td>37.1 °C (98.8 °F)</td>
          <td>
            <qti-inline-choice-interaction response-identifier="RESPONSE" shuffle="true" required="true">
              <qti-inline-choice identifier="improved">Improved</qti-inline-choice>
              <qti-inline-choice identifier="noChange">No change</qti-inline-choice>
              <qti-inline-choice identifier="declined">Declined</qti-inline-choice>
            </qti-inline-choice-interaction>
          </td>
        </tr>
        <tr>
          <th scope="row">Respiratory rate</th>
          <td>28 breaths/min</td>
          <td>18 breaths/min</td>
          <td>
            <qti-inline-choice-interaction response-identifier="RESPONSE_2" shuffle="true" required="true">
              <qti-inline-choice identifier="improved">Improved</qti-inline-choice>
              <qti-inline-choice identifier="noChange">No change</qti-inline-choice>
              <qti-inline-choice identifier="declined">Declined</qti-inline-choice>
            </qti-inline-choice-interaction>
          </td>
        </tr>
        <tr>
          <th scope="row">Oxygen saturation</th>
          <td>91% on 2 L/min by nasal cannula</td>
          <td>91% on 2 L/min by nasal cannula</td>
          <td>
            <qti-inline-choice-interaction response-identifier="RESPONSE_3" shuffle="true" required="true">
              <qti-inline-choice identifier="improved">Improved</qti-inline-choice>
              <qti-inline-choice identifier="noChange">No change</qti-inline-choice>
              <qti-inline-choice identifier="declined">Declined</qti-inline-choice>
            </qti-inline-choice-interaction>
          </td>
        </tr>
        <tr>
          <th scope="row">White blood cell count</th>
          <td>16,500/mm³</td>
          <td>19,800/mm³</td>
          <td>
            <qti-inline-choice-interaction response-identifier="RESPONSE_4" shuffle="true" required="true">
              <qti-inline-choice identifier="improved">Improved</qti-inline-choice>
              <qti-inline-choice identifier="noChange">No change</qti-inline-choice>
              <qti-inline-choice identifier="declined">Declined</qti-inline-choice>
            </qti-inline-choice-interaction>
          </td>
        </tr>
      </tbody>
    </table>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <qti-content-body>
        <p>Compare each day 3 value with the admission value and with the normal range. The temperature fell from 39.2 °C to 37.1 °C, which is within normal limits, so it has improved. The respiratory rate dropped from 28 to 18 breaths/min, back in the normal range of 12 to 20, so it has also improved. The oxygen saturation is still 91% on the same 2 L/min of oxygen, so it hasn't changed. The white blood cell count rose from 16,500 to 19,800/mm³, moving further above the normal range of about 5,000 to 10,000/mm³, which suggests the infection may not be responding to the antibiotic, so it has declined. The temperature and respiratory rate improved, the oxygen saturation didn't change, and the white blood cell count declined.</p>
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
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE_4"/>
          <qti-correct identifier="RESPONSE_4"/>
        </qti-match>
        <qti-set-outcome-value identifier="RESPONSE_4_SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="RESPONSE_4_SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum>
        <qti-variable identifier="RESPONSE_SCORE"/>
        <qti-variable identifier="RESPONSE_2_SCORE"/>
        <qti-variable identifier="RESPONSE_3_SCORE"/>
        <qti-variable identifier="RESPONSE_4_SCORE"/>
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

export const dropDownTable: Sample = {
  id: 'nclex-drop-down-table',
  name: 'Drop-Down: Table',
  summary: 'NCLEX drop-down table: choose a drop-down answer for each row of a table, scored +1 for each correct row.',
  description,
  interactionTypes: ['inline-choice'],
  item,
};
