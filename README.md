# Wayv — Creator Matching & AI Brief Generator

A full-stack Next.js application that ranks influencer creators against a brand campaign using a weighted scoring engine, then generates a personalised outreach brief via an LLM (or a deterministic mock when no API key is configured).

## Stack

- **Next.js** (Pages Router) + **tRPC v11** — end-to-end type-safe API
- **Prisma 6** + **Supabase Postgres** — data layer
- **Tailwind CSS** — minimal dark-theme UI
- **OpenAI gpt-4o-mini** — brief generation (mock fallback included)
- **Zod** — strict runtime validation of LLM output
- **Bun** — runtime & package manager

## Setup

```bash
# 1. Install dependencies
bun install

# 2. Copy environment config
cp .env.example .env
# Fill in DATABASE_URL (and optionally OPENAI_API_KEY)

# 3. Apply migrations and seed data
bunx prisma migrate dev
bunx prisma db seed

# 4. Start the dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `OPENAI_API_KEY` | No | When absent the mock provider is used automatically |

## Scoring logic

Each creator is scored against the selected campaign by `scoreCreator()` in [`src/lib/scoring/matching.ts`](src/lib/scoring/matching.ts). The result is a weighted sum of nine independent signals, each normalised to **0–100**, minus any absolute penalties.

```
totalScore = Σ(signalScore × weight) − penalties   [clamped 0–100]
```

| Signal | Weight | How it is measured |
|---|---|---|
| Niche alignment | 25% | Fraction of campaign niches present in creator niches |
| Country | 20% | Primary audience country = 100, secondary = 60, miss = 0 |
| Engagement rate | 12% | Linear ramp between 2% (floor → 0) and 15% (ceiling → 100) |
| Watch time | 12% | Meets campaign minimum → 100; proportional below |
| Follower fit | 12% | Within `budgetRange` → 100; ramped below, penalised above |
| Hook alignment | 10% | Creator's `primaryHookType` in campaign's `preferredHookTypes` |
| Brand safety | 5% | No flags → 100; any flag → 0 |
| Gender match | 2% | Audience gender split vs campaign `targetGender` |
| Age range | 2% | Audience `topAgeRange` exact match |
| **Penalties** | — | −5 pts per brand safety flag (absolute deduction after weighting) |

Weights are centralised in [`src/lib/scoring/weights.ts`](src/lib/scoring/weights.ts) so they can be tuned without touching signal logic. All signals are pure functions with no database access, making them straightforward to unit-test.

Human-readable reasons for each score are produced by `explainScore()` in [`src/lib/scoring/explain.ts`](src/lib/scoring/explain.ts) using a small `tier()` helper that maps score thresholds to label strings.

## AI brief generation

1. `buildBriefPrompt()` serialises campaign and creator context as a JSON block inside a strict-JSON system prompt.
2. `parseBriefWithRepair()` calls the provider and validates the response with **Zod** (`BriefSchema`). If validation fails it sends a repair prompt (up to 2 retries) before throwing a controlled `TRPCError`.
3. Successful responses are stored in `AiBriefCache` keyed by `(campaignId, creatorId, promptHash)`. The hash includes `SCHEMA_VERSION` so cache entries are automatically invalidated when the prompt schema changes.

## Trade-offs and development notes

**Mock provider for offline work** — When `OPENAI_API_KEY` is not set, `provider.ts` automatically routes to `mockCallProvider()`. The mock extracts campaign/creator fields directly from the prompt string with regex and returns deterministic, schema-valid JSON. This means the full UI and caching flow can be tested without an API key or network access.

**Zod repair loop instead of structured outputs** — The repair loop (`parseBriefWithRepair`) was chosen over OpenAI's `response_format: json_schema` feature so the same validation path covers both the mock provider and any other future provider that does not support structured outputs.

**Prisma `Json` fields and TypeScript** — Audience demographics and budget ranges are stored as `Json` in Prisma because their shape varies. At runtime they are cast with `as unknown as T` using interfaces defined once in `src/lib/scoring/types.ts` and imported wherever needed, rather than repeating the definitions.

**Scoring as a pure function** — `scoreCreator()` takes plain objects and returns a value. It has no database access and no side effects, so it can be extracted into a serverless function or tested in isolation without any infrastructure.

**Weights sum to 1.0** — The nine weights add up to exactly 1.0, meaning a creator with 100 on every signal (and no penalties) achieves a `totalScore` of 100. Penalties are applied after the weighted sum as absolute point deductions so a flagged creator can still rank but is always visibly penalised.

**Caching trade-off** — Briefs are cached after first generation. The `forceRefresh` flag on the `generateBrief` mutation allows regeneration without changing the API surface. The cache key includes a `SCHEMA_VERSION` constant, so bumping the version in `weights.ts` invalidates all existing cache entries globally.

## Project structure

```
src/
  lib/
    scoring/
      types.ts        # Shared interfaces for Prisma Json fields
      weights.ts      # Signal weights, thresholds, schema version
      matching.ts     # scoreCreator() – pure scoring function
      explain.ts      # explainScore(), weightedContributions()
    ai/
      provider.ts     # OpenAI / mock selector
      mock-provider.ts
      prompt.ts       # buildBriefPrompt(), buildRepairPrompt()
      json.ts         # BriefSchema (Zod), parseBriefWithRepair()
      cache.ts        # getCachedBrief(), storeBriefCache()
  server/
    routers/
      campaign.ts     # list, byId
      creator.ts      # list, byId
      matching.ts     # getTopCreatorsForCampaign
      brief.ts        # generateBrief mutation
  pages/
    index.tsx         # Full UI
prisma/
  schema.prisma       # Campaign, Creator, AiBriefCache models
  seed.ts             # Upserts from agent_resources/
agent_resources/
  campaigns.json      # 3 real campaigns
  creators.json       # 50 real creators
```

