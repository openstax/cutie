// Variant test: extended text height-lines vocabulary classes and expected-lines sizing

export const name = "Extended Text Sizes";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="variant-extended-text-sizes" title="Extended Text Size Variants"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="R1" cardinality="single" base-type="string"/>
  <qti-response-declaration identifier="R2" cardinality="single" base-type="string"/>
  <qti-response-declaration identifier="R3" cardinality="single" base-type="string"/>
  <qti-response-declaration identifier="R4" cardinality="single" base-type="string"/>
  <qti-response-declaration identifier="R5" cardinality="single" base-type="string"/>
  <qti-response-declaration identifier="R6" cardinality="single" base-type="string"/>
  <qti-response-declaration identifier="R7" cardinality="single" base-type="string"/>
  <qti-response-declaration identifier="R8" cardinality="single" base-type="string"/>
  <qti-response-declaration identifier="R9" cardinality="single" base-type="string"/>
  <qti-response-declaration identifier="R10" cardinality="single" base-type="string"/>
  <qti-response-declaration identifier="R11" cardinality="single" base-type="string"/>
  <qti-response-declaration identifier="R12" cardinality="single" base-type="string"/>
  <qti-response-declaration identifier="R13" cardinality="single" base-type="string"/>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>

    <p><strong>Extended Text Size Variants</strong></p>
    <p>Each textarea below demonstrates a different sizing approach.</p>

    <!-- Default (no sizing hints) — uses CSS default 7.5em -->
    <qti-extended-text-interaction response-identifier="R1">
      <qti-prompt>Default size (no sizing hints, CSS default 7.5em)</qti-prompt>
    </qti-extended-text-interaction>

    <!-- qti-height-lines-3: short answer, 3 lines -->
    <qti-extended-text-interaction response-identifier="R2" class="qti-height-lines-3">
      <qti-prompt>qti-height-lines-3 (4.2em, short answer)</qti-prompt>
    </qti-extended-text-interaction>

    <!-- qti-height-lines-6: medium answer, 6 lines -->
    <qti-extended-text-interaction response-identifier="R3" class="qti-height-lines-6">
      <qti-prompt>qti-height-lines-6 (8.4em, medium answer)</qti-prompt>
    </qti-extended-text-interaction>

    <!-- qti-height-lines-15: long answer, 15 lines -->
    <qti-extended-text-interaction response-identifier="R4" class="qti-height-lines-15">
      <qti-prompt>qti-height-lines-15 (21em, essay-length)</qti-prompt>
    </qti-extended-text-interaction>

    <!-- expected-lines="10" attribute (inline style, overrides height-lines class) -->
    <qti-extended-text-interaction response-identifier="R5" expected-lines="10" class="qti-height-lines-3">
      <qti-prompt>expected-lines="10" with qti-height-lines-3 class (attribute wins, 14em)</qti-prompt>
    </qti-extended-text-interaction>

    <!-- Rich text (format="xhtml") with default height -->
    <qti-extended-text-interaction response-identifier="R6" format="xhtml">
      <qti-prompt>Rich text editor — default height (Quill, format="xhtml")</qti-prompt>
    </qti-extended-text-interaction>

    <!-- Rich text (format="xhtml") with qti-height-lines-15 for tall editor -->
    <qti-extended-text-interaction response-identifier="R7" format="xhtml" class="qti-height-lines-15">
      <qti-prompt>Rich text editor — qti-height-lines-15 (21em, essay-length)</qti-prompt>
    </qti-extended-text-interaction>

    <!-- Character counter: count up -->
    <qti-extended-text-interaction response-identifier="R8" expected-length="200" class="qti-counter-up qti-height-lines-3">
      <qti-prompt>Counter up — shows "N / 200 characters"</qti-prompt>
    </qti-extended-text-interaction>

    <!-- Character counter: count down (short limit to easily demo over-limit) -->
    <qti-extended-text-interaction response-identifier="R9" expected-length="50" class="qti-counter-down qti-height-lines-3">
      <qti-prompt>Counter down — shows remaining, turns red when over 50 chars</qti-prompt>
    </qti-extended-text-interaction>

    <!-- Character counter on rich text editor -->
    <qti-extended-text-interaction response-identifier="R10" format="xhtml" expected-length="300" class="qti-counter-up">
      <qti-prompt>Rich text with counter up — shows "N / 300 characters"</qti-prompt>
    </qti-extended-text-interaction>

    <!-- Hard character limit (data-max-characters) — counter defaults to down -->
    <qti-extended-text-interaction response-identifier="R11" data-max-characters="100" class="qti-height-lines-3">
      <qti-prompt>Hard limit 100 chars (data-max-characters) — counter defaults to down, validation fails when exceeded</qti-prompt>
    </qti-extended-text-interaction>

    <!-- Hard character limit with counter-up -->
    <qti-extended-text-interaction response-identifier="R12" data-max-characters="50" class="qti-counter-up qti-height-lines-3">
      <qti-prompt>Hard limit 50 chars with counter-up — shows "N / 50 characters"</qti-prompt>
    </qti-extended-text-interaction>

    <!-- Min + max character range with counter-up -->
    <qti-extended-text-interaction response-identifier="R13" data-min-characters="20" data-max-characters="200" class="qti-counter-up qti-height-lines-6">
      <qti-prompt>Min 20, max 200 chars — "Write at least 20 characters" constraint with counter</qti-prompt>
    </qti-extended-text-interaction>

  </qti-item-body>

  <qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['extended-text'];
