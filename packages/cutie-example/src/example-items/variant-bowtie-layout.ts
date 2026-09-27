// cspell:ignore tachycardia hypotension mucous
// Variant test: bowtie rendered with qti-match-interaction (grouped mode).
// A two-set match whose source choices carry match-group naming their target
// column; the handler derives one column per target (Actions | Condition |
// Parameters). The qti-choices-* class repositions each column's word bank
// within its own column — DOM order stays slot -> bank, so only the visual
// placement changes. Visual verification of qti-choices-top/bottom/left/right
// on the grouped column layout.

export const name = "Match - Bowtie Layout";

// A compact clinical-judgment bowtie collapsed to three target columns:
// Actions (accepts 2) | Condition (accepts 1) | Parameters (accepts 2). Each
// source names its column via match-group; targets are fixed so the column
// order survives shuffle. Reused per interaction with a different bank class.
const buildBowtie = (rid: string, cls: string, label: string): string => `
    <qti-match-interaction response-identifier="${rid}" shuffle="true"${cls ? ` class="${cls}"` : ''}>
      <qti-prompt>${label}</qti-prompt>

      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="ACT1" match-max="1" match-group="T_ACTIONS">Administer IV fluids</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="ACT2" match-max="1" match-group="T_ACTIONS">Notify the provider</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="ACT3" match-max="1" match-group="T_ACTIONS">Restrict oral fluids</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="COND1" match-max="1" match-group="T_CONDITION">Fluid volume deficit</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="COND2" match-max="1" match-group="T_CONDITION">Fluid volume excess</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="PAR1" match-max="1" match-group="T_PARAMS">Heart rate</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="PAR2" match-max="1" match-group="T_PARAMS">Blood pressure</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="PAR3" match-max="1" match-group="T_PARAMS">Deep tendon reflexes</qti-simple-associable-choice>
      </qti-simple-match-set>

      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="T_ACTIONS" match-max="2" fixed="true">Actions to Take</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="T_CONDITION" match-max="1" fixed="true">Condition</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="T_PARAMS" match-max="2" fixed="true">Parameters to Monitor</qti-simple-associable-choice>
      </qti-simple-match-set>
    </qti-match-interaction>`;

const responseDecl = (rid: string): string => `
  <qti-response-declaration identifier="${rid}" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>ACT1 T_ACTIONS</qti-value>
      <qti-value>ACT2 T_ACTIONS</qti-value>
      <qti-value>COND1 T_CONDITION</qti-value>
      <qti-value>PAR1 T_PARAMS</qti-value>
      <qti-value>PAR2 T_PARAMS</qti-value>
    </qti-correct-response>
  </qti-response-declaration>`;

const variants: Array<{ rid: string; cls: string; label: string }> = [
  { rid: 'R_BOTTOM', cls: '', label: 'Default (bottom) — each bank below its column’s slot' },
  { rid: 'R_TOP', cls: 'qti-choices-top', label: 'qti-choices-top — each bank above its column’s slot' },
  { rid: 'R_LEFT', cls: 'qti-choices-left', label: 'qti-choices-left — each bank left of its column’s slot' },
  { rid: 'R_RIGHT', cls: 'qti-choices-right', label: 'qti-choices-right — each bank right of its column’s slot' },
];

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="variant-bowtie-layout" title="Bowtie Layout Variants"
adaptive="false" time-dependent="false" xml:lang="en">
${variants.map(v => responseDecl(v.rid)).join('')}

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <p><strong>Bowtie Layout Variants</strong></p>
    <p>Each bowtie below is a qti-match-interaction whose per-column word banks are placed with a different qti-choices-* class.</p>
${variants.map(v => buildBowtie(v.rid, v.cls, v.label)).join('\n    <hr/>\n')}
  </qti-item-body>

  <qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['match'];
