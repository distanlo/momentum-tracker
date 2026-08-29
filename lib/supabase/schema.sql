-- Ground Truth Health — Database Schema
-- Run this in your Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==================== SOURCES ====================
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  rss_url TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'who', 'cdc', 'ecdc', 'nih', 'peer_reviewed',
    'major_media', 'local_media', 'government',
    'expert', 'social_media', 'anonymous'
  )),
  reliability_score INTEGER NOT NULL DEFAULT 50 CHECK (reliability_score BETWEEN 0 AND 100),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  correction_count INTEGER NOT NULL DEFAULT 0,
  country TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== ARTICLES ====================
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  published_at TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  summary TEXT,
  original_content TEXT,
  confidence TEXT NOT NULL DEFAULT 'developing' CHECK (confidence IN (
    'confirmed', 'likely', 'developing', 'suspected', 'rumor', 'debunked'
  )),
  confidence_score INTEGER NOT NULL DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),
  category TEXT NOT NULL DEFAULT 'scientific_update' CHECK (category IN (
    'confirmed_case', 'suspected_case', 'death', 'travel_advisory',
    'scientific_update', 'policy', 'rumor', 'misinformation',
    'who_guidance', 'cdc_guidance', 'environmental', 'laboratory',
    'treatment', 'prevention'
  )),
  countries TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  case_count INTEGER,
  death_count INTEGER,
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  ai_processed BOOLEAN NOT NULL DEFAULT FALSE,
  sentiment_score NUMERIC(4,3) DEFAULT 0 CHECK (sentiment_score BETWEEN -1 AND 1),
  entities JSONB DEFAULT '{}',
  content_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== OUTBREAK EVENTS ====================
CREATE TABLE IF NOT EXISTS outbreak_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'confirmed_case', 'suspected_case', 'death', 'travel_advisory',
    'scientific_update', 'policy', 'rumor', 'misinformation',
    'who_guidance', 'cdc_guidance', 'environmental', 'laboratory',
    'treatment', 'prevention'
  )),
  confidence TEXT NOT NULL DEFAULT 'developing',
  confidence_score INTEGER NOT NULL DEFAULT 50,
  country TEXT NOT NULL DEFAULT 'Unknown',
  region TEXT,
  city TEXT,
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sources TEXT[] NOT NULL DEFAULT '{}',
  article_ids UUID[] NOT NULL DEFAULT '{}',
  case_count INTEGER,
  death_count INTEGER,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== CASE COUNTS ====================
CREATE TABLE IF NOT EXISTS case_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country TEXT NOT NULL,
  country_code CHAR(2) NOT NULL,
  region TEXT,
  date DATE NOT NULL,
  confirmed_cases INTEGER NOT NULL DEFAULT 0,
  suspected_cases INTEGER NOT NULL DEFAULT 0,
  deaths INTEGER NOT NULL DEFAULT 0,
  recovered INTEGER NOT NULL DEFAULT 0,
  active_investigations INTEGER NOT NULL DEFAULT 0,
  source_id UUID REFERENCES sources(id),
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(country, date)
);

-- ==================== RUMORS ====================
CREATE TABLE IF NOT EXISTS rumors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN (
    'false', 'misleading', 'unverified', 'partially_true', 'confirmed'
  )),
  evidence_summary TEXT NOT NULL DEFAULT '',
  source_urls TEXT[] NOT NULL DEFAULT '{}',
  analyst_notes TEXT,
  original_url TEXT,
  spread_count INTEGER NOT NULL DEFAULT 0,
  correction_url TEXT,
  platform TEXT,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- ==================== SCIENTIFIC UPDATES ====================
CREATE TABLE IF NOT EXISTS scientific_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  authors TEXT[] NOT NULL DEFAULT '{}',
  institution TEXT,
  journal TEXT,
  preprint_server TEXT,
  doi TEXT,
  url TEXT NOT NULL UNIQUE,
  published_at TIMESTAMPTZ,
  topics TEXT[] NOT NULL DEFAULT '{}',
  strain_names TEXT[] NOT NULL DEFAULT '{}',
  is_peer_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  significance_score INTEGER NOT NULL DEFAULT 50 CHECK (significance_score BETWEEN 0 AND 100),
  key_findings TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== SIGNALS ====================
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL CHECK (platform IN (
    'google_trends', 'reddit', 'twitter', 'youtube', 'news'
  )),
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  normalized_value NUMERIC NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  keywords TEXT[] NOT NULL DEFAULT '{}'
);

-- ==================== ALERTS ====================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  country TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ==================== KNOWN FACTS ====================
CREATE TABLE IF NOT EXISTS known_facts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim TEXT NOT NULL,
  evidence TEXT[] NOT NULL DEFAULT '{}',
  confidence_score INTEGER NOT NULL DEFAULT 80,
  category TEXT NOT NULL DEFAULT 'epidemiology',
  source_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== UNKNOWN QUESTIONS ====================
CREATE TABLE IF NOT EXISTS unknown_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  why_unknown TEXT NOT NULL,
  ongoing_research TEXT,
  estimated_resolution TEXT,
  category TEXT NOT NULL DEFAULT 'epidemiology',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== MISINFORMATION ====================
CREATE TABLE IF NOT EXISTS misinformation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim TEXT NOT NULL,
  truth TEXT NOT NULL,
  evidence TEXT[] NOT NULL DEFAULT '{}',
  source_urls TEXT[] NOT NULL DEFAULT '{}',
  spread_estimate TEXT,
  debunked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== INGESTION LOGS ====================
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  articles_fetched INTEGER NOT NULL DEFAULT 0,
  articles_new INTEGER NOT NULL DEFAULT 0,
  articles_duplicate INTEGER NOT NULL DEFAULT 0,
  articles_processed INTEGER NOT NULL DEFAULT 0,
  errors TEXT[] NOT NULL DEFAULT '{}',
  duration_ms INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'partial', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== VIEWS ====================
CREATE OR REPLACE VIEW global_metrics AS
SELECT
  COALESCE(SUM(cc.confirmed_cases), 0) AS total_confirmed,
  COALESCE(SUM(cc.suspected_cases), 0) AS total_suspected,
  COALESCE(SUM(cc.deaths), 0) AS total_deaths,
  COUNT(DISTINCT cc.country) AS countries_affected,
  COALESCE((
    SELECT SUM(c2.confirmed_cases)
    FROM case_counts c2
    WHERE c2.date = CURRENT_DATE
  ), 0) AS new_cases_24h,
  COALESCE(SUM(cc.active_investigations), 0) AS active_investigations,
  NOW() AS last_updated
FROM case_counts cc
WHERE cc.date = (SELECT MAX(date) FROM case_counts);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_confidence ON articles(confidence);
CREATE INDEX IF NOT EXISTS idx_articles_countries ON articles USING GIN(countries);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_is_approved ON articles(is_approved);
CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_content_hash ON articles(content_hash);
CREATE INDEX IF NOT EXISTS idx_articles_fts ON articles USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))
);

CREATE INDEX IF NOT EXISTS idx_events_event_date ON outbreak_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_category ON outbreak_events(category);
CREATE INDEX IF NOT EXISTS idx_events_country ON outbreak_events(country);
CREATE INDEX IF NOT EXISTS idx_events_fts ON outbreak_events USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

CREATE INDEX IF NOT EXISTS idx_case_counts_country_date ON case_counts(country, date DESC);
CREATE INDEX IF NOT EXISTS idx_case_counts_date ON case_counts(date DESC);
CREATE INDEX IF NOT EXISTS idx_rumors_status ON rumors(status);
CREATE INDEX IF NOT EXISTS idx_signals_platform ON signals(platform, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON alerts(is_active);

-- ==================== UPDATED_AT TRIGGER ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sources_updated_at
  BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON outbreak_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rumors_updated_at
  BEFORE UPDATE ON rumors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scientific_updated_at
  BEFORE UPDATE ON scientific_updates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== ROW LEVEL SECURITY ====================
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbreak_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rumors ENABLE ROW LEVEL SECURITY;
ALTER TABLE scientific_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE known_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE unknown_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE misinformation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_logs ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read approved articles" ON articles FOR SELECT USING (is_approved = TRUE);
CREATE POLICY "Public read active sources" ON sources FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read events" ON outbreak_events FOR SELECT USING (TRUE);
CREATE POLICY "Public read case counts" ON case_counts FOR SELECT USING (TRUE);
CREATE POLICY "Public read rumors" ON rumors FOR SELECT USING (TRUE);
CREATE POLICY "Public read scientific" ON scientific_updates FOR SELECT USING (TRUE);
CREATE POLICY "Public read signals" ON signals FOR SELECT USING (TRUE);
CREATE POLICY "Public read active alerts" ON alerts FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read known facts" ON known_facts FOR SELECT USING (TRUE);
CREATE POLICY "Public read unknown questions" ON unknown_questions FOR SELECT USING (TRUE);
CREATE POLICY "Public read misinformation" ON misinformation_items FOR SELECT USING (TRUE);

-- Service role full access
CREATE POLICY "Service articles" ON articles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service sources" ON sources FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service events" ON outbreak_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service case_counts" ON case_counts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service rumors" ON rumors FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service scientific" ON scientific_updates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service signals" ON signals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service alerts" ON alerts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service known_facts" ON known_facts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service unknown_questions" ON unknown_questions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service misinformation" ON misinformation_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service ingestion_logs" ON ingestion_logs FOR ALL USING (auth.role() = 'service_role');
