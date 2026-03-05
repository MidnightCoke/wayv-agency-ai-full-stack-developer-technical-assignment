import OpenAI from 'openai';
import Groq from 'groq-sdk';
import {
  mockCallProvider,
  MOCK_PROVIDER_NAME,
  MOCK_MODEL_NAME,
} from './mock-provider';

// ─── Provider config ──────────────────────────────────────────────────────────
// Priority: OpenAI > GROQ > Mock

const hasOpenAI = !!process.env.OPENAI_API_KEY;
const hasGroq = !!process.env.GROQ_API_KEY;

export const PROVIDER_NAME = hasOpenAI ? 'openai' : hasGroq ? 'groq' : MOCK_PROVIDER_NAME;
export const MODEL_NAME = hasOpenAI ? 'gpt-4o-mini' : hasGroq ? 'openai/gpt-oss-120b' : MOCK_MODEL_NAME;

// ─── Lazy clients ─────────────────────────────────────────────────────────────

let _openai: OpenAI | null = null;
let _groq: Groq | null = null;

const getOpenAI = () => (_openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }));
const getGroq = () => (_groq ??= new Groq({ apiKey: process.env.GROQ_API_KEY! }));

// ─── Shared chat-completions call ─────────────────────────────────────────────

const SYSTEM_PROMPT =
  'You are a JSON-only response API. You never produce markdown, explanations, or any text outside of a single JSON object.';

type ChatClient = {
  chat: {
    completions: {
      create(params: {
        model: string;
        messages: { role: 'system' | 'user'; content: string }[];
        temperature: number;
        response_format: { type: 'json_object' };
      }): Promise<{ choices: { message: { content: string | null } }[] }>;
    };
  };
};

async function callChatCompletions(client: ChatClient, prompt: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: MODEL_NAME,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error(`[AI] ${PROVIDER_NAME} returned an empty response`);
  return content;
}

// ─── Unified call ─────────────────────────────────────────────────────────────

/**
 * Calls the configured AI provider and returns raw JSON text.
 * Priority: OpenAI → GROQ → Mock
 * Parsing and validation happen in json.ts.
 */
export async function callProvider(prompt: string): Promise<string> {
  if (hasOpenAI) return callChatCompletions(getOpenAI(), prompt);
  if (hasGroq) return callChatCompletions(getGroq(), prompt);
  return mockCallProvider(prompt);
}
