import type { ConfidenceLevel, SourceCategory, EventCategory, RiskLevel } from '@/types';

export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  confirmed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  likely: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  developing: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  suspected: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  rumor: 'text-red-400 bg-red-400/10 border-red-400/20',
  debunked: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  confirmed: 'Confirmed',
  likely: 'Likely',
  developing: 'Developing',
  suspected: 'Suspected',
  rumor: 'Unverified',
  debunked: 'Debunked',
};

export const SOURCE_CATEGORY_LABELS: Record<SourceCategory, string> = {
  who: 'WHO',
  cdc: 'CDC',
  ecdc: 'ECDC',
  nih: 'NIH',
  peer_reviewed: 'Peer-Reviewed',
  major_media: 'Major Media',
  local_media: 'Local Media',
  government: 'Government',
  expert: 'Expert',
  social_media: 'Social Media',
  anonymous: 'Anonymous',
};

export const SOURCE_RELIABILITY: Record<SourceCategory, number> = {
  who: 95,
  cdc: 95,
  ecdc: 92,
  nih: 93,
  peer_reviewed: 88,
  government: 82,
  major_media: 75,
  expert: 78,
  local_media: 60,
  social_media: 35,
  anonymous: 15,
};

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  confirmed_case: 'Confirmed Case',
  suspected_case: 'Suspected Case',
  death: 'Death Reported',
  travel_advisory: 'Travel Advisory',
  scientific_update: 'Scientific Update',
  policy: 'Policy Update',
  rumor: 'Rumor',
  misinformation: 'Misinformation',
  who_guidance: 'WHO Guidance',
  cdc_guidance: 'CDC Guidance',
  environmental: 'Environmental Finding',
  laboratory: 'Laboratory Result',
  treatment: 'Treatment Update',
  prevention: 'Prevention Guidance',
};

export const EVENT_CATEGORY_COLORS: Record<EventCategory, string> = {
  confirmed_case: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  suspected_case: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  death: 'bg-red-900/30 text-red-400 border-red-500/30',
  travel_advisory: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  scientific_update: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  policy: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  rumor: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  misinformation: 'bg-red-500/20 text-red-400 border-red-500/30',
  who_guidance: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cdc_guidance: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  environmental: 'bg-green-500/20 text-green-400 border-green-500/30',
  laboratory: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  treatment: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  prevention: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: 'text-emerald-400',
  moderate: 'text-amber-400',
  high: 'text-orange-400',
  very_high: 'text-red-400',
  critical: 'text-red-600',
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: 'Low Risk',
  moderate: 'Moderate Risk',
  high: 'High Risk',
  very_high: 'Very High Risk',
  critical: 'Critical',
};

export const KNOWN_RSS_FEEDS = [
  {
    name: 'CDC Health News',
    url: 'https://tools.cdc.gov/api/v2/resources/media/132608.rss',
    category: 'cdc' as SourceCategory,
    reliability: 95,
  },
  {
    name: 'WHO Disease Outbreaks',
    url: 'https://www.who.int/rss-feeds/news-english.xml',
    category: 'who' as SourceCategory,
    reliability: 95,
  },
  {
    name: 'ProMED Mail',
    url: 'https://promedmail.org/feed/',
    category: 'expert' as SourceCategory,
    reliability: 85,
  },
  {
    name: 'Reuters Health',
    url: 'https://feeds.reuters.com/reuters/healthNews',
    category: 'major_media' as SourceCategory,
    reliability: 82,
  },
  {
    name: 'AP Health News',
    url: 'https://feeds.apnews.com/rss/apf-Health',
    category: 'major_media' as SourceCategory,
    reliability: 82,
  },
  {
    name: 'NIH News Releases',
    url: 'https://www.nih.gov/rss/news_releases.xml',
    category: 'nih' as SourceCategory,
    reliability: 93,
  },
  {
    name: 'ECDC News',
    url: 'https://www.ecdc.europa.eu/en/rss',
    category: 'ecdc' as SourceCategory,
    reliability: 92,
  },
  {
    name: 'HealthMap Alerts',
    url: 'https://www.healthmap.org/en/rss.php',
    category: 'expert' as SourceCategory,
    reliability: 80,
  },
];
