// cspell:ignore COPD
// Variant test: match interaction tabular layout vocabulary
// Visual verification of qti-match-tabular, qti-header-hidden and data-first-column-header

export const name = "Match Tabular Layout";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="variant-match-tabular-layout" title="Match Tabular Layout Variants"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="R1" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>F1 IND</qti-value>
      <qti-value>F2 NOT</qti-value>
      <qti-value>F3 IND</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R2" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>F1 FLU</qti-value>
      <qti-value>F1 PNE</qti-value>
      <qti-value>F2 PNE</qti-value>
      <qti-value>F3 FLU</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R3" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>F1 IND</qti-value>
      <qti-value>F2 NOT</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>

    <p><strong>Match Tabular Layout Variants</strong></p>
    <p>Each interaction below demonstrates a different tabular match presentation.</p>

    <!-- 1. Rows with match-max="1": a radio group per row -->
    <qti-match-interaction response-identifier="R1" max-associations="0" class="qti-match-tabular">
      <qti-prompt>qti-match-tabular — one choice per row (radio buttons)</qti-prompt>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="F1" match-max="1">Temperature 39.2 °C (102.6 °F)</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="F2" match-max="1">Blood pressure 118/76 mm Hg</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="F3" match-max="1">Crackles in the right lower lobe</qti-simple-associable-choice>
      </qti-simple-match-set>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="IND" match-max="0">Indicated</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="NOT" match-max="0">Not indicated</qti-simple-associable-choice>
      </qti-simple-match-set>
    </qti-match-interaction>

    <!-- 2. Rows with match-max="0": checkboxes, any number per row -->
    <qti-match-interaction response-identifier="R2" max-associations="0" class="qti-match-tabular" data-first-column-header="Finding">
      <qti-prompt>qti-match-tabular with data-first-column-header — any number per row (checkboxes)</qti-prompt>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="F1" match-max="0">Fever</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="F2" match-max="0">Productive cough with rust-colored sputum</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="F3" match-max="0">Myalgia</qti-simple-associable-choice>
      </qti-simple-match-set>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="FLU" match-max="0">Influenza</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="PNE" match-max="0">Pneumonia</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="COPD" match-max="0">COPD</qti-simple-associable-choice>
      </qti-simple-match-set>
    </qti-match-interaction>

    <!-- 3. qti-header-hidden: the column headers are hidden visually -->
    <qti-match-interaction response-identifier="R3" max-associations="0" class="qti-match-tabular qti-header-hidden">
      <qti-prompt>qti-match-tabular qti-header-hidden — column headers hidden (Indicated, Not indicated)</qti-prompt>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="F1" match-max="1">Oxygen saturation 89%</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="F2" match-max="1">Heart rate 78 beats/min</qti-simple-associable-choice>
      </qti-simple-match-set>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="IND" match-max="0">Indicated</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="NOT" match-max="0">Not indicated</qti-simple-associable-choice>
      </qti-simple-match-set>
    </qti-match-interaction>

  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['match'];
