import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';
import { prisma } from '~/server/prisma';

export const creatorRouter = router({
  list: publicProcedure.query(async () => {
    return prisma.creator.findMany({
      orderBy: { followers: 'desc' },
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const creator = await prisma.creator.findUnique({ where: { id: input.id } });
      if (!creator) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Creator ${input.id} not found` });
      }
      return creator;
    }),
});
