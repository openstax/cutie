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
      <qti-prompt>Which of the following best describes the primary function of mitochondria in a cell?</qti-prompt>
      <qti-simple-choice identifier="choiceA">They generate most of the cell's supply of ATP through oxidative phosphorylation</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">They produce energy for the cell through cellular respiration</qti-simple-choice>
      <qti-simple-choice identifier="choiceC">They store genetic information for the cell</qti-simple-choice>
      <qti-simple-choice identifier="choiceD">They synthesize proteins for export outside the cell</qti-simple-choice>
    </qti-choice-interaction>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Correct!</strong> Mitochondria generate most of the cell's ATP through oxidative phosphorylation. This is the most precise description of their primary function.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_partial" show-hide="show" data-feedback-type="info">
      <p><strong>Partially correct.</strong> While mitochondria are involved in cellular respiration, the more precise answer is that they generate ATP specifically through oxidative phosphorylation. "Producing energy" is a common simplification.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Incorrect.</strong> Mitochondria are often called the "powerhouse of the cell" because they generate ATP. Genetic information is stored in the nucleus, and protein synthesis for export occurs at the rough endoplasmic reticulum.</p>
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
