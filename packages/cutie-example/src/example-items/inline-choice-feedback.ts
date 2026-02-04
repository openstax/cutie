// Inline Choice in Sentence with Feedback

export const name = "Inline Choice - With Feedback";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="inline-choice-feedback" title="Inline Choice - With Feedback"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>optionB</qti-value>
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
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>

  <qti-item-body>
    <p>Complete the sentence by selecting the correct word from the dropdown.</p>
    <p>
      The sentence begins here and the missing word is
      <qti-inline-choice-interaction response-identifier="RESPONSE" shuffle="true">
        <qti-inline-choice identifier="optionA">wrong option A</qti-inline-choice>
        <qti-inline-choice identifier="optionB">correct option</qti-inline-choice>
        <qti-inline-choice identifier="optionC">wrong option C</qti-inline-choice>
      </qti-inline-choice-interaction>
      and the sentence continues here.
    </p>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="correct" show-hide="show">
      <p><strong>Correct!</strong> "Correct option" is the right choice because [explanation].</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="incorrect" show-hide="show">
      <p><strong>Incorrect.</strong> The correct answer is "correct option". [Explanation of why].</p>
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
          <qti-base-value base-type="identifier">correct</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-base-value base-type="identifier">incorrect</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;
