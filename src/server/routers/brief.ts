import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';
import { prisma } from '~/server/prisma';
import { buildBriefPrompt } from '~/lib/ai/prompt';
import { parseBriefWithRepair } from '~/lib/ai/json';
import {
  computePromptHash,
  getCachedBrief,
  storeBriefCache,
} from '~/lib/ai/cache';

export const briefRouter = router({
  generateBrief: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
        creatorId: z.string(),
        forceRefresh: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ input }) => {
      const [campaign, creator] = await Promise.all([
        prisma.campaign.findUnique({ where: { id: input.campaignId } }),
        prisma.creator.findUnique({ where: { id: input.creatorId } }),
      ]);

      if (!campaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Campaign ${input.campaignId} not found`,
        });
      }
      if (!creator) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Creator ${input.creatorId} not found`,
        });
      }

      const prompt = buildBriefPrompt(campaign, creator);
      const promptHash = computePromptHash(prompt);

      // Cache lookup (skip if forceRefresh)
      if (!input.forceRefresh) {
        const cached = await getCachedBrief(
          input.campaignId,
          input.creatorId,
          promptHash,
        );
        if (cached) {
          return { brief: cached, cached: true };
        }
      }

      // Generate, validate, repair
      const brief = await parseBriefWithRepair(prompt);

      // Store in cache
      await storeBriefCache(
        input.campaignId,
        input.creatorId,
        promptHash,
        brief,
      );

      return { brief, cached: false };
    }),
});
