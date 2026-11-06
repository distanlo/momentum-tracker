import { getOpenAIClient, AI_MODELS } from './openai';

export interface SummarizationResult {
  summary: string;
  key_points: string[];
  neutral_rewrite: string;
}

export async function summarizeArticle(
  title: string,
  content: string,
  maxWords = 150
): Promise<SummarizationResult> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: AI_MODELS.fast,
    messages: [
      {
        role: 'system',
        content: `You are a neutral public-health journalist. Summarize outbreak news in factual, calm, unemotional language.

Rules:
- Never use fear-mongering language
- Use "reported" or "alleged" for unconfirmed claims
- Keep summaries under ${maxWords} words
- Use present tense for ongoing situations
- Cite specific numbers when available
- Do not editorialize or speculate

Return JSON: { summary, key_points (3-5 strings), neutral_rewrite }`,
      },
      {
        role: 'user',
        content: `Title: ${title}\n\nContent: ${content.slice(0, 3000)}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 600,
  });

  const result = JSON.parse(response.choices[0].message.content ?? '{}');
  return {
    summary: result.summary ?? '',
    key_points: Array.isArray(result.key_points) ? result.key_points : [],
    neutral_rewrite: result.neutral_rewrite ?? result.summary ?? '',
  };
}
