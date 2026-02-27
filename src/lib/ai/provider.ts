import OpenAI from 'openai';
import {
  mockCallProvider,
  MOCK_PROVIDER_NAME,
  MOCK_MODEL_NAME,
} from './mock-provider';

// ─── Provider selection ───────────────────────────────────────────────────────

const isMock = !process.env.OPENAI_API_KEY;

export const PROVIDER_NAME = isMock ? MOCK_PROVIDER_NAME : 'openai';
export const MODEL_NAME = isMock ? MOCK_MODEL_NAME : 'gpt-4o-mini';

// ─── OpenAI client (lazy, only created when a real key is present) ────────────

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY!;
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

// ─── Unified call ─────────────────────────────────────────────────────────────

/**
 * Calls the configured provider and returns raw text response.
 * Falls back to mock when OPENAI_API_KEY is not set.
 * No parsing or validation here – that happens in json.ts.
 */
export async function callProvider(prompt: string): Promise<string> {
  if (isMock) {
    console.log('[AI] OPENAI_API_KEY not set – using mock provider');
    return mockCallProvider(prompt);
  }

  const client = getClient();

  const response = await client.chat.completions.create({
    model: MODEL_NAME,
    messages: [
      {
        role: 'system',
        content:
          'You are a JSON-only response API. You never produce markdown, explanations, or any text outside of a single JSON object.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  return response.choices[0]?.message?.content ?? '';
}
