// Scoring mode: sumScores
// Each response contributes independently to the total SCORE via qti-sum.
// See README.md "sumScores Mode" for full pattern documentation.

// Multi-Interaction Item with Accumulated Feedback

export const name = "Multi-Interaction";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="multi-interaction-feedback" title="Multi-Interaction - Combined Feedback"
adaptive="false" time-dependent="false" xml:lang="en">

  <!-- Response declarations for each interaction -->
  <qti-response-declaration identifier="RESPONSE1" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE2" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>answer</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="answer" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE3" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>optionB</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <!-- Outcome declarations -->
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="RESPONSE1_SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="RESPONSE3_SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>3.0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

  <qti-item-body>
    <p><strong>Part 1:</strong> Question prompt for the choice interaction.</p>
    <qti-choice-interaction response-identifier="RESPONSE1" shuffle="true" max-choices="1">
      <qti-prompt>Select the best answer:</qti-prompt>
      <qti-simple-choice identifier="choiceA">Correct answer</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Wrong answer B</qti-simple-choice>
      <qti-simple-choice identifier="choiceC">Wrong answer C</qti-simple-choice>
    </qti-choice-interaction>

    <p>
      <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE1_correct" show-hide="show" data-feedback-type="correct">
        <strong>Part 1: Correct!</strong> You selected the right option for this choice question.
      </qti-feedback-inline>
      <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE1_incorrect" show-hide="show" data-feedback-type="incorrect">
        <strong>Part 1: Incorrect.</strong> Review the options and consider which best addresses the question.
      </qti-feedback-inline>
    </p>

    <hr/>

    <p><strong>Part 2:</strong> Question prompt for the text entry interaction.</p>
    <p>Enter the expected word: <qti-text-entry-interaction response-identifier="RESPONSE2" expected-length="10"/></p>

    <p>
      <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE2_correct" show-hide="show" data-feedback-type="correct">
        <strong>Part 2: Correct!</strong> Your text entry matches the expected response.
      </qti-feedback-inline>
      <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE2_incorrect" show-hide="show" data-feedback-type="incorrect">
        <strong>Part 2: Incorrect.</strong> Check your spelling and consider what word the question is asking for.
      </qti-feedback-inline>
    </p>

    <hr/>

    <p><strong>Part 3:</strong> Question prompt for the inline choice interaction.</p>
    <p>
      Complete the sentence: The correct option is
      <qti-inline-choice-interaction response-identifier="RESPONSE3" shuffle="true">
        <qti-inline-choice identifier="optionA">wrong A</qti-inline-choice>
        <qti-inline-choice identifier="optionB">correct</qti-inline-choice>
        <qti-inline-choice identifier="optionC">wrong C</qti-inline-choice>
      </qti-inline-choice-interaction>
      in this context.
    </p>

    <p>
      <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE3_correct" show-hide="show" data-feedback-type="correct">
        <strong>Part 3: Correct!</strong> You chose the word that best fits the sentence context.
      </qti-feedback-inline>
      <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE3_incorrect" show-hide="show" data-feedback-type="incorrect">
        <strong>Part 3: Incorrect.</strong> Re-read the sentence and consider which option makes the most sense in context.
      </qti-feedback-inline>
    </p>

  </qti-item-body>

  <qti-response-processing>
    <!-- Intermediate score for RESPONSE1 (unmapped choice) -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE1"/>
          <qti-correct identifier="RESPONSE1"/>
        </qti-match>
        <qti-set-outcome-value identifier="RESPONSE1_SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="RESPONSE1_SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>

    <!-- Intermediate score for RESPONSE3 (unmapped inline choice) -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE3"/>
          <qti-correct identifier="RESPONSE3"/>
        </qti-match>
        <qti-set-outcome-value identifier="RESPONSE3_SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="RESPONSE3_SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>

    <!-- Sum: mixed mapped (qti-map-response) and unmapped ({id}_SCORE) into SCORE -->
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum>
        <qti-variable identifier="RESPONSE1_SCORE"/>
        <qti-map-response identifier="RESPONSE2"/>
        <qti-variable identifier="RESPONSE3_SCORE"/>
      </qti-sum>
    </qti-set-outcome-value>

    <!-- Feedback for RESPONSE1 -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE1"/>
          <qti-correct identifier="RESPONSE1"/>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE1_correct</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE1_incorrect</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>

    <!-- Feedback for RESPONSE2: mapped response uses qti-gt(qti-map-response, 0) -->
    <qti-response-condition>
      <qti-response-if>
        <qti-gt>
          <qti-map-response identifier="RESPONSE2"/>
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-gt>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE2_correct</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE2_incorrect</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>

    <!-- Feedback for RESPONSE3 -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE3"/>
          <qti-correct identifier="RESPONSE3"/>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE3_correct</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE3_incorrect</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['choice', 'text-entry', 'inline-choice'];
