import type { SourceCategory, ConfidenceLevel } from '@/types';
import { SOURCE_RELIABILITY } from '@/lib/utils/constants';

export function calculateConfidenceScore(
  aiScore: number,
  sourceCategory: SourceCategory,
  hasLabConfirmation: boolean,
  hasOfficialSource: boolean,
  articleAgeHours: number
): number {
  const sourceWeight = SOURCE_RELIABILITY[sourceCategory] / 100;
  let score = aiScore * 0.6 + sourceWeight * 100 * 0.4;

  if (hasLabConfirmation) score = Math.min(100, score + 15);
  if (hasOfficialSource) score = Math.min(100, score + 10);

  // Mild staleness decay after 72 hours
  if (articleAgeHours > 72) {
    const decay = Math.max(0.7, 1 - (articleAgeHours - 72) / 720);
    score *= decay;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

export function scoreToConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 85) return 'confirmed';
  if (score >= 70) return 'likely';
  if (score >= 50) return 'developing';
  if (score >= 35) return 'suspected';
  if (score >= 15) return 'rumor';
  return 'debunked';
}
