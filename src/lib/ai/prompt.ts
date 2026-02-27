import type { Campaign, Creator } from '@prisma/client';
import type { Audience, BudgetRange } from '~/lib/scoring/types';

const SCHEMA_EXAMPLE = JSON.stringify(
  {
    outreachMessage: 'Hi [Creator Name], we love your content...',
    contentIdeas: [
      'POV-style unboxing for maximum hook impact',
      'Day-in-the-life integration with the product',
      'Transformation before/after using the brand',
      'Trending audio remix featuring the product',
      'Behind-the-scenes collab with the brand team',
    ],
    hookSuggestions: [
      'POV: You just discovered the only product you\'ll ever need...',
      'I tried [brand] for 7 days — here\'s what happened',
      'Wait until you see what [brand] sent me...',
    ],
  },
  null,
  2,
);

/**
 * Builds the strict-JSON prompt for brief generation.
 * Includes only the fields the LLM needs to do its job.
 */
export function buildBriefPrompt(campaign: Campaign, creator: Creator): string {
  const budgetRange = campaign.budgetRange as unknown as BudgetRange;
  const audience = creator.audience as unknown as Audience;

  const campaignContext = {
    brand: campaign.brand,
    objective: campaign.objective,
    niches: campaign.niches,
    targetCountry: campaign.targetCountry,
    targetGender: campaign.targetGender,
    targetAgeRange: campaign.targetAgeRange,
    preferredHookTypes: campaign.preferredHookTypes,
    minAvgWatchTime: campaign.minAvgWatchTime,
    followerRange: `${budgetRange.minFollowers.toLocaleString()}–${budgetRange.maxFollowers.toLocaleString()}`,
    tone: campaign.tone,
    doNotUseWords: campaign.doNotUseWords,
  };

  const creatorContext = {
    username: creator.username,
    niches: creator.niches,
    country: creator.country,
    followers: creator.followers,
    engagementRate: `${(creator.engagementRate * 100).toFixed(1)}%`,
    avgWatchTime: `${creator.avgWatchTime}s`,
    contentStyle: creator.contentStyle,
    primaryHookType: creator.primaryHookType,
    audienceTopCountries: audience.topCountries,
    audienceTopAgeRange: audience.topAgeRange,
    audienceGenderSplit: audience.genderSplit,
  };

  return `You are a campaign brief writer for an influencer marketing platform.

Generate a campaign brief tailored to the following campaign and creator.

CAMPAIGN:
${JSON.stringify(campaignContext, null, 2)}

CREATOR:
${JSON.stringify(creatorContext, null, 2)}

INSTRUCTIONS:
- Respond with STRICT JSON only. No markdown. No explanations. No extra text.
- Your entire response must be a single valid JSON object.
- The JSON must exactly match this schema (no extra keys allowed):
${SCHEMA_EXAMPLE}

SCHEMA REQUIREMENTS:
- outreachMessage: string — personalized opening message for the creator, referencing their username and content style
- contentIdeas: array of exactly 5 strings — specific, actionable content ideas for this creator + campaign combo
- hookSuggestions: array of exactly 3 strings — scroll-stopping hook lines matching the creator's primaryHookType style

TONE: ${campaign.tone}
AVOID WORDS: ${campaign.doNotUseWords.join(', ') || 'none'}

OUTPUT ONLY THE JSON OBJECT.`;
}

/**
 * Builds a repair prompt when the first attempt produced invalid JSON.
 */
export function buildRepairPrompt(
  originalPrompt: string,
  previousOutput: string,
  validationErrors: string,
): string {
  return `${originalPrompt}

---
YOUR PREVIOUS RESPONSE WAS INVALID. Here is what was wrong:
${validationErrors}

PREVIOUS OUTPUT:
${previousOutput}

Fix the issues above and return ONLY the corrected JSON object. No explanations.`;
}
