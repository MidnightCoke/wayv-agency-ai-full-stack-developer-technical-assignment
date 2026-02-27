import { createHash } from 'crypto';
import { prisma } from '~/server/prisma';
import { PROVIDER_NAME, MODEL_NAME } from './provider';
import { SCHEMA_VERSION } from '../scoring/weights';
import type { BriefOutput } from './json';

/**
 * Computes a stable hash for the given prompt + schema version.
 * Changing the schema version invalidates the cache automatically.
 */
export function computePromptHash(prompt: string): string {
  return createHash('sha256')
    .update(SCHEMA_VERSION)
    .update(prompt)
    .digest('hex');
}

/**
 * Looks up a cached brief. Returns the parsed JSON if found, null otherwise.
 */
export async function getCachedBrief(
  campaignId: string,
  creatorId: string,
  promptHash: string,
): Promise<BriefOutput | null> {
  const cached = await prisma.aiBriefCache.findUnique({
    where: {
      campaignId_creatorId_promptHash: { campaignId, creatorId, promptHash },
    },
  });

  if (!cached) return null;
  return cached.responseJson as BriefOutput;
}

/**
 * Stores a validated brief in the cache.
 */
export async function storeBriefCache(
  campaignId: string,
  creatorId: string,
  promptHash: string,
  responseJson: BriefOutput,
): Promise<void> {
  await prisma.aiBriefCache.upsert({
    where: {
      campaignId_creatorId_promptHash: { campaignId, creatorId, promptHash },
    },
    create: {
      campaignId,
      creatorId,
      promptHash,
      provider: PROVIDER_NAME,
      model: MODEL_NAME,
      responseJson,
    },
    update: {
      responseJson,
      provider: PROVIDER_NAME,
      model: MODEL_NAME,
    },
  });
}
