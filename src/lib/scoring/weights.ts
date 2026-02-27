export const WEIGHTS = {
  niche: 0.25,
  country: 0.20,
  engagement: 0.12,
  watchTime: 0.12,
  followerFit: 0.12,
  hookAlignment: 0.10,
  brandSafety: 0.05,
  gender: 0.02,
  age: 0.02,
} as const;

export const THRESHOLDS = {
  minEngagementRate: 0.02,  // 2%  – below this scores 0
  maxEngagementRate: 0.15,  // 15% – above this scores 100
  penaltyPerFlag: 5,        // absolute points deducted per brand safety flag
} as const;

export const SCHEMA_VERSION = '2.0.0';
