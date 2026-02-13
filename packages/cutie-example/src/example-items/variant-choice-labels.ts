// Variant test: all choice label vocabulary classes
// Visual verification of qti-labels-* and qti-labels-suffix-* CSS

export const name = "Choice Labels & Suffixes";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="variant-choice-labels" title="Choice Label Variants"
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

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>

    <p><strong>Choice Label Vocabulary Variants</strong></p>
    <p>Each interaction below demonstrates a different combination of label and suffix classes.</p>

    <!-- No labels (default) -->
    <qti-choice-interaction response-identifier="R1" max-choices="1" class="qti-labels-none">
      <qti-prompt>This is a choice interaction with no labels (qti-labels-none, the default)</qti-prompt>
      <qti-simple-choice identifier="A">First choice</qti-simple-choice>
      <qti-simple-choice identifier="B">Second choice</qti-simple-choice>
      <qti-simple-choice identifier="C">Third choice</qti-simple-choice>
    </qti-choice-interaction>

    <!-- Decimal labels, no suffix -->
    <qti-choice-interaction response-identifier="R2" max-choices="1" class="qti-labels-decimal">
      <qti-prompt>This is a choice interaction with decimal number labels (1, 2, 3)</qti-prompt>
      <qti-simple-choice identifier="A">First choice</qti-simple-choice>
      <qti-simple-choice identifier="B">Second choice</qti-simple-choice>
      <qti-simple-choice identifier="C">Third choice</qti-simple-choice>
    </qti-choice-interaction>

    <!-- Lower alpha labels, no suffix -->
    <qti-choice-interaction response-identifier="R3" max-choices="1" class="qti-labels-lower-alpha">
      <qti-prompt>This is a choice interaction with lowercase letter labels (a, b, c)</qti-prompt>
      <qti-simple-choice identifier="A">First choice</qti-simple-choice>
      <qti-simple-choice identifier="B">Second choice</qti-simple-choice>
      <qti-simple-choice identifier="C">Third choice</qti-simple-choice>
    </qti-choice-interaction>

    <!-- Upper alpha labels, no suffix -->
    <qti-choice-interaction response-identifier="R4" max-choices="1" class="qti-labels-upper-alpha">
      <qti-prompt>This is a choice interaction with uppercase letter labels (A, B, C)</qti-prompt>
      <qti-simple-choice identifier="A">First choice</qti-simple-choice>
      <qti-simple-choice identifier="B">Second choice</qti-simple-choice>
      <qti-simple-choice identifier="C">Third choice</qti-simple-choice>
    </qti-choice-interaction>

    <!-- Decimal + period suffix -->
    <qti-choice-interaction response-identifier="R5" max-choices="1" class="qti-labels-decimal qti-labels-suffix-period">
      <qti-prompt>This is a choice interaction with decimal labels and period suffix (1., 2., 3.)</qti-prompt>
      <qti-simple-choice identifier="A">First choice</qti-simple-choice>
      <qti-simple-choice identifier="B">Second choice</qti-simple-choice>
      <qti-simple-choice identifier="C">Third choice</qti-simple-choice>
    </qti-choice-interaction>

    <!-- Lower alpha + period suffix -->
    <qti-choice-interaction response-identifier="R6" max-choices="1" class="qti-labels-lower-alpha qti-labels-suffix-period">
      <qti-prompt>This is a choice interaction with lowercase letter labels and period suffix (a., b., c.)</qti-prompt>
      <qti-simple-choice identifier="A">First choice</qti-simple-choice>
      <qti-simple-choice identifier="B">Second choice</qti-simple-choice>
      <qti-simple-choice identifier="C">Third choice</qti-simple-choice>
    </qti-choice-interaction>

    <!-- Upper alpha + period suffix -->
    <qti-choice-interaction response-identifier="R7" max-choices="1" class="qti-labels-upper-alpha qti-labels-suffix-period">
      <qti-prompt>This is a choice interaction with uppercase letter labels and period suffix (A., B., C.)</qti-prompt>
      <qti-simple-choice identifier="A">First choice</qti-simple-choice>
      <qti-simple-choice identifier="B">Second choice</qti-simple-choice>
      <qti-simple-choice identifier="C">Third choice</qti-simple-choice>
    </qti-choice-interaction>

    <!-- Decimal + parenthesis suffix -->
    <qti-choice-interaction response-identifier="R8" max-choices="1" class="qti-labels-decimal qti-labels-suffix-parenthesis">
      <qti-prompt>This is a choice interaction with decimal labels and parenthesis suffix (1), 2), 3))</qti-prompt>
      <qti-simple-choice identifier="A">First choice</qti-simple-choice>
      <qti-simple-choice identifier="B">Second choice</qti-simple-choice>
      <qti-simple-choice identifier="C">Third choice</qti-simple-choice>
    </qti-choice-interaction>

    <!-- Lower alpha + parenthesis suffix -->
    <qti-choice-interaction response-identifier="R9" max-choices="1" class="qti-labels-lower-alpha qti-labels-suffix-parenthesis">
      <qti-prompt>This is a choice interaction with lowercase letter labels and parenthesis suffix (a), b), c))</qti-prompt>
      <qti-simple-choice identifier="A">First choice</qti-simple-choice>
      <qti-simple-choice identifier="B">Second choice</qti-simple-choice>
      <qti-simple-choice identifier="C">Third choice</qti-simple-choice>
    </qti-choice-interaction>

    <!-- Upper alpha + parenthesis suffix -->
    <qti-choice-interaction response-identifier="R10" max-choices="1" class="qti-labels-upper-alpha qti-labels-suffix-parenthesis">
      <qti-prompt>This is a choice interaction with uppercase letter labels and parenthesis suffix (A), B), C))</qti-prompt>
      <qti-simple-choice identifier="A">First choice</qti-simple-choice>
      <qti-simple-choice identifier="B">Second choice</qti-simple-choice>
      <qti-simple-choice identifier="C">Third choice</qti-simple-choice>
    </qti-choice-interaction>

  </qti-item-body>

  <qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['choice'];
