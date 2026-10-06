/* Shared authoring guidance composed into the descriptions of standard samples,
 * so each sample's description stands on its own for consumers that read one
 * sample at a time. */

export const outcomes = `\
Declare the outcomes \`SCORE\` (float, default 0) and \`MAXSCORE\` (float). When \
the item has feedback, also declare \`FEEDBACK\` (identifier, multiple \
cardinality); feedback elements use \`outcome-identifier="FEEDBACK"\` and \
\`show-hide="show"\`.`;

export const correctResponse = `\
Always declare a \`qti-correct-response\`, even when scoring uses a \`qti-mapping\`. \
Delivery feedback depends on knowing the correct answer.`;

export const shuffle = `\
Set \`shuffle="true"\` unless the order of the options matters. If only some \
options depend on their position (such as "All of the above"), mark those options \
\`fixed="true"\` instead of turning shuffle off.`;

export const workedSolution = `\
After the interaction, include two \`qti-feedback-block\` elements with \
identifiers \`RESPONSE_correct\` and \`RESPONSE_incorrect\`. Each contains a \
detailed, step-by-step explanation of how to arrive at the correct answer, worded \
for that outcome. Do not prefix feedback with "Correct" or "Incorrect"; the \
delivery system presents the verdict. "Incorrect" means "not fully correct", so \
it also covers partially correct responses.`;

export const responseProcessingOrder = `\
Response processing is ordered the way the editor generates it: first one \
condition that sets \`SCORE\`, then one condition that adds \`RESPONSE_correct\` \
or \`RESPONSE_incorrect\` to \`FEEDBACK\`, then any per-option feedback conditions.`;

export const allOrNothingMatch = `\
Score all-or-nothing with \`qti-match\` against \`qti-correct\`: \`SCORE\` is 1 \
when the response matches the correct response exactly, otherwise 0.`;

export const allOrNothingMultiple = `\
Score the whole item all-or-nothing: \`SCORE\` is 1 only when every interaction \
is correct, using \`qti-and\` over each response's correctness check.`;

export const pairMappingAlternative = `\
**Alternative (partial credit):** when partially correct responses should earn \
credit, add a \`qti-mapping\` to the response declaration that assigns a value to \
each correct pair (and optionally a negative value to incorrect pairs) with \
\`lower-bound="0"\`, set \`SCORE\` from \`qti-map-response\`, and decide the \
correct/incorrect feedback with \`qti-equal\` between \`qti-map-response\` and the \
maximum mapped score. Partially correct responses still receive \
\`RESPONSE_incorrect\`.`;

export const responseRequired = `\
Add \`pattern-mask=".+"\` with \`data-patternmask-message="Response required"\` \
so an empty response cannot be submitted, and set \`expected-length\` to roughly \
the length of the answer to size the field.`;

export const preferSelectedResponse = `\
Strongly consider an inline choice or gap match interaction for text-based \
answers instead: they are much more reliable to score than free-text entry. Use \
text entry for simple numeric input. For anything resembling a formula, use an \
extended text interaction with the formula extension.`;
