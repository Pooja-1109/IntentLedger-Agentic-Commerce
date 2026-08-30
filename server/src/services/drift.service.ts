import { Intent, AgentProposal, IntentDriftReport, IntentDriftItem } from "../types";

export class DriftService {
  /**
   * Detects intent drift by comparing the original intent against the proposed agent action
   */
  detectDrift(intent: Intent, proposal: AgentProposal): IntentDriftReport {
    const driftItems: IntentDriftItem[] = [];
    let maxSeverityScore = 0; // 0: None, 1: Low, 2: Medium, 3: High, 4: Critical

    const currencySymbol = proposal.currency === "INR" ? "₹" : proposal.currency === "USD" ? "$" : `${proposal.currency} `;

    // 1. Budget / Amount Drift Check
    if (intent.constraints.maxAmount !== undefined) {
      const maxBudget = intent.constraints.maxAmount;
      const proposedAmt = proposal.amount;

      if (proposedAmt > maxBudget) {
        const diff = proposedAmt - maxBudget;
        driftItems.push({
          field: "amount",
          label: "Budget Limit",
          originalIntent: `${currencySymbol}${maxBudget.toLocaleString()}`,
          proposedAction: `${currencySymbol}${proposedAmt.toLocaleString()}`,
          deviation: `+${currencySymbol}${diff.toLocaleString()}`,
          type: "INCREASE",
          isViolation: true,
        });

        // Exceeding budget is High to Critical depending on percentage
        const pctOver = (diff / maxBudget) * 100;
        if (pctOver > 50) {
          maxSeverityScore = Math.max(maxSeverityScore, 4); // CRITICAL
        } else {
          maxSeverityScore = Math.max(maxSeverityScore, 3); // HIGH
        }
      } else if (proposedAmt < maxBudget) {
        const diff = maxBudget - proposedAmt;
        driftItems.push({
          field: "amount",
          label: "Budget Limit",
          originalIntent: `${currencySymbol}${maxBudget.toLocaleString()} max`,
          proposedAction: `${currencySymbol}${proposedAmt.toLocaleString()}`,
          deviation: `-${currencySymbol}${diff.toLocaleString()} (within budget)`,
          type: "DECREASE",
          isViolation: false,
        });
      }
    }

    // 2. Merchant Whitelist / Blacklist Drift
    const normProposedMerchant = proposal.merchant.trim().toLowerCase();

    // Check Blocked
    if (intent.constraints.blockedMerchants && intent.constraints.blockedMerchants.length > 0) {
      const isBlocked = intent.constraints.blockedMerchants.some(
        (bm) => normProposedMerchant.includes(bm.trim().toLowerCase()) || bm.trim().toLowerCase().includes(normProposedMerchant)
      );

      if (isBlocked) {
        driftItems.push({
          field: "merchant",
          label: "Merchant Policy",
          originalIntent: `Blocked: [${intent.constraints.blockedMerchants.join(", ")}]`,
          proposedAction: proposal.merchant,
          deviation: "Attempting purchase from explicitly blocked merchant",
          type: "UNAUTHORIZED",
          isViolation: true,
        });
        maxSeverityScore = Math.max(maxSeverityScore, 4); // CRITICAL
      }
    }

    // Check Allowed List
    if (intent.constraints.allowedMerchants && intent.constraints.allowedMerchants.length > 0) {
      const isAllowed = intent.constraints.allowedMerchants.some(
        (am) => normProposedMerchant.includes(am.trim().toLowerCase()) || am.trim().toLowerCase().includes(normProposedMerchant)
      );

      if (!isAllowed) {
        driftItems.push({
          field: "merchant",
          label: "Merchant Whitelist",
          originalIntent: `Allowed: [${intent.constraints.allowedMerchants.join(", ")}]`,
          proposedAction: proposal.merchant,
          deviation: `Merchant '${proposal.merchant}' not in authorized whitelist`,
          type: "UNAUTHORIZED",
          isViolation: true,
        });
        maxSeverityScore = Math.max(maxSeverityScore, 3); // HIGH
      }
    }

    // 3. Action & Subscription Permission Drift
    if (proposal.action === "subscribe" || proposal.isSubscription) {
      if (!intent.permissions.canSubscribe) {
        driftItems.push({
          field: "action",
          label: "Subscription Permission",
          originalIntent: "One-Time Purchase Only (No Subscriptions)",
          proposedAction: "Recurring Subscription",
          deviation: "Agent attempted recurring charge without subscription permission",
          type: "UNAUTHORIZED",
          isViolation: true,
        });
        maxSeverityScore = Math.max(maxSeverityScore, 4); // CRITICAL
      }
    }

    if (proposal.action === "purchase" && !intent.permissions.canPurchase) {
      driftItems.push({
        field: "action",
        label: "Purchase Permission",
        originalIntent: "Purchases Disabled",
        proposedAction: "Execute Purchase",
        deviation: "Purchase permission is disabled for this intent",
        type: "UNAUTHORIZED",
        isViolation: true,
      });
      maxSeverityScore = Math.max(maxSeverityScore, 4); // CRITICAL
    }

    if (proposal.action === "transfer" && !intent.permissions.canTransfer) {
      driftItems.push({
        field: "action",
        label: "Transfer Permission",
        originalIntent: "Transfers Disabled",
        proposedAction: "Wire/Send Transfer",
        deviation: "Transfer permission is disabled for this intent",
        type: "UNAUTHORIZED",
        isViolation: true,
      });
      maxSeverityScore = Math.max(maxSeverityScore, 4); // CRITICAL
    }

    // 4. Quantity Drift
    if (intent.constraints.quantity !== undefined && proposal.quantity > intent.constraints.quantity) {
      const diff = proposal.quantity - intent.constraints.quantity;
      driftItems.push({
        field: "quantity",
        label: "Item Quantity",
        originalIntent: `Max ${intent.constraints.quantity} unit(s)`,
        proposedAction: `${proposal.quantity} units`,
        deviation: `+${diff} extra unit(s) proposed`,
        type: "INCREASE",
        isViolation: true,
      });
      maxSeverityScore = Math.max(maxSeverityScore, 3); // HIGH
    }

    // 5. Currency Mismatch Drift
    if (intent.constraints.currency && proposal.currency && intent.constraints.currency.toUpperCase() !== proposal.currency.toUpperCase()) {
      driftItems.push({
        field: "currency",
        label: "Currency Type",
        originalIntent: intent.constraints.currency.toUpperCase(),
        proposedAction: proposal.currency.toUpperCase(),
        deviation: `Currency mismatch: expected ${intent.constraints.currency.toUpperCase()}, got ${proposal.currency.toUpperCase()}`,
        type: "CHANGED",
        isViolation: true,
      });
      maxSeverityScore = Math.max(maxSeverityScore, 2); // MEDIUM
    }

    // Map severity score to enum
    const severityMap: Record<number, "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"> = {
      0: "NONE",
      1: "LOW",
      2: "MEDIUM",
      3: "HIGH",
      4: "CRITICAL",
    };

    const hasViolatingDrift = driftItems.some((d) => d.isViolation);
    const severity = severityMap[maxSeverityScore] || "NONE";

    // Summary generator
    let summary = "Agent proposal aligns with original intent parameters.";
    if (hasViolatingDrift) {
      const violationFields = driftItems.filter((d) => d.isViolation).map((d) => d.label);
      summary = `Intent drift detected in: ${violationFields.join(", ")}.`;
    }

    return {
      hasDrift: hasViolatingDrift,
      severity,
      driftItems,
      summary,
    };
  }
}

export const driftService = new DriftService();
