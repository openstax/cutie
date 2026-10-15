/* spell-checker: ignore nontender hottext */
import {
  correctResponse,
  outcomes,
  responseProcessingOrder,
  workedSolution,
} from '../standard/conventions.js';
import type { Sample } from '../types.js';
import { clinicalScenario, maxScore, plusMinusScoring, sumMapResponses } from './conventions.js';

const description = `\
NCLEX text highlight, passage: \`qti-hottext-interaction\` with a \`multiple\` \
cardinality response, \`min-choices="1"\`, and \`max-choices="0"\`. A \
\`qti-prompt\` asks the learner to highlight the findings that meet a condition, \
such as requiring follow-up. The passage, often nurses' notes, follows in \
paragraphs inside the interaction.

- ${clinicalScenario}
- Wrap each finding in its own \`qti-hottext\`, including findings that are \
normal or expected, so the learner has to judge every one. Keep the text around \
the findings short; it can't be selected.
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
identifier="sample-nclex-highlight-passage" title="Nurses' Notes After Knee Replacement"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>rightCalf</qti-value>
      <qti-value>shortnessOfBreath</qti-value>
      <qti-value>oxygenSaturation</qti-value>
    </qti-correct-response>
    <qti-mapping lower-bound="0" upper-bound="3" default-value="-1">
      <qti-map-entry map-key="rightCalf" mapped-value="1"/>
      <qti-map-entry map-key="shortnessOfBreath" mapped-value="1"/>
      <qti-map-entry map-key="oxygenSaturation" mapped-value="1"/>
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
    <p>A client had a right total knee replacement 2 days ago. The nurse reviews the morning entry in the nurses' notes.</p>
    <qti-hottext-interaction response-identifier="RESPONSE" min-choices="1" max-choices="0">
      <qti-prompt>Highlight the findings that require follow-up.</qti-prompt>
      <p>
        0800: <qti-hottext identifier="pain">Reports incision pain of 3 on a 0 to 10 scale after an oral analgesic.</qti-hottext>
        <qti-hottext identifier="incision">Incision edges are approximated with no drainage.</qti-hottext>
        <qti-hottext identifier="rightCalf">Right calf is warm, swollen, and tender to touch.</qti-hottext>
        <qti-hottext identifier="leftCalf">Left calf is soft and nontender.</qti-hottext>
        <qti-hottext identifier="ambulation">Walked 20 m in the hallway with a walker.</qti-hottext>
        <qti-hottext identifier="shortnessOfBreath">Reports new shortness of breath when walking back to bed.</qti-hottext>
        <qti-hottext identifier="oxygenSaturation">Oxygen saturation 90% on room air, down from 97% yesterday.</qti-hottext>
        <qti-hottext identifier="bowelSounds">Bowel sounds active in all four quadrants.</qti-hottext>
      </p>
    </qti-hottext-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <p>After a knee replacement, the client is at high risk for venous thromboembolism, so look for cues of a deep vein thrombosis and of a pulmonary embolism. A right calf that is warm, swollen, and tender on the surgical side suggests a deep vein thrombosis. New shortness of breath with exertion and an oxygen saturation that dropped from 97% to 90% suggest a clot may have traveled to the lungs. These need prompt follow-up. Mild pain controlled by an oral analgesic, a closed incision with no drainage, a soft left calf, walking with a walker, and active bowel sounds are all expected on day 2. The findings that require follow-up are the warm, swollen, tender right calf, the new shortness of breath, and the oxygen saturation of 90%.</p>
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

export const highlightPassage: Sample = {
  id: 'nclex-highlight-passage',
  name: 'Text Highlight: Passage',
  summary: 'NCLEX text highlight: select the findings in a passage such as nurses\' notes, scored +1 for each correct and -1 for each incorrect selection.',
  description,
  interactionTypes: ['hottext'],
  item,
};
