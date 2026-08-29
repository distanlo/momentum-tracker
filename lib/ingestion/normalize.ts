import type { Article } from '@/types';
import type { FeedItem } from './feeds';
import type { ClassificationResult } from '@/lib/ai/classify';
import type { SummarizationResult } from '@/lib/ai/summarize';

export function normalizeArticle(
  item: FeedItem,
  sourceId: string,
  classification: ClassificationResult,
  summarization: SummarizationResult
): Omit<Article, 'id' | 'source' | 'ingested_at'> {
  return {
    title: item.title.slice(0, 500),
    url: item.url,
    source_id: sourceId,
    published_at: item.published_at.toISOString(),
    summary: summarization.summary,
    original_content: item.content.slice(0, 10_000),
    confidence: classification.confidence,
    confidence_score: classification.confidence_score,
    category: classification.category,
    countries: classification.countries,
    tags: classification.tags,
    case_count: classification.case_count,
    death_count: classification.death_count,
    is_flagged: classification.is_misinformation,
    is_approved: !classification.is_misinformation,
    ai_processed: true,
    sentiment_score: classification.sentiment_score,
    entities: {},
    content_hash: item.content_hash,
  };
}
