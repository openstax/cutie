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
A multi-select ("select all that apply") question: \`qti-choice-interaction\` with \
a \`multiple\` cardinality response and the question in a \`qti-prompt\`. Any number \
of choices is fine.

- Set \`min-choices="1"\` so at least one choice must be selected before submitting.
- \`max-choices\` is at the author's discretion. \`max-choices="0"\` allows any number \
of selections. Setting it to the number of correct answers makes the delivery \
system show a validation hint that reveals how many answers to pick, which is \
sometimes desirable.
- ${shuffle}
- Every choice ends with its own \`qti-feedback-block\` with identifier \
\`RESPONSE_choice_<choiceId>\`, shown when that choice is selected, so several can \
show at once. The text is in italics and explains why that specific choice is right \
or wrong. It has no \`data-feedback-type\` and no "Correct"/"Incorrect" prefix; the \
delivery system presents the verdict.
- ${workedSolution}
- ${allOrNothingMatch} The response must contain exactly the correct set of choices.
- Each per-choice feedback condition uses \`qti-member\` to check whether the choice \
identifier is in the response.
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}

**Alternative (penalty for wrong picks):** when wrong selections should cost \
credit, add a \`qti-mapping\` to the response declaration with positive values for \
correct choices, negative values for incorrect choices, and \`lower-bound="0"\`. Set \
\`SCORE\` from \`qti-map-response\` and decide the correct/incorrect feedback with \
\`qti-equal\` between \`qti-map-response\` and the maximum mapped score. Partially \
correct responses still receive \`RESPONSE_incorrect\`.`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-choice-multiple" title="Physical and Chemical Changes"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
      <qti-value>choiceB</qti-value>
      <qti-value>choiceE</qti-value>
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
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="true" min-choices="1" max-choices="0">
      <qti-prompt>Which of the following are physical changes? Select all that apply.</qti-prompt>
      <qti-simple-choice identifier="choiceA">
        Ice melting into liquid water
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceA" show-hide="show">
          <p><em>Melting changes water from a solid to a liquid, but the molecules are still H₂O. A change of state is a physical change.</em></p>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceB">
        Sugar dissolving in water
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceB" show-hide="show">
          <p><em>Dissolved sugar molecules spread out among the water molecules but stay sugar. Evaporating the water gets the sugar back, so this is a physical change.</em></p>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceC">
        Iron rusting
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceC" show-hide="show">
          <p><em>Rusting is a chemical change. Iron reacts with oxygen and water to form iron oxide, a new substance with different properties.</em></p>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceD">
        Wood burning
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceD" show-hide="show">
          <p><em>Burning is a chemical change. Combustion turns the wood into carbon dioxide, water vapor, and ash, which can't be turned back into wood.</em></p>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceE">
        Cutting paper into pieces
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceE" show-hide="show">
          <p><em>Cutting changes the size and shape of the paper, but each piece is still paper. Changes to size or shape are physical changes.</em></p>
        </qti-feedback-block>
      </qti-simple-choice>
    </qti-choice-interaction>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_correct" show-hide="show">
      <p>To sort each change, ask whether a new substance forms. In a physical change, the substance keeps its chemical identity even though its state, size, or shape changes. Melting ice, dissolving sugar, and cutting paper all leave the original substance intact. In a chemical change, atoms rearrange into new substances. Rusting iron and burning wood both form new substances, so they are chemical changes.</p>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_incorrect" show-hide="show">
      <p>For each change, ask whether a new substance forms. If the substance keeps its chemical identity and only its state, size, or shape changes, it is a physical change. Melting ice, dissolving sugar, and cutting paper fit that description. If atoms rearrange into new substances with different properties, it is a chemical change. Rusting iron forms iron oxide, and burning wood forms carbon dioxide, water, and ash. The physical changes are melting ice, dissolving sugar, and cutting paper.</p>
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

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceA</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceA</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceB</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceB</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceC</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceC</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceD</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceD</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceE</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceE</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

export const choiceMultiple: Sample = {
  id: 'choice-multiple',
  name: 'Multiple Choice (Select All)',
  summary: 'Select all that apply: pick every correct answer from a list of options.',
  description,
  interactionTypes: ['choice'],
  item,
};
