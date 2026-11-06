import { createServiceClient } from '@/lib/supabase/server';
import { KNOWN_RSS_FEEDS } from '@/lib/utils/constants';
import type { Source } from '@/types';

export async function ensureSources(): Promise<Map<string, Source>> {
  const supabase = createServiceClient();
  const map = new Map<string, Source>();

  for (const feed of KNOWN_RSS_FEEDS) {
    const { data: existing } = await supabase
      .from('sources')
      .select('*')
      .eq('name', feed.name)
      .single();

    if (existing) {
      map.set(feed.name, existing as Source);
      continue;
    }

    const officialCategories = ['who', 'cdc', 'ecdc', 'nih'];
    const { data: created, error } = await supabase
      .from('sources')
      .insert({
        name: feed.name,
        url: feed.url,
        rss_url: feed.url,
        category: feed.category,
        reliability_score: feed.reliability,
        is_verified: officialCategories.includes(feed.category as string),
      })
      .select()
      .single();

    if (created && !error) map.set(feed.name, created as Source);
  }

  return map;
}
