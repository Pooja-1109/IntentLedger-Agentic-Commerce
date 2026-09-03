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
    productName?: string;
    quantity?: number;
    merchant?: string;
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

    // 2. Extract Max Budget / Amount / Price Range
    let maxAmount: number | undefined;
    let minAmount: number | undefined;
    let spendingBoundaryText = "";

    // Check for range patterns (e.g. "₹500 to ₹600", "500-600", "between ₹500 and ₹600", "around ₹500 to ₹600")
    const rangeRegex = /(?:around|between|from)?\s*(?:₹|rs\.?|inr|\$|usd)?\s*([\d,]+(?:\.\d+)?)\s*(?:to|-|and)\s*(?:₹|rs\.?|inr|\$|usd)?\s*([\d,]+(?:\.\d+)?)/i;
    const rangeMatch = rawText.match(rangeRegex);

    if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
      const num1 = parseFloat(rangeMatch[1].replace(/,/g, ""));
      const num2 = parseFloat(rangeMatch[2].replace(/,/g, ""));
      if (!isNaN(num1) && !isNaN(num2)) {
        minAmount = Math.min(num1, num2);
        maxAmount = Math.max(num1, num2);
        spendingBoundaryText = `₹${minAmount.toLocaleString()}–₹${maxAmount.toLocaleString()}`;
      }
    }

    if (!maxAmount) {
      const singleAmountRegex = /(?:under|below|max|upto|up to|budget of|less than|within|for|around|approx|approximately|at|price of)\s*(?:₹|rs\.?|inr|\$|usd)?\s*([\d,]+(?:\.\d+)?)/i;
      const directAmountRegex = /(?:₹|rs\.?|inr|\$|usd)\s*([\d,]+(?:\.\d+)?)/i;

      const amountMatch = rawText.match(singleAmountRegex) || rawText.match(directAmountRegex);
      if (amountMatch && amountMatch[1]) {
        const cleanNum = parseFloat(amountMatch[1].replace(/,/g, ""));
        if (!isNaN(cleanNum)) {
          maxAmount = cleanNum;
          spendingBoundaryText = `Up to ₹${maxAmount.toLocaleString()}`;
        }
      }
    }

    if (!maxAmount) {
      maxAmount = 5000;
      spendingBoundaryText = `Up to ₹5,000`;
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

    // 5. Extract Quantity
    let quantity = 1;
    const qtyMatch =
      textLower.match(/(?:set of|pack of|box of|quantity of|qty:?|quantity:?|count:?)\s*(\d+)/i) ||
      textLower.match(/(\d+)\s*(?:notebooks?|books?|monitors?|laptops?|shoes?|kurtis?|items?|units?|pieces?|pairs?|passes)/i);

    if (qtyMatch && qtyMatch[1]) {
      const parsedQty = parseInt(qtyMatch[1], 10);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        quantity = parsedQty;
      }
    }

    // 6. Extract Product / Category / Formatted Name
    let productCategory: string | undefined;
    let productName = "Procurement Item";

    if (textLower.includes("cord set kurti") || (textLower.includes("cord set") && textLower.includes("kurti"))) {
      productCategory = "clothing";
      productName = "Cord Set Kurti";
    } else if (textLower.includes("kurti") || textLower.includes("cord set") || textLower.includes("dress") || textLower.includes("saree") || textLower.includes("clothing") || textLower.includes("apparel") || textLower.includes("shirt") || textLower.includes("jeans") || textLower.includes("ethnic")) {
      productCategory = "clothing";
      productName = textLower.includes("kurti") ? "Kurti" : "Apparel Item";
    } else if (textLower.includes("notebook")) {
      productCategory = "notebooks";
      productName = quantity > 1 ? `Notebook Set (Pack of ${quantity})` : "Notebook Set";
    } else if (textLower.includes("monitor") || textLower.includes("screen") || textLower.includes("display")) {
      productCategory = "monitor";
      productName = "4K UHD Desktop Monitor";
    } else if (textLower.includes("laptop") || textLower.includes("macbook") || textLower.includes("computer")) {
      productCategory = "laptop";
      productName = "Engineering Laptop";
    } else if (textLower.includes("running shoes") || textLower.includes("shoes") || textLower.includes("sneakers")) {
      productCategory = "running shoes";
      productName = "Nike Air Pegasus Running Shoes";
    } else if (textLower.includes("flight") || textLower.includes("ticket") || textLower.includes("travel")) {
      productCategory = "travel";
      productName = "Round-Trip Flight Ticket";
    } else if (textLower.includes("stationery") || textLower.includes("office supplies")) {
      productCategory = "office supplies";
      productName = "Office Stationery & Supplies";
    } else if (textLower.includes("pass") || textLower.includes("streaming")) {
      productCategory = "streaming pass";
      productName = "Streaming Service Pass";
    } else if (textLower.includes("coffee") || textLower.includes("groceries") || textLower.includes("food")) {
      productCategory = "groceries";
      productName = "Pantry Groceries";
    } else {
      // Dynamic fallback extraction
      productCategory = category;
      productName = `${category.toUpperCase()} Candidate Item`;
    }

    // 7. Extract Allowed/Blocked Merchants
    const allowedMerchants: string[] = [];
    const blockedMerchants: string[] = [];

    if (textLower.includes("approved store")) allowedMerchants.push("Approved Store");
    else if (textLower.includes("approved vendor") || textLower.includes("approved merchant")) allowedMerchants.push("Approved Vendor");
    else if (textLower.includes("verified supplier") || textLower.includes("verified store")) allowedMerchants.push("Verified Store");

    if (textLower.includes("nike")) allowedMerchants.push("Nike India");
    if (textLower.includes("amazon")) allowedMerchants.push("Amazon");
    if (textLower.includes("flipkart")) allowedMerchants.push("Flipkart");
    if (textLower.includes("myntra")) allowedMerchants.push("Myntra");
    if (textLower.includes("ajio")) allowedMerchants.push("Ajio");
    if (textLower.includes("blinkit")) allowedMerchants.push("Blinkit");

    if (allowedMerchants.length === 0) {
      allowedMerchants.push(textLower.includes("store") ? "Approved Store" : "Approved Vendor");
    }

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

    // 8. Explicit Prohibitions
    const prohibitions: string[] = [];
    if (textLower.includes("don't buy extended warranty") || textLower.includes("no warranty") || textLower.includes("without warranty") || textLower.includes("don't buy extended warranties")) {
      prohibitions.push("No extended warranty purchase");
    }

    // 9. Permissions Matrix
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
        maxAmount,
        currency,
        productCategory,
        allowedMerchants: allowedMerchants.length > 0 ? allowedMerchants : undefined,
        blockedMerchants: blockedMerchants.length > 0 ? blockedMerchants : undefined,
        quantity,
        requiresApproval,
      },
      permissions,
      mode: "deterministic_fallback",
      confidenceScore: null,
      compiler: "rules",
      interpretation: {
        budget: spendingBoundaryText || `Maximum ${currencySym}${maxAmount.toLocaleString()}`,
        category: productCategory ? productCategory.toUpperCase() : category.toUpperCase(),
        approval: requiresApproval ? "Mandatory Confirmation Required" : "Auto-Authorize Allowed",
        permissions: `Purchase: ${permissions.canPurchase ? "YES" : "NO"} | Subscribe: ${permissions.canSubscribe ? "YES" : "NO"}`,
        productName,
        quantity,
        merchant: allowedMerchants[0] || "Approved Store",
        prohibitions: prohibitions.length > 0 ? prohibitions.join(", ") : undefined,
      },
      warnings: [],
    };
  }
}

export const ruleBasedCompiler = new RuleBasedCompilerProvider();
