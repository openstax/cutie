/* spell-checker: ignore leukemia thrombocytopenia */
import {
  allOrNothingMatch,
  correctResponse,
  outcomes,
  responseProcessingOrder,
  workedSolution,
} from '../standard/conventions.js';
import type { Sample } from '../types.js';
import { clinicalScenario, rationaleDyad, rationaleWordBanks } from './conventions.js';

const description = `\
NCLEX drag-and-drop rationale: one sentence that links a cause to its effect, \
such as "The client is at highest risk for ___ as evidenced by the ___." Use a \
\`qti-gap-match-interaction\` with a \`qti-prompt\`, a \`qti-gap-text\` for each \
option, and the sentence with a \`qti-gap\` for the cause (\`G1\`) and one for the \
effect (\`G2\`). The response is a \`multiple\` cardinality \`directedPair\` of \
"option gap" identifiers. Include 2 to 3 cause options and 2 to 3 effect options. \
Each effect option should be a finding from the scenario.

- ${rationaleDyad}
- ${clinicalScenario}
- ${rationaleWordBanks}
- Set \`shuffle="true"\` so the option bank order varies.
- Set \`match-max="1"\` on every \`qti-gap-text\`, so each option is used at most once.
- Set \`min-associations="2"\`, so both blanks must be filled before submitting.
- Don't add per-gap feedback.
- ${workedSolution}
- ${allOrNothingMatch} The response must contain exactly the correct pair for \
each gap.
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-nclex-drag-and-drop-rationale" title="Laboratory Results During Chemotherapy"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>bleeding G1</qti-value>
      <qti-value>platelets G2</qti-value>
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
    <p>A client with acute leukemia completed a cycle of chemotherapy 10 days ago. Today's laboratory results are a platelet count of 38,000/mm³, a white blood cell count of 6,200/mm³, and a hemoglobin of 12.8 g/dL.</p>
    <qti-gap-match-interaction response-identifier="RESPONSE" shuffle="true" min-associations="2">
      <qti-prompt>Complete the sentence by dragging an option into each blank.</qti-prompt>
      <qti-gap-text identifier="bleeding" match-max="1" match-group="cause">bleeding</qti-gap-text>
      <qti-gap-text identifier="infection" match-max="1" match-group="cause">infection</qti-gap-text>
      <qti-gap-text identifier="fatigue" match-max="1" match-group="cause">fatigue from anemia</qti-gap-text>
      <qti-gap-text identifier="platelets" match-max="1" match-group="effect">platelet count</qti-gap-text>
      <qti-gap-text identifier="whiteCells" match-max="1" match-group="effect">white blood cell count</qti-gap-text>
      <qti-gap-text identifier="hemoglobin" match-max="1" match-group="effect">hemoglobin</qti-gap-text>
      <h3 data-for-match-group="cause">Risk</h3>
      <h3 data-for-match-group="effect">Finding</h3>
      <p>
        The client is at highest risk for <qti-gap identifier="G1" match-group="cause"/> as evidenced by the <qti-gap identifier="G2" match-group="effect"/>.
      </p>
    </qti-gap-match-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <qti-content-body>
        <p>Chemotherapy suppresses the bone marrow, so check each result against its normal range to find which cell line is low. Platelets normally range from about 150,000 to 400,000/mm³, so 38,000/mm³ is thrombocytopenia, and the risk of bleeding rises sharply below 50,000/mm³. The white blood cell count of 6,200/mm³ is within the normal range of about 5,000 to 10,000/mm³, so infection risk isn't the main concern today. A hemoglobin of 12.8 g/dL is within normal limits, so anemia doesn't explain fatigue here. The client is at highest risk for bleeding as evidenced by the platelet count.</p>
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

export const dragAndDropRationale: Sample = {
  id: 'nclex-drag-and-drop-rationale',
  name: 'Drag-and-Drop: Rationale',
  summary: 'NCLEX drag-and-drop rationale (dyad): drag a cause and the finding that supports it from separate word banks into a sentence, both correct for credit.',
  description,
  interactionTypes: ['gap-match'],
  item,
};
