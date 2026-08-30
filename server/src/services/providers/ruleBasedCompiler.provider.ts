import { IntentCategory, IntentConstraints, IntentPermissions } from "../../types";

export interface CompiledIntentStructure {
  category: IntentCategory;
  constraints: IntentConstraints;
  permissions: IntentPermissions;
  mode: "ai" | "deterministic_fallback";
  confidenceScore: number | null;
  compiler: "gemini" | "rules";
  interpretation: {
    budget: string;
    category: string;
    approval: string;
    permissions: string;
    prohibitions?: string;
  };
  warnings: string[];
}

export class RuleBasedCompilerProvider {
  compile(rawText: string): CompiledIntentStructure {
    const textLower = rawText.toLowerCase();

    // 1. Determine Category (accounting for negated subscription keywords)
    let category: IntentCategory = "shopping";
    const isNegatedSubscription =
      textLower.includes("do not subscribe") ||
      textLower.includes("no subscription") ||
      textLower.includes("don't subscribe") ||
      textLower.includes("one-time only") ||
      textLower.includes("no recurring");

    if (!isNegatedSubscription && (textLower.includes("subscri") || textLower.includes("recurring") || textLower.includes("monthly plan"))) {
      category = "subscription";
    } else if (textLower.includes("transfer") || textLower.includes("send money") || textLower.includes("wire")) {
      category = "transfer";
    } else if (textLower.includes("bill") || textLower.includes("utility") || textLower.includes("recharge")) {
      category = "payment";
    }

    // 2. Extract Max Budget / Amount
    let maxAmount: number | undefined;
    const amountRegex = /(?:under|below|max|upto|up to|budget of|less than|within|for)\s*(?:₹|rs\.?|inr|\$|usd)?\s*([\d,]+(?:\.\d+)?)/i;
    const directAmountRegex = /(?:₹|rs\.?|inr|\$|usd)\s*([\d,]+(?:\.\d+)?)/i;

    const amountMatch = rawText.match(amountRegex) || rawText.match(directAmountRegex);
    if (amountMatch && amountMatch[1]) {
      const cleanNum = parseFloat(amountMatch[1].replace(/,/g, ""));
      if (!isNaN(cleanNum)) {
        maxAmount = cleanNum;
      }
    }

    // 3. Extract Currency
    let currency = "INR";
    if (rawText.includes("$") || textLower.includes("usd") || textLower.includes("dollar")) {
      currency = "USD";
    } else if (textLower.includes("eur") || rawText.includes("€")) {
      currency = "EUR";
    }

    // 4. Extract Approval requirement
    let requiresApproval = true;
    if (
      textLower.includes("automatically") ||
      textLower.includes("auto buy") ||
      textLower.includes("auto-buy") ||
      textLower.includes("without asking") ||
      textLower.includes("direct purchase")
    ) {
      requiresApproval = false;
    } else if (
      textLower.includes("ask me") ||
      textLower.includes("ask before") ||
      textLower.includes("confirm with me") ||
      textLower.includes("require approval") ||
      textLower.includes("don't purchase without asking") ||
      textLower.includes("do not buy without asking") ||
      textLower.includes("need my permission") ||
      textLower.includes("prompt me")
    ) {
      requiresApproval = true;
    }

    // 5. Extract Product / Category
    let productCategory: string | undefined;
    if (textLower.includes("running shoes") || textLower.includes("shoes") || textLower.includes("sneakers")) {
      productCategory = "running shoes";
    } else if (textLower.includes("stationery") || textLower.includes("office supplies")) {
      productCategory = "office supplies";
    } else if (textLower.includes("laptop") || textLower.includes("macbook") || textLower.includes("computer")) {
      productCategory = "laptop";
    } else if (textLower.includes("coffee") || textLower.includes("groceries") || textLower.includes("food")) {
      productCategory = "groceries";
    }

    // 6. Extract Allowed/Blocked Merchants
    const allowedMerchants: string[] = [];
    const blockedMerchants: string[] = [];

    if (textLower.includes("nike")) allowedMerchants.push("Nike India");
    if (textLower.includes("amazon")) allowedMerchants.push("Amazon");
    if (textLower.includes("flipkart")) allowedMerchants.push("Flipkart");
    if (textLower.includes("blinkit")) allowedMerchants.push("Blinkit");

    if (
      textLower.includes("not from") ||
      textLower.includes("avoid") ||
      textLower.includes("don't buy from") ||
      textLower.includes("block") ||
      textLower.includes("unverified")
    ) {
      if (
        textLower.includes("unknown") ||
        textLower.includes("third-party") ||
        textLower.includes("unverified")
      ) {
        blockedMerchants.push("Unverified Merchants");
      }
    }

    // 7. Explicit Prohibitions extraction (e.g. warranties, subscriptions)
    const prohibitions: string[] = [];
    if (textLower.includes("don't buy extended warranty") || textLower.includes("no warranty") || textLower.includes("without warranty") || textLower.includes("don't buy extended warranties")) {
      prohibitions.push("No extended warranty purchase");
    }

    // 8. Permissions Matrix
    const permissions: IntentPermissions = {
      canPurchase: category === "shopping" || category === "payment",
      canSubscribe: category === "subscription" && !isNegatedSubscription,
      canTransfer: category === "transfer",
      canChangeQuantity: !textLower.includes("only 1") && !textLower.includes("exact 1"),
    };

    if (isNegatedSubscription) {
      permissions.canSubscribe = false;
    }

    const currencySym = currency === "INR" ? "₹" : "$";

    return {
      category,
      constraints: {
        maxAmount: maxAmount || 5000,
        currency,
        productCategory,
        allowedMerchants: allowedMerchants.length > 0 ? allowedMerchants : undefined,
        blockedMerchants: blockedMerchants.length > 0 ? blockedMerchants : undefined,
        quantity: 1,
        requiresApproval,
      },
      permissions,
      mode: "deterministic_fallback",
      confidenceScore: null,
      compiler: "rules",
      interpretation: {
        budget: `Maximum ${currencySym}${(maxAmount || 5000).toLocaleString()}`,
        category: productCategory ? productCategory.toUpperCase() : category.toUpperCase(),
        approval: requiresApproval ? "Mandatory Confirmation Required" : "Auto-Authorize Allowed",
        permissions: `Purchase: ${permissions.canPurchase ? "YES" : "NO"} | Subscribe: ${permissions.canSubscribe ? "YES" : "NO"}`,
        prohibitions: prohibitions.length > 0 ? prohibitions.join(", ") : undefined,
      },
      warnings: [],
    };
  }
}

export const ruleBasedCompiler = new RuleBasedCompilerProvider();
