/**
 * This file contains the root router of your tRPC-backend
 */
import { createCallerFactory, publicProcedure, router } from '../trpc';
import { campaignRouter } from './campaign';
import { creatorRouter } from './creator';
import { matchingRouter } from './matching';
import { briefRouter } from './brief';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),
  campaign: campaignRouter,
  creator: creatorRouter,
  matching: matchingRouter,
  brief: briefRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
