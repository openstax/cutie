// Scoring mode: sumScores
// Each response contributes independently to the total SCORE via qti-sum.
// See README.md "sumScores Mode" for full pattern documentation.

// Single Choice with Partial Credit via Mapping

export const name = "Single Choice - Partial Credit";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="choice-partial" title="Single Choice - Partial Credit"
adaptive="false" time-dependent="false" xml:lang="en">

  <!--
    This example demonstrates partial credit for a choice interaction using a mapping.
    Each choice has a weighted score: the best answer gets full credit, a plausible
    alternative gets partial credit, and the remaining options score zero.
  -->
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="choiceA" mapped-value="1"/>
      <qti-map-entry map-key="choiceB" mapped-value="0.5"/>
      <qti-map-entry map-key="choiceC" mapped-value="0"/>
      <qti-map-entry map-key="choiceD" mapped-value="0"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>1</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="true" min-choices="1" max-choices="1">
      <qti-prompt>Question prompt goes here. Select the best answer.</qti-prompt>
      <qti-simple-choice identifier="choiceA">Best answer (full credit)</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Partially correct answer (half credit)</qti-simple-choice>
      <qti-simple-choice identifier="choiceC">Wrong answer C (no credit)</qti-simple-choice>
      <qti-simple-choice identifier="choiceD">Wrong answer D (no credit)</qti-simple-choice>
    </qti-choice-interaction>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Correct!</strong> This is the most precise and complete answer to the question.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_partial" show-hide="show" data-feedback-type="info">
      <p><strong>Partially correct.</strong> This answer is on the right track but lacks precision. Consider what would make the answer more specific.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Incorrect.</strong> This answer reflects a common misconception. Review the key concepts and try again.</p>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <!-- Scoring: single mapped response via qti-sum > qti-map-response -->
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum>
        <qti-map-response identifier="RESPONSE"/>
      </qti-sum>
    </qti-set-outcome-value>

    <!-- Feedback: three-way (correct / partial / incorrect) via qti-map-response thresholds -->
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
      <qti-response-else-if>
        <qti-gt>
          <qti-map-response identifier="RESPONSE"/>
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-gt>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_partial</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else-if>
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

export const interactionTypes: string[] = ['choice'];
