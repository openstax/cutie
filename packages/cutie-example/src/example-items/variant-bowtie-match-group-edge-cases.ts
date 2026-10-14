// cspell:ignore distractor
// Variant test: match-group values that don't form a well-formed bowtie.
// The grouped (bowtie) layout is only used when every source names exactly one
// target column, every column's slots can be filled, and max-associations
// allows filling them all. The first interaction
// is a well-formed bowtie (with a distractor) for comparison; each one after it
// has one deliberately irregular source or target, so it falls back to the
// classic two-set layout (where match-group still restricts pairing):
//   - a source with no match-group
//   - a source whose match-group names a target that doesn't exist
//   - a source whose match-group names two targets
//   - a target that no source names
//   - a target with more slots (match-max) than sources to fill them
//   - more slots in total than max-associations allows
// Each interaction sets max-associations to its total slot count (the spec
// default is 1), except the last, which sets it lower.

export const name = "Match - Bowtie match-group Edge Cases";

interface Source { id: string; group?: string; text: string }

const targets = `
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="T_FRUIT" match-max="2" fixed="true">Fruit</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="T_VEG" match-max="2" fixed="true">Vegetable</qti-simple-associable-choice>
      </qti-simple-match-set>`;

const baseSources: Source[] = [
  { id: 'APPLE', group: 'T_FRUIT', text: 'Apple' },
  { id: 'PEAR', group: 'T_FRUIT', text: 'Pear' },
  { id: 'CARROT', group: 'T_VEG', text: 'Carrot' },
  { id: 'LEEK', group: 'T_VEG', text: 'Leek' },
];

const buildSources = (sources: Source[]): string => `
      <qti-simple-match-set>
${sources.map(s => `        <qti-simple-associable-choice identifier="${s.id}" match-max="1"${s.group !== undefined ? ` match-group="${s.group}"` : ''}>${s.text}</qti-simple-associable-choice>`).join('\n')}
      </qti-simple-match-set>`;

const variants: Array<{
  rid: string; label: string; body: string; maxAssociations: number; correct: string[];
}> = [
  {
    rid: 'R_VALID',
    label: 'Well-formed bowtie: Tomato is a Fruit distractor (3 sources for 2 slots) — renders grouped',
    body: buildSources([...baseSources, { id: 'TOMATO', group: 'T_FRUIT', text: 'Tomato' }]) + targets,
    maxAssociations: 4,
    correct: ['APPLE T_FRUIT', 'PEAR T_FRUIT', 'CARROT T_VEG', 'LEEK T_VEG'],
  },
  {
    rid: 'R_NO_GROUP',
    label: 'Tomato has no match-group (all other sources do)',
    body: buildSources([...baseSources, { id: 'TOMATO', text: 'Tomato' }]) + targets,
    maxAssociations: 4,
    correct: ['APPLE T_FRUIT', 'PEAR T_FRUIT', 'CARROT T_VEG', 'LEEK T_VEG'],
  },
  {
    rid: 'R_MISSING_GROUP',
    label: 'Tomato has match-group="T_BERRY", which is not a target identifier',
    body: buildSources([...baseSources, { id: 'TOMATO', group: 'T_BERRY', text: 'Tomato' }]) + targets,
    maxAssociations: 4,
    correct: ['APPLE T_FRUIT', 'PEAR T_FRUIT', 'CARROT T_VEG', 'LEEK T_VEG'],
  },
  {
    rid: 'R_MULTI_GROUP',
    label: 'Tomato has match-group="T_FRUIT T_VEG" (names both targets)',
    body: buildSources([...baseSources, { id: 'TOMATO', group: 'T_FRUIT T_VEG', text: 'Tomato' }]) + `
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="T_FRUIT" match-max="3" fixed="true">Fruit</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="T_VEG" match-max="3" fixed="true">Vegetable</qti-simple-associable-choice>
      </qti-simple-match-set>`,
    maxAssociations: 6,
    correct: ['APPLE T_FRUIT', 'PEAR T_FRUIT', 'TOMATO T_FRUIT', 'CARROT T_VEG', 'LEEK T_VEG'],
  },
  {
    rid: 'R_EMPTY_TARGET',
    label: 'Target "Grain" is named by no source (empty bank)',
    body: buildSources(baseSources) + `
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="T_FRUIT" match-max="2" fixed="true">Fruit</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="T_VEG" match-max="2" fixed="true">Vegetable</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="T_GRAIN" match-max="1" fixed="true">Grain</qti-simple-associable-choice>
      </qti-simple-match-set>`,
    maxAssociations: 5,
    correct: ['APPLE T_FRUIT', 'PEAR T_FRUIT', 'CARROT T_VEG', 'LEEK T_VEG'],
  },
  {
    rid: 'R_TOO_MANY_SLOTS',
    label: 'Target "Vegetable" has match-max="3" but only 2 sources name it',
    body: buildSources(baseSources) + `
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="T_FRUIT" match-max="2" fixed="true">Fruit</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="T_VEG" match-max="3" fixed="true">Vegetable</qti-simple-associable-choice>
      </qti-simple-match-set>`,
    maxAssociations: 5,
    correct: ['APPLE T_FRUIT', 'PEAR T_FRUIT', 'CARROT T_VEG', 'LEEK T_VEG'],
  },
  {
    rid: 'R_MAX_ASSOCIATIONS',
    label: 'max-associations="3" allows fewer associations than the 4 slots',
    body: buildSources(baseSources) + targets,
    maxAssociations: 3,
    correct: ['APPLE T_FRUIT', 'PEAR T_FRUIT', 'CARROT T_VEG'],
  },
];

const responseDecl = (rid: string, correct: string[]): string => `
  <qti-response-declaration identifier="${rid}" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
${correct.map(c => `      <qti-value>${c}</qti-value>`).join('\n')}
    </qti-correct-response>
  </qti-response-declaration>`;

const buildInteraction = (rid: string, label: string, body: string, maxAssociations: number): string => `
    <qti-match-interaction response-identifier="${rid}" shuffle="true" max-associations="${maxAssociations}">
      <qti-prompt>${label}</qti-prompt>
${body}
    </qti-match-interaction>`;

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="variant-bowtie-match-group-edge-cases" title="Bowtie match-group Edge Cases"
adaptive="false" time-dependent="false" xml:lang="en">
${variants.map(v => responseDecl(v.rid, v.correct)).join('')}

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <p><strong>Bowtie match-group Edge Cases</strong></p>
    <p>The first match is a well-formed bowtie. Each one after it has one irregular source or target, so it falls back to the classic match layout.</p>
${variants.map(v => buildInteraction(v.rid, v.label, v.body, v.maxAssociations)).join('\n    <hr/>\n')}
  </qti-item-body>

  <qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['match'];
