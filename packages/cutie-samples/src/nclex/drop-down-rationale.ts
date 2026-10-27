import {
  allOrNothingMultiple,
  correctResponse,
  outcomes,
  responseProcessingOrder,
  shuffle,
  workedSolution,
} from '../standard/conventions.js';
import type { Sample } from '../types.js';
import { clinicalScenario, rationaleDyad } from './conventions.js';

const description = `\
NCLEX drop-down rationale: one sentence that links a cause to its effect, such as \
"The client is at highest risk for ___ as evidenced by ___." The cause blank is a \
\`qti-inline-choice-interaction\` with response identifier \`RESPONSE\` and the \
effect blank uses \`RESPONSE_2\`, both inline in the sentence with \
\`required="true"\`. Use 3 to 5 options per drop-down. Each effect option should \
be a finding from the scenario.

- ${rationaleDyad}
- ${clinicalScenario}
- ${shuffle}
- Options contain plain text only. Don't add per-option feedback to inline \
interactions.
- ${workedSolution}
- ${allOrNothingMultiple} Each drop-down's check is \`qti-match\` against its \
\`qti-correct\`.
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-nclex-drop-down-rationale" title="Swallow Screening After a Stroke"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>aspiration</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_2" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>wetVoice</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>1.0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

  <qti-item-body>
    <p>A client had an ischemic stroke 2 days ago and has weakness on the right side of the body. The client turns in bed with help from one person and voided 350 mL of clear yellow urine an hour ago. During a bedside swallow screen, the client coughs and the voice sounds wet after each sip of water. Complete the following sentence by choosing from the lists of options.</p>
    <p>
      The client is at highest risk for
      <qti-inline-choice-interaction response-identifier="RESPONSE" shuffle="true" required="true">
        <qti-inline-choice identifier="aspiration">aspiration</qti-inline-choice>
        <qti-inline-choice identifier="urinaryRetention">urinary retention</qti-inline-choice>
        <qti-inline-choice identifier="pressureInjury">a pressure injury</qti-inline-choice>
      </qti-inline-choice-interaction>
      as evidenced by
      <qti-inline-choice-interaction response-identifier="RESPONSE_2" shuffle="true" required="true">
        <qti-inline-choice identifier="wetVoice">coughing and a wet voice after sips of water</qti-inline-choice>
        <qti-inline-choice identifier="rightWeakness">weakness on the right side of the body</qti-inline-choice>
        <qti-inline-choice identifier="voiding">voiding 350 mL of urine</qti-inline-choice>
      </qti-inline-choice-interaction>.
    </p>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <p>Dysphagia is common after a stroke, and a bedside swallow screen looks for signs that food or fluid is entering the airway. Coughing and a wet, gurgling voice after sips of water mean the client isn't protecting the airway, so the client is at highest risk for aspiration, which can lead to pneumonia. The client should stay NPO until a speech-language pathologist completes a full swallow evaluation. Right-sided weakness does raise the risk of a pressure injury, but the client can turn with help, and airway risks come first. Voiding 350 mL of clear urine shows the bladder is emptying, so urinary retention isn't supported. The client is at highest risk for aspiration as evidenced by coughing and a wet voice after sips of water.</p>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-and>
          <qti-match>
            <qti-variable identifier="RESPONSE"/>
            <qti-correct identifier="RESPONSE"/>
          </qti-match>
          <qti-match>
            <qti-variable identifier="RESPONSE_2"/>
            <qti-correct identifier="RESPONSE_2"/>
          </qti-match>
        </qti-and>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
    <qti-set-outcome-value identifier="FEEDBACK">
      <qti-multiple>
        <qti-variable identifier="FEEDBACK"/>
        <qti-base-value base-type="identifier">ITEM_completed</qti-base-value>
      </qti-multiple>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

export const dropDownRationale: Sample = {
  id: 'nclex-drop-down-rationale',
  name: 'Drop-Down: Rationale',
  summary: 'NCLEX drop-down rationale (dyad): choose a cause and the finding that supports it, both correct for credit.',
  description,
  interactionTypes: ['inline-choice'],
  item,
};
