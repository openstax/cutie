import type { Sample } from '../types.js';
import {
  allOrNothingMultiple,
  correctResponse,
  outcomes,
  responseProcessingOrder,
  shuffle,
  workedSolution,
} from './conventions.js';

const description = `\
A question with several drop-downs: one \`qti-inline-choice-interaction\` per \
blank, each placed inline in the text with \`required="true"\`, and response \
identifiers \`RESPONSE\`, \`RESPONSE_2\`, \`RESPONSE_3\`, and so on.

- ${shuffle}
- Options contain plain text only. Don't add per-option feedback to inline \
interactions.
- ${allOrNothingMultiple} Each drop-down's check is \`qti-match\` against its \
\`qti-correct\`.
- ${workedSolution}
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-inline-choice-multiple" title="Newton's First Law"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>first</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_2" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>netForce</qti-value>
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
    <p>
      Newton's
      <qti-inline-choice-interaction response-identifier="RESPONSE" shuffle="true" required="true">
        <qti-inline-choice identifier="first">first</qti-inline-choice>
        <qti-inline-choice identifier="second">second</qti-inline-choice>
        <qti-inline-choice identifier="third">third</qti-inline-choice>
      </qti-inline-choice-interaction>
      law states that an object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless it is acted on by a
      <qti-inline-choice-interaction response-identifier="RESPONSE_2" shuffle="true" required="true">
        <qti-inline-choice identifier="netForce">net external force</qti-inline-choice>
        <qti-inline-choice identifier="mass">change in mass</qti-inline-choice>
        <qti-inline-choice identifier="gravity">gravitational field</qti-inline-choice>
      </qti-inline-choice-interaction>.
    </p>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <p>Newton's first law, sometimes called the law of inertia, says an object's velocity changes only when a net external force acts on it. An object at rest stays at rest, and an object in motion keeps moving at the same speed in the same direction. A change in mass doesn't change velocity, and a gravitational field matters only when it produces a net force. So the sentence describes Newton's first law, and the condition is a net external force.</p>
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

export const inlineChoiceMultiple: Sample = {
  id: 'inline-choice-multiple',
  name: 'Inline Choice (Multiple Drop-downs)',
  summary: 'Complete several blanks in a passage, each with its own drop-down.',
  description,
  interactionTypes: ['inline-choice'],
  item,
};
