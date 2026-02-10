// Scoring mode: sumScores
// Each response contributes independently to the total SCORE via qti-sum.
// See README.md "sumScores Mode" for full pattern documentation.

// Multiple Inline Choice Interactions in Flowing Text

export const name = "Inline Choice - Multiple";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="inline-choice-multi" title="Inline Choice - Multiple in Paragraph"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>photosynthesis</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_2" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>sunlight</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_3" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>oxygen</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="RESPONSE_SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="RESPONSE_2_SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="RESPONSE_3_SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>3</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

  <qti-item-body>
    <p>Select the correct words to complete the paragraph about plant biology.</p>
    <p>
      Plants produce their own food through a process called
      <qti-inline-choice-interaction response-identifier="RESPONSE" shuffle="true">
        <qti-inline-choice identifier="photosynthesis">photosynthesis</qti-inline-choice>
        <qti-inline-choice identifier="respiration">respiration</qti-inline-choice>
        <qti-inline-choice identifier="fermentation">fermentation</qti-inline-choice>
      </qti-inline-choice-interaction>.
      This process converts carbon dioxide and water into glucose using energy from
      <qti-inline-choice-interaction response-identifier="RESPONSE_2" shuffle="true">
        <qti-inline-choice identifier="sunlight">sunlight</qti-inline-choice>
        <qti-inline-choice identifier="soil">soil</qti-inline-choice>
        <qti-inline-choice identifier="wind">wind</qti-inline-choice>
      </qti-inline-choice-interaction>.
      As a byproduct, plants release
      <qti-inline-choice-interaction response-identifier="RESPONSE_3" shuffle="true">
        <qti-inline-choice identifier="oxygen">oxygen</qti-inline-choice>
        <qti-inline-choice identifier="nitrogen">nitrogen</qti-inline-choice>
        <qti-inline-choice identifier="methane">methane</qti-inline-choice>
      </qti-inline-choice-interaction>
      into the atmosphere, which is essential for animal life.
    </p>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Part 1: Correct!</strong> The process by which plants produce their own food is indeed photosynthesis.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Part 1: Incorrect.</strong> Think about the process that uses light to convert carbon dioxide and water into glucose.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_2_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Part 2: Correct!</strong> Sunlight provides the energy that drives photosynthesis.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_2_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Part 2: Incorrect.</strong> Consider what energy source plants absorb through their leaves to power the conversion of carbon dioxide and water.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_3_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Part 3: Correct!</strong> Oxygen is the byproduct of photosynthesis that is essential for animal life.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_3_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Part 3: Incorrect.</strong> Think about what gas is released as a byproduct of photosynthesis and is vital for animal respiration.</p>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <!-- Intermediate scores: unmapped responses use {id}_SCORE variables via qti-match -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-correct identifier="RESPONSE"/>
        </qti-match>
        <qti-set-outcome-value identifier="RESPONSE_SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="RESPONSE_SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>

    <!-- Intermediate score for RESPONSE_2 -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE_2"/>
          <qti-correct identifier="RESPONSE_2"/>
        </qti-match>
        <qti-set-outcome-value identifier="RESPONSE_2_SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="RESPONSE_2_SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>

    <!-- Intermediate score for RESPONSE_3 -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE_3"/>
          <qti-correct identifier="RESPONSE_3"/>
        </qti-match>
        <qti-set-outcome-value identifier="RESPONSE_3_SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="RESPONSE_3_SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>

    <!-- Sum: intermediate scores are summed into SCORE -->
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum>
        <qti-variable identifier="RESPONSE_SCORE"/>
        <qti-variable identifier="RESPONSE_2_SCORE"/>
        <qti-variable identifier="RESPONSE_3_SCORE"/>
      </qti-sum>
    </qti-set-outcome-value>

    <!-- Feedback for RESPONSE -->
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

    <!-- Feedback for RESPONSE_2 -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE_2"/>
          <qti-correct identifier="RESPONSE_2"/>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_2_correct</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_2_incorrect</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>

    <!-- Feedback for RESPONSE_3 -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE_3"/>
          <qti-correct identifier="RESPONSE_3"/>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_3_correct</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_3_incorrect</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['inline-choice'];
