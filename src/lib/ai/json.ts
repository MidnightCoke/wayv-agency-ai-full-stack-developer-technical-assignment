import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { callProvider } from './provider';
import { buildRepairPrompt } from './prompt';

// ─── Output schema ───────────────────────────────────────────────────────────

export const BriefSchema = z.object({
  outreachMessage: z.string().min(1),
  contentIdeas: z.array(z.string()).length(5),
  hookSuggestions: z.array(z.string()).length(3),
});

export type BriefOutput = z.infer<typeof BriefSchema>;

// ─── Parse + Validate + Repair loop ──────────────────────────────────────────

const MAX_REPAIR_ATTEMPTS = 2;

/**
 * Given a prompt, calls the provider and returns a validated BriefOutput.
 * Retries with a repair prompt if the output is invalid JSON or fails Zod.
 * Throws a controlled TRPCError if all attempts fail.
 */
export async function parseBriefWithRepair(prompt: string): Promise<BriefOutput> {
  let lastRaw = '';
  let lastError = '';

  for (let attempt = 0; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
    const activePrompt =
      attempt === 0
        ? prompt
        : buildRepairPrompt(prompt, lastRaw, lastError);

    lastRaw = await callProvider(activePrompt);

    // 1. JSON parse
    let parsed: unknown;
    try {
      parsed = JSON.parse(lastRaw);
    } catch (e) {
      lastError = `Response is not valid JSON: ${String(e)}`;
      continue;
    }

    // 2. Zod validation
    const result = BriefSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }

    lastError = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n');
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `AI brief generation failed after ${MAX_REPAIR_ATTEMPTS + 1} attempts. Last error: ${lastError}`,
  });
}
