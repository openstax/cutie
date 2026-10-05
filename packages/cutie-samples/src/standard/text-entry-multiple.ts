import type { Sample } from '../types';
import {
  allOrNothingMultiple,
  correctResponse,
  outcomes,
  preferSelectedResponse,
  responseRequired,
} from './conventions';

// TODO: add item-level worked solution feedback (shown for correct and
// incorrect responses) once that feedback type is available in the standard
// pattern. Per-response RESPONSE_correct / RESPONSE_incorrect blocks can't
// express a verdict on the whole item.

const description = `\
A fill-in-the-blank question with several typed blanks: one \
\`qti-text-entry-interaction\` per blank, each placed inline in the text, with \
response identifiers \`RESPONSE\`, \`RESPONSE_2\`, \`RESPONSE_3\`, and so on.

${preferSelectedResponse}

- Each blank follows the single text entry rules: ${responseRequired}
- Score each text blank with a case-insensitive \`qti-mapping\` that has a \
\`qti-map-entry\` with \`mapped-value="1"\` for every acceptable answer and \
\`default-value="0"\`. A blank counts as correct when its \`qti-map-response\` \
equals 1.
- ${allOrNothingMultiple}
- ${correctResponse}
- ${outcomes}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-text-entry-multiple" title="Composition of Water"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>hydrogen</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="hydrogen" mapped-value="1"/>
      <qti-map-entry map-key="H" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_2" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>oxygen</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="oxygen" mapped-value="1"/>
      <qti-map-entry map-key="O" mapped-value="1"/>
    </qti-mapping>
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
    <p>Complete the sentence about the chemical formula of water, H₂O.</p>
    <p>Each water molecule contains two atoms of <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="10" pattern-mask=".+" data-patternmask-message="Response required"/> bonded to one atom of <qti-text-entry-interaction response-identifier="RESPONSE_2" expected-length="10" pattern-mask=".+" data-patternmask-message="Response required"/>.</p>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-and>
          <qti-equal>
            <qti-map-response identifier="RESPONSE"/>
            <qti-base-value base-type="float">1</qti-base-value>
          </qti-equal>
          <qti-equal>
            <qti-map-response identifier="RESPONSE_2"/>
            <qti-base-value base-type="float">1</qti-base-value>
          </qti-equal>
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

export const textEntryMultiple: Sample = {
  id: 'text-entry-multiple',
  name: 'Text Entry (Multiple Blanks)',
  description,
  interactionTypes: ['text-entry'],
  item,
};
