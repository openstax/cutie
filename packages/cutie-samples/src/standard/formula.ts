import type { Sample } from '../types';
import {
  allOrNothingMatch,
  correctResponse,
  outcomes,
  responseProcessingOrder,
  workedSolution,
} from './conventions';

const description = `\
A question with a math expression as the answer: \`qti-extended-text-interaction\` \
using the formula extension. Use this instead of text entry for anything resembling \
a formula.

- Declare the response with \`base-type="string"\`, \
\`data-response-type="formula"\`, and a \`data-comparison-mode\`. The \
\`qti-correct-response\` holds the expected expression.
- Set \`min-strings="1"\` on the interaction so a response is required.
- Choose the comparison mode based on what the question tests:
  - \`canonical\` (shown here): order doesn't matter, but the expression isn't \
simplified. For "expand" or "simplify" questions, this accepts \`6 + 2x\` for \
\`2x + 6\`, but not the unexpanded \`2(x + 3)\`.
  - \`algebraic\`: any mathematically equivalent form is accepted. Use it when \
the form of the answer doesn't matter.
  - \`strict\`: the expression must match exactly, including term order. Use it \
only when the exact form is what's being tested.
- ${allOrNothingMatch} The formula comparison mode is applied inside \`qti-match\`.
- ${workedSolution}
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-formula" title="Distributive Property"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"
    data-response-type="formula" data-comparison-mode="canonical">
    <qti-correct-response>
      <qti-value>2x+6</qti-value>
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
    <qti-extended-text-interaction response-identifier="RESPONSE" min-strings="1">
      <qti-prompt>Use the distributive property to expand 2(x + 3).</qti-prompt>
    </qti-extended-text-interaction>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_correct" show-hide="show">
      <p>The distributive property says a(b + c) = ab + ac. Multiply the 2 by each term inside the parentheses: 2 · x = 2x and 2 · 3 = 6. Adding the products gives 2x + 6.</p>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_incorrect" show-hide="show">
      <p>The distributive property says a(b + c) = ab + ac, so the 2 outside the parentheses multiplies every term inside. First, 2 · x = 2x. Next, 2 · 3 = 6. Adding the products gives 2x + 6. A common mistake is multiplying only the first term, which gives 2x + 3.</p>
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

    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-correct identifier="RESPONSE"/>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_correct</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_incorrect</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

export const formula: Sample = {
  id: 'formula',
  name: 'Formula Entry',
  summary: 'Enter a math expression as the answer, scored by comparison to the expected expression.',
  description,
  interactionTypes: ['extended-text'],
  item,
};
