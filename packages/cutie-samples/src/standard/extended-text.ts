import type { Sample } from '../types';

const description = `\
An open-response question graded by an instructor: \`qti-extended-text-interaction\` \
with the question in a \`qti-prompt\` and \`format="plain"\`.

- Set \`min-strings="1"\` so a response is required before submitting.
- Always show a character counter that signals the expected response size: set \
\`expected-length\` to the suggested number of characters and add \
\`class="qti-counter-up"\`. This is a soft hint, not a limit. When a hard cap is \
really needed, use \`data-max-characters\` instead, which turns on a counter that \
counts down and stops input at the limit.
- The response has no correct value, so don't declare a \`qti-correct-response\` \
or response processing. Declare \`SCORE\` with \`external-scored="human"\` and a \
\`normal-maximum\` for the points available.
- Don't include built-in feedback or a rubric. The grader's comments are the \
feedback for this type of question.`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-extended-text" title="Classical and Operant Conditioning"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"
    external-scored="human" normal-maximum="1"/>

  <qti-item-body>
    <qti-extended-text-interaction response-identifier="RESPONSE" format="plain"
      min-strings="1" expected-length="600" class="qti-counter-up">
      <qti-prompt>Explain the difference between classical conditioning and operant conditioning. Give one everyday example of each.</qti-prompt>
    </qti-extended-text-interaction>
  </qti-item-body>
</qti-assessment-item>`;

export const extendedText: Sample = {
  id: 'extended-text',
  name: 'Extended Text',
  description,
  interactionTypes: ['extended-text'],
  item,
};
