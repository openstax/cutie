// Source: https://www.imsglobal.org/spec/qti/v3p0/impl#h.of39hkegnqll
// NOTE: This file demonstrates MODAL feedback which is generally discouraged.
// Modal feedback interrupts the learner's flow and should be used sparingly.
// For typical assessment items, prefer inline or block feedback instead.

export const name = "Single Choice - Modal Feedback";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
identifier="Example01-modalFeedback" title="Example 1 - modal feedback"
adaptive="false" time-dependent="false" xml:lang="en" >
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <!-- The response variable RESPONSE will hold the candidate's input-->
    <qti-correct-response>
      <!--The value of the right answer is declared-->
      <qti-value>true</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

<!-- Define a feedback variable; using cardinality="multiple" for editor compatibility -->
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier" />
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"
      normal-maximum="10.0">
    <qti-default-value>
        <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
        <qti-value>10.0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" min-choices="1" max-choices="1">
      <qti-prompt>Sigmund Freud and Carl Jung both belong to the psychoanalytic school of
          psychology.</qti-prompt>
      <qti-simple-choice identifier="true" fixed="true">True </qti-simple-choice>
      <qti-simple-choice identifier="false" fixed="true">False </qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing>
    <!-- Score the response -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-correct identifier="RESPONSE"/>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-variable identifier="MAXSCORE"/>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <!-- Set feedback for correct response -->
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
    </qti-response-condition>

    <!-- Set feedback for incorrect response -->
    <qti-response-condition>
      <qti-response-if>
        <qti-not>
          <qti-match>
            <qti-variable identifier="RESPONSE"/>
            <qti-correct identifier="RESPONSE"/>
          </qti-match>
        </qti-not>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_incorrect</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>

<!-- Note how the identifiers in the following modalFeedback elements match those of the
        setOutcomeValue elements above -->

  <qti-modal-feedback outcome-identifier="FEEDBACK" show-hide="show" identifier="RESPONSE_correct" data-feedback-type="correct">
      <qti-content-body>correct</qti-content-body>
  </qti-modal-feedback>
  <qti-modal-feedback outcome-identifier="FEEDBACK" show-hide="show" identifier="RESPONSE_incorrect" data-feedback-type="incorrect">
      <qti-content-body>incorrect</qti-content-body>
  </qti-modal-feedback>

</qti-assessment-item>`;

export const interactionTypes: string[] = ['choice'];
