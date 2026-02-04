import { API_URL, PROMPT_IDS, API_KEY, DEFAULT_MODEL_ID } from './config';
import { token } from './auth';

const QTI_SYSTEM_PROMPT = `You are a QTI v3 assessment item generator. Generate valid QTI v3 XML for assessment items with feedback.

Requirements:
- Use the QTI v3 namespace: xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
- Include response-declaration with correct-response
- Include outcome-declaration for SCORE and FEEDBACK
- Include item-body with appropriate interaction(s)
- Include feedback (inline, block, or modal) that explains why answers are correct/incorrect
- Do NOT include images or external resources
- Output ONLY the XML, no explanations or markdown

Choose the most appropriate interaction type for the topic. Here are examples of each type:

=== EXAMPLE 1: Single Choice with Per-Choice Inline Feedback ===
<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
identifier="choice-feedback" title="Single Choice with Feedback" adaptive="false" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>choiceA</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>1.0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="true" max-choices="1">
      <qti-prompt>Question prompt goes here.</qti-prompt>
      <qti-simple-choice identifier="choiceA">Correct answer
        <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceA" show-hide="show">
          — <strong>Correct!</strong> Explanation for why this is right.
        </qti-feedback-inline>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Wrong answer B
        <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceB" show-hide="show">
          — <strong>Incorrect.</strong> Explanation for why B is wrong.
        </qti-feedback-inline>
      </qti-simple-choice>
      <qti-simple-choice identifier="choiceC">Wrong answer C
        <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceC" show-hide="show">
          — <strong>Incorrect.</strong> Explanation for why C is wrong.
        </qti-feedback-inline>
      </qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>
        <qti-set-outcome-value identifier="SCORE"><qti-variable identifier="MAXSCORE"/></qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-base-value base-type="identifier">choiceA</qti-base-value></qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple><qti-variable identifier="FEEDBACK"/><qti-base-value base-type="identifier">RESPONSE_choice_choiceA</qti-base-value></qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-base-value base-type="identifier">choiceB</qti-base-value></qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple><qti-variable identifier="FEEDBACK"/><qti-base-value base-type="identifier">RESPONSE_choice_choiceB</qti-base-value></qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-base-value base-type="identifier">choiceC</qti-base-value></qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple><qti-variable identifier="FEEDBACK"/><qti-base-value base-type="identifier">RESPONSE_choice_choiceC</qti-base-value></qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>

=== EXAMPLE 2: Multiple Choice (Checkboxes) with Per-Choice Block Feedback ===
<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
identifier="choice-multiple-feedback" title="Multiple Choice with Feedback" adaptive="false" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
      <qti-value>choiceC</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="true" max-choices="0">
      <qti-prompt>Select all that apply.</qti-prompt>
      <qti-simple-choice identifier="choiceA">Correct answer A</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Wrong answer B</qti-simple-choice>
      <qti-simple-choice identifier="choiceC">Correct answer C</qti-simple-choice>
    </qti-choice-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceA" show-hide="show">
      <p><strong>Choice A:</strong> Correct! Explanation.</p>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceB" show-hide="show">
      <p><strong>Choice B:</strong> Incorrect. Explanation.</p>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceC" show-hide="show">
      <p><strong>Choice C:</strong> Correct! Explanation.</p>
    </qti-feedback-block>
  </qti-item-body>
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-member><qti-base-value base-type="identifier">choiceA</qti-base-value><qti-variable identifier="RESPONSE"/></qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple><qti-variable identifier="FEEDBACK"/><qti-base-value base-type="identifier">RESPONSE_choice_choiceA</qti-base-value></qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
    <qti-response-condition>
      <qti-response-if>
        <qti-member><qti-base-value base-type="identifier">choiceB</qti-base-value><qti-variable identifier="RESPONSE"/></qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple><qti-variable identifier="FEEDBACK"/><qti-base-value base-type="identifier">RESPONSE_choice_choiceB</qti-base-value></qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
    <qti-response-condition>
      <qti-response-if>
        <qti-member><qti-base-value base-type="identifier">choiceC</qti-base-value><qti-variable identifier="RESPONSE"/></qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple><qti-variable identifier="FEEDBACK"/><qti-base-value base-type="identifier">RESPONSE_choice_choiceC</qti-base-value></qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>

=== EXAMPLE 3: Text Entry with Correct/Incorrect Feedback ===
<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
identifier="text-entry-feedback" title="Text Entry with Feedback" adaptive="false" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
    <qti-correct-response><qti-value>answer</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>1.0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <p>Question prompt. Enter your answer: <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="15"/></p>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="correct" show-hide="show">
      <p><strong>Correct!</strong> Explanation of why this is right.</p>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="incorrect" show-hide="show">
      <p><strong>Incorrect.</strong> The correct answer is "answer". Explanation.</p>
    </qti-feedback-block>
  </qti-item-body>
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>
        <qti-set-outcome-value identifier="SCORE"><qti-variable identifier="MAXSCORE"/></qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">correct</qti-base-value></qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">incorrect</qti-base-value></qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>

=== EXAMPLE 4: Inline Choice (Dropdown) with Feedback ===
<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
identifier="inline-choice-feedback" title="Inline Choice with Feedback" adaptive="false" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>optionB</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>1.0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <p>Complete the sentence: The answer is
      <qti-inline-choice-interaction response-identifier="RESPONSE" shuffle="true">
        <qti-inline-choice identifier="optionA">wrong A</qti-inline-choice>
        <qti-inline-choice identifier="optionB">correct</qti-inline-choice>
        <qti-inline-choice identifier="optionC">wrong C</qti-inline-choice>
      </qti-inline-choice-interaction>
      in this context.</p>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="correct" show-hide="show">
      <p><strong>Correct!</strong> Explanation.</p>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="incorrect" show-hide="show">
      <p><strong>Incorrect.</strong> The correct answer is "correct". Explanation.</p>
    </qti-feedback-block>
  </qti-item-body>
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>
        <qti-set-outcome-value identifier="SCORE"><qti-variable identifier="MAXSCORE"/></qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">correct</qti-base-value></qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">incorrect</qti-base-value></qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>

=== EXAMPLE 5: Match Interaction with Feedback ===
<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
identifier="match-feedback" title="Match with Feedback" adaptive="false" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>itemA targetX</qti-value>
      <qti-value>itemB targetY</qti-value>
      <qti-value>itemC targetZ</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>3.0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <qti-match-interaction response-identifier="RESPONSE" shuffle="true" max-associations="3">
      <qti-prompt>Match each item to its target.</qti-prompt>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="itemA" match-max="1">Item A</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="itemB" match-max="1">Item B</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="itemC" match-max="1">Item C</qti-simple-associable-choice>
      </qti-simple-match-set>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="targetX" match-max="1">Target X</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="targetY" match-max="1">Target Y</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="targetZ" match-max="1">Target Z</qti-simple-associable-choice>
      </qti-simple-match-set>
    </qti-match-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="correct" show-hide="show">
      <p><strong>Correct!</strong> All matches are right. Item A→Target X, Item B→Target Y, Item C→Target Z.</p>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="incorrect" show-hide="show">
      <p><strong>Incorrect.</strong> Correct pairings: Item A→Target X, Item B→Target Y, Item C→Target Z.</p>
    </qti-feedback-block>
  </qti-item-body>
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>
        <qti-set-outcome-value identifier="SCORE"><qti-variable identifier="MAXSCORE"/></qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">correct</qti-base-value></qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">incorrect</qti-base-value></qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>

=== EXAMPLE 6: Gap Match (Drag-and-Drop) with Feedback ===
<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
identifier="gap-match-feedback" title="Gap Match with Feedback" adaptive="false" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>wordA G1</qti-value>
      <qti-value>wordB G2</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>2.0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <qti-gap-match-interaction response-identifier="RESPONSE" shuffle="true">
      <qti-prompt>Drag words to fill the blanks.</qti-prompt>
      <qti-gap-text identifier="wordA" match-max="1">word A</qti-gap-text>
      <qti-gap-text identifier="wordB" match-max="1">word B</qti-gap-text>
      <qti-gap-text identifier="wordC" match-max="1">distractor</qti-gap-text>
      <p>The sentence has <qti-gap identifier="G1"/> in the first blank and <qti-gap identifier="G2"/> in the second.</p>
    </qti-gap-match-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="correct" show-hide="show">
      <p><strong>Correct!</strong> Gap 1: "word A", Gap 2: "word B".</p>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="incorrect" show-hide="show">
      <p><strong>Incorrect.</strong> Correct: Gap 1→word A, Gap 2→word B.</p>
    </qti-feedback-block>
  </qti-item-body>
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>
        <qti-set-outcome-value identifier="SCORE"><qti-variable identifier="MAXSCORE"/></qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">correct</qti-base-value></qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">incorrect</qti-base-value></qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>

=== EXAMPLE 7: Multi-Interaction with Combined Feedback ===
<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
identifier="multi-interaction-feedback" title="Multi-Interaction with Feedback" adaptive="false" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE1" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>choiceA</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="RESPONSE2" cardinality="single" base-type="string">
    <qti-correct-response><qti-value>answer</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="SCORE1" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="SCORE2" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>
  <qti-item-body>
    <p><strong>Part 1:</strong></p>
    <qti-choice-interaction response-identifier="RESPONSE1" shuffle="true" max-choices="1">
      <qti-prompt>Select the best answer:</qti-prompt>
      <qti-simple-choice identifier="choiceA">Correct</qti-simple-choice>
      <qti-simple-choice identifier="choiceB">Wrong</qti-simple-choice>
    </qti-choice-interaction>
    <p>
      <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="part1_correct" show-hide="show"><strong>Part 1: Correct!</strong></qti-feedback-inline>
      <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="part1_incorrect" show-hide="show"><strong>Part 1: Incorrect.</strong></qti-feedback-inline>
    </p>
    <hr/>
    <p><strong>Part 2:</strong> Enter the answer: <qti-text-entry-interaction response-identifier="RESPONSE2" expected-length="10"/></p>
    <p>
      <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="part2_correct" show-hide="show"><strong>Part 2: Correct!</strong></qti-feedback-inline>
      <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="part2_incorrect" show-hide="show"><strong>Part 2: Incorrect.</strong></qti-feedback-inline>
    </p>
  </qti-item-body>
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE1"/><qti-correct identifier="RESPONSE1"/></qti-match>
        <qti-set-outcome-value identifier="SCORE1"><qti-base-value base-type="float">1.0</qti-base-value></qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple><qti-base-value base-type="identifier">part1_correct</qti-base-value></qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple><qti-base-value base-type="identifier">part1_incorrect</qti-base-value></qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE2"/><qti-correct identifier="RESPONSE2"/></qti-match>
        <qti-set-outcome-value identifier="SCORE2"><qti-base-value base-type="float">1.0</qti-base-value></qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple><qti-variable identifier="FEEDBACK"/><qti-base-value base-type="identifier">part2_correct</qti-base-value></qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple><qti-variable identifier="FEEDBACK"/><qti-base-value base-type="identifier">part2_incorrect</qti-base-value></qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum><qti-variable identifier="SCORE1"/><qti-variable identifier="SCORE2"/></qti-sum>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>

Generate an assessment item about the given topic. Choose the most appropriate interaction type and always include meaningful feedback that explains why answers are correct or incorrect.`;

const promptExecuteUrl = (promptType: string): string =>
  `${API_URL}/prompts/${PROMPT_IDS[promptType].toString()}/execute`;

const authorizedFetch = (url: string, options: RequestInit = {}) => {
  const urlToFetch = new URL(url);
  urlToFetch.searchParams.set('api_key', API_KEY);

  const headers = new Headers(options.headers);
  if (token) headers.set('x-launch-token', token);

  return fetch(urlToFetch.toString(), {
    ...options,
    headers,
  });
};

function extractXmlFromResponse(text: string): string {
  // Strip markdown code blocks if present
  const codeBlockMatch = text.match(/```(?:xml)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to extract XML starting from <?xml or <qti-assessment-item
  const xmlMatch = text.match(/<\?xml[\s\S]*<\/qti-assessment-item>/);
  if (xmlMatch) {
    return xmlMatch[0].trim();
  }

  const qtiMatch = text.match(/<qti-assessment-item[\s\S]*<\/qti-assessment-item>/);
  if (qtiMatch) {
    return qtiMatch[0].trim();
  }

  // Return as-is if no patterns match
  return text.trim();
}

export const generateQtiItem = async (topic: string): Promise<string> => {
  const prompt = `${QTI_SYSTEM_PROMPT}\n\nTopic: ${topic}`;
  const payload = { input: { prompt }, modelId: DEFAULT_MODEL_ID };

  const promptUrl = promptExecuteUrl('generate');

  const response = await authorizedFetch(promptUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((response) => response.json() as Promise<{ text: string }>);

  return extractXmlFromResponse(response.text);
};
