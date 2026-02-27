import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/routers/_app';

type RouterOutput = inferRouterOutputs<AppRouter>;

export type MatchingResult =
  RouterOutput['matching']['getTopCreatorsForCampaign']['results'][number];

export type Campaign =
  RouterOutput['matching']['getTopCreatorsForCampaign']['campaign'];
