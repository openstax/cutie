/* spell-checker: ignore stomata */
import type { Sample } from '../types.js';
import {
  allOrNothingMatch,
  correctResponse,
  outcomes,
  pairMappingAlternative,
  responseProcessingOrder,
  workedSolution,
} from './conventions.js';

const description = `\
A fill-in-the-blank question with a word bank: \`qti-gap-match-interaction\` with \
a \`qti-prompt\`, a \`qti-gap-text\` for each word in the bank, and the passage \
with a \`qti-gap\` for each blank. The response is a \`multiple\` cardinality \
\`directedPair\` of "word gap" identifiers.

Gap match is the preferred interaction for fill-in-the-blank questions; it is much \
more reliable to score than free-text entry.

- Set \`shuffle="true"\` so the word bank order varies.
- Set \`match-max="1"\` on every \`qti-gap-text\`, so each word is used at most once.
- Set \`min-associations\` to the number of gaps, so every blank must be filled \
before submitting.
- Distractor words that don't belong in any blank are optional. Include them \
depending on how difficult the question should be.
- Don't add per-gap feedback.
- ${workedSolution}
- ${allOrNothingMatch} The response must contain exactly the correct set of pairs.
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}

${pairMappingAlternative}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-gap-match" title="Inputs and Outputs of Photosynthesis"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>carbonDioxide G1</qti-value>
      <qti-value>water G2</qti-value>
      <qti-value>oxygen G3</qti-value>
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
    <qti-gap-match-interaction response-identifier="RESPONSE" shuffle="true" min-associations="3">
      <qti-prompt>Drag the correct term into each blank to complete the description of photosynthesis.</qti-prompt>
      <qti-gap-text identifier="carbonDioxide" match-max="1">carbon dioxide</qti-gap-text>
      <qti-gap-text identifier="water" match-max="1">water</qti-gap-text>
      <qti-gap-text identifier="oxygen" match-max="1">oxygen</qti-gap-text>
      <qti-gap-text identifier="nitrogen" match-max="1">nitrogen</qti-gap-text>
      <p>
        During photosynthesis, a plant takes in <qti-gap identifier="G1"/> from the air through its stomata
        and absorbs <qti-gap identifier="G2"/> from the soil through its roots. Using energy from sunlight,
        it produces glucose and releases <qti-gap identifier="G3"/> as a byproduct.
      </p>
    </qti-gap-match-interaction>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <p>Start from the overall equation for photosynthesis: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. The reactants are carbon dioxide and water. Carbon dioxide is a gas, so it enters the leaf from the air through small pores called stomata, while water is absorbed by the roots and carried up to the leaves. The light-dependent reactions split water molecules, releasing oxygen as a byproduct. Nitrogen doesn't appear in the equation at all.</p>
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

export const gapMatch: Sample = {
  id: 'gap-match',
  name: 'Gap Match',
  summary: 'Fill the blanks in a passage by dragging words from a word bank; the preferred fill-in-the-blank format.',
  description,
  interactionTypes: ['gap-match'],
  item,
};
