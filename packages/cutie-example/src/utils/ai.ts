import { API_URL, PROMPT_IDS, API_KEY, DEFAULT_MODEL_ID } from './config';
import { token } from './auth';
import z from 'zod';
import * as choiceFeedback from '../example-items/choice-feedback';
import * as choiceMultipleFeedback from '../example-items/choice-multiple-feedback';
import * as textEntryFeedback from '../example-items/text-entry-feedback';
import * as inlineChoiceFeedback from '../example-items/inline-choice-feedback';
import * as matchFeedback from '../example-items/match-feedback';
import * as gapMatchFeedback from '../example-items/gap-match-feedback';
import * as multiInteractionFeedback from '../example-items/multi-interaction-feedback';
import { shuffle } from "./misc";

const feedbackExamples = [
  { name: 'Single Choice with Per-Choice Inline Feedback', item: choiceFeedback.item, types: ['choice'] },
  { name: 'Multiple Choice (Checkboxes) with Per-Choice Block Feedback', item: choiceMultipleFeedback.item, types: ['choice'] },
  { name: 'Text Entry with Correct/Incorrect Feedback', item: textEntryFeedback.item, types: ['text-entry'] },
  { name: 'Inline Choice (Dropdown) with Feedback', item: inlineChoiceFeedback.item, types: ['inline-choice'] },
  { name: 'Match Interaction with Feedback', item: matchFeedback.item, types: ['match'] },
  { name: 'Gap Match (Drag-and-Drop) with Feedback', item: gapMatchFeedback.item, types: ['gap-match'] },
  { name: 'Multi-Interaction with Combined Feedback', item: multiInteractionFeedback.item, types: ['choice', 'text-entry'] },
];

const formatExamples = (interactionTypes?: string[]) => {
  let examples = feedbackExamples;
  if (interactionTypes && interactionTypes.length > 0) {

    examples = feedbackExamples.filter(ex =>
      ex.types.every(type => interactionTypes.includes(type))
    );
    // Fall back to all examples if no matches found
    if (examples.length === 0) {
      examples = feedbackExamples;
    }
  }
  return shuffle(examples)
    .map(({ name, item }, i) => `=== EXAMPLE ${i + 1}: ${name} ===\n${item.trim()}`)
    .join('\n\n');
};

const buildSystemPrompt = (interactionTypes?: string[]) => {
  const typeInstruction = interactionTypes && interactionTypes.length > 0
    ? `Use the following interaction type(s): ${interactionTypes.join(', ')}.`
    : 'Choose the most appropriate interaction type for the topic.';

  return `You are a QTI v3 assessment item generator. Generate valid QTI v3 XML for assessment items with feedback.

Requirements:
- Use the QTI v3 namespace: xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
- Include response-declaration with correct-response
- Include outcome-declaration for SCORE and FEEDBACK
- Include item-body with appropriate interaction(s)
- Include feedback (inline, block, or modal) that explains why answers are correct/incorrect
- Do NOT include images or external resources
- Output ONLY the XML, no explanations or markdown

${typeInstruction} Here are examples of each type:

${formatExamples(interactionTypes)}

Generate an assessment item about the given topic. ${typeInstruction.replace('.', '')} and always include meaningful feedback that explains why answers are correct or incorrect.`;
};

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

export const generateText = async (modelId: number, promptText: string) => {
  const payload = { input: {prompt: promptText}, modelId };

  const promptUrl = promptExecuteUrl('generate');

  const response = await authorizedFetch(promptUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(response => response.json() as Promise<{ text: string }>)
  ;

  console.log('Response from AI:', response);

  return response.text;
};

export const generateJson = async <T>(modelId: number, promptText: string, schema: z.ZodType<T>) => {
  const jsonSchema = schema.toJSONSchema();
  const payload = { input: {prompt: promptText}, modelId, jsonSchema };

  const promptUrl = promptExecuteUrl('json');

  const response = await authorizedFetch(promptUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(response => response.json() as Promise<{ data: T }>)
  ;

  console.log('Response from AI:', response);

  return response.data;
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

export const generateQtiItem = async (topic: string, interactionTypes?: string[]): Promise<string> => {
  const systemPrompt = buildSystemPrompt(interactionTypes);
  const response = await generateText(DEFAULT_MODEL_ID, `${systemPrompt}\n\nTopic: ${topic}`);
  return extractXmlFromResponse(response);
};

const interactionTypes = z.enum(['choice', 'inline-choice', 'text-entry', 'gap-match', 'match']);
export type InteractionType = z.infer<typeof interactionTypes>;

const quizResponse = z.object({
  topic: z.string().describe(`An atomic topic related to these questions. It should be specific and focused, not an entire discipline or broad subject area. It may represent a specific concept related to the user's specified interest.`),
  questions: z.array(z.object({
    description: z.string().describe(`A single sentence describing a question to be asked about the topic. This may be the question text (eg. "What is the capital of France?") or a description of a question (Eg. "Gap-match words in a well known excerpt from Moby Dick."`),
    interactions: z.array(interactionTypes).min(1).describe('specify one or more QTIv3 interaction types this question should use')
  })).length(4)
});

export type QuizResponse = z.infer<typeof quizResponse>;

export const beginQuiz = (topic: string) => {

  return generateJson(DEFAULT_MODEL_ID, `Sketch out the structure of a quiz for the user. The user's specified interest is:
${topic}
`, quizResponse);
};

export const continueQuiz = (topic: string, history: {topic: string; questions: {description: string; result: 'correct' | 'incorrect' | 'partial-credit'}[]}[]) => {
  const formattedHistory = history.slice(-3).map(quiz => `## ${quiz.topic}
${quiz.questions.map(q => `- ${q.result}: ${q.description}`)}
`);

  return generateJson(DEFAULT_MODEL_ID, `The user's specified interest is:
${topic}

the user has completed these questions:
${formattedHistory}

Sketch out the structure of a quiz that will meet the user on their level based on their previous responses.
`, quizResponse);

};
