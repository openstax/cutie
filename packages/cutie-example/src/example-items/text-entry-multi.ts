// Scoring mode: allCorrect
// All responses must be correct for SCORE=1, otherwise SCORE=0.
// See README.md "allCorrect Mode" for full pattern documentation.

// Multiple Text Entry Interactions in Flowing Text

export const name = "Text Entry - Multiple";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="text-entry-multi" title="Text Entry - Multiple in Paragraph"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>1776</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="1776" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_2" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>Philadelphia</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="Philadelphia" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE_3" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>thirteen</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="thirteen" mapped-value="1"/>
      <qti-map-entry map-key="13" mapped-value="1"/>
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
    <p>Fill in the blanks to complete the paragraph about American history.</p>
    <p>
      The Declaration of Independence was signed in the year
      <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="4"/>.
      The document was adopted by the Continental Congress meeting in
      <qti-text-entry-interaction response-identifier="RESPONSE_2" expected-length="12"/>,
      Pennsylvania. At the time, there were
      <qti-text-entry-interaction response-identifier="RESPONSE_3" expected-length="8"/>
      colonies that declared their independence from British rule.
    </p>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Correct!</strong> The Declaration of Independence was signed in 1776.</p>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Incorrect.</strong> Consider the key dates of the American Revolution.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_2_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Correct!</strong> The Continental Congress met in Philadelphia.</p>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_2_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Incorrect.</strong> Think about where the Continental Congress convened in Pennsylvania.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_3_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Correct!</strong> There were thirteen original colonies.</p>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_3_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Incorrect.</strong> Review how many colonies participated in the independence movement.</p>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <!-- Scoring: all-or-nothing via qti-and(qti-equal(qti-map-response, 1), ...) -->
    <qti-response-condition>
      <qti-response-if>
        <qti-and>
          <qti-equal>
            <qti-map-response identifier="RESPONSE"/>
            <qti-base-value base-type="float">1</qti-base-value>
          </qti-equal>
          <qti-equal>
            <qti-map-response identifier="RESPONSE_2"/>
            <qti-base-value base-type="float">1</qti-base-value>
          </qti-equal>
          <qti-equal>
            <qti-map-response identifier="RESPONSE_3"/>
            <qti-base-value base-type="float">1</qti-base-value>
          </qti-equal>
        </qti-and>
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
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_incorrect</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-equal>
          <qti-map-response identifier="RESPONSE_2"/>
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-equal>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_2_correct</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_2_incorrect</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-equal>
          <qti-map-response identifier="RESPONSE_3"/>
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-equal>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_3_correct</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_3_incorrect</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['text-entry'];
