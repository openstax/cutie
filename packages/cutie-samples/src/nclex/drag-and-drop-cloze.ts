import {
  correctResponse,
  outcomes,
  responseProcessingOrder,
  workedSolution,
} from '../standard/conventions.js';
import type { Sample } from '../types.js';
import { cappedSumMapResponses, clinicalScenario, maxScore, zeroOneMappedScoring } from './conventions.js';

const description = `\
NCLEX drag-and-drop cloze: \`qti-gap-match-interaction\` with a \`qti-prompt\`, a \
\`qti-gap-text\` for each option in the bank, and the passage with a \`qti-gap\` \
for each blank. The response is a \`multiple\` cardinality \`directedPair\` of \
"option gap" identifiers. Include more options than blanks.

- ${clinicalScenario}
- Set \`shuffle="true"\` so the option bank order varies.
- Set \`match-max="1"\` on every \`qti-gap-text\`, so each option is used at most once.
- Set \`min-associations\` to the number of gaps, so every blank must be filled \
before submitting.
- Don't add per-gap feedback.
- ${workedSolution}
- ${zeroOneMappedScoring} The map keys are the correct "option gap" pairs, and \
\`upper-bound\` is the number of gaps.
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
identifier="sample-nclex-drag-and-drop-cloze" title="Isolation for Tuberculosis"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>airborne G1</qti-value>
      <qti-value>negativePressure G2</qti-value>
      <qti-value>respirator G3</qti-value>
    </qti-correct-response>
    <qti-mapping lower-bound="0" upper-bound="3" default-value="0">
      <qti-map-entry map-key="airborne G1" mapped-value="1"/>
      <qti-map-entry map-key="negativePressure G2" mapped-value="1"/>
      <qti-map-entry map-key="respirator G3" mapped-value="1"/>
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
    <p>A client is admitted with a 3-week history of cough, night sweats, and weight loss. The provider suspects pulmonary tuberculosis and orders sputum testing.</p>
    <qti-gap-match-interaction response-identifier="RESPONSE" shuffle="true" min-associations="3">
      <qti-prompt>Complete the sentence by dragging an option into each blank.</qti-prompt>
      <qti-gap-text identifier="airborne" match-max="1">airborne</qti-gap-text>
      <qti-gap-text identifier="droplet" match-max="1">droplet</qti-gap-text>
      <qti-gap-text identifier="contact" match-max="1">contact</qti-gap-text>
      <qti-gap-text identifier="negativePressure" match-max="1">negative-pressure</qti-gap-text>
      <qti-gap-text identifier="positivePressure" match-max="1">positive-pressure</qti-gap-text>
      <qti-gap-text identifier="respirator" match-max="1">fit-tested N95 respirator</qti-gap-text>
      <qti-gap-text identifier="surgicalMask" match-max="1">surgical mask</qti-gap-text>
      <p>
        Until tuberculosis is ruled out, the nurse places the client on <qti-gap identifier="G1"/> precautions
        in a <qti-gap identifier="G2"/> room and wears a <qti-gap identifier="G3"/> when entering the room.
      </p>
    </qti-gap-match-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <qti-content-body>
        <p>Tuberculosis spreads through tiny airborne particles that stay suspended in the air and travel on air currents, so the client needs airborne precautions rather than droplet or contact precautions. An airborne infection isolation room uses negative pressure, which pulls air into the room and vents it outside so the particles can't drift into the hallway; positive pressure would push them out. A surgical mask doesn't filter particles this small, so staff wear a fit-tested N95 respirator. The nurse places the client on airborne precautions in a negative-pressure room and wears a fit-tested N95 respirator.</p>
      </qti-content-body>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE">
      <qti-min>
        <qti-base-value base-type="float">3</qti-base-value>
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

export const dragAndDropCloze: Sample = {
  id: 'nclex-drag-and-drop-cloze',
  name: 'Drag-and-Drop: Cloze',
  summary: 'NCLEX drag-and-drop cloze: drag options from a bank into the blanks of a passage, scored +1 for each correct blank.',
  description,
  interactionTypes: ['gap-match'],
  item,
};
