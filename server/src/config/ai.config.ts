/**
 * Centralized AI & Gemini Configuration for IntentLedger
 * Reads model and API key from environment with modern defaults.
 */

export interface AiConfig {
  apiKey?: string;
  model: string;
  isConfigured: boolean;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || "gemini-3.6-flash";
}

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return !!(key && key.trim() !== "");
}

export function getAiConfig(): AiConfig {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = getGeminiModel();
  const isConfigured = isGeminiConfigured();

  return {
    apiKey: isConfigured ? apiKey : undefined,
    model,
    isConfigured,
  };
}

export function getAiCompilerHealth(): {
  provider: "gemini" | "deterministic";
  model: string | null;
  status: "ready" | "fallback";
  description: string;
} {
  const configured = isGeminiConfigured();
  const model = getGeminiModel();

  if (configured) {
    return {
      provider: "gemini",
      model,
      status: "ready",
      description: `Google Gemini (${model}) Structured Intent Compiler`,
    };
  }

  return {
    provider: "deterministic",
    model: null,
    status: "fallback",
    description: "Deterministic Rule Engine (Fallback)",
  };
}
