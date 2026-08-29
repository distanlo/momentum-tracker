import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export const AI_MODELS = {
  fast: 'gpt-4o-mini',
  powerful: 'gpt-4o',
} as const;
