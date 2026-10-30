import {
  correctResponse,
  outcomes,
  responseProcessingOrder,
  shuffle,
  workedSolution,
} from '../standard/conventions.js';
import type { Sample } from '../types.js';
import { clinicalScenario, rationaleTriad, rationaleTriadScoring } from './conventions.js';

const description = `\
NCLEX drop-down rationale: one sentence that links a cause to two effects, such \
as "The client is showing signs of ___ as evidenced by ___ and ___." The cause \
blank is a \`qti-inline-choice-interaction\` with response identifier \
\`RESPONSE\` and the effect blanks use \`RESPONSE_2\` and \`RESPONSE_3\`, all \
inline in the sentence with \`required="true"\`. Use 3 to 5 options per \
drop-down. Each effect option should be a finding from the scenario, and no \
finding should appear in both effect drop-downs.

- ${rationaleTriad}
- ${clinicalScenario}
- ${shuffle}
- Options contain plain text only. Don't add per-option feedback to inline \
interactions.
- ${workedSolution}
- ${rationaleTriadScoring}
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-nclex-drop-down-rationale-triad" title="Fluid Status in Heart Failure"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>excessFluid</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="excessFluid" mapped-value="2"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_2" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>crackles</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="crackles" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_3" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>weightGain</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="weightGain" mapped-value="1"/>
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
    <p>A client with heart failure is admitted with shortness of breath. The client weighs 2.3 kg (5 lb) more than 2 days ago. The nurse hears crackles in both lung bases. The client's temperature is 37.0°C (98.6°F), blood pressure is 128/76 mm Hg, heart rate is 82/min and regular, and mucous membranes are moist. Complete the following sentence by choosing from the lists of options.</p>
    <p>
      The client is showing signs of
      <qti-inline-choice-interaction response-identifier="RESPONSE" shuffle="true" required="true">
        <qti-inline-choice identifier="excessFluid">excess fluid volume</qti-inline-choice>
        <qti-inline-choice identifier="deficientFluid">deficient fluid volume</qti-inline-choice>
        <qti-inline-choice identifier="infection">an infection</qti-inline-choice>
      </qti-inline-choice-interaction>
      as evidenced by
      <qti-inline-choice-interaction response-identifier="RESPONSE_2" shuffle="true" required="true">
        <qti-inline-choice identifier="crackles">crackles in both lung bases</qti-inline-choice>
        <qti-inline-choice identifier="temperature">a temperature of 37.0°C (98.6°F)</qti-inline-choice>
        <qti-inline-choice identifier="bloodPressure">a blood pressure of 128/76 mm Hg</qti-inline-choice>
      </qti-inline-choice-interaction>
      and
      <qti-inline-choice-interaction response-identifier="RESPONSE_3" shuffle="true" required="true">
        <qti-inline-choice identifier="weightGain">a weight gain of 2.3 kg (5 lb) in 2 days</qti-inline-choice>
        <qti-inline-choice identifier="heartRate">a regular heart rate of 82/min</qti-inline-choice>
        <qti-inline-choice identifier="mucousMembranes">moist mucous membranes</qti-inline-choice>
      </qti-inline-choice-interaction>.
    </p>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <qti-content-body>
        <p>When the heart can't pump well, fluid backs up into the lungs and builds up in the body. Fluid in the alveoli is heard as crackles, usually starting in the lung bases. A sudden weight gain is the most reliable sign of fluid retention, because 1 kg of weight is about 1 L of fluid, so a 2.3 kg gain in 2 days means the client is holding over 2 L of extra fluid. Together these findings show excess fluid volume. Moist mucous membranes, a regular heart rate, and a normal blood pressure don't point to deficient fluid volume, and a normal temperature doesn't suggest an infection. The client is showing signs of excess fluid volume as evidenced by crackles in both lung bases and a weight gain of 2.3 kg (5 lb) in 2 days.</p>
      </qti-content-body>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE">
      <qti-max>
        <qti-base-value base-type="float">0</qti-base-value>
        <qti-sum>
          <qti-base-value base-type="float">-2</qti-base-value>
          <qti-map-response identifier="RESPONSE"/>
          <qti-map-response identifier="RESPONSE_2"/>
          <qti-map-response identifier="RESPONSE_3"/>
        </qti-sum>
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

export const dropDownRationaleTriad: Sample = {
  id: 'nclex-drop-down-rationale-triad',
  name: 'Drop-Down: Rationale (Triad)',
  summary: 'NCLEX drop-down rationale (triad): choose a cause and two findings that support it, with a point for each correct finding once the cause is correct.',
  description,
  interactionTypes: ['inline-choice'],
  item,
};
