import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { prisma } from "./prisma";
import { decrypt } from "./crypto";

export type ProviderName = "gemini" | "openai" | "groq" | "openrouter";

interface ProviderConfig {
  name: ProviderName;
  label: string;
  models: string[];
  defaultModel: string;
}

export const PROVIDERS: Record<ProviderName, ProviderConfig> = {
  gemini: {
    name: "gemini",
    label: "Gemini",
    models: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"],
    defaultModel: "gemini-2.5-flash",
  },
  openai: {
    name: "openai",
    label: "OpenAI",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
    defaultModel: "gpt-4o-mini",
  },
  groq: {
    name: "groq",
    label: "Groq",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    defaultModel: "llama-3.3-70b-versatile",
  },
  openrouter: {
    name: "openrouter",
    label: "OpenRouter",
    models: ["meta-llama/llama-3.2-3b-instruct:free", "google/gemini-2.0-flash-lite-preview-02-05:free"],
    defaultModel: "meta-llama/llama-3.2-3b-instruct:free",
  },
};

// Schema definition for Google Generative AI structured output
const geminiResponseSchema: any = {
  type: "object",
  properties: {
    comments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          personaId: { type: "string" },
          content: { type: "string" },
          replyToId: { type: "string" },
          sentimentScore: { type: "number" },
          toxicityScore: { type: "number" },
        },
        required: ["personaId", "content", "replyToId", "sentimentScore", "toxicityScore"],
      }
    }
  },
  required: ["comments"],
};

export interface LLMResult {
  comments: Array<{
    personaId: string;
    content: string;
    replyToId: string | null;
    sentimentScore: number;
    toxicityScore: number;
  }>;
}

/**
 * Get the currently selected API key from the database.
 * Falls back to .env GOOGLE_GENERATIVE_AI_API_KEY for Gemini if no DB key is set.
 */
export async function getActiveProvider(): Promise<{ provider: ProviderName; apiKey: string } | null> {
  try {
    // Find the selected key
    const selectedKey = await prisma.apiKey.findFirst({
      where: { isSelected: true, isActive: true, isExhausted: false },
    });

    if (selectedKey) {
      const decryptedKey = decrypt(selectedKey.keyValue);
      if (decryptedKey) {
        return { provider: selectedKey.provider as ProviderName, apiKey: decryptedKey };
      }
    }

    // Fallback: try any non-exhausted active key
    const fallbackKey = await prisma.apiKey.findFirst({
      where: { isActive: true, isExhausted: false },
      orderBy: { createdAt: "asc" },
    });

    if (fallbackKey) {
      // Auto-select it
      await prisma.apiKey.updateMany({ data: { isSelected: false } });
      await prisma.apiKey.update({ where: { id: fallbackKey.id }, data: { isSelected: true } });
      const decryptedKey = decrypt(fallbackKey.keyValue);
      if (decryptedKey) {
        return { provider: fallbackKey.provider as ProviderName, apiKey: decryptedKey };
      }
    }

    // Final fallback: .env Gemini key
    const envKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (envKey) {
      return { provider: "gemini", apiKey: envKey };
    }

    return null;
  } catch (e) {
    // If DB fails, fall back to env
    const envKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (envKey) return { provider: "gemini", apiKey: envKey };
    return null;
  }
}

/**
 * Mark a key as exhausted when we get a 429 / quota error
 */
export async function markKeyExhausted(provider: ProviderName): Promise<void> {
  try {
    await prisma.apiKey.updateMany({
      where: { provider, isSelected: true },
      data: { isExhausted: true, isSelected: false },
    });
  } catch (e) {
    console.error("Failed to mark key exhausted:", e);
  }
}

/**
 * Call the active LLM provider with the given system prompt
 */
export async function callLLM(systemPrompt: string): Promise<LLMResult> {
  const active = await getActiveProvider();
  if (!active) {
    throw new Error("NO_API_KEY: No active API key configured. Add one in the API Key Manager (🔑 button).");
  }

  const { provider, apiKey } = active;

  // Update lastUsedAt
  try {
    await prisma.apiKey.updateMany({
      where: { isSelected: true },
      data: { lastUsedAt: new Date() },
    });
  } catch { /* non-fatal */ }

  try {
    switch (provider) {
      case "gemini":
        return await callGemini(apiKey, systemPrompt);
      case "openai":
        return await callOpenAI(apiKey, systemPrompt, PROVIDERS.openai.defaultModel);
      case "groq":
        return await callGroq(apiKey, systemPrompt, PROVIDERS.groq.defaultModel);
      case "openrouter":
        return await callOpenRouter(apiKey, systemPrompt, PROVIDERS.openrouter.defaultModel);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error: any) {
    // Detect quota exhaustion or 503 high demand
    const msg = error?.message || error?.toString() || "";
    const status = error?.status || error?.statusCode || 0;
    const isExhaustedOrBusy = 
      status === 429 || status === 503 ||
      msg.includes("429") || msg.includes("503") ||
      msg.toLowerCase().includes("quota") || 
      msg.toLowerCase().includes("rate limit") ||
      msg.toLowerCase().includes("high demand") ||
      msg.toLowerCase().includes("service unavailable");

    if (isExhaustedOrBusy) {
      await markKeyExhausted(provider);
      // Try auto-fallback
      const fallback = await getActiveProvider();
      if (fallback && fallback.provider !== provider) {
        console.log(`[PROVIDER] Auto-fallback from ${provider} to ${fallback.provider}`);
        return await callLLM(systemPrompt); // Recursive retry with new provider
      }
      throw new Error(`QUOTA_EXHAUSTED: ${provider} API key quota exceeded. Add a new key or wait for reset.`);
    }
    throw error;
  }
}

// ===== GEMINI =====
async function callGemini(apiKey: string, prompt: string): Promise<LLMResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: PROVIDERS.gemini.defaultModel,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: geminiResponseSchema,
      temperature: 0.8,
    },
  });

  const response = await model.generateContent(prompt);
  const text = response.response.text();
  return JSON.parse(text) as LLMResult;
}

// ===== OPENAI =====
async function callOpenAI(apiKey: string, prompt: string, model: string): Promise<LLMResult> {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model,
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a thread simulation engine. Return valid JSON only." },
      { role: "user", content: prompt + "\n\nReturn your response as a JSON object with a single key 'comments' containing an array. Each comment object must have: personaId (string), content (string), replyToId (string or null), sentimentScore (number -1 to 1), toxicityScore (number 0 to 1)." },
    ],
  });

  const text = response.choices[0]?.message?.content || "{}";
  return JSON.parse(text) as LLMResult;
}

// ===== GROQ (OpenAI-compatible API) =====
async function callGroq(apiKey: string, prompt: string, model: string): Promise<LLMResult> {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const response = await client.chat.completions.create({
    model,
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a thread simulation engine. Return valid JSON only." },
      { role: "user", content: prompt + "\n\nReturn your response as a JSON object with a single key 'comments' containing an array. Each comment object must have: personaId (string), content (string), replyToId (string or null), sentimentScore (number -1 to 1), toxicityScore (number 0 to 1)." },
    ],
  });

  const text = response.choices[0]?.message?.content || "{}";
  return JSON.parse(text) as LLMResult;
}

// ===== OPENROUTER (OpenAI-compatible API) =====
async function callOpenRouter(apiKey: string, prompt: string, model: string): Promise<LLMResult> {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  const response = await client.chat.completions.create({
    model,
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a thread simulation engine. Return valid JSON only." },
      { role: "user", content: prompt + "\n\nReturn your response as a JSON object with a single key 'comments' containing an array. Each comment object must have: personaId (string), content (string), replyToId (string or null), sentimentScore (number -1 to 1), toxicityScore (number 0 to 1)." },
    ],
  });

  const text = response.choices[0]?.message?.content || "{}";
  return JSON.parse(text) as LLMResult;
}
