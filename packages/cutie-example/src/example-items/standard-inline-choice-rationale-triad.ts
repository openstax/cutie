// Scoring mode: custom (Drop-down: Rationale triad)
// Approximates the "Drop-down: Rationale" item type with a cause/effect triad
// (1 cause + 2 supporting effects) worth 2 points:
//   - The cause must be correct for ANY credit.
//   - Partial credit: 1 point for one correct effect, 2 points for both.
// Cause gate + qti-sum of per-effect scores, with an explicit MAXSCORE of 2.

export const name = "Inline Choice - Rationale (Triad)";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="inline-choice-rationale" title="Inline Choice - Rationale (Triad)"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="CAUSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>cold_front</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="EFFECT_1" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>falling_temperature</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="EFFECT_2" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>gusting_winds</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="EFFECT_1_SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="EFFECT_2_SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>2</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

  <qti-item-body>
    <p>A weather station records a sudden change in conditions. Complete the statement by
      selecting the event and the two readings that support it.</p>
    <p>
      The station data most likely indicate that a
      <qti-inline-choice-interaction response-identifier="CAUSE" shuffle="true" required="true" class="qti-input-width-20" data-prompt="Choose event…">
        <qti-inline-choice identifier="cold_front">cold front</qti-inline-choice>
        <qti-inline-choice identifier="warm_front">warm front</qti-inline-choice>
        <qti-inline-choice identifier="high_pressure_system">high-pressure system</qti-inline-choice>
      </qti-inline-choice-interaction>
      is approaching, as evidenced by
      <qti-inline-choice-interaction response-identifier="EFFECT_1" shuffle="true" required="true" class="qti-input-width-16" data-prompt="Choose reading…">
        <qti-inline-choice identifier="falling_temperature">a falling temperature</qti-inline-choice>
        <qti-inline-choice identifier="rising_temperature">a rising temperature</qti-inline-choice>
        <qti-inline-choice identifier="steady_temperature">a steady temperature</qti-inline-choice>
      </qti-inline-choice-interaction>
      and
      <qti-inline-choice-interaction response-identifier="EFFECT_2" shuffle="true" required="true" class="qti-input-width-14" data-prompt="Choose reading…">
        <qti-inline-choice identifier="gusting_winds">gusting winds</qti-inline-choice>
        <qti-inline-choice identifier="calm_winds">calm winds</qti-inline-choice>
        <qti-inline-choice identifier="light_breeze">a light breeze</qti-inline-choice>
      </qti-inline-choice-interaction>.
    </p>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="CAUSE_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Event: Correct.</strong> A rapid drop in temperature together with gusting winds
        are classic signs of an approaching cold front.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="CAUSE_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Event: Incorrect.</strong> Reconsider which event brings a sudden drop in
        temperature along with stronger, shifting winds.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="EFFECT_1_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Reading 1: Correct.</strong> As a cold front moves in, the cold air mass drives
        the temperature down.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="EFFECT_1_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Reading 1: Incorrect.</strong> Consider how the temperature changes as a cold
        air mass arrives.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="EFFECT_2_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Reading 2: Correct.</strong> The steep pressure change along a cold front
        produces gusting winds.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="EFFECT_2_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Reading 2: Incorrect.</strong> Consider how the wind behaves as a front passes
        through.</p>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <!-- Per-effect intermediate scores (0/1 each) -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="EFFECT_1"/>
          <qti-correct identifier="EFFECT_1"/>
        </qti-match>
        <qti-set-outcome-value identifier="EFFECT_1_SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="EFFECT_1_SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="EFFECT_2"/>
          <qti-correct identifier="EFFECT_2"/>
        </qti-match>
        <qti-set-outcome-value identifier="EFFECT_2_SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="EFFECT_2_SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>

    <!-- Cause gate: wrong cause => 0; correct cause => sum of effect scores (0/1/2) -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="CAUSE"/>
          <qti-correct identifier="CAUSE"/>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-sum>
            <qti-variable identifier="EFFECT_1_SCORE"/>
            <qti-variable identifier="EFFECT_2_SCORE"/>
          </qti-sum>
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

    <!-- Feedback for EFFECT_1 -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="EFFECT_1"/>
          <qti-correct identifier="EFFECT_1"/>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">EFFECT_1_correct</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">EFFECT_1_incorrect</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>

    <!-- Feedback for EFFECT_2 -->
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="EFFECT_2"/>
          <qti-correct identifier="EFFECT_2"/>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">EFFECT_2_correct</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">EFFECT_2_incorrect</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['inline-choice'];
