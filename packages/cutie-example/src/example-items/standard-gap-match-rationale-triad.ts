// cspell:ignore gusting
// Scoring mode: custom (Drop-down: Rationale triad, gap-match variant)
// Approximates the "Drop-down: Rationale" item type with a cause/effect triad
// (1 cause + 2 supporting effects) worth 2 points:
//   - The cause must be correct for ANY credit.
//   - Partial credit: 1 point for one correct effect gap, 2 points for both.
// A single gap-match interaction holds all three gaps in one shared sentence.
// Its choices are split into two visually separate word-bank boxes by
// cutie's client renderer (one per match-group value: cause words, then
// effect words) — see packages/cutie-client's gapMatchInteractionHandler.
// Even though both boxes belong to one physical interaction/response,
// match-group scoping keeps each box's words restricted to its own gap(s) —
// a cause word can't be dropped into an effect gap, or vice versa.
// Per-gap credit is computed with qti-member (checking whether the
// declared-correct pair for that gap — read via qti-correct + qti-index — is
// present in the single RESPONSE), since all three gaps are scored from one
// multiple/directedPair response variable rather than one variable per gap.
// Cause gate + qti-sum of the two intermediate effect scores, with an
// explicit MAXSCORE of 2.

export const name = "Gap Match - Rationale (Triad)";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="gap-match-rationale-triad" title="Gap Match - Rationale (Triad)"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>cold_front GC</qti-value>
      <qti-value>falling_temperature GE1</qti-value>
      <qti-value>gusting_winds GE2</qti-value>
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
    <p>A weather station records a sudden change in conditions. Drag words to complete the
      sentence below.</p>

    <qti-gap-match-interaction response-identifier="RESPONSE" shuffle="false" min-associations="3" max-associations="3">
      <qti-prompt>Drag the event and the two readings into the sentence.</qti-prompt>
      <p>The station data most likely indicate that a <qti-gap identifier="GC" match-group="cause"/>
        is approaching, as evidenced by <qti-gap identifier="GE1" match-group="effects"/> and
        <qti-gap identifier="GE2" match-group="effects"/>.</p>
      <qti-gap-text identifier="cold_front" match-max="1" match-group="cause">cold front</qti-gap-text>
      <qti-gap-text identifier="warm_front" match-max="1" match-group="cause">warm front</qti-gap-text>
      <qti-gap-text identifier="high_pressure_system" match-max="1" match-group="cause">high-pressure system</qti-gap-text>
      <qti-gap-text identifier="falling_temperature" match-max="1" match-group="effects">a falling temperature</qti-gap-text>
      <qti-gap-text identifier="gusting_winds" match-max="1" match-group="effects">gusting winds</qti-gap-text>
      <qti-gap-text identifier="rising_temperature" match-max="1" match-group="effects">a rising temperature</qti-gap-text>
      <qti-gap-text identifier="calm_winds" match-max="1" match-group="effects">calm winds</qti-gap-text>
    </qti-gap-match-interaction>

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
    <!--
      Per-effect-gap intermediate scores (0/1 each): check whether the
      declared-correct pair for that gap (the 2nd/3rd value of RESPONSE's
      qti-correct-response, read positionally via qti-index) is present in
      the submitted RESPONSE.
    -->
    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-index n="2">
            <qti-correct identifier="RESPONSE"/>
          </qti-index>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
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
        <qti-member>
          <qti-index n="3">
            <qti-correct identifier="RESPONSE"/>
          </qti-index>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
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

    <!--
      Cause gate: check whether the 1st correct pair (the cause gap) is
      present. Wrong cause => 0; correct cause => sum of effect scores (0/1/2).
    -->
    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-index n="1">
            <qti-correct identifier="RESPONSE"/>
          </qti-index>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
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

    <!-- Feedback for CAUSE (reuses the same 1st-pair membership check) -->
    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-index n="1">
            <qti-correct identifier="RESPONSE"/>
          </qti-index>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
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

    <!-- Feedback for EFFECT_1 (reuses the already-computed intermediate score) -->
    <qti-response-condition>
      <qti-response-if>
        <qti-equal>
          <qti-variable identifier="EFFECT_1_SCORE"/>
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-equal>
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

    <!-- Feedback for EFFECT_2 (reuses the already-computed intermediate score) -->
    <qti-response-condition>
      <qti-response-if>
        <qti-equal>
          <qti-variable identifier="EFFECT_2_SCORE"/>
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-equal>
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

export const interactionTypes: string[] = ['gap-match'];
