import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/routers/_app';

type RouterOutput = inferRouterOutputs<AppRouter>;

export type BriefOutput =
  RouterOutput['brief']['generateBrief']['brief'];
