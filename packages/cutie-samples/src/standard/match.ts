/* spell-checker: ignore monosaccharides monosaccharide */
import type { Sample } from '../types';
import {
  allOrNothingMatch,
  correctResponse,
  outcomes,
  pairMappingAlternative,
  responseProcessingOrder,
  shuffle,
  workedSolution,
} from './conventions';

const description = `\
A matching question: \`qti-match-interaction\` with a \`qti-prompt\` and two \
\`qti-simple-match-set\` elements, sources first and targets second. The response \
is a \`multiple\` cardinality \`directedPair\` of "source target" identifiers.

Use match for creating *associations* between two sets of things. For \
fill-in-the-blank style questions, use gap match instead.

- ${shuffle}
- \`match-max\` on each choice and \`min-associations\`/\`max-associations\` on the \
interaction are at the author's discretion. For example, a target can accept several \
sources, or extra targets can act as distractors.
- Don't add per-pair feedback.
- ${workedSolution}
- ${allOrNothingMatch} The response must contain exactly the correct set of pairs.
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}

${pairMappingAlternative}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-match" title="Macromolecules and Their Monomers"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>proteins aminoAcids</qti-value>
      <qti-value>nucleicAcids nucleotides</qti-value>
      <qti-value>carbohydrates monosaccharides</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>1.0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

  <qti-item-body>
    <qti-match-interaction response-identifier="RESPONSE" shuffle="true" min-associations="3" max-associations="3">
      <qti-prompt>Match each type of macromolecule with the monomer it is built from.</qti-prompt>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="proteins" match-max="1">Proteins</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="nucleicAcids" match-max="1">Nucleic acids</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="carbohydrates" match-max="1">Carbohydrates</qti-simple-associable-choice>
      </qti-simple-match-set>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="aminoAcids" match-max="1">Amino acids</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="nucleotides" match-max="1">Nucleotides</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="monosaccharides" match-max="1">Monosaccharides</qti-simple-associable-choice>
      </qti-simple-match-set>
    </qti-match-interaction>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <p>Macromolecules are polymers made by linking many smaller monomers together, and the monomer's name often hints at the polymer it builds. Proteins are chains of amino acids joined by peptide bonds. Nucleic acids such as DNA and RNA are chains of nucleotides, each made of a sugar, a phosphate group, and a nitrogenous base. Carbohydrates such as starch and cellulose are chains of monosaccharides ("single sugars") like glucose.</p>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
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
    <qti-set-outcome-value identifier="FEEDBACK">
      <qti-multiple>
        <qti-variable identifier="FEEDBACK"/>
        <qti-base-value base-type="identifier">ITEM_completed</qti-base-value>
      </qti-multiple>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

export const match: Sample = {
  id: 'match',
  name: 'Match',
  summary: 'Pair items from one set with items from another, such as terms with definitions.',
  description,
  interactionTypes: ['match'],
  item,
};
