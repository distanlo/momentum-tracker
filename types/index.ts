export type ConfidenceLevel =
  | 'confirmed'
  | 'likely'
  | 'developing'
  | 'suspected'
  | 'rumor'
  | 'debunked';

export type SourceCategory =
  | 'who'
  | 'cdc'
  | 'ecdc'
  | 'nih'
  | 'peer_reviewed'
  | 'major_media'
  | 'local_media'
  | 'government'
  | 'expert'
  | 'social_media'
  | 'anonymous';

export type EventCategory =
  | 'confirmed_case'
  | 'suspected_case'
  | 'death'
  | 'travel_advisory'
  | 'scientific_update'
  | 'policy'
  | 'rumor'
  | 'misinformation'
  | 'who_guidance'
  | 'cdc_guidance'
  | 'environmental'
  | 'laboratory'
  | 'treatment'
  | 'prevention';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'very_high' | 'critical';

export type RumorStatus =
  | 'false'
  | 'misleading'
  | 'unverified'
  | 'partially_true'
  | 'confirmed';

export type TrendDirection = 'increasing' | 'stable' | 'decreasing';

export interface Source {
  id: string;
  name: string;
  url: string;
  rss_url?: string;
  category: SourceCategory;
  reliability_score: number;
  is_verified: boolean;
  correction_count: number;
  country?: string;
  description?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  title: string;
  url: string;
  source_id: string;
  source?: Source;
  published_at: string;
  ingested_at: string;
  summary: string;
  original_content?: string;
  confidence: ConfidenceLevel;
  confidence_score: number;
  category: EventCategory;
  countries: string[];
  tags: string[];
  case_count?: number;
  death_count?: number;
  is_flagged: boolean;
  is_approved: boolean;
  ai_processed: boolean;
  sentiment_score: number;
  entities?: Record<string, string[]>;
  content_hash?: string;
}

export interface OutbreakEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  confidence: ConfidenceLevel;
  confidence_score: number;
  country: string;
  region?: string;
  city?: string;
  lat?: number;
  lng?: number;
  event_date: string;
  sources: string[];
  article_ids: string[];
  case_count?: number;
  death_count?: number;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CaseCount {
  id: string;
  country: string;
  country_code: string;
  region?: string;
  date: string;
  confirmed_cases: number;
  suspected_cases: number;
  deaths: number;
  recovered: number;
  active_investigations: number;
  source_id?: string;
  lat?: number;
  lng?: number;
  created_at: string;
}

export interface Rumor {
  id: string;
  claim: string;
  status: RumorStatus;
  evidence_summary: string;
  source_urls: string[];
  analyst_notes?: string;
  original_url?: string;
  spread_count: number;
  correction_url?: string;
  platform?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface ScientificUpdate {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  institution?: string;
  journal?: string;
  preprint_server?: string;
  doi?: string;
  url: string;
  published_at?: string;
  topics: string[];
  strain_names: string[];
  is_peer_reviewed: boolean;
  significance_score: number;
  key_findings: string[];
}

export interface GlobalMetrics {
  total_confirmed: number;
  total_suspected: number;
  total_deaths: number;
  countries_affected: number;
  new_cases_24h: number;
  active_investigations: number;
  who_risk_level: RiskLevel;
  cdc_advisory_level: string;
  last_updated: string;
  trend_7d: TrendDirection;
  fatality_rate: number;
  case_fatality_rate: number;
}

export interface Signal {
  id: string;
  platform: 'google_trends' | 'reddit' | 'twitter' | 'youtube' | 'news';
  metric: string;
  value: number;
  normalized_value: number;
  timestamp: string;
  keywords: string[];
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  country?: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  source_url?: string;
}

export interface TrendDataPoint {
  date: string;
  confirmed: number;
  suspected: number;
  deaths: number;
  new_cases: number;
}

export interface IngestionResult {
  articles_fetched: number;
  articles_new: number;
  articles_duplicate: number;
  articles_processed: number;
  errors: string[];
  duration_ms: number;
  timestamp: string;
}

export interface KnownFact {
  id: string;
  claim: string;
  evidence: string[];
  confidence_score: number;
  category: string;
  source_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface UnknownQuestion {
  id: string;
  question: string;
  why_unknown: string;
  ongoing_research?: string;
  estimated_resolution?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface MisinformationItem {
  id: string;
  claim: string;
  truth: string;
  evidence: string[];
  source_urls: string[];
  spread_estimate?: string;
  debunked_at: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}
