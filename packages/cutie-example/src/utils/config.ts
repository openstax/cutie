export const API_KEY = import.meta.env.VITE_API_KEY;
export const API_HOST = 'promptly.openstax.org';

export const API_URL = `https://${API_HOST}/api/v0`;
export const TOKEN_URL = `${API_URL}/user/token`;

export const PROMPT_IDS: Record<string, number> = {
  generate: 21,
};

export const MODELS: Record<string, number> = {
  'claude-sonnet-4': 5,
};

export const DEFAULT_MODEL_ID = MODELS['claude-sonnet-4'];
