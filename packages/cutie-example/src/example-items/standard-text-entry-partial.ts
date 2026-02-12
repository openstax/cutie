// cspell:ignore Harrisberg
// Scoring mode: sumScores
// Each response contributes independently to the total SCORE via qti-sum.
// See README.md "sumScores Mode" for full pattern documentation.

// Text Entry with Partial Credit via Mapping

export const name = "Text Entry - Partial Credit";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="text-entry-partial" title="Text Entry - Partial Credit"
adaptive="false" time-dependent="false" xml:lang="en">

  <!--
    This example demonstrates partial credit scoring for a text entry interaction.
    The mapping awards full credit for the correct answer, partial credit for a
    common misspelling, and zero for anything else. QTI 3.0 mappings are
    case-insensitive by default, so "harrisburg" and "Harrisburg" both match.
  -->
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>Harrisburg</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="Harrisburg" mapped-value="1"/>
      <qti-map-entry map-key="Harrisberg" mapped-value="0.5"/>
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
    <p>What is the capital of Pennsylvania?</p>
    <p>Answer: <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="15" pattern-mask=".+" data-patternmask-message="Response required"/></p>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Correct!</strong> Harrisburg is the capital of Pennsylvania. It has served as the state capital since 1812.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_partial" show-hide="show" data-feedback-type="info">
      <p><strong>Close!</strong> You have the right city but the spelling is slightly off. The correct spelling is "Harrisburg" (not "Harrisberg").</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Incorrect.</strong> The capital of Pennsylvania is Harrisburg. A common mistake is to guess Philadelphia or Pittsburgh, which are larger cities but not the state capital.</p>
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

export const interactionTypes: string[] = ['text-entry'];
