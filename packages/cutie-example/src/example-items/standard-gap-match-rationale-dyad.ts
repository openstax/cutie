// Scoring mode: allCorrect (Drop-down: Rationale dyad, gap-match variant)
// Approximates the "Drop-down: Rationale" item type with a cause/effect dyad
// (1 cause + 1 supporting effect) worth 1 point:
//   - BOTH parts must be correct for credit (all-or-nothing; no partial credit).
// A single gap-match interaction holds both gaps in one shared sentence, with
// one combined word bank ordered as two groups (cause words, then effect
// words). match-group scoping keeps each group of words restricted to its own
// gap — a cause word can't be dropped into the effect gap, or vice versa —
// even though both groups share one physical word bank/interaction.
// Scoring is a plain qti-match against the whole (2-pair) correct response,
// with an explicit MAXSCORE of 1.

export const name = "Gap Match - Rationale (Dyad)";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="gap-match-rationale-dyad" title="Gap Match - Rationale (Dyad)"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>warm_front GC</qti-value>
      <qti-value>rising_temperature GE</qti-value>
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
    <p>A weather station records a gradual change in conditions. Drag words to complete the
      sentence below.</p>

    <qti-gap-match-interaction response-identifier="RESPONSE" shuffle="false" min-associations="2" max-associations="2">
      <qti-prompt>Drag the event and the reading into the sentence.</qti-prompt>
      <p>The station data most likely indicate that a <qti-gap identifier="GC" match-group="cause"/>
        is approaching, as evidenced by <qti-gap identifier="GE" match-group="effect"/>.</p>
      <qti-gap-text identifier="warm_front" match-max="1" match-group="cause">warm front</qti-gap-text>
      <qti-gap-text identifier="cold_front" match-max="1" match-group="cause">cold front</qti-gap-text>
      <qti-gap-text identifier="stationary_front" match-max="1" match-group="cause">stationary front</qti-gap-text>
      <qti-gap-text identifier="rising_temperature" match-max="1" match-group="effect">a rising temperature</qti-gap-text>
      <qti-gap-text identifier="falling_temperature" match-max="1" match-group="effect">a falling temperature</qti-gap-text>
      <qti-gap-text identifier="steady_temperature" match-max="1" match-group="effect">a steady temperature</qti-gap-text>
    </qti-gap-match-interaction>

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
    <!-- Scoring: all-or-nothing — both gaps must match the declared correct pairs -->
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

    <!--
      Feedback for the CAUSE gap: check whether the declared-correct pair for
      that gap (the 1st value of RESPONSE's qti-correct-response, read
      positionally via qti-index) is present in the submitted RESPONSE.
    -->
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

    <!-- Feedback for the EFFECT gap: same technique, checking the 2nd correct pair -->
    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-index n="2">
            <qti-correct identifier="RESPONSE"/>
          </qti-index>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
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

export const interactionTypes: string[] = ['gap-match'];
