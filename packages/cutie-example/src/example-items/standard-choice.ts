// Single Choice with Per-Choice Inline Feedback

export const name = "Single Choice";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="choice-feedback" title="Single Choice - Per-Choice Feedback"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
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
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="true" max-choices="1">
      <qti-prompt>Question prompt goes here. Select the best answer.</qti-prompt>
      <qti-simple-choice identifier="choiceA">
        Correct answer text
        <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceA" show-hide="show" data-feedback-type="correct">
          <strong>Correct!</strong> This option demonstrates the key concept being assessed. It correctly applies the principle discussed in the question.
        </qti-feedback-inline>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceB">
        Wrong answer B text
        <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceB" show-hide="show" data-feedback-type="incorrect">
          <strong>Incorrect.</strong> This option represents a common misconception. Consider how the key terms relate to each other differently.
        </qti-feedback-inline>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceC">
        Wrong answer C text
        <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceC" show-hide="show" data-feedback-type="incorrect">
          <strong>Incorrect.</strong> While this may seem plausible, it misses an important distinction. Review the fundamental principles involved.
        </qti-feedback-inline>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceD">
        Wrong answer D text
        <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceD" show-hide="show" data-feedback-type="incorrect">
          <strong>Incorrect.</strong> This option confuses related but distinct concepts. Think about the specific criteria mentioned in the question.
        </qti-feedback-inline>
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
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <!-- Set feedback for choiceA -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="identifier">choiceA</qti-base-value>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceA</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <!-- Set feedback for choiceB -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="identifier">choiceB</qti-base-value>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceB</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <!-- Set feedback for choiceC -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="identifier">choiceC</qti-base-value>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceC</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <!-- Set feedback for choiceD -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-base-value base-type="identifier">choiceD</qti-base-value>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceD</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['choice'];
