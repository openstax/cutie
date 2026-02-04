// Gap Match with Feedback

export const name = "Gap Match - With Feedback";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="gap-match-feedback" title="Gap Match - With Feedback"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>wordA G1</qti-value>
      <qti-value>wordB G2</qti-value>
      <qti-value>wordC G3</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>3.0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>

  <qti-item-body>
    <qti-gap-match-interaction response-identifier="RESPONSE" shuffle="true">
      <qti-prompt>Drag the words to fill in the blanks in the sentence below.</qti-prompt>
      <qti-gap-text identifier="wordA" match-max="1">word A</qti-gap-text>
      <qti-gap-text identifier="wordB" match-max="1">word B</qti-gap-text>
      <qti-gap-text identifier="wordC" match-max="1">word C</qti-gap-text>
      <qti-gap-text identifier="wordD" match-max="1">distractor</qti-gap-text>
      <p>
        The sentence starts here with <qti-gap identifier="G1"/> in the first blank,
        then continues with <qti-gap identifier="G2"/> in the second blank,
        and finally ends with <qti-gap identifier="G3"/> in the third blank.
      </p>
    </qti-gap-match-interaction>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="correct" show-hide="show">
      <p><strong>Correct!</strong> All gaps are filled correctly.</p>
      <ul>
        <li>Gap 1: "word A" - [explanation]</li>
        <li>Gap 2: "word B" - [explanation]</li>
        <li>Gap 3: "word C" - [explanation]</li>
      </ul>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="incorrect" show-hide="show">
      <p><strong>Incorrect.</strong> The correct answers are:</p>
      <ul>
        <li>Gap 1: word A</li>
        <li>Gap 2: word B</li>
        <li>Gap 3: word C</li>
      </ul>
      <p>Note: "distractor" is not used in the correct solution.</p>
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
