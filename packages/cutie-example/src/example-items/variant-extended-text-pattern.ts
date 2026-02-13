// Variant test: extended text pattern-mask validation with min-strings
// Shows dynamic constraint text swapping between min-strings and pattern-mask errors

export const name = "Extended Text Pattern Validation";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="variant-extended-text-pattern" title="Extended Text Pattern Validation"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
    <qti-correct-response><qti-value>42</qti-value></qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>

    <p><strong>Pattern Validation with Required Input</strong></p>
    <p>This interaction has both <code>min-strings="1"</code> (response required) and
       <code>pattern-mask</code> (must be digits only). Try submitting with:</p>
    <ul>
      <li>Empty input — you should see "Enter a response."</li>
      <li>Non-numeric text (e.g. "abc") — you should see "Enter a whole number."</li>
      <li>A valid number (e.g. "42") — should pass validation</li>
    </ul>

    <qti-extended-text-interaction response-identifier="RESPONSE"
      min-strings="1"
      pattern-mask="^\\d+$"
      data-patternmask-message="Enter a whole number."
      placeholder-text="Type a number..."
      class="qti-height-lines-3">
      <qti-prompt>What is the answer to life, the universe, and everything?</qti-prompt>
    </qti-extended-text-interaction>

  </qti-item-body>

  <qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['extended-text'];
