import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { CompiledIntentStructure } from "./ruleBasedCompiler.provider";
import { getGeminiModel, isGeminiConfigured } from "../../config/ai.config";

const geminiResponseSchema = z.object({
  category: z.enum(["shopping", "payment", "subscription", "transfer", "other"]).default("shopping"),
  maxAmount: z.number().positive().optional(),
  currency: z.string().default("INR"),
  productCategory: z.string().optional(),
  allowedMerchants: z.array(z.string()).optional(),
  blockedMerchants: z.array(z.string()).optional(),
  quantity: z.number().int().positive().default(1),
  requiresApproval: z.boolean().default(true),
  canPurchase: z.boolean().default(true),
  canSubscribe: z.boolean().default(false),
  canTransfer: z.boolean().default(false),
  canChangeQuantity: z.boolean().default(true),
  prohibitions: z.string().optional(),
  warnings: z.array(z.string()).default([]),
});

export class GeminiCompilerProvider {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== "") {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  isConfigured(): boolean {
    return isGeminiConfigured();
  }

  getModelName(): string {
    return getGeminiModel();
  }

  async compile(rawText: string): Promise<CompiledIntentStructure> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }

    const modelName = this.getModelName();
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
You are an intent extraction system for IntentLedger.
Your job is ONLY to convert the user's natural-language instruction into a structured authorization policy.
Do NOT make purchasing decisions. Do NOT invent permissions.
Do NOT assume the user approved something that was not explicitly stated.
If information is missing, use null/empty values rather than inventing facts.

Extract the following fields into a single JSON object:
- category: ("shopping" | "payment" | "subscription" | "transfer" | "other")
- maxAmount: (number, the upper budget limit authorized by the user)
- currency: (3-letter currency code, e.g. "INR", "USD", "EUR". Default "INR" if unspecified)
- productCategory: (string describing the allowed item or domain)
- allowedMerchants: (string array of explicitly allowed or mentioned stores)
- blockedMerchants: (string array of explicitly prohibited stores)
- quantity: (integer limit)
- requiresApproval: (boolean: true if user asks to be prompted/asked before purchase or if ambiguous; false only if user explicitly says auto-buy/automatically/without asking)
- canPurchase: (boolean: true if buying is permitted)
- canSubscribe: (boolean: false if user prohibits recurring/subscription or if intent is one-time only)
- canTransfer: (boolean)
- canChangeQuantity: (boolean)
- prohibitions: (string describing any explicit prohibited items or add-ons, e.g. "No extended warranty")
- warnings: (string array of any ambiguous terms)

User natural-language instruction:
"${rawText}"
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse and validate with Zod
    const parsedJson = JSON.parse(responseText);
    const validated = geminiResponseSchema.parse(parsedJson);

    const currencySym = validated.currency === "INR" ? "₹" : "$";

    return {
      category: validated.category,
      constraints: {
        maxAmount: validated.maxAmount || 5000,
        currency: validated.currency,
        productCategory: validated.productCategory,
        allowedMerchants: validated.allowedMerchants && validated.allowedMerchants.length > 0 ? validated.allowedMerchants : undefined,
        blockedMerchants: validated.blockedMerchants && validated.blockedMerchants.length > 0 ? validated.blockedMerchants : undefined,
        quantity: validated.quantity,
        requiresApproval: validated.requiresApproval,
      },
      permissions: {
        canPurchase: validated.canPurchase,
        canSubscribe: validated.canSubscribe,
        canTransfer: validated.canTransfer,
        canChangeQuantity: validated.canChangeQuantity,
      },
      mode: "ai",
      confidenceScore: null,
      compiler: "gemini",
      interpretation: {
        budget: `Maximum ${currencySym}${(validated.maxAmount || 5000).toLocaleString()}`,
        category: validated.productCategory ? validated.productCategory.toUpperCase() : validated.category.toUpperCase(),
        approval: validated.requiresApproval ? "Mandatory Confirmation Required" : "Auto-Authorize Allowed",
        permissions: `Purchase: ${validated.canPurchase ? "YES" : "NO"} | Subscribe: ${validated.canSubscribe ? "YES" : "NO"}`,
        prohibitions: validated.prohibitions,
      },
      warnings: validated.warnings,
    };
  }
}

export const geminiCompiler = new GeminiCompilerProvider();
