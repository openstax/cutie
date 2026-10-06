import type { Sample } from '../types';
import {
  correctResponse,
  outcomes,
  preferSelectedResponse,
  responseProcessingOrder,
  responseRequired,
  workedSolution,
} from './conventions';

const description = `\
A fill-in-the-blank question with a typed text answer: one \
\`qti-text-entry-interaction\` placed inline in a sentence.

${preferSelectedResponse}

- ${responseRequired}
- Score with a \`qti-mapping\` rather than \`qti-match\`. Mappings are \
case-insensitive by default, while \`qti-match\` on strings is case-sensitive. Add a \
\`qti-map-entry\` with \`mapped-value="1"\` for every acceptable answer (spelling \
variants, plurals, abbreviations) and set \`default-value="0"\`. Mark entries \
where case matters, such as unit or element symbols, \`case-sensitive="true"\`.
- \`SCORE\` is 1 when \`qti-map-response\` equals 1, otherwise 0. The \
correct/incorrect feedback condition uses the same check.
- ${workedSolution}
- ${responseProcessingOrder}
- ${correctResponse} Put the main answer in \`qti-correct-response\`.
- ${outcomes}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-text-entry" title="SI Unit of Force"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>newton</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="newton" mapped-value="1"/>
      <qti-map-entry map-key="newtons" mapped-value="1"/>
      <qti-map-entry map-key="N" mapped-value="1" case-sensitive="true"/>
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
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

  <qti-item-body>
    <p>The SI unit of force, equal to one kilogram meter per second squared, is the <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="10" pattern-mask=".+" data-patternmask-message="Response required"/>.</p>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_correct" show-hide="show">
      <p>Newton's second law says force equals mass times acceleration (F = ma). Multiplying the SI unit of mass (kg) by the SI unit of acceleration (m/s²) gives kg·m/s². This combination is named the newton (N) after Isaac Newton.</p>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_incorrect" show-hide="show">
      <p>Start from Newton's second law, F = ma. The SI unit of mass is the kilogram and the SI unit of acceleration is meters per second squared, so the unit of force is kg·m/s². That derived unit is named the newton (N) after Isaac Newton.</p>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-equal>
          <qti-map-response identifier="RESPONSE"/>
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-equal>
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
        <qti-equal>
          <qti-map-response identifier="RESPONSE"/>
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-equal>
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

export const textEntry: Sample = {
  id: 'text-entry',
  name: 'Text Entry',
  description,
  interactionTypes: ['text-entry'],
  item,
};
