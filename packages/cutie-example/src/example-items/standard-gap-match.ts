// cspell:ignore distractor
// Scoring mode: allCorrect
// All responses must be correct for SCORE=1, otherwise SCORE=0.
// See README.md "allCorrect Mode" for full pattern documentation.

// Gap Match with Feedback

export const name = "Gap Match";

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
      <qti-value>1.0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

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

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Correct!</strong> All gaps are filled correctly. You've demonstrated understanding of how each word fits into the sentence structure and meaning.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Not quite.</strong> Read the sentence carefully and consider how each word fits grammatically and semantically. Look for context clues in the sentence that indicate which word belongs in each gap. Remember that one option may not be used in the correct solution.</p>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <!-- Scoring: all-or-nothing via qti-match -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-correct identifier="RESPONSE"/>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>

    <!-- Feedback: 2-way (correct / incorrect) via qti-match -->
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
  </qti-response-processing>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['gap-match'];
