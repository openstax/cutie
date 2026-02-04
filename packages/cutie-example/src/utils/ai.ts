import { API_URL, PROMPT_IDS, API_KEY, DEFAULT_MODEL_ID } from './config';
import { token } from './auth';

const QTI_SYSTEM_PROMPT = `You are a QTI v3 assessment item generator. Generate valid QTI v3 XML for multiple choice questions.

Requirements:
- Use the QTI v3 namespace: xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
- Include response-declaration with correct-response
- Include outcome-declaration for SCORE
- Include item-body with a qti-choice-interaction
- Use the match_correct response processing template
- Do NOT include images or external resources
- Output ONLY the XML, no explanations or markdown

Example structure:
<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  identifier="generated-item" title="Generated Item" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>ChoiceA</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">
      <qti-prompt>Question text here</qti-prompt>
      <qti-simple-choice identifier="ChoiceA">Correct answer</qti-simple-choice>
      <qti-simple-choice identifier="ChoiceB">Wrong answer 1</qti-simple-choice>
      <qti-simple-choice identifier="ChoiceC">Wrong answer 2</qti-simple-choice>
      <qti-simple-choice identifier="ChoiceD">Wrong answer 3</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>

Generate a question about the given topic with 4 answer choices (one correct, three incorrect).`;

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
