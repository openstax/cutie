// Text Entry with Correct/Incorrect Feedback

export const name = "Text Entry - With Feedback";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="text-entry-feedback" title="Text Entry - With Feedback"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>correct</qti-value>
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
    <p>Question prompt goes here. Enter your answer in the text field below.</p>
    <p>The expected answer is: <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="15"/></p>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="correct" show-hide="show">
      <p><strong>Correct!</strong> Your answer matches the expected value. [Additional explanation here].</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="incorrect" show-hide="show">
      <p><strong>Incorrect.</strong> The correct answer is "correct". [Explanation of why this is the answer].</p>
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
