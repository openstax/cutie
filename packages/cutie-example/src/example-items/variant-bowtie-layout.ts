// cspell:ignore tachycardia hypotension mucous
// Variant test: bowtie (grouped gap-match) per-column choice bank placement.
// Visual verification of qti-choices-top/bottom/left/right on a column layout —
// the class repositions each group's bank within its own column. DOM order
// stays gaps -> bank, so only the visual placement changes.

export const name = "Gap Match - Bowtie Layout";

// A compact clinical-judgment bowtie: Actions (2 gaps) | Condition (1 gap) |
// Parameters (2 gaps). Reused per interaction with a different choice-bank class.
const buildBowtie = (rid: string, cls: string, label: string): string => `
    <qti-gap-match-interaction response-identifier="${rid}" shuffle="true"${cls ? ` class="${cls}"` : ''}>
      <qti-prompt>${label}</qti-prompt>

      <qti-gap-text identifier="ACT1" match-max="1" match-group="actions">Administer IV fluids</qti-gap-text>
      <qti-gap-text identifier="ACT2" match-max="1" match-group="actions">Notify the provider</qti-gap-text>
      <qti-gap-text identifier="ACT3" match-max="1" match-group="actions">Restrict oral fluids</qti-gap-text>

      <qti-gap-text identifier="COND1" match-max="1" match-group="condition">Fluid volume deficit</qti-gap-text>
      <qti-gap-text identifier="COND2" match-max="1" match-group="condition">Fluid volume excess</qti-gap-text>

      <qti-gap-text identifier="PAR1" match-max="1" match-group="parameters">Heart rate</qti-gap-text>
      <qti-gap-text identifier="PAR2" match-max="1" match-group="parameters">Blood pressure</qti-gap-text>
      <qti-gap-text identifier="PAR3" match-max="1" match-group="parameters">Deep tendon reflexes</qti-gap-text>

      <div class="qti-layout-row">
        <div class="qti-layout-col4"><p><strong>Actions to Take</strong><qti-gap identifier="GA1" match-group="actions"/><qti-gap identifier="GA2" match-group="actions"/></p></div>
        <div class="qti-layout-col4"><p><strong>Condition</strong><qti-gap identifier="GC1" match-group="condition"/></p></div>
        <div class="qti-layout-col4"><p><strong>Parameters to Monitor</strong><qti-gap identifier="GP1" match-group="parameters"/><qti-gap identifier="GP2" match-group="parameters"/></p></div>
      </div>
    </qti-gap-match-interaction>`;

const responseDecl = (rid: string): string => `
  <qti-response-declaration identifier="${rid}" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>ACT1 GA1</qti-value>
      <qti-value>ACT2 GA2</qti-value>
      <qti-value>COND1 GC1</qti-value>
      <qti-value>PAR1 GP1</qti-value>
      <qti-value>PAR2 GP2</qti-value>
    </qti-correct-response>
  </qti-response-declaration>`;

const variants: Array<{ rid: string; cls: string; label: string }> = [
  { rid: 'R_BOTTOM', cls: '', label: 'Default (bottom) — each bank below its column’s gaps' },
  { rid: 'R_TOP', cls: 'qti-choices-top', label: 'qti-choices-top — each bank above its column’s gaps' },
  { rid: 'R_LEFT', cls: 'qti-choices-left', label: 'qti-choices-left — each bank left of its column’s gaps' },
  { rid: 'R_RIGHT', cls: 'qti-choices-right', label: 'qti-choices-right — each bank right of its column’s gaps' },
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
    <p>Each bowtie below places its per-column choice banks with a different qti-choices-* class.</p>
${variants.map(v => buildBowtie(v.rid, v.cls, v.label)).join('\n    <hr/>\n')}
  </qti-item-body>

  <qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['gap-match'];
