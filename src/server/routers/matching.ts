import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';
import { prisma } from '~/server/prisma';
import { scoreCreator } from '~/lib/scoring/matching';
import { explainScore } from '~/lib/scoring/explain';

export const matchingRouter = router({
  getTopCreatorsForCampaign: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const campaign = await prisma.campaign.findUnique({
        where: { id: input.campaignId },
      });

      if (!campaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Campaign ${input.campaignId} not found`,
        });
      }

      const creators = await prisma.creator.findMany();

      const scored = creators
        .map((creator) => {
          const result = scoreCreator(campaign, creator);
          return {
            ...result,
            reasons: explainScore(result.breakdown),
          };
        })
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, input.limit);

      return {
        campaign,
        results: scored,
      };
    }),
});
