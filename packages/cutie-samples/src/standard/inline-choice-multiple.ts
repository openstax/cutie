import type { Sample } from '../types';
import {
  allOrNothingMultiple,
  correctResponse,
  outcomes,
  shuffle,
} from './conventions';

// TODO: add item-level worked solution feedback (shown for correct and
// incorrect responses) once that feedback type is available in the standard
// pattern. Per-response RESPONSE_correct / RESPONSE_incorrect blocks can't
// express a verdict on the whole item.

const description = `\
A question with several drop-downs: one \`qti-inline-choice-interaction\` per \
blank, each placed inline in the text with \`required="true"\`, and response \
identifiers \`RESPONSE\`, \`RESPONSE_2\`, \`RESPONSE_3\`, and so on.

- ${shuffle}
- Options contain plain text only. Don't add per-option feedback to inline \
interactions.
- ${allOrNothingMultiple} Each drop-down's check is \`qti-match\` against its \
\`qti-correct\`.
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
  </qti-response-processing>
</qti-assessment-item>`;

export const inlineChoiceMultiple: Sample = {
  id: 'inline-choice-multiple',
  name: 'Inline Choice (Multiple Drop-downs)',
  description,
  interactionTypes: ['inline-choice'],
  item,
};
