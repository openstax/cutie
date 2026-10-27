/* Shared NCLEX authoring guidance composed into the descriptions of NCLEX
 * samples, alongside the standard conventions. */

export const clinicalScenario = `\
Start with a short clinical scenario that gives the client's situation and the \
data the question depends on. Refer to the person receiving care as "the client".`;

export const plusMinusScoring = `\
Score with the NCLEX +/- rule: each correct selection earns 1 point, each \
incorrect selection loses 1 point, and the score can't go below 0. Add a \
\`qti-mapping\` to the response declaration with \`mapped-value="1"\` for each \
correct option, \`default-value="-1"\` so any other selection costs a point, \
\`lower-bound="0"\`, and \`upper-bound\` set to the number of correct options.`;

export const zeroOneMappedScoring = `\
Score with the NCLEX 0/1 rule: each correct selection earns 1 point and \
incorrect selections earn nothing. Add a \`qti-mapping\` to the response \
declaration with \`mapped-value="1"\` for each correct value, \`default-value="0"\`, \
and \`lower-bound="0"\`.`;

export const zeroOneDropDownScoring = `\
Score with the NCLEX 0/1 rule: each drop-down answered correctly earns 1 point. \
For each drop-down, a \`qti-response-condition\` sets an intermediate \
\`<responseId>_SCORE\` outcome (declared as a float with default 0) to 1 when \
the response matches its \`qti-correct\` and 0 otherwise. Then set \`SCORE\` to \
the \`qti-sum\` of those outcomes.`;

export const sumMapResponses = `\
Set \`SCORE\` to a \`qti-sum\` of \`qti-map-response\` for each response, even \
when there is only one.`;

export const rationaleDyad = `\
This is the dyad form: one cause and one effect, worth 1 point, and both must \
be correct for credit. The triad form (one cause, two effects, worth 2 points, \
with no credit unless the cause is correct) has no sample yet.`;

export const maxScore = `\
Set the \`MAXSCORE\` default to the most the item can award: one point for \
each correct option, blank, or pair.`;
