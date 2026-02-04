import { API_URL, PROMPT_IDS, API_KEY, DEFAULT_MODEL_ID } from './config';
import { token } from './auth';
import * as choiceFeedback from '../example-items/choice-feedback';
import * as choiceMultipleFeedback from '../example-items/choice-multiple-feedback';
import * as textEntryFeedback from '../example-items/text-entry-feedback';
import * as inlineChoiceFeedback from '../example-items/inline-choice-feedback';
import * as matchFeedback from '../example-items/match-feedback';
import * as gapMatchFeedback from '../example-items/gap-match-feedback';
import * as multiInteractionFeedback from '../example-items/multi-interaction-feedback';

const feedbackExamples = [
  { name: 'Single Choice with Per-Choice Inline Feedback', item: choiceFeedback.item },
  { name: 'Multiple Choice (Checkboxes) with Per-Choice Block Feedback', item: choiceMultipleFeedback.item },
  { name: 'Text Entry with Correct/Incorrect Feedback', item: textEntryFeedback.item },
  { name: 'Inline Choice (Dropdown) with Feedback', item: inlineChoiceFeedback.item },
  { name: 'Match Interaction with Feedback', item: matchFeedback.item },
  { name: 'Gap Match (Drag-and-Drop) with Feedback', item: gapMatchFeedback.item },
  { name: 'Multi-Interaction with Combined Feedback', item: multiInteractionFeedback.item },
];

const formatExamples = () =>
  feedbackExamples
    .map(({ name, item }, i) => `=== EXAMPLE ${i + 1}: ${name} ===\n${item.trim()}`)
    .join('\n\n');

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

${formatExamples()}

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
