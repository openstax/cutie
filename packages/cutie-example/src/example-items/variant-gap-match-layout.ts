// Variant test: gap-match word bank positioning and sizing vocabulary
// Visual verification of qti-choices-bottom/left/right and data-choices-container-width

export const name = "Gap Match Layout";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="variant-gap-match-layout" title="Gap Match Layout Variants"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="R1" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>W1 G1</qti-value>
      <qti-value>W2 G2</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R2" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>W1 G1</qti-value>
      <qti-value>W2 G2</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R3" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>W1 G1</qti-value>
      <qti-value>W2 G2</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R4" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>W1 G1</qti-value>
      <qti-value>W2 G2</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>

    <p><strong>Gap Match Layout Variants</strong></p>
    <p>Each interaction below demonstrates a different word bank position or width.</p>

    <!-- 1. Default (word bank above content, qti-choices-top equivalent) -->
    <qti-gap-match-interaction response-identifier="R1">
      <qti-prompt>Default layout — word bank above the content</qti-prompt>
      <qti-gap-text identifier="W1" match-max="1">quick</qti-gap-text>
      <qti-gap-text identifier="W2" match-max="1">lazy</qti-gap-text>
      <p>The <qti-gap identifier="G1"></qti-gap> brown fox jumps over the <qti-gap identifier="G2"></qti-gap> dog.</p>
    </qti-gap-match-interaction>

    <!-- 2. qti-choices-bottom — word bank below content -->
    <qti-gap-match-interaction response-identifier="R2" class="qti-choices-bottom">
      <qti-prompt>qti-choices-bottom — word bank below the content</qti-prompt>
      <qti-gap-text identifier="W1" match-max="1">quick</qti-gap-text>
      <qti-gap-text identifier="W2" match-max="1">lazy</qti-gap-text>
      <p>The <qti-gap identifier="G1"></qti-gap> brown fox jumps over the <qti-gap identifier="G2"></qti-gap> dog.</p>
    </qti-gap-match-interaction>

    <!-- 3. qti-choices-left — word bank beside content on the left -->
    <qti-gap-match-interaction response-identifier="R3" class="qti-choices-left">
      <qti-prompt>qti-choices-left — word bank to the left of the content</qti-prompt>
      <qti-gap-text identifier="W1" match-max="1">quick</qti-gap-text>
      <qti-gap-text identifier="W2" match-max="1">lazy</qti-gap-text>
      <p>The <qti-gap identifier="G1"></qti-gap> brown fox jumps over the <qti-gap identifier="G2"></qti-gap> dog.</p>
    </qti-gap-match-interaction>

    <!-- 4. qti-choices-right + fixed container width -->
    <qti-gap-match-interaction response-identifier="R4" class="qti-choices-right" data-choices-container-width="200">
      <qti-prompt>qti-choices-right with data-choices-container-width="200"</qti-prompt>
      <qti-gap-text identifier="W1" match-max="1">quick</qti-gap-text>
      <qti-gap-text identifier="W2" match-max="1">lazy</qti-gap-text>
      <p>The <qti-gap identifier="G1"></qti-gap> brown fox jumps over the <qti-gap identifier="G2"></qti-gap> dog.</p>
    </qti-gap-match-interaction>

  </qti-item-body>

  <qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['gap-match'];
