import { formatDistanceToNow, format, parseISO, isValid } from 'date-fns';

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatPercent(num: number, decimals = 1): string {
  return `${num.toFixed(decimals)}%`;
}

export function formatDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, 'MMM d, yyyy HH:mm') + ' UTC';
  } catch {
    return dateStr;
  }
}

export function formatRelativeTime(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatConfidenceScore(score: number): string {
  if (score >= 90) return 'Very High';
  if (score >= 75) return 'High';
  if (score >= 50) return 'Moderate';
  if (score >= 25) return 'Low';
  return 'Very Low';
}

export function formatFatalityRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatTrend(direction: string): string {
  if (direction === 'increasing') return '↑ Increasing';
  if (direction === 'decreasing') return '↓ Decreasing';
  return '→ Stable';
}
