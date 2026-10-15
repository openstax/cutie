/* spell-checker: ignore pyelonephritis dysregulated hottext */
import {
  correctResponse,
  outcomes,
  responseProcessingOrder,
  workedSolution,
} from '../standard/conventions.js';
import type { Sample } from '../types.js';
import { clinicalScenario, maxScore, plusMinusScoring, sumMapResponses } from './conventions.js';

const description = `\
NCLEX text highlight, table: \`qti-hottext-interaction\` with a \`multiple\` \
cardinality response, \`min-choices="1"\`, and \`max-choices="0"\`, holding a \
\`qti-prompt\` and a \`table\` of client data. A \`qti-hottext\` wraps the value \
in each data cell.

- ${clinicalScenario}
- Give the table a \`caption\`, a header row of \`th\` cells with \`scope="col"\`, \
and a \`th\` with \`scope="row"\` naming each row's finding.
- Make every value selectable, including normal ones, so the learner has to judge \
every row.
- Don't add per-option feedback.
- ${workedSolution}
- ${plusMinusScoring}
- ${sumMapResponses}
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}
- ${maxScore}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-nclex-highlight-table" title="Admission Findings With Pyelonephritis"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>temperature</qti-value>
      <qti-value>heartRate</qti-value>
      <qti-value>respiratoryRate</qti-value>
      <qti-value>whiteCells</qti-value>
    </qti-correct-response>
    <qti-mapping lower-bound="0" upper-bound="4" default-value="-1">
      <qti-map-entry map-key="temperature" mapped-value="1"/>
      <qti-map-entry map-key="heartRate" mapped-value="1"/>
      <qti-map-entry map-key="respiratoryRate" mapped-value="1"/>
      <qti-map-entry map-key="whiteCells" mapped-value="1"/>
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
    <p>An older adult is admitted with pyelonephritis. The nurse reviews the admission vital signs and laboratory results.</p>
    <qti-hottext-interaction response-identifier="RESPONSE" min-choices="1" max-choices="0">
      <qti-prompt>Highlight the findings that indicate the client may be developing sepsis.</qti-prompt>
      <table>
        <caption>Admission vital signs and laboratory results</caption>
        <thead>
          <tr>
            <th scope="col">Finding</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Temperature</th>
            <td><qti-hottext identifier="temperature">38.9 °C (102 °F)</qti-hottext></td>
          </tr>
          <tr>
            <th scope="row">Heart rate</th>
            <td><qti-hottext identifier="heartRate">116 beats/min</qti-hottext></td>
          </tr>
          <tr>
            <th scope="row">Respiratory rate</th>
            <td><qti-hottext identifier="respiratoryRate">24 breaths/min</qti-hottext></td>
          </tr>
          <tr>
            <th scope="row">Blood pressure</th>
            <td><qti-hottext identifier="bloodPressure">124/78 mm Hg</qti-hottext></td>
          </tr>
          <tr>
            <th scope="row">Oxygen saturation</th>
            <td><qti-hottext identifier="oxygenSaturation">97% on room air</qti-hottext></td>
          </tr>
          <tr>
            <th scope="row">White blood cell count</th>
            <td><qti-hottext identifier="whiteCells">15,800/mm³</qti-hottext></td>
          </tr>
          <tr>
            <th scope="row">Blood glucose</th>
            <td><qti-hottext identifier="glucose">104 mg/dL</qti-hottext></td>
          </tr>
        </tbody>
      </table>
    </qti-hottext-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <p>Sepsis is the body's dysregulated response to an infection, and early cues are the signs of systemic inflammation. Compare each value with its normal range. A temperature above 38 °C, a heart rate above 90 beats/min, a respiratory rate above 20 breaths/min, and a white blood cell count above 12,000/mm³ are all signs of systemic inflammation, and together with a known infection they suggest developing sepsis. The blood pressure, oxygen saturation, and blood glucose are within normal limits, though the nurse keeps monitoring the blood pressure for hypotension. The findings to highlight are the temperature, the heart rate, the respiratory rate, and the white blood cell count.</p>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum>
        <qti-map-response identifier="RESPONSE"/>
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

export const highlightTable: Sample = {
  id: 'nclex-highlight-table',
  name: 'Text Highlight: Table',
  summary: 'NCLEX text highlight in a table: select the values in a table of client data, scored +1 for each correct and -1 for each incorrect selection.',
  description,
  interactionTypes: ['hottext'],
  item,
};
