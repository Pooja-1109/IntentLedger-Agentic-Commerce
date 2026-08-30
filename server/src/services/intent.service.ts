import { v4 as uuidv4 } from "uuid";
import { Intent, IntentCategory, IntentConstraints, IntentPermissions } from "../types";
import { intentRepository } from "../repositories/intent.repository";
import { ledgerRepository } from "../repositories/ledger.repository";
import { geminiCompiler } from "./providers/geminiCompiler.provider";
import { ruleBasedCompiler, CompiledIntentStructure } from "./providers/ruleBasedCompiler.provider";

export { CompiledIntentStructure };

export class IntentService {
  /**
   * Compiles Natural Language Intent using Gemini AI (if configured) with automatic fallback to Rule-Based Engine
   */
  async compileRawIntent(rawText: string): Promise<CompiledIntentStructure> {
    if (geminiCompiler.isConfigured()) {
      try {
        const aiResult = await geminiCompiler.compile(rawText);
        return aiResult;
      } catch (err) {
        console.warn("⚠️ Gemini Intent Compilation failed/unavailable, falling back to Deterministic Rules:", (err as Error).message);
        const fallbackResult = ruleBasedCompiler.compile(rawText);
        fallbackResult.warnings.push("Gemini AI unavailable or malformed response; compiled via deterministic rule engine.");
        return fallbackResult;
      }
    }

    // Default fallback to deterministic rules
    return ruleBasedCompiler.compile(rawText);
  }

  async createIntent(data: {
    rawText: string;
    userId?: string;
    category?: IntentCategory;
    constraints?: Partial<IntentConstraints>;
    permissions?: Partial<IntentPermissions>;
  }): Promise<Intent> {
    const compiled = await this.compileRawIntent(data.rawText);

    const intentId = `intent_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const newIntent: Intent = {
      id: intentId,
      userId: data.userId || "user_default",
      rawText: data.rawText,
      category: data.category || compiled.category,
      constraints: {
        ...compiled.constraints,
        ...(data.constraints || {}),
      },
      permissions: {
        ...compiled.permissions,
        ...(data.permissions || {}),
      },
      status: "active",
      createdAt: now,
      updatedAt: now,
      metadata: {
        compiler: compiled.compiler,
        mode: compiled.mode,
        interpretation: compiled.interpretation,
        warnings: compiled.warnings,
      },
    };

    const saved = await intentRepository.create(newIntent);

    // Record in Ledger
    await ledgerRepository.append({
      id: `evt_${uuidv4().substring(0, 8)}`,
      intentId: saved.id,
      eventType: "INTENT_CREATED",
      timestamp: now,
      actor: "USER",
      summary: `User registered new intent: "${saved.rawText.substring(0, 60)}${saved.rawText.length > 60 ? "..." : ""}"`,
      metadata: {
        category: saved.category,
        maxAmount: saved.constraints.maxAmount,
        currency: saved.constraints.currency,
        requiresApproval: saved.constraints.requiresApproval,
        compiler: compiled.compiler,
      },
    });

    await ledgerRepository.append({
      id: `evt_${uuidv4().substring(0, 8)}`,
      intentId: saved.id,
      eventType: "INTENT_COMPILED",
      timestamp: new Date().toISOString(),
      actor: "INTENT_ENGINE",
      summary: `Intent compiled via ${compiled.compiler === "gemini" ? "Gemini 1.5 AI" : "Deterministic Rule Engine"} with ${Object.keys(saved.constraints).length} constraints & permission safeguards.`,
      metadata: {
        compilerMode: compiled.mode,
        compiler: compiled.compiler,
        confidenceScore: compiled.confidenceScore,
        interpretation: compiled.interpretation,
      },
    });

    return saved;
  }

  async getIntentById(id: string): Promise<Intent | null> {
    return intentRepository.findById(id);
  }

  async getAllIntents(filters?: { userId?: string; status?: string }): Promise<Intent[]> {
    return intentRepository.findAll(filters);
  }
}

export const intentService = new IntentService();
