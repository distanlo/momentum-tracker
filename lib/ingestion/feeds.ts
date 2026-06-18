import Parser from 'rss-parser';
import crypto from 'crypto';

export interface FeedItem {
  title: string;
  url: string;
  content: string;
  published_at: Date;
  source_name: string;
  content_hash: string;
}

export interface FeedConfig {
  name: string;
  url: string;
  category: string;
  reliability: number;
}

const parser = new Parser({
  timeout: 12000,
  headers: { 'User-Agent': 'GroundTruthHealth/1.0 (Outbreak Tracker; hantavirus)' },
});

export async function fetchRSSFeed(config: FeedConfig): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(config.url);
    return (feed.items ?? []).map((item) => {
      const content = item.contentSnippet ?? item.content ?? item.summary ?? '';
      const hash = crypto
        .createHash('md5')
        .update(`${item.title ?? ''}${content}`)
        .digest('hex');
      return {
        title: item.title ?? 'Untitled',
        url: item.link ?? item.guid ?? '',
        content,
        published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
        source_name: config.name,
        content_hash: hash,
      };
    }).filter((i) => i.url.length > 0);
  } catch (err) {
    console.error(`[feeds] Failed to fetch ${config.name}:`, err);
    return [];
  }
}

export async function fetchAllFeeds(configs: FeedConfig[]): Promise<Map<string, FeedItem[]>> {
  const results = new Map<string, FeedItem[]>();
  await Promise.allSettled(
    configs.map(async (config) => {
      const items = await fetchRSSFeed(config);
      results.set(config.name, items);
    })
  );
  return results;
}

const HANTAVIRUS_KEYWORDS = [
  'hantavirus', 'hantaviral', 'hantaan', 'HPS', 'HCPS',
  'hemorrhagic fever with renal syndrome', 'HFRS',
  'sin nombre', 'andes virus', 'puumala', 'rodent-borne',
  'deer mouse', 'peromyscus', 'Seoul virus', 'nephropathia epidemica',
  'hanta', 'dobrava', 'bayou virus', 'black creek canal',
];

export function isHantavirusRelated(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase();
  return HANTAVIRUS_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
}
