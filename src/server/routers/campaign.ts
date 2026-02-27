import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';
import { prisma } from '~/server/prisma';

export const campaignRouter = router({
  list: publicProcedure.query(async () => {
    return prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const campaign = await prisma.campaign.findUnique({ where: { id: input.id } });
      if (!campaign) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Campaign ${input.id} not found` });
      }
      return campaign;
    }),
});
