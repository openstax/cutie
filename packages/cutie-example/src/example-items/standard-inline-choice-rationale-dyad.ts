// Scoring mode: allCorrect (Drop-down: Rationale dyad)
// Approximates the "Drop-down: Rationale" item type with a cause/effect dyad
// (1 cause + 1 supporting effect) worth 1 point:
//   - BOTH parts must be correct for credit (all-or-nothing; no partial credit).
// qti-and of the two matches, with an explicit MAXSCORE of 1.

export const name = "Inline Choice - Rationale (Dyad)";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="inline-choice-rationale-dyad" title="Inline Choice - Rationale (Dyad)"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="CAUSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>warm_front</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="EFFECT" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>rising_temperature</qti-value>
    </qti-correct-response>
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
    <p>A weather station records a gradual change in conditions. Complete the statement by
      selecting the event and the reading that supports it.</p>
    <p>
      The station data most likely indicate that a
      <qti-inline-choice-interaction response-identifier="CAUSE" shuffle="true" required="true" class="qti-input-width-20" data-prompt="Choose event…">
        <qti-inline-choice identifier="warm_front">warm front</qti-inline-choice>
        <qti-inline-choice identifier="cold_front">cold front</qti-inline-choice>
        <qti-inline-choice identifier="stationary_front">stationary front</qti-inline-choice>
      </qti-inline-choice-interaction>
      is approaching, as evidenced by
      <qti-inline-choice-interaction response-identifier="EFFECT" shuffle="true" required="true" class="qti-input-width-16" data-prompt="Choose reading…">
        <qti-inline-choice identifier="rising_temperature">a rising temperature</qti-inline-choice>
        <qti-inline-choice identifier="falling_temperature">a falling temperature</qti-inline-choice>
        <qti-inline-choice identifier="steady_temperature">a steady temperature</qti-inline-choice>
      </qti-inline-choice-interaction>.
    </p>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="CAUSE_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Event: Correct.</strong> A gradual rise in temperature is a classic sign of an
        approaching warm front.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="CAUSE_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Event: Incorrect.</strong> Reconsider which event brings a slow, steady rise in
        temperature as warmer air moves in.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="EFFECT_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Reading: Correct.</strong> As a warm front moves in, the warmer air mass drives
        the temperature up.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="EFFECT_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Reading: Incorrect.</strong> Consider how the temperature changes as a warm
        air mass arrives.</p>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <!-- Scoring: all-or-nothing — BOTH cause and effect must be correct for 1 point -->
    <qti-response-condition>
      <qti-response-if>
        <qti-and>
          <qti-match>
            <qti-variable identifier="CAUSE"/>
            <qti-correct identifier="CAUSE"/>
          </qti-match>
          <qti-match>
            <qti-variable identifier="EFFECT"/>
            <qti-correct identifier="EFFECT"/>
          </qti-match>
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

    <!-- Feedback for CAUSE -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="CAUSE"/>
          <qti-correct identifier="CAUSE"/>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">CAUSE_correct</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">CAUSE_incorrect</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>

    <!-- Feedback for EFFECT -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="EFFECT"/>
          <qti-correct identifier="EFFECT"/>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">EFFECT_correct</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">EFFECT_incorrect</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['inline-choice'];
