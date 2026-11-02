/* spell-checker: ignore catheterization retroperitoneal */
import {
  correctResponse,
  outcomes,
  responseProcessingOrder,
  workedSolution,
} from '../standard/conventions.js';
import type { Sample } from '../types.js';
import {
  cappedSumMapResponses,
  clinicalScenario,
  matrixTable,
  maxScore,
  zeroOneMappedScoring,
} from './conventions.js';

const description = `\
NCLEX matrix multiple choice: a table of findings or actions, each with exactly \
one correct option, such as "Expected" or "Requires follow-up". ${matrixTable} \
Use 4 to 10 rows and 2 or 3 columns.

- ${clinicalScenario}
- Give every row \`match-max="1"\`, so each row is a radio group and takes one \
option. Give every column \`match-max="0"\`, so any number of rows can choose it.
- Set \`min-associations\` and \`max-associations\` to the number of rows, so \
every row must be answered before submitting.
- Set \`shuffle="true"\` so the row order varies, and mark every column \
\`fixed="true"\` so the options stay in their written order.
- Don't add per-cell feedback.
- ${workedSolution} Explain each row's answer.
- ${zeroOneMappedScoring} Map each row's correct "row column" pair, and set \
\`upper-bound\` to the number of rows.
- ${cappedSumMapResponses}
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}
- ${maxScore}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-nclex-matrix-multiple-choice" title="After Cardiac Catheterization"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>pedalPulse expected</qti-value>
      <qti-value>bruise expected</qti-value>
      <qti-value>urineOutput expected</qti-value>
      <qti-value>swelling followUp</qti-value>
      <qti-value>coolFoot followUp</qti-value>
      <qti-value>backPain followUp</qti-value>
    </qti-correct-response>
    <qti-mapping lower-bound="0" upper-bound="6" default-value="0">
      <qti-map-entry map-key="pedalPulse expected" mapped-value="1"/>
      <qti-map-entry map-key="bruise expected" mapped-value="1"/>
      <qti-map-entry map-key="urineOutput expected" mapped-value="1"/>
      <qti-map-entry map-key="swelling followUp" mapped-value="1"/>
      <qti-map-entry map-key="coolFoot followUp" mapped-value="1"/>
      <qti-map-entry map-key="backPain followUp" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>6.0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

  <qti-item-body>
    <p>A client had a cardiac catheterization through the right femoral artery 4 hours ago and is on bed rest with the right leg straight. The nurse assesses the client.</p>
    <qti-match-interaction class="qti-match-tabular" data-first-column-header="Assessment finding" response-identifier="RESPONSE" shuffle="true" min-associations="6" max-associations="6">
      <qti-prompt>For each assessment finding, specify whether the finding is expected or requires follow-up.</qti-prompt>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="pedalPulse" match-max="1">Right pedal pulse 2+</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="bruise" match-max="1">Small, flat bruise at the insertion site</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="urineOutput" match-max="1">Urine output 60 mL/hr</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="swelling" match-max="1">Firm swelling at the insertion site that is getting larger</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="coolFoot" match-max="1">Right foot cool and pale compared with the left</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="backPain" match-max="1">New, severe lower back pain</qti-simple-associable-choice>
      </qti-simple-match-set>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="expected" match-max="0" fixed="true">Expected</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="followUp" match-max="0" fixed="true">Requires follow-up</qti-simple-associable-choice>
      </qti-simple-match-set>
    </qti-match-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <qti-content-body>
        <p>After a catheterization through the femoral artery, the main risks are bleeding from the puncture site and a clot that blocks blood flow to the leg. Check each finding against those risks.</p>
        <p>Three findings are expected. A right pedal pulse of 2+ shows blood is flowing past the puncture site to the foot. A small, flat bruise is common where the catheter went in. A urine output of 60 mL/hr is above the minimum of 30 mL/hr and shows the kidneys are clearing the contrast dye.</p>
        <p>Three findings require follow-up. Firm swelling that is getting larger is a hematoma, blood collecting under the skin from the artery. A right foot that is cool and pale compared with the left means blood flow to the leg may be blocked. New, severe lower back pain can be a sign of retroperitoneal bleeding, where blood from the artery collects behind the abdomen and can't be seen at the site.</p>
      </qti-content-body>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE">
      <qti-min>
        <qti-base-value base-type="float">6</qti-base-value>
        <qti-sum>
          <qti-map-response identifier="RESPONSE"/>
        </qti-sum>
      </qti-min>
    </qti-set-outcome-value>
    <qti-set-outcome-value identifier="FEEDBACK">
      <qti-multiple>
        <qti-variable identifier="FEEDBACK"/>
        <qti-base-value base-type="identifier">ITEM_completed</qti-base-value>
      </qti-multiple>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

export const matrixMultipleChoice: Sample = {
  id: 'nclex-matrix-multiple-choice',
  name: 'Matrix Multiple Choice',
  summary: 'NCLEX matrix multiple choice, a table where each row takes exactly one option, scored 1 point for each correct row.',
  description,
  interactionTypes: ['match'],
  item,
};
