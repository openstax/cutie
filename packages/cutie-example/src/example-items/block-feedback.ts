// Based on QTI 3.0 feedback patterns from https://www.imsglobal.org/spec/qti/v3p0/impl#h.of39hkegnqll

export const name = "Single Choice - Block Feedback";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
identifier="Example03-feedbackBlock" title="Example 3 - block feedback"
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
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">
        <qti-prompt>Sigmund Freud and Carl Jung both belong to the psychoanalytic school of
            psychology.</qti-prompt>
        <qti-simple-choice identifier="true" fixed="true">True</qti-simple-choice>
        <qti-simple-choice identifier="false" fixed="true">False</qti-simple-choice>
    </qti-choice-interaction>

    <!-- Block feedback appears as separate blocks after the interaction -->
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_correct" show-hide="show" data-feedback-type="correct">
        <p><strong>Correct!</strong></p>
        <p>Both Sigmund Freud and Carl Jung are considered founders of the psychoanalytic
            school of psychology. Freud developed the foundational theories, while Jung,
            originally a close collaborator, later developed his own analytical psychology
            but remained within the broader psychoanalytic tradition.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_incorrect" show-hide="show" data-feedback-type="incorrect">
        <p><strong>Incorrect.</strong></p>
        <p>Actually, both Sigmund Freud and Carl Jung do belong to the psychoanalytic school.
            Freud is considered the father of psychoanalysis, and Jung was one of his early
            followers before developing his own approach called analytical psychology.</p>
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
            <qti-variable identifier="MAXSCORE"/>
        </qti-set-outcome-value>
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
  </qti-response-processing>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['choice'];
