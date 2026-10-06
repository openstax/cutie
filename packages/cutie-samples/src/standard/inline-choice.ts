import type { Sample } from '../types';
import {
  allOrNothingMatch,
  correctResponse,
  outcomes,
  responseProcessingOrder,
  shuffle,
  workedSolution,
} from './conventions';

const description = `\
A drop-down question: one \`qti-inline-choice-interaction\` placed inline in a \
sentence, with \`required="true"\` so a selection must be made before submitting.

- ${shuffle}
- Options contain plain text only. Don't add per-option feedback to inline \
interactions.
- ${workedSolution}
- ${allOrNothingMatch}
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-inline-choice" title="Law of Demand"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>decreases</qti-value>
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
      According to the law of demand, when the price of a good rises and all other factors stay the same, the quantity demanded
      <qti-inline-choice-interaction response-identifier="RESPONSE" shuffle="true" required="true">
        <qti-inline-choice identifier="increases">increases</qti-inline-choice>
        <qti-inline-choice identifier="decreases">decreases</qti-inline-choice>
        <qti-inline-choice identifier="unchanged">stays the same</qti-inline-choice>
      </qti-inline-choice-interaction>.
    </p>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <p>The law of demand describes an inverse relationship between price and quantity demanded: as one goes up, the other goes down. When a good's price rises, some buyers switch to cheaper substitutes and others can afford less of it. The phrase "all other factors stay the same" tells you the demand curve itself doesn't shift, so the higher price moves you up and to the left along the curve. The quantity demanded decreases.</p>
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

export const inlineChoice: Sample = {
  id: 'inline-choice',
  name: 'Inline Choice (Drop-down)',
  summary: 'Pick the correct word or phrase from a drop-down within a sentence.',
  description,
  interactionTypes: ['inline-choice'],
  item,
};
