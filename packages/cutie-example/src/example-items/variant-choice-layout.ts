// Variant test: orientation, stacking, and hidden input control vocabulary classes
// Visual verification of qti-orientation-*, qti-choices-stacking-*, qti-input-control-hidden

export const name = "Choice Layout & Orientation";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="variant-choice-layout" title="Choice Layout Variants"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="R1" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R2" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R3" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R4" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R5" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R6" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R7" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R8" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R9" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R10" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R11" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R12" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>

    <p><strong>Choice Layout &amp; Orientation Variants</strong></p>
    <p>Each interaction below demonstrates a different combination of orientation, stacking, and input visibility classes.</p>

    <!-- 1. Plain horizontal — no labels, controls visible -->
    <qti-choice-interaction response-identifier="R11" max-choices="1"
      class="qti-orientation-horizontal">
      <qti-prompt>Plain horizontal — no labels, radio buttons visible</qti-prompt>
      <qti-simple-choice identifier="A">Alpha</qti-simple-choice>
      <qti-simple-choice identifier="B">Beta</qti-simple-choice>
      <qti-simple-choice identifier="C">Gamma</qti-simple-choice>
      <qti-simple-choice identifier="D">Delta</qti-simple-choice>
    </qti-choice-interaction>

    <!-- 2. Horizontal + stacking-3 — no labels, controls visible -->
    <qti-choice-interaction response-identifier="R12" max-choices="1"
      class="qti-orientation-horizontal qti-choices-stacking-3">
      <qti-prompt>Horizontal + stacking-3 (row-major grid) — no labels, radio buttons visible</qti-prompt>
      <qti-simple-choice identifier="A">Alpha</qti-simple-choice>
      <qti-simple-choice identifier="B">Beta</qti-simple-choice>
      <qti-simple-choice identifier="C">Gamma</qti-simple-choice>
      <qti-simple-choice identifier="D">Delta</qti-simple-choice>
      <qti-simple-choice identifier="E">Epsilon</qti-simple-choice>
      <qti-simple-choice identifier="F">Zeta</qti-simple-choice>
    </qti-choice-interaction>

    <!-- 3. Horizontal orientation via vocab class + labels -->
    <qti-choice-interaction response-identifier="R1" max-choices="1"
      class="qti-orientation-horizontal qti-labels-upper-alpha qti-labels-suffix-period">
      <qti-prompt>Horizontal orientation (vocab class) with upper-alpha labels</qti-prompt>
      <qti-simple-choice identifier="A">Alpha</qti-simple-choice>
      <qti-simple-choice identifier="B">Beta</qti-simple-choice>
      <qti-simple-choice identifier="C">Gamma</qti-simple-choice>
      <qti-simple-choice identifier="D">Delta</qti-simple-choice>
    </qti-choice-interaction>

    <!-- 4. Horizontal orientation via deprecated attribute + labels -->
    <qti-choice-interaction response-identifier="R2" max-choices="1" orientation="horizontal"
      class="qti-labels-decimal">
      <qti-prompt>Horizontal orientation (deprecated attribute) with decimal labels</qti-prompt>
      <qti-simple-choice identifier="A">Alpha</qti-simple-choice>
      <qti-simple-choice identifier="B">Beta</qti-simple-choice>
      <qti-simple-choice identifier="C">Gamma</qti-simple-choice>
    </qti-choice-interaction>

    <!-- 5. Vertical stacking-2 (column-major: 1,2 / 3,4 / 5,6 down then across) -->
    <qti-choice-interaction response-identifier="R3" max-choices="1"
      class="qti-choices-stacking-2 qti-labels-lower-alpha qti-labels-suffix-parenthesis">
      <qti-prompt>Vertical + stacking-2 (column-major) with lower-alpha labels — expect a,b,c down left, then d,e,f down right</qti-prompt>
      <qti-simple-choice identifier="A">Alpha</qti-simple-choice>
      <qti-simple-choice identifier="B">Beta</qti-simple-choice>
      <qti-simple-choice identifier="C">Gamma</qti-simple-choice>
      <qti-simple-choice identifier="D">Delta</qti-simple-choice>
      <qti-simple-choice identifier="E">Epsilon</qti-simple-choice>
      <qti-simple-choice identifier="F">Zeta</qti-simple-choice>
    </qti-choice-interaction>

    <!-- 6. Horizontal + stacking-3 (row-major) + labels -->
    <qti-choice-interaction response-identifier="R4" max-choices="1"
      class="qti-orientation-horizontal qti-choices-stacking-3 qti-labels-decimal qti-labels-suffix-period">
      <qti-prompt>Horizontal + stacking-3 (row-major) with decimal labels — expect 1,2,3 across, then 4,5,6</qti-prompt>
      <qti-simple-choice identifier="A">Alpha</qti-simple-choice>
      <qti-simple-choice identifier="B">Beta</qti-simple-choice>
      <qti-simple-choice identifier="C">Gamma</qti-simple-choice>
      <qti-simple-choice identifier="D">Delta</qti-simple-choice>
      <qti-simple-choice identifier="E">Epsilon</qti-simple-choice>
      <qti-simple-choice identifier="F">Zeta</qti-simple-choice>
    </qti-choice-interaction>

    <!-- 7. Vertical + stacking-3 (column-major with 3 columns) + labels -->
    <qti-choice-interaction response-identifier="R5" max-choices="1"
      class="qti-choices-stacking-3 qti-labels-upper-alpha">
      <qti-prompt>Vertical + stacking-3 (column-major, 3 cols) — expect A,B down left, C,D middle, E,F right</qti-prompt>
      <qti-simple-choice identifier="A">Alpha</qti-simple-choice>
      <qti-simple-choice identifier="B">Beta</qti-simple-choice>
      <qti-simple-choice identifier="C">Gamma</qti-simple-choice>
      <qti-simple-choice identifier="D">Delta</qti-simple-choice>
      <qti-simple-choice identifier="E">Epsilon</qti-simple-choice>
      <qti-simple-choice identifier="F">Zeta</qti-simple-choice>
    </qti-choice-interaction>

    <!-- 8. Hidden input control + labels -->
    <qti-choice-interaction response-identifier="R6" max-choices="1"
      class="qti-input-control-hidden qti-labels-decimal qti-labels-suffix-period">
      <qti-prompt>Hidden input control with decimal labels — radio buttons should be visually hidden</qti-prompt>
      <qti-simple-choice identifier="A">Alpha</qti-simple-choice>
      <qti-simple-choice identifier="B">Beta</qti-simple-choice>
      <qti-simple-choice identifier="C">Gamma</qti-simple-choice>
    </qti-choice-interaction>

    <!-- 9. Hidden input control + horizontal (no labels) -->
    <qti-choice-interaction response-identifier="R7" max-choices="1"
      class="qti-input-control-hidden qti-orientation-horizontal">
      <qti-prompt>Hidden input control + horizontal — no radio/checkbox visible, choices flow left to right</qti-prompt>
      <qti-simple-choice identifier="A">Alpha</qti-simple-choice>
      <qti-simple-choice identifier="B">Beta</qti-simple-choice>
      <qti-simple-choice identifier="C">Gamma</qti-simple-choice>
    </qti-choice-interaction>

    <!-- 10. Hidden input control + stacking-2 (vertical column-major) + labels -->
    <qti-choice-interaction response-identifier="R8" max-choices="1"
      class="qti-input-control-hidden qti-choices-stacking-2 qti-labels-lower-alpha">
      <qti-prompt>Hidden input + stacking-2 (column-major) with lower-alpha labels</qti-prompt>
      <qti-simple-choice identifier="A">Alpha</qti-simple-choice>
      <qti-simple-choice identifier="B">Beta</qti-simple-choice>
      <qti-simple-choice identifier="C">Gamma</qti-simple-choice>
      <qti-simple-choice identifier="D">Delta</qti-simple-choice>
    </qti-choice-interaction>

    <!-- 11. Stacking-1 (should look like normal vertical, no grid) -->
    <qti-choice-interaction response-identifier="R9" max-choices="1"
      class="qti-choices-stacking-1 qti-labels-decimal">
      <qti-prompt>Stacking-1 (single column, no grid) — should look identical to default vertical layout</qti-prompt>
      <qti-simple-choice identifier="A">Alpha</qti-simple-choice>
      <qti-simple-choice identifier="B">Beta</qti-simple-choice>
      <qti-simple-choice identifier="C">Gamma</qti-simple-choice>
    </qti-choice-interaction>

    <!-- 12. Horizontal + stacking-2 + hidden + labels (everything combined) -->
    <qti-choice-interaction response-identifier="R10" max-choices="1"
      class="qti-orientation-horizontal qti-choices-stacking-2 qti-input-control-hidden qti-labels-upper-alpha qti-labels-suffix-parenthesis">
      <qti-prompt>All combined: horizontal + stacking-2 + hidden input + upper-alpha labels</qti-prompt>
      <qti-simple-choice identifier="A">Alpha</qti-simple-choice>
      <qti-simple-choice identifier="B">Beta</qti-simple-choice>
      <qti-simple-choice identifier="C">Gamma</qti-simple-choice>
      <qti-simple-choice identifier="D">Delta</qti-simple-choice>
    </qti-choice-interaction>

  </qti-item-body>

  <qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['choice'];
