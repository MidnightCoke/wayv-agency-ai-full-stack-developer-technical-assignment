import { z } from 'zod';
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
      return prisma.creator.findUnique({ where: { id: input.id } });
    }),
});
