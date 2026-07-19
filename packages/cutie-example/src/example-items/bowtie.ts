// cspell:ignore tachycardia hypotension mucous pupillary distractor
// Scoring mode: sumScores (partial credit via map_response)
// SCORE = qti-map-response(RESPONSE): +1 for each correctly placed choice,
// default 0 for wrong placements, floored at 0 by the mapping's lower-bound.
//
// Bowtie (NCLEX-style): a plain gap-match whose three match-group-restricted
// columns — Actions to Take | Condition | Parameters to Monitor — are derived
// by the client from the match-group data (every choice targets exactly one
// group and each content block holds one group's gaps). No layout hints.

export const name = "Bowtie (Clinical Judgment)";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="bowtie-clinical-judgment" title="Bowtie - Clinical Judgment"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>ACT1 GA1</qti-value>
      <qti-value>ACT2 GA2</qti-value>
      <qti-value>COND1 GC1</qti-value>
      <qti-value>PAR1 GP1</qti-value>
      <qti-value>PAR2 GP2</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0" lower-bound="0">
      <qti-map-entry map-key="ACT1 GA1" mapped-value="1"/>
      <qti-map-entry map-key="ACT2 GA2" mapped-value="1"/>
      <qti-map-entry map-key="COND1 GC1" mapped-value="1"/>
      <qti-map-entry map-key="PAR1 GP1" mapped-value="1"/>
      <qti-map-entry map-key="PAR2 GP2" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>5</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

  <qti-item-body>
    <qti-gap-match-interaction response-identifier="RESPONSE" shuffle="true">
      <qti-prompt>
        A client presents with dry mucous membranes, tachycardia, and hypotension.
        Drag one choice into each box to complete the diagram: the two actions the
        nurse should take, the client's most likely condition, and the two parameters
        to monitor.
      </qti-prompt>

      <qti-gap-text identifier="ACT1" match-max="1" match-group="actions">Administer prescribed IV fluids</qti-gap-text>
      <qti-gap-text identifier="ACT2" match-max="1" match-group="actions">Notify the primary provider</qti-gap-text>
      <qti-gap-text identifier="ACT3" match-max="1" match-group="actions">Restrict oral fluids</qti-gap-text>
      <qti-gap-text identifier="ACT4" match-max="1" match-group="actions">Elevate the head of the bed</qti-gap-text>

      <qti-gap-text identifier="COND1" match-max="1" match-group="condition">Fluid volume deficit</qti-gap-text>
      <qti-gap-text identifier="COND2" match-max="1" match-group="condition">Fluid volume excess</qti-gap-text>
      <qti-gap-text identifier="COND3" match-max="1" match-group="condition">Impaired gas exchange</qti-gap-text>

      <qti-gap-text identifier="PAR1" match-max="1" match-group="parameters">Heart rate</qti-gap-text>
      <qti-gap-text identifier="PAR2" match-max="1" match-group="parameters">Blood pressure</qti-gap-text>
      <qti-gap-text identifier="PAR3" match-max="1" match-group="parameters">Pupillary response</qti-gap-text>
      <qti-gap-text identifier="PAR4" match-max="1" match-group="parameters">Deep tendon reflexes</qti-gap-text>

      <p><strong>Actions to Take</strong><qti-gap identifier="GA1" match-group="actions"/><qti-gap identifier="GA2" match-group="actions"/></p>
      <p><strong>Condition</strong><qti-gap identifier="GC1" match-group="condition"/></p>
      <p><strong>Parameters to Monitor</strong><qti-gap identifier="GP1" match-group="parameters"/><qti-gap identifier="GP2" match-group="parameters"/></p>
    </qti-gap-match-interaction>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_correct" show-hide="show" data-feedback-type="correct">
      <p><strong>Correct!</strong> You identified the condition and matched every action and parameter to it.</p>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_incorrect" show-hide="show" data-feedback-type="incorrect">
      <p><strong>Review your answer.</strong> Each correct placement earns a point. Start from the condition in the center, then choose the actions and parameters that follow from it.</p>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <!-- Scoring: +1 per correct placement, min 0, via the response mapping -->
    <qti-set-outcome-value identifier="SCORE">
      <qti-map-response identifier="RESPONSE"/>
    </qti-set-outcome-value>

    <!-- Feedback: 2-way, "correct" only when all five placements are right -->
    <qti-response-condition>
      <qti-response-if>
        <qti-equal>
          <qti-map-response identifier="RESPONSE"/>
          <qti-base-value base-type="float">5</qti-base-value>
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
  </qti-response-processing>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['gap-match'];
