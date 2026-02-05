// Source: https://www.imsglobal.org/spec/qti/v3p0/impl#h.of39hkegnqll

export const name = "Single Choice - Inline Feedback";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation=" http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
identifier="Example02-feedbackInline" title="Example 2 - inline feedback"
adaptive="false" time-dependent="false" xml:lang="en" >

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
      <qti-correct-response>
          <qti-value>true</qti-value>
      </qti-correct-response>
  </qti-response-declaration>

  <!-- Define a feedback variable; using cardinality="multiple" for editor compatibility -->
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" normal-maximum="10.0">
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
    <!-- The response variable RESPONSE will hold the candidate's input-->
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">
        <qti-prompt>Sigmund Freud and Carl Jung both belong to the psychoanalytic school of
            psychology.</qti-prompt>
        <qti-simple-choice identifier="true" fixed="true">True
          <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_true" show-hide="show">
            <strong>Correct!</strong> Both Freud and Jung are foundational figures in psychoanalysis. Freud developed the original theory, while Jung contributed analytical psychology as a related approach.</qti-feedback-inline>
        </qti-simple-choice>
        <qti-simple-choice identifier="false" fixed="true">False
        <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_false" show-hide="show">
            <strong>Incorrect.</strong> Consider the historical development of psychology. Both figures worked together early in their careers and shared foundational ideas about the unconscious mind.</qti-feedback-inline>
        </qti-simple-choice>
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

    <!-- Set feedback for true choice -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="identifier">true</qti-base-value>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_true</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <!-- Set feedback for false choice -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="identifier">false</qti-base-value>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_false</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['choice'];
