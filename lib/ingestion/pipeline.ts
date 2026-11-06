import { createServiceClient } from '@/lib/supabase/server';
import { fetchAllFeeds, isHantavirusRelated } from './feeds';
import { ensureSources } from './sources';
import { normalizeArticle } from './normalize';
import { summarizeArticle } from '@/lib/ai/summarize';
import { classifyArticle, detectDuplication } from '@/lib/ai/classify';
import { calculateConfidenceScore, scoreToConfidenceLevel } from '@/lib/ai/confidence';
import { KNOWN_RSS_FEEDS } from '@/lib/utils/constants';
import type { IngestionResult } from '@/types';

export async function runIngestionPipeline(): Promise<IngestionResult> {
  const startTime = Date.now();
  const supabase = createServiceClient();
  const result: IngestionResult = {
    articles_fetched: 0,
    articles_new: 0,
    articles_duplicate: 0,
    articles_processed: 0,
    errors: [],
    duration_ms: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    console.log('[pipeline] Starting ingestion run...');
    const sourceMap = await ensureSources();
    const feedResults = await fetchAllFeeds(KNOWN_RSS_FEEDS);

    // Collect hantavirus-related items
    const candidates: Array<{ item: { title: string; url: string; content: string; published_at: Date; source_name: string; content_hash: string }; sourceName: string }> = [];
    for (const [sourceName, items] of feedResults) {
      result.articles_fetched += items.length;
      for (const item of items) {
        if (isHantavirusRelated(item.title, item.content)) {
          candidates.push({ item, sourceName });
        }
      }
    }

    console.log(`[pipeline] ${candidates.length} hantavirus-related candidates`);

    // Load existing for deduplication
    const { data: recent } = await supabase
      .from('articles')
      .select('title, url, content_hash')
      .order('ingested_at', { ascending: false })
      .limit(200);

    const existingUrls = new Set((recent ?? []).map((a) => a.url));
    const existingHashes = new Set(
      (recent ?? []).map((a) => a.content_hash).filter(Boolean)
    );
    const existingTitles = (recent ?? []).map((a) => a.title as string);

    for (const { item, sourceName } of candidates) {
      try {
        if (existingUrls.has(item.url)) { result.articles_duplicate++; continue; }
        if (existingHashes.has(item.content_hash)) { result.articles_duplicate++; continue; }

        const source = sourceMap.get(sourceName);
        if (!source) continue;

        // Near-duplicate check
        const dupCheck = await detectDuplication(item.title, item.content, existingTitles);
        if (dupCheck.is_duplicate && dupCheck.similarity_score > 80) {
          result.articles_duplicate++;
          continue;
        }

        // AI classification + summarization
        const [classification, summarization] = await Promise.all([
          classifyArticle(item.title, item.content, source.reliability_score),
          summarizeArticle(item.title, item.content, 150),
        ]);

        if (!classification.is_hantavirus_related) continue;

        const officialCategories = ['who', 'cdc', 'ecdc', 'nih', 'government'];
        const hoursOld = (Date.now() - item.published_at.getTime()) / 3_600_000;
        const finalScore = calculateConfidenceScore(
          classification.confidence_score,
          source.category,
          item.content.toLowerCase().includes('laboratory confirmed') ||
            item.content.toLowerCase().includes('lab confirmed'),
          officialCategories.includes(source.category),
          hoursOld
        );

        const normalized = normalizeArticle(item, source.id, classification, summarization);
        const { error } = await supabase.from('articles').insert({
          ...normalized,
          confidence_score: finalScore,
          confidence: scoreToConfidenceLevel(finalScore),
        });

        if (error) {
          if (error.code === '23505') result.articles_duplicate++;
          else result.errors.push(`Insert "${item.title}": ${error.message}`);
        } else {
          result.articles_new++;
          result.articles_processed++;
          existingTitles.push(item.title);
          existingUrls.add(item.url);
        }

        // Respect OpenAI rate limits
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`Processing "${item.title}": ${msg}`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Pipeline: ${msg}`);
  }

  result.duration_ms = Date.now() - startTime;

  await supabase.from('ingestion_logs').insert({
    articles_fetched: result.articles_fetched,
    articles_new: result.articles_new,
    articles_duplicate: result.articles_duplicate,
    articles_processed: result.articles_processed,
    errors: result.errors,
    duration_ms: result.duration_ms,
    status: result.errors.length === 0 ? 'success' : result.articles_new > 0 ? 'partial' : 'failed',
  });

  console.log('[pipeline] Done:', result);
  return result;
}
