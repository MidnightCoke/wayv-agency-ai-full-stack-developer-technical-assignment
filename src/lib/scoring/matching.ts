import type { Campaign, Creator } from '@prisma/client';
import { THRESHOLDS, WEIGHTS } from './weights';
import type { Audience, BudgetRange } from './types';

// ─── Breakdown ────────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  nicheScore: number;
  countryScore: number;
  engagementScore: number;
  watchTimeScore: number;
  followerFitScore: number;
  hookAlignmentScore: number;
  brandSafetyScore: number;
  genderScore: number;
  ageScore: number;
  penalties: number;
}

export interface MatchResult {
  creator: Creator;
  totalScore: number;
  breakdown: ScoreBreakdown;
  reasons?: string[];
}

// ─── Main scoring function ────────────────────────────────────────────────────

/**
 * Score a single creator against a campaign.
 * Pure function – no DB access, no side effects.
 */
export function scoreCreator(
  campaign: Campaign,
  creator: Creator,
): MatchResult {
  const audience = creator.audience as unknown as Audience;
  const budgetRange = campaign.budgetRange as unknown as BudgetRange;

  const breakdown: ScoreBreakdown = {
    nicheScore: calcNicheScore(campaign, creator),
    countryScore: calcCountryScore(campaign, audience),
    engagementScore: calcEngagementScore(creator),
    watchTimeScore: calcWatchTimeScore(campaign, creator),
    followerFitScore: calcFollowerFitScore(budgetRange, creator),
    hookAlignmentScore: calcHookAlignmentScore(campaign, creator),
    brandSafetyScore: calcBrandSafetyScore(creator),
    genderScore: calcGenderScore(campaign, audience),
    ageScore: calcAgeScore(campaign, audience),
    penalties: calcPenalties(creator),
  };

  const raw =
    breakdown.nicheScore * WEIGHTS.niche +
    breakdown.countryScore * WEIGHTS.country +
    breakdown.engagementScore * WEIGHTS.engagement +
    breakdown.watchTimeScore * WEIGHTS.watchTime +
    breakdown.followerFitScore * WEIGHTS.followerFit +
    breakdown.hookAlignmentScore * WEIGHTS.hookAlignment +
    breakdown.brandSafetyScore * WEIGHTS.brandSafety +
    breakdown.genderScore * WEIGHTS.gender +
    breakdown.ageScore * WEIGHTS.age;

  const totalScore = Math.max(0, Math.min(100, raw - breakdown.penalties));

  return {
    creator,
    totalScore: Math.round(totalScore * 100) / 100,
    breakdown,
  };
}

// ─── Individual signal functions ──────────────────────────────────────────────

/** Overlap between campaign niches and creator niches (partial credit per match) */
function calcNicheScore(campaign: Campaign, creator: Creator): number {
  if (campaign.niches.length === 0) return 100;
  const creatorNiches = new Set(creator.niches.map((n) => n.toLowerCase()));
  const matches = campaign.niches.filter((n) =>
    creatorNiches.has(n.toLowerCase()),
  ).length;
  return (matches / campaign.niches.length) * 100;
}

/** Does the campaign's target country appear in the creator's top audience countries? */
function calcCountryScore(campaign: Campaign, audience: Audience): number {
  const target = campaign.targetCountry.toUpperCase();
  const tops = audience.topCountries.map((c) => c.toUpperCase());
  if (tops[0] === target) return 100;
  if (tops.includes(target)) return 60;
  return 0;
}

/** Engagement rate normalised between min and max thresholds */
function calcEngagementScore(creator: Creator): number {
  const { minEngagementRate, maxEngagementRate } = THRESHOLDS;
  const rate = creator.engagementRate;
  if (rate <= minEngagementRate) return 0;
  if (rate >= maxEngagementRate) return 100;
  return (
    ((rate - minEngagementRate) / (maxEngagementRate - minEngagementRate)) * 100
  );
}

/** Creator's avg watch time vs campaign minimum – meeting the bar = full score */
function calcWatchTimeScore(campaign: Campaign, creator: Creator): number {
  if (campaign.minAvgWatchTime <= 0) return 100;
  if (creator.avgWatchTime >= campaign.minAvgWatchTime) return 100;
  return (creator.avgWatchTime / campaign.minAvgWatchTime) * 100;
}

/** Creator's follower count within campaign's budgetRange (minFollowers..maxFollowers) */
function calcFollowerFitScore(
  budgetRange: BudgetRange,
  creator: Creator,
): number {
  const { minFollowers, maxFollowers } = budgetRange;
  const f = creator.followers;
  if (f >= minFollowers && f <= maxFollowers) return 100;
  if (f < minFollowers) {
    // proportional ramp from 0 at 0 followers to 100 at minFollowers
    return Math.min(100, (f / minFollowers) * 80);
  }
  // above max – still usable but penalised
  return Math.max(0, 100 - ((f - maxFollowers) / maxFollowers) * 50);
}

/** Creator's primaryHookType matches one of campaign's preferredHookTypes */
function calcHookAlignmentScore(campaign: Campaign, creator: Creator): number {
  if (campaign.preferredHookTypes.length === 0) return 100;
  const hook = creator.primaryHookType.toLowerCase();
  return campaign.preferredHookTypes.some((h) => h.toLowerCase() === hook)
    ? 100
    : 0;
}

/** No brand safety flags = full score */
function calcBrandSafetyScore(creator: Creator): number {
  return creator.brandSafetyFlags.length === 0 ? 100 : 0;
}

/** Audience gender split vs campaign's targetGender */
function calcGenderScore(campaign: Campaign, audience: Audience): number {
  if (campaign.targetGender === 'all') return 100;
  const split = audience.genderSplit as unknown as Record<string, number>;
  const fraction = split[campaign.targetGender] ?? 0;
  // fraction >0.6 = strong match, 0.5 = neutral, <0.4 = mismatch
  if (fraction >= 0.7) return 100;
  if (fraction >= 0.5) return 60;
  if (fraction >= 0.4) return 30;
  return 0;
}

/** Audience top age range vs campaign's targetAgeRange */
function calcAgeScore(campaign: Campaign, audience: Audience): number {
  return audience.topAgeRange === campaign.targetAgeRange ? 100 : 0;
}

/** Absolute score deduction per brand safety flag */
function calcPenalties(creator: Creator): number {
  return creator.brandSafetyFlags.length * THRESHOLDS.penaltyPerFlag;
}

