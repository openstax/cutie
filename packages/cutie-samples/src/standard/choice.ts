/* spell-checker: ignore Golgi Lysosome */
import type { Sample } from '../types.js';
import {
  allOrNothingMatch,
  correctResponse,
  outcomes,
  responseProcessingOrder,
  shuffle,
  workedSolution,
} from './conventions.js';

const description = `\
A single-select multiple choice question: \`qti-choice-interaction\` with \
\`max-choices="1"\` and the question in a \`qti-prompt\`. Any number of choices is fine.

- Set \`min-choices="1"\` so a choice must be selected before submitting.
- ${shuffle}
- Every choice ends with its own \`qti-feedback-block\` with identifier \
\`RESPONSE_choice_<choiceId>\`, shown when that choice is selected. The text is in \
italics and explains why that specific choice is right or wrong (for example, the \
misconception it reflects). It has no \`data-feedback-type\` and no \
"Correct"/"Incorrect" prefix; the delivery system presents the verdict.
- ${workedSolution}
- ${allOrNothingMatch}
- Each per-choice feedback condition uses \`qti-match\` between the response and \
the choice identifier.
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-choice" title="Cellular Respiration Organelle"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
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
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="true" min-choices="1" max-choices="1">
      <qti-prompt>In a eukaryotic cell, which organelle produces most of the cell's ATP through cellular respiration?</qti-prompt>
      <qti-simple-choice identifier="choiceA">
        Mitochondrion
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceA" show-hide="show">
          <p><em>The citric acid cycle and the electron transport chain both take place in the mitochondrion, and together they produce most of the ATP made during cellular respiration.</em></p>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceB">
        Ribosome
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceB" show-hide="show">
          <p><em>Ribosomes use ATP to build proteins, but they don't produce it. Their job is translating mRNA into chains of amino acids.</em></p>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceC">
        Golgi apparatus
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceC" show-hide="show">
          <p><em>The Golgi apparatus modifies, sorts, and packages proteins and lipids for transport. It isn't involved in producing energy.</em></p>
        </qti-feedback-block>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceD">
        Lysosome
        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceD" show-hide="show">
          <p><em>Lysosomes break down waste and worn-out cell parts with digestive enzymes. Breaking molecules down there doesn't capture energy as ATP.</em></p>
        </qti-feedback-block>
      </qti-simple-choice>
    </qti-choice-interaction>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <p>Cellular respiration happens in three stages. Glycolysis takes place in the cytoplasm and makes only a small amount of ATP. The citric acid cycle runs in the mitochondrial matrix, and the electron transport chain sits on the inner mitochondrial membrane. Because oxidative phosphorylation along that membrane produces most of the cell's ATP, the answer is the mitochondrion, which is why it's often called the powerhouse of the cell.</p>
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
          <qti-base-value base-type="identifier">choiceA</qti-base-value>
        </qti-match>
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
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="identifier">choiceB</qti-base-value>
        </qti-match>
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
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="identifier">choiceC</qti-base-value>
        </qti-match>
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
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="identifier">choiceD</qti-base-value>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceD</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
    <qti-set-outcome-value identifier="FEEDBACK">
      <qti-multiple>
        <qti-variable identifier="FEEDBACK"/>
        <qti-base-value base-type="identifier">ITEM_completed</qti-base-value>
      </qti-multiple>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

export const choice: Sample = {
  id: 'choice',
  name: 'Single Choice',
  summary: 'Pick the one correct answer from a list of options.',
  description,
  interactionTypes: ['choice'],
  item,
};
