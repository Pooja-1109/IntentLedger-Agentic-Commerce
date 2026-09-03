import { v4 as uuidv4 } from "uuid";
import {
  Intent,
  AgentProposal,
  CommerceCandidate,
  AvailabilityResult,
  CandidateMatchTier,
} from "../types";

/**
 * Deterministic Retail Price Formatter
 * Snaps calculated raw price estimates to realistic e-commerce retail price endings
 * (e.g. ₹1,299, ₹1,449, ₹1,699, ₹3,499, ₹7,999, etc.)
 */
function snapToRetailEnding(amount: number, isDrift: boolean): number {
  if (amount <= 100) {
    return Math.max(10, Math.round(amount / 5) * 5);
  }
  if (amount <= 500) {
    // Snap to endings like 49, 99, 50
    const base = Math.floor(amount / 50) * 50;
    return isDrift ? base + 49 : Math.max(49, base - 1 > 0 ? base - 1 : base);
  }
  if (amount <= 2000) {
    // Snap to 49, 99 (e.g. 1299, 1449, 1699)
    const base = Math.floor(amount / 50) * 50;
    const candidate = base - 1; // e.g. 1299, 1449, 1649, 1699
    return candidate > 0 ? candidate : amount;
  }
  if (amount <= 10000) {
    // Snap to 499 or 999 (e.g. 3499, 7999)
    const base = Math.floor(amount / 100) * 100;
    return base - 1 > 0 ? base - 1 : amount;
  }
  // Larger enterprise/electronics (e.g. 18500, 23999, 34999)
  const base = Math.floor(amount / 500) * 500;
  return base - 1 > 0 ? base - 1 : amount;
}

export class AvailabilityService {
  /**
   * Discovers realistic candidate commerce products matching the user's intent.
   * Considers category, requested item, budget, quantity, and merchant constraints.
   */
  getCandidatesForIntent(intent: Intent): AvailabilityResult {
    const rawText = intent.rawText.toLowerCase();
    const maxBudget = intent.constraints.maxAmount || 5000;
    const currency = intent.constraints.currency || "INR";
    const quantity = Math.max(1, intent.constraints.quantity || 1);
    const category = intent.constraints.productCategory || intent.category || "shopping";

    const allowedMerchant =
      intent.constraints.allowedMerchants && intent.constraints.allowedMerchants.length > 0
        ? intent.constraints.allowedMerchants[0]
        : null;

    let productRequested = "Procurement Item";
    let candidates: CommerceCandidate[] = [];

    // =========================================================================
    // 1. CLOTHING / APPAREL / KURTI / CORD SET
    // =========================================================================
    if (
      rawText.includes("cord set") ||
      rawText.includes("kurti") ||
      rawText.includes("dress") ||
      rawText.includes("saree") ||
      rawText.includes("clothing") ||
      rawText.includes("apparel") ||
      rawText.includes("shirt") ||
      rawText.includes("jeans") ||
      category === "clothing"
    ) {
      const isCordSet = rawText.includes("cord set") || rawText.includes("kurti");
      productRequested = isCordSet ? "Cord Set Kurti" : "Apparel Item";
      const merchant = allowedMerchant || (rawText.includes("myntra") ? "Myntra" : rawText.includes("ajio") ? "Ajio" : "Approved Fashion Store");

      // Calculate realistic candidate tiers based on budget
      let priceValue = 1299;
      let priceTarget = 1449;
      let priceDrift = 1699;

      if (maxBudget !== 1500) {
        priceValue = snapToRetailEnding(Math.round(maxBudget * 0.86), false);
        priceTarget = snapToRetailEnding(Math.round(maxBudget * 0.96), false);
        priceDrift = snapToRetailEnding(
          maxBudget <= 1000 ? maxBudget + 250 : Math.round(maxBudget * 1.15),
          true
        );
      }

      candidates = [
        {
          id: "cand_fashion_value",
          name: isCordSet ? "Daily Cotton Cord Set Kurti" : "Casual Cotton Daily Wear",
          category: "clothing",
          merchant,
          unitPrice: Math.round(priceValue / quantity),
          quantity,
          totalPrice: priceValue,
          currency,
          matchTier: "within_budget",
          description: `100% pure breathable cotton ${productRequested} with tailored fit. Meets user spending authority.`,
        },
        {
          id: "cand_fashion_target",
          name: isCordSet ? "Embroidered Festive Cord Set Kurti" : "Festive Embroidered Ensemble",
          category: "clothing",
          merchant,
          unitPrice: Math.round(priceTarget / quantity),
          quantity,
          totalPrice: priceTarget,
          currency,
          matchTier: "exact_budget",
          description: `Intricate handcrafted embroidery with contemporary silhouette. Fits right under ₹${maxBudget.toLocaleString()} limit.`,
        },
        {
          id: "cand_fashion_drift",
          name: isCordSet ? "Designer Silk Blend Kurti Set (Over-Budget)" : "Designer Luxury Silk Ensemble",
          category: "clothing",
          merchant,
          unitPrice: Math.round(priceDrift / quantity),
          quantity,
          totalPrice: priceDrift,
          currency,
          matchTier: "budget_drift",
          description: `Premium Mulberry silk blend with designer zardozi work. Exceeds user limit by +₹${(priceDrift - maxBudget).toLocaleString()}.`,
        },
      ];
    }
    // =========================================================================
    // 2. FOOTWEAR / SHOES / RUNNING
    // =========================================================================
    else if (
      rawText.includes("running shoes") ||
      rawText.includes("shoe") ||
      rawText.includes("sneaker") ||
      category === "running shoes" ||
      category === "footwear"
    ) {
      productRequested = "Running Shoes";
      const merchant = allowedMerchant || (rawText.includes("nike") ? "Nike India" : "Approved Sports Store");

      let priceValue = 2999;
      let priceTarget = 3499;
      let priceDrift = 7999;

      if (maxBudget !== 4000) {
        priceValue = snapToRetailEnding(Math.round(maxBudget * 0.75), false);
        priceTarget = snapToRetailEnding(Math.round(maxBudget * 0.88), false);
        priceDrift = snapToRetailEnding(Math.round(maxBudget * 1.8), true);
      }

      candidates = [
        {
          id: "cand_footwear_value",
          name: "Nike Revolution Road Running Shoes",
          category: "running shoes",
          merchant,
          unitPrice: Math.round(priceValue / quantity),
          quantity,
          totalPrice: priceValue,
          currency,
          matchTier: "within_budget",
          description: "Comfortable cushioned lightweight road running shoes.",
        },
        {
          id: "cand_footwear_target",
          name: "Nike Air Pegasus Running Shoes",
          category: "running shoes",
          merchant,
          unitPrice: Math.round(priceTarget / quantity),
          quantity,
          totalPrice: priceTarget,
          currency,
          matchTier: "exact_budget",
          description: `Responsive Zoom Air cushioning and engineered mesh upper. Safe inside ₹${maxBudget.toLocaleString()} budget.`,
        },
        {
          id: "cand_footwear_drift",
          name: "Nike Vaporfly Elite Pro Shoes (Budget Drift)",
          category: "running shoes",
          merchant,
          unitPrice: Math.round(priceDrift / quantity),
          quantity,
          totalPrice: priceDrift,
          currency,
          matchTier: "budget_drift",
          description: `World-class carbon-fiber plate marathon racing shoe. Exceeds user limit by +₹${(priceDrift - maxBudget).toLocaleString()}.`,
        },
      ];
    }
    // =========================================================================
    // 3. ELECTRONICS / MONITORS / LAPTOPS
    // =========================================================================
    else if (
      rawText.includes("monitor") ||
      rawText.includes("screen") ||
      rawText.includes("laptop") ||
      rawText.includes("macbook") ||
      rawText.includes("display") ||
      category === "monitor" ||
      category === "laptop" ||
      category === "electronics"
    ) {
      const isLaptop = rawText.includes("laptop") || rawText.includes("macbook") || category === "laptop";
      productRequested = isLaptop ? "Engineering Laptop" : "Desktop Monitor";
      const merchant = allowedMerchant || (rawText.includes("croma") ? "Croma" : "Approved Electronics Vendor");

      let priceValue = isLaptop ? 35000 : 18500;
      let priceTarget = isLaptop ? 39499 : 23999;
      let priceDrift = isLaptop ? 58999 : 32999;

      if (maxBudget !== 25000 && maxBudget !== 40000 && maxBudget !== 50000) {
        priceValue = snapToRetailEnding(Math.round(maxBudget * 0.78), false);
        priceTarget = snapToRetailEnding(Math.round(maxBudget * 0.95), false);
        priceDrift = snapToRetailEnding(Math.round(maxBudget * 1.3), true);
      }

      candidates = [
        {
          id: "cand_elec_value",
          name: isLaptop ? "Core i5 16GB Engineering Laptop" : "Dell 24-Inch IPS FHD Monitor",
          category: isLaptop ? "laptop" : "monitor",
          merchant,
          unitPrice: Math.round(priceValue / quantity),
          quantity,
          totalPrice: priceValue,
          currency,
          matchTier: "within_budget",
          description: "Solid high-performance configuration within authorized budget.",
        },
        {
          id: "cand_elec_target",
          name: isLaptop ? "Ryzen 7 32GB Engineering Laptop" : "Dell 27-Inch 4K UHD Professional Display",
          category: isLaptop ? "laptop" : "monitor",
          merchant,
          unitPrice: Math.round(priceTarget / quantity),
          quantity,
          totalPrice: priceTarget,
          currency,
          matchTier: "exact_budget",
          description: `Optimal specification matching business requirement inside ₹${maxBudget.toLocaleString()} limit.`,
        },
        {
          id: "cand_elec_drift",
          name: isLaptop ? "MacBook Pro M3 Max (Flagship Drift)" : "Dell UltraSharp 32-Inch 8K Premier Monitor",
          category: isLaptop ? "laptop" : "monitor",
          merchant,
          unitPrice: Math.round(priceDrift / quantity),
          quantity,
          totalPrice: priceDrift,
          currency,
          matchTier: "budget_drift",
          description: `Top-tier workstation flagship. Exceeds user limit by +₹${(priceDrift - maxBudget).toLocaleString()}.`,
        },
      ];
    }
    // =========================================================================
    // 4. STATIONERY & OFFICE SUPPLIES (Multi-quantity aware)
    // =========================================================================
    else if (
      rawText.includes("notebook") ||
      rawText.includes("stationery") ||
      rawText.includes("pen") ||
      rawText.includes("office") ||
      category === "notebooks" ||
      category === "office supplies"
    ) {
      const isNotebook = rawText.includes("notebook") || category === "notebooks";
      productRequested = isNotebook ? (quantity > 1 ? `Notebook Set (Pack of ${quantity})` : "Notebook Set") : "Office Stationery";
      const merchant = allowedMerchant || "Approved Store";

      let priceValue: number;
      let priceTarget: number;
      let priceDrift: number;

      if (maxBudget === 600 && quantity === 6) {
        priceValue = 510; // 85 * 6
        priceTarget = 570; // 95 * 6
        priceDrift = 810; // 135 * 6
      } else if (maxBudget === 1000) {
        priceValue = 649;
        priceTarget = 899;
        priceDrift = 1499;
      } else {
        priceValue = snapToRetailEnding(Math.round(maxBudget * 0.8), false);
        priceTarget = snapToRetailEnding(Math.round(maxBudget * 0.95), false);
        priceDrift = snapToRetailEnding(
          maxBudget <= 1000 ? maxBudget + 250 : Math.round(maxBudget * 1.3),
          true
        );
      }

      candidates = [
        {
          id: "cand_stat_value",
          name: isNotebook
            ? `Classmate Softbound Ruled Notebooks (${quantity} Pack)`
            : "Essential Desk Stationery Bundle",
          category: "office supplies",
          merchant,
          unitPrice: Math.round(priceValue / quantity),
          quantity,
          totalPrice: priceValue,
          currency,
          matchTier: "within_budget",
          description: `High-quality smooth GSM paper for daily office use. Total: ₹${priceValue.toLocaleString()} (₹${Math.round(priceValue / quantity)}/unit).`,
        },
        {
          id: "cand_stat_target",
          name: isNotebook
            ? `Executive Hardbound Thread-Stitched Notebooks (${quantity} Pack)`
            : "Premium Mesh Desk Organizer & Pen Set",
          category: "office supplies",
          merchant,
          unitPrice: Math.round(priceTarget / quantity),
          quantity,
          totalPrice: priceTarget,
          currency,
          matchTier: "exact_budget",
          description: `Archival acid-free paper with durable binding. Total: ₹${priceTarget.toLocaleString()} (₹${Math.round(priceTarget / quantity)}/unit).`,
        },
        {
          id: "cand_stat_drift",
          name: isNotebook
            ? `Imported Leatherette Journal Set (${quantity} Pack - Drift)`
            : "Luxury Brass Desk Collection (Over-Budget)",
          category: "office supplies",
          merchant,
          unitPrice: Math.round(priceDrift / quantity),
          quantity,
          totalPrice: priceDrift,
          currency,
          matchTier: "budget_drift",
          description: `Handcrafted Italian leatherette notebooks. Exceeds limit by +₹${(priceDrift - maxBudget).toLocaleString()}.`,
        },
      ];
    }
    // =========================================================================
    // 5. GROCERIES / PANTRY / FOOD
    // =========================================================================
    else if (
      rawText.includes("grocery") ||
      rawText.includes("groceries") ||
      rawText.includes("coffee") ||
      rawText.includes("food") ||
      category === "groceries"
    ) {
      productRequested = "Pantry Groceries";
      const merchant = allowedMerchant || (rawText.includes("blinkit") ? "Blinkit" : "Approved Grocery Partner");

      let priceValue = snapToRetailEnding(Math.round(maxBudget * 0.75), false);
      let priceTarget = snapToRetailEnding(Math.round(maxBudget * 0.92), false);
      let priceDrift = snapToRetailEnding(
        maxBudget <= 1000 ? maxBudget + 300 : Math.round(maxBudget * 1.35),
        true
      );

      candidates = [
        {
          id: "cand_groc_value",
          name: "Organic Pantry Essentials Bundle",
          category: "groceries",
          merchant,
          unitPrice: Math.round(priceValue / quantity),
          quantity,
          totalPrice: priceValue,
          currency,
          matchTier: "within_budget",
          description: "Fresh daily grocery essentials sourced directly from verified organic farms.",
        },
        {
          id: "cand_groc_target",
          name: "Artisanal Single-Origin Coffee & Breakfast Combo",
          category: "groceries",
          merchant,
          unitPrice: Math.round(priceTarget / quantity),
          quantity,
          totalPrice: priceTarget,
          currency,
          matchTier: "exact_budget",
          description: `Specialty medium roast beans and breakfast staples within ₹${maxBudget.toLocaleString()} limit.`,
        },
        {
          id: "cand_groc_drift",
          name: "Gourmet Imported Pantry Gift Hamper (Budget Drift)",
          category: "groceries",
          merchant,
          unitPrice: Math.round(priceDrift / quantity),
          quantity,
          totalPrice: priceDrift,
          currency,
          matchTier: "budget_drift",
          description: `Imported artisanal cheeses, oils, and truffles. Exceeds limit by +₹${(priceDrift - maxBudget).toLocaleString()}.`,
        },
      ];
    }
    // =========================================================================
    // 6. GENERAL COMMERCE FALLBACK (Completely Dynamic to any user input)
    // =========================================================================
    else {
      productRequested = `${category.charAt(0).toUpperCase() + category.slice(1)} Item`;
      const merchant = allowedMerchant || "Approved Vendor";

      const priceValue = snapToRetailEnding(Math.round(maxBudget * 0.85), false);
      const priceTarget = snapToRetailEnding(Math.round(maxBudget * 0.96), false);
      const priceDrift = snapToRetailEnding(
        maxBudget <= 1000 ? maxBudget + 200 : Math.round(maxBudget * 1.25),
        true
      );

      candidates = [
        {
          id: "cand_gen_value",
          name: `Standard Quality ${productRequested}`,
          category,
          merchant,
          unitPrice: Math.round(priceValue / quantity),
          quantity,
          totalPrice: priceValue,
          currency,
          matchTier: "within_budget",
          description: `Reliable certified candidate within the ₹${maxBudget.toLocaleString()} boundary.`,
        },
        {
          id: "cand_gen_target",
          name: `Optimal Grade ${productRequested}`,
          category,
          merchant,
          unitPrice: Math.round(priceTarget / quantity),
          quantity,
          totalPrice: priceTarget,
          currency,
          matchTier: "exact_budget",
          description: `Highest quality available candidate under the ₹${maxBudget.toLocaleString()} limit.`,
        },
        {
          id: "cand_gen_drift",
          name: `Flagship Luxury ${productRequested} (Over-Budget)`,
          category,
          merchant,
          unitPrice: Math.round(priceDrift / quantity),
          quantity,
          totalPrice: priceDrift,
          currency,
          matchTier: "budget_drift",
          description: `Over-budget option exceeding limit by +₹${(priceDrift - maxBudget).toLocaleString()}.`,
        },
      ];
    }

    // Determine recommended candidate (Default to value/target candidate within budget)
    const recommendedCandidate =
      candidates.find((c) => c.matchTier === "within_budget") || candidates[0];

    return {
      intentId: intent.id,
      productRequested,
      category,
      userBudget: maxBudget,
      currency,
      quantity,
      candidates,
      recommendedCandidate,
    };
  }

  /**
   * Generates a concrete AI Agent Proposal from available commerce candidate options
   */
  generateProposalForIntent(intent: Intent, candidateId?: string): AgentProposal {
    const availability = this.getCandidatesForIntent(intent);
    const candidate = candidateId
      ? availability.candidates.find((c) => c.id === candidateId) || availability.recommendedCandidate
      : availability.recommendedCandidate;

    const now = new Date().toISOString();

    return {
      id: `prop_avail_${uuidv4().substring(0, 8)}`,
      intentId: intent.id,
      agentId: "agent_gemini_shopper",
      agentName: "Autonomous Commerce Agent",
      action: candidate.isSubscription ? "subscribe" : "purchase",
      product: candidate.name,
      merchant: candidate.merchant,
      amount: candidate.totalPrice,
      currency: candidate.currency,
      quantity: candidate.quantity,
      isSubscription: candidate.isSubscription || false,
      subscriptionFrequency: candidate.subscriptionFrequency,
      proposedAt: now,
      metadata: {
        candidateId: candidate.id,
        matchTier: candidate.matchTier,
        unitPrice: candidate.unitPrice,
        description: candidate.description,
      },
    };
  }

  /**
   * Finds a specific candidate for an intent
   */
  getCandidateById(intent: Intent, candidateId: string): CommerceCandidate | null {
    const availability = this.getCandidatesForIntent(intent);
    return availability.candidates.find((c) => c.id === candidateId) || null;
  }
}

export const availabilityService = new AvailabilityService();
