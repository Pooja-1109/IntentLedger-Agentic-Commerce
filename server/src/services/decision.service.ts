import { v4 as uuidv4 } from "uuid";
import {
  Intent,
  AgentProposal,
  DecisionResult,
  DecisionType,
  PolicyCheck,
  PolicyViolation,
} from "../types";
import { driftService } from "./drift.service";

export class DecisionService {
  /**
   * Evaluates an AI Agent Proposal against a User Intent deterministically
   */
  evaluateProposal(intent: Intent, proposal: AgentProposal): DecisionResult {
    const checks: PolicyCheck[] = [];
    const violations: PolicyViolation[] = [];
    const warnings: string[] = [];

    const currencySymbol = proposal.currency === "INR" ? "₹" : proposal.currency === "USD" ? "$" : `${proposal.currency} `;

    // =========================================================================
    // CHECK 1: Budget Constraint
    // =========================================================================
    if (intent.constraints.maxAmount !== undefined) {
      const maxBudget = intent.constraints.maxAmount;
      const proposedAmt = proposal.amount;

      if (proposedAmt > maxBudget) {
        const deviation = proposedAmt - maxBudget;
        const explanation = `Agent proposed ${currencySymbol}${proposedAmt.toLocaleString()}, exceeding the user's ${currencySymbol}${maxBudget.toLocaleString()} limit by ${currencySymbol}${deviation.toLocaleString()}.`;

        checks.push({
          id: "chk_budget_limit",
          name: "Budget Cap Policy",
          status: "FAIL",
          passed: false,
          severity: "critical",
          message: explanation,
          expectedValue: `${currencySymbol}${maxBudget.toLocaleString()}`,
          actualValue: `${currencySymbol}${proposedAmt.toLocaleString()}`,
        });

        violations.push({
          code: "PROPOSED_AMOUNT_EXCEEDS_MAXIMUM",
          field: "amount",
          expected: maxBudget,
          actual: proposedAmt,
          deviation,
          explanation,
        });
      } else {
        checks.push({
          id: "chk_budget_limit",
          name: "Budget Cap Policy",
          status: "PASS",
          passed: true,
          severity: "info",
          message: `Proposed amount ${currencySymbol}${proposedAmt.toLocaleString()} is within user's max budget of ${currencySymbol}${maxBudget.toLocaleString()}.`,
          expectedValue: `<= ${currencySymbol}${maxBudget.toLocaleString()}`,
          actualValue: `${currencySymbol}${proposedAmt.toLocaleString()}`,
        });
      }
    }

    // =========================================================================
    // CHECK 2: Merchant Restrictions (Blocked & Whitelist)
    // =========================================================================
    const normProposedMerchant = proposal.merchant.trim().toLowerCase();

    // 2a. Blocked Merchants
    if (intent.constraints.blockedMerchants && intent.constraints.blockedMerchants.length > 0) {
      const isBlocked = intent.constraints.blockedMerchants.some(
        (bm) => normProposedMerchant.includes(bm.trim().toLowerCase()) || bm.trim().toLowerCase().includes(normProposedMerchant)
      );

      if (isBlocked) {
        const explanation = `Merchant '${proposal.merchant}' is in user's explicitly blocked merchants list.`;
        checks.push({
          id: "chk_blocked_merchant",
          name: "Merchant Blacklist Policy",
          status: "FAIL",
          passed: false,
          severity: "critical",
          message: explanation,
          expectedValue: "Non-blocked merchant",
          actualValue: proposal.merchant,
        });

        violations.push({
          code: "MERCHANT_EXPLICITLY_BLOCKED",
          field: "merchant",
          expected: "Not in blacklist",
          actual: proposal.merchant,
          explanation,
        });
      } else {
        checks.push({
          id: "chk_blocked_merchant",
          name: "Merchant Blacklist Policy",
          status: "PASS",
          passed: true,
          severity: "info",
          message: `Merchant '${proposal.merchant}' is not on blacklist.`,
        });
      }
    }

    // 2b. Allowed Merchants Whitelist
    if (intent.constraints.allowedMerchants && intent.constraints.allowedMerchants.length > 0) {
      const isAllowed = intent.constraints.allowedMerchants.some(
        (am) => normProposedMerchant.includes(am.trim().toLowerCase()) || am.trim().toLowerCase().includes(normProposedMerchant)
      );

      if (!isAllowed) {
        const explanation = `Merchant '${proposal.merchant}' is not in user's authorized merchant whitelist: [${intent.constraints.allowedMerchants.join(", ")}].`;
        checks.push({
          id: "chk_allowed_merchant",
          name: "Merchant Whitelist Policy",
          status: "FAIL",
          passed: false,
          severity: "critical",
          message: explanation,
          expectedValue: intent.constraints.allowedMerchants.join(", "),
          actualValue: proposal.merchant,
        });

        violations.push({
          code: "MERCHANT_NOT_ALLOWED",
          field: "merchant",
          expected: intent.constraints.allowedMerchants,
          actual: proposal.merchant,
          explanation,
        });
      } else {
        checks.push({
          id: "chk_allowed_merchant",
          name: "Merchant Whitelist Policy",
          status: "PASS",
          passed: true,
          severity: "info",
          message: `Merchant '${proposal.merchant}' is approved on whitelist.`,
        });
      }
    }

    // =========================================================================
    // CHECK 3: Action & Subscription Permissions
    // =========================================================================
    if (proposal.action === "subscribe" || proposal.isSubscription) {
      if (!intent.permissions.canSubscribe) {
        const explanation = "Agent attempted to create a recurring subscription, but the user's intent forbids subscriptions.";
        checks.push({
          id: "chk_subscription_permission",
          name: "Subscription Permission Policy",
          status: "FAIL",
          passed: false,
          severity: "critical",
          message: explanation,
          expectedValue: "canSubscribe = false",
          actualValue: "Action = subscribe",
        });

        violations.push({
          code: "SUBSCRIPTION_NOT_PERMITTED",
          field: "action",
          expected: "One-time purchase",
          actual: "Subscription",
          explanation,
        });
      } else {
        checks.push({
          id: "chk_subscription_permission",
          name: "Subscription Permission Policy",
          status: "PASS",
          passed: true,
          severity: "info",
          message: "Subscription authorized by user intent.",
        });
      }
    }

    if (proposal.action === "purchase") {
      if (!intent.permissions.canPurchase) {
        const explanation = "Purchase action is disabled for this intent policy.";
        checks.push({
          id: "chk_purchase_permission",
          name: "Purchase Permission Policy",
          status: "FAIL",
          passed: false,
          severity: "critical",
          message: explanation,
          expectedValue: "canPurchase = true",
          actualValue: "canPurchase = false",
        });

        violations.push({
          code: "PURCHASE_NOT_PERMITTED",
          field: "action",
          expected: "canPurchase = true",
          actual: "Purchase disallowed",
          explanation,
        });
      } else {
        checks.push({
          id: "chk_purchase_permission",
          name: "Purchase Permission Policy",
          status: "PASS",
          passed: true,
          severity: "info",
          message: "Purchase capability authorized.",
        });
      }
    }

    if (proposal.action === "transfer") {
      if (!intent.permissions.canTransfer) {
        const explanation = "Transfer action is disabled for this intent policy.";
        checks.push({
          id: "chk_transfer_permission",
          name: "Transfer Permission Policy",
          status: "FAIL",
          passed: false,
          severity: "critical",
          message: explanation,
          expectedValue: "canTransfer = true",
          actualValue: "canTransfer = false",
        });

        violations.push({
          code: "TRANSFER_NOT_PERMITTED",
          field: "action",
          expected: "canTransfer = true",
          actual: "Transfer disallowed",
          explanation,
        });
      } else {
        checks.push({
          id: "chk_transfer_permission",
          name: "Transfer Permission Policy",
          status: "PASS",
          passed: true,
          severity: "info",
          message: "Fund transfer authorized.",
        });
      }
    }

    // =========================================================================
    // CHECK 4: Quantity Limit
    // =========================================================================
    if (intent.constraints.quantity !== undefined && proposal.quantity > intent.constraints.quantity) {
      const explanation = `Agent proposed quantity of ${proposal.quantity}, exceeding maximum allowed quantity of ${intent.constraints.quantity}.`;
      checks.push({
        id: "chk_quantity_limit",
        name: "Quantity Limit Policy",
        status: "FAIL",
        passed: false,
        severity: "critical",
        message: explanation,
        expectedValue: intent.constraints.quantity,
        actualValue: proposal.quantity,
      });

      violations.push({
        code: "QUANTITY_EXCEEDED",
        field: "quantity",
        expected: intent.constraints.quantity,
        actual: proposal.quantity,
        deviation: proposal.quantity - intent.constraints.quantity,
        explanation,
      });
    } else if (intent.constraints.quantity !== undefined) {
      checks.push({
        id: "chk_quantity_limit",
        name: "Quantity Limit Policy",
        status: "PASS",
        passed: true,
        severity: "info",
        message: `Quantity ${proposal.quantity} is within limit of ${intent.constraints.quantity}.`,
      });
    }

    // =========================================================================
    // CHECK 5: Currency Alignment
    // =========================================================================
    if (intent.constraints.currency && proposal.currency && intent.constraints.currency.toUpperCase() !== proposal.currency.toUpperCase()) {
      const explanation = `Currency mismatch: proposal is in ${proposal.currency.toUpperCase()}, but intent is restricted to ${intent.constraints.currency.toUpperCase()}.`;
      checks.push({
        id: "chk_currency_alignment",
        name: "Currency Alignment Policy",
        status: "FAIL",
        passed: false,
        severity: "warning",
        message: explanation,
        expectedValue: intent.constraints.currency.toUpperCase(),
        actualValue: proposal.currency.toUpperCase(),
      });

      violations.push({
        code: "CURRENCY_MISMATCH",
        field: "currency",
        expected: intent.constraints.currency.toUpperCase(),
        actual: proposal.currency.toUpperCase(),
        explanation,
      });
    }

    // =========================================================================
    // CHECK 6: Approval Mandate Check
    // =========================================================================
    const requiresApproval = intent.constraints.requiresApproval === true;
    if (requiresApproval) {
      const approvalMsg = "Purchase meets price constraints, but user policy mandates explicit approval before payment.";
      warnings.push(approvalMsg);

      checks.push({
        id: "chk_approval_mandate",
        name: "Human Approval Mandate",
        status: "WARN",
        passed: true,
        severity: "warning",
        message: approvalMsg,
        expectedValue: "Approval Required",
        actualValue: "Requires Human Review",
      });
    } else {
      checks.push({
        id: "chk_approval_mandate",
        name: "Human Approval Mandate",
        status: "PASS",
        passed: true,
        severity: "info",
        message: "Policy authorizes automated payment execution without human prompt.",
        expectedValue: "Auto-Authorize",
        actualValue: "Auto-Authorize",
      });
    }

    // =========================================================================
    // RUN INTENT DRIFT ANALYSIS
    // =========================================================================
    const driftReport = driftService.detectDrift(intent, proposal);

    // =========================================================================
    // RISK SCORE CALCULATION (Deterministic 0 - 100)
    // =========================================================================
    let riskScore = 5; // Base nominal risk

    violations.forEach((v) => {
      if (v.code === "PROPOSED_AMOUNT_EXCEEDS_MAXIMUM") {
        if (v.deviation && intent.constraints.maxAmount) {
          const pct = (v.deviation / intent.constraints.maxAmount) * 100;
          riskScore += pct > 50 ? 55 : 35;
        } else {
          riskScore += 35;
        }
      } else if (v.code === "SUBSCRIPTION_NOT_PERMITTED") {
        riskScore += 45;
      } else if (v.code === "MERCHANT_EXPLICITLY_BLOCKED") {
        riskScore += 40;
      } else if (v.code === "MERCHANT_NOT_ALLOWED") {
        riskScore += 30;
      } else if (v.code === "PURCHASE_NOT_PERMITTED" || v.code === "TRANSFER_NOT_PERMITTED") {
        riskScore += 40;
      } else if (v.code === "QUANTITY_EXCEEDED") {
        riskScore += 25;
      } else if (v.code === "CURRENCY_MISMATCH") {
        riskScore += 20;
      }
    });

    if (requiresApproval && violations.length === 0) {
      riskScore += 15; // Moderate risk requiring human review
    }

    riskScore = Math.min(100, Math.max(0, riskScore));

    // =========================================================================
    // FINAL DETERMINISTIC PRIORITY DECISION
    // Priority: BLOCK > ASK_APPROVAL > ALLOW
    // =========================================================================
    let decision: DecisionType = "ALLOW";
    let explanation = "Agent proposal is fully compliant with all intent constraints and permissions. Payment execution authorized.";

    if (violations.length > 0) {
      decision = "BLOCK";
      explanation = `Action blocked due to ${violations.length} critical policy violation(s): ${violations.map((v) => v.explanation).join(" ")}`;
    } else if (requiresApproval) {
      decision = "ASK_APPROVAL";
      explanation = `Proposal is within all constraint limits, but user policy requires explicit manual approval prior to payment execution.`;
    }

    const result: DecisionResult = {
      id: `dec_${uuidv4().substring(0, 8)}`,
      intentId: intent.id,
      proposalId: proposal.id,
      proposal,
      intent,
      decision,
      riskScore,
      violations,
      warnings,
      explanation,
      checks,
      driftReport,
      evaluatedAt: new Date().toISOString(),
      requiresUserApproval: decision === "ASK_APPROVAL",
    };

    return result;
  }
}

export const decisionService = new DecisionService();
