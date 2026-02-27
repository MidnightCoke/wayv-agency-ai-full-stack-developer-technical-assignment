import type { BriefOutput } from './json';

/**
 * Extracts a value from the prompt by looking for a JSON key.
 * Used to personalise the mock response without actually calling an LLM.
 */
function extractFromPrompt(prompt: string, key: string): string {
  const match = new RegExp(`"${key}":\\s*"([^"]+)"`).exec(prompt);
  return match?.[1] ?? key;
}

/**
 * Mock AI provider – returns deterministic, schema-valid JSON.
 * Used when OPENAI_API_KEY is not set.
 *
 * Reads campaign/creator fields directly from the prompt text so the
 * output is contextually relevant without any real LLM call.
 */
export function mockCallProvider(prompt: string): string {
  const brand = extractFromPrompt(prompt, 'brand');
  const username = extractFromPrompt(prompt, 'username');
  const objective = extractFromPrompt(prompt, 'objective');
  const contentStyle = extractFromPrompt(prompt, 'contentStyle');
  const primaryHookType = extractFromPrompt(prompt, 'primaryHookType');
  const niches = (() => {
    const m = /"niches":\s*\[([^\]]+)\]/.exec(prompt);
    if (!m) return 'your niche';
    return m[1]
      .split(',')
      .map((s) => s.trim().replace(/"/g, ''))
      .join(' & ');
  })();

  const brief: BriefOutput = {
    outreachMessage: `Hey @${username}! We've been following your ${niches} content and love your ${contentStyle} style — it's exactly the energy ${brand} is looking for. We'd love to collaborate on our upcoming ${objective} campaign and think your audience would genuinely connect with what we're building. Let's chat!`,

    contentIdeas: [
      `${primaryHookType}-style short: "What I actually use from ${brand} every day" — raw and authentic`,
      `${contentStyle} integration: day-in-the-life showing ${brand} fitting naturally into your routine`,
      `Before/after transformation using ${brand}'s product, narrated in your voice`,
      `"Testing ${brand} for 7 days" mini-series — document the honest experience`,
      `Collab teaser: behind-the-scenes of creating content with the ${brand} team`,
    ],

    hookSuggestions: [
      `POV: you finally found a ${niches} brand that actually gets it… 👀`,
      `I tested ${brand} for a week so you don't have to — here's the truth`,
      `Wait until you see what ${brand} just dropped 🔥 #${brand.replace(/\s+/g, '')}`,
    ],
  };

  // Return as raw JSON string, exactly as a real LLM would
  return JSON.stringify(brief);
}

export const MOCK_PROVIDER_NAME = 'mock';
export const MOCK_MODEL_NAME = 'mock-v1';
