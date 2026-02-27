import type { ScoreBreakdown } from './matching';
import { WEIGHTS } from './weights';

/**
 * Returns the first label whose threshold the score meets, or the last label
 * as a fallback. Bands must be ordered from highest threshold to lowest.
 */
function tier(
  score: number,
  bands: Array<[threshold: number, label: string]>,
  fallback: string,
): string {
  for (const [threshold, label] of bands) {
    if (score >= threshold) return label;
  }
  return fallback;
}

/**
 * Returns human-readable reasons for a score breakdown.
 */
export function explainScore(breakdown: ScoreBreakdown): string[] {
  return [
    tier(
      breakdown.nicheScore,
      [[80, 'Strong niche alignment with campaign categories'], [1, 'Partial niche overlap with campaign categories']],
      'No niche overlap with campaign categories',
    ),
    tier(
      breakdown.countryScore,
      [[100, 'Primary audience country matches campaign target'], [1, 'Target country appears in secondary audience countries']],
      'Audience country does not match campaign target',
    ),
    tier(
      breakdown.engagementScore,
      [[70, 'High engagement rate'], [30, 'Moderate engagement rate']],
      'Below-average engagement rate',
    ),
    tier(
      breakdown.watchTimeScore,
      [[100, 'Watch time meets or exceeds campaign minimum'], [60, 'Watch time slightly below campaign minimum']],
      'Watch time significantly below campaign minimum',
    ),
    tier(
      breakdown.followerFitScore,
      [[100, 'Follower count within campaign budget range'], [60, 'Follower count close to campaign budget range']],
      'Follower count outside campaign budget range',
    ),
    tier(
      breakdown.hookAlignmentScore,
      [[100, 'Hook style matches campaign preferred hooks']],
      'Hook style does not match preferred campaign hooks',
    ),
    tier(
      breakdown.genderScore,
      [[100, 'Audience gender aligns with campaign target'], [60, 'Audience gender partially aligns with campaign target']],
      'Audience gender does not align with campaign target',
    ),
    tier(
      breakdown.ageScore,
      [[100, 'Audience age range matches campaign target']],
      'Audience age range differs from campaign target',
    ),
    tier(
      breakdown.brandSafetyScore,
      [[100, 'No brand safety concerns']],
      'Brand safety flags detected — penalty applied',
    ),
  ];
}

/** Round to 2 decimal places. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Returns the weighted contribution of each dimension to the total score.
 */
export function weightedContributions(
  breakdown: ScoreBreakdown,
): Record<string, number> {
  return {
    niche:         r2(breakdown.nicheScore         * WEIGHTS.niche),
    country:       r2(breakdown.countryScore       * WEIGHTS.country),
    engagement:    r2(breakdown.engagementScore    * WEIGHTS.engagement),
    watchTime:     r2(breakdown.watchTimeScore     * WEIGHTS.watchTime),
    followerFit:   r2(breakdown.followerFitScore   * WEIGHTS.followerFit),
    hookAlignment: r2(breakdown.hookAlignmentScore * WEIGHTS.hookAlignment),
    brandSafety:   r2(breakdown.brandSafetyScore   * WEIGHTS.brandSafety),
    gender:        r2(breakdown.genderScore        * WEIGHTS.gender),
    age:           r2(breakdown.ageScore           * WEIGHTS.age),
    penalties:    -r2(breakdown.penalties),
  };
}
