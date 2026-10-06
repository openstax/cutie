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
After the interactions, include one \`qti-feedback-block\` with identifier \
\`ITEM_completed\`, shown once the item is completed whether the response is \
correct or not. It contains a detailed, step-by-step explanation of how to arrive \
at the correct answer, stating the answer, worded so it reads well for a learner \
who answered correctly and for one who didn't. Do not prefix it with "Correct" or \
"Incorrect"; the delivery system presents the verdict. Response processing adds \
\`ITEM_completed\` to \`FEEDBACK\` with an unconditional \
\`qti-set-outcome-value\` (not inside a \`qti-response-condition\`).`;

export const responseProcessingOrder = `\
Response processing is ordered the way the editor generates it: first the rules \
that set \`SCORE\`, then any per-option feedback conditions, then the \
unconditional rule that adds \`ITEM_completed\` to \`FEEDBACK\`.`;

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
\`lower-bound="0"\`, and set \`SCORE\` from \`qti-map-response\`. The worked \
solution is unchanged.`;

export const responseRequired = `\
Add \`pattern-mask=".+"\` with \`data-patternmask-message="Response required"\` \
so an empty response cannot be submitted, and set \`expected-length\` to roughly \
the length of the answer to size the field.`;

export const preferSelectedResponse = `\
Strongly consider an inline choice or gap match interaction for text-based \
answers instead: they are much more reliable to score than free-text entry. Use \
text entry for simple numeric input. For anything resembling a formula, use an \
extended text interaction with the formula extension.`;
