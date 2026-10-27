import type { Sample } from '../types.js';
import {
  allOrNothingMatch,
  correctResponse,
  outcomes,
  responseProcessingOrder,
  responseRequired,
  workedSolution,
} from './conventions.js';

const description = `\
A question with a numeric answer: one \`qti-text-entry-interaction\` placed inline \
in a sentence, with the units outside the field. Text entry is the right \
interaction for simple numeric input; for anything resembling a formula, use an \
extended text interaction with the formula extension instead.

- Declare the response with \`base-type="float"\` (or \`"integer"\` for whole \
numbers). The delivery system then renders a numeric input.
- ${responseRequired}
- ${allOrNothingMatch} Write the question so it has one exact answer, for example \
by stating the precision to round to.
- ${workedSolution}
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-text-entry-numeric" title="Average Speed"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="float">
    <qti-correct-response>
      <qti-value>62.5</qti-value>
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
    <p>A cyclist rides 25 kilometers in 0.4 hours. What is the cyclist's average speed?</p>
    <p><qti-text-entry-interaction response-identifier="RESPONSE" expected-length="6" pattern-mask=".+" data-patternmask-message="Response required"/> km/h</p>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <p>Average speed is total distance divided by total time: v = d / t. Here d = 25 km and t = 0.4 h, so v = 25 / 0.4 = 62.5 km/h. A common mistake is to multiply distance by time instead of dividing. To check the answer, multiply it by the time: 62.5 × 0.4 = 25 km, which matches the distance traveled.</p>
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

export const textEntryNumeric: Sample = {
  id: 'text-entry-numeric',
  name: 'Text Entry (Numeric)',
  summary: 'Type a single numeric answer, such as the result of a calculation.',
  description,
  interactionTypes: ['text-entry'],
  item,
};
