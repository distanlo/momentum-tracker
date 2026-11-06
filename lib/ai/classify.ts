import { getOpenAIClient, AI_MODELS } from './openai';
import type { EventCategory, ConfidenceLevel } from '@/types';

export interface ClassificationResult {
  category: EventCategory;
  confidence: ConfidenceLevel;
  confidence_score: number;
  countries: string[];
  tags: string[];
  case_count?: number;
  death_count?: number;
  sentiment_score: number;
  is_hantavirus_related: boolean;
  is_misinformation: boolean;
  reasoning: string;
}

export async function classifyArticle(
  title: string,
  content: string,
  sourceReliability: number
): Promise<ClassificationResult> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: AI_MODELS.fast,
    messages: [
      {
        role: 'system',
        content: `You are an epidemiological intelligence analyst specialising in hantavirus outbreaks.

Classify articles into ONE category:
confirmed_case | suspected_case | death | travel_advisory | scientific_update |
policy | rumor | misinformation | who_guidance | cdc_guidance |
environmental | laboratory | treatment | prevention

Confidence levels:
confirmed (lab-verified, official) | likely (high-quality, consistent) |
developing (unfolding, partial) | suspected (plausible, unconfirmed) |
rumor (unclear sourcing) | debunked (demonstrated false)

Source reliability for this article: ${sourceReliability}/100. Use this when setting confidence_score.

Return JSON:
{
  category, confidence, confidence_score (0-100),
  countries (array of country names),
  tags (array: e.g. ["HPS", "SNV", "rodent exposure", "HFRS"]),
  case_count (integer or null), death_count (integer or null),
  sentiment_score (-1 to 1), is_hantavirus_related (bool),
  is_misinformation (bool), reasoning (1-2 sentences)
}`,
      },
      {
        role: 'user',
        content: `Title: ${title}\n\nContent: ${content.slice(0, 2000)}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 500,
  });

  const r = JSON.parse(response.choices[0].message.content ?? '{}');
  return {
    category: r.category ?? 'scientific_update',
    confidence: r.confidence ?? 'developing',
    confidence_score: Math.min(100, Math.max(0, r.confidence_score ?? 50)),
    countries: Array.isArray(r.countries) ? r.countries : [],
    tags: Array.isArray(r.tags) ? r.tags : [],
    case_count: typeof r.case_count === 'number' ? r.case_count : undefined,
    death_count: typeof r.death_count === 'number' ? r.death_count : undefined,
    sentiment_score: Math.min(1, Math.max(-1, r.sentiment_score ?? 0)),
    is_hantavirus_related: r.is_hantavirus_related ?? true,
    is_misinformation: r.is_misinformation ?? false,
    reasoning: r.reasoning ?? '',
  };
}

export async function detectDuplication(
  newTitle: string,
  newContent: string,
  existingTitles: string[]
): Promise<{ is_duplicate: boolean; similar_to?: string; similarity_score: number }> {
  if (existingTitles.length === 0) return { is_duplicate: false, similarity_score: 0 };

  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: AI_MODELS.fast,
    messages: [
      {
        role: 'system',
        content:
          'Detect near-duplicate news articles. Same event from different sources = duplicate. '
          + 'Return JSON: { is_duplicate: bool, similar_to: string|null, similarity_score: 0-100 }',
      },
      {
        role: 'user',
        content:
          `New: "${newTitle}"\n\nExisting:\n` +
          existingTitles
            .slice(0, 40)
            .map((t, i) => `${i + 1}. ${t}`)
            .join('\n'),
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
    max_tokens: 150,
  });

  const r = JSON.parse(response.choices[0].message.content ?? '{}');
  return {
    is_duplicate: r.is_duplicate ?? false,
    similar_to: r.similar_to ?? undefined,
    similarity_score: r.similarity_score ?? 0,
  };
}
