import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { ApiResponse, AgentProposal, DecisionResult, DemoScenario } from "../types";
import { intentRepository } from "../repositories/intent.repository";
import { decisionRepository } from "../repositories/decision.repository";
import { ledgerRepository } from "../repositories/ledger.repository";
import { decisionService } from "../services/decision.service";
import { approvalService } from "../services/approval.service";
import { AppError } from "../middleware/error.middleware";

const evaluateSchema = z.object({
  intentId: z.string().min(1, "intentId is required"),
  proposal: z.object({
    id: z.string().optional(),
    agentId: z.string().optional(),
    agentName: z.string().optional(),
    product: z.string().min(1, "Product name is required"),
    merchant: z.string().min(1, "Merchant name is required"),
    amount: z.number().positive("Amount must be a positive number"),
    currency: z.string().default("INR"),
    quantity: z.number().int().positive().default(1),
    action: z.enum(["purchase", "subscribe", "transfer", "quote", "reserve"]).default("purchase"),
    isSubscription: z.boolean().optional(),
    subscriptionFrequency: z.enum(["weekly", "monthly", "yearly"]).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

export const evaluateDecisionHandler = async (
  req: Request,
  res: Response<ApiResponse<DecisionResult>>,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = evaluateSchema.parse(req.body);

    // 1. Load Intent
    const intent = await intentRepository.findById(validated.intentId);
    if (!intent) {
      throw new AppError(`Intent with ID '${validated.intentId}' not found`, 404, "INTENT_NOT_FOUND");
    }

    const proposalId = validated.proposal.id || `prop_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const fullProposal: AgentProposal = {
      id: proposalId,
      intentId: intent.id,
      agentId: validated.proposal.agentId || "agent_gemini_shopper",
      agentName: validated.proposal.agentName || "Autonomous Shopping Agent",
      product: validated.proposal.product,
      merchant: validated.proposal.merchant,
      amount: validated.proposal.amount,
      currency: validated.proposal.currency,
      quantity: validated.proposal.quantity,
      action: validated.proposal.action,
      isSubscription: validated.proposal.isSubscription || validated.proposal.action === "subscribe",
      subscriptionFrequency: validated.proposal.subscriptionFrequency,
      proposedAt: now,
      metadata: validated.proposal.metadata,
    };

    const currencySym = fullProposal.currency === "INR" ? "₹" : "$";

    // 2. Ledger: AGENT_PROPOSAL_CREATED
    await ledgerRepository.append({
      id: `evt_${uuidv4().substring(0, 8)}`,
      intentId: intent.id,
      proposalId: fullProposal.id,
      eventType: "AGENT_PROPOSAL_CREATED",
      timestamp: now,
      actor: "AI_AGENT",
      summary: `AI Agent proposed '${fullProposal.product}' from ${fullProposal.merchant} for ${currencySym}${fullProposal.amount.toLocaleString()}.`,
      metadata: {
        product: fullProposal.product,
        merchant: fullProposal.merchant,
        amount: fullProposal.amount,
        action: fullProposal.action,
      },
    });

    // 3. Ledger: POLICY_CHECK_STARTED
    await ledgerRepository.append({
      id: `evt_${uuidv4().substring(0, 8)}`,
      intentId: intent.id,
      proposalId: fullProposal.id,
      eventType: "POLICY_CHECK_STARTED",
      timestamp: new Date().toISOString(),
      actor: "INTENT_ENGINE",
      summary: `Starting deterministic policy checks against Intent boundary (${intent.id}).`,
    });

    // 4. Run Policy Decision Engine
    const decisionResult = decisionService.evaluateProposal(intent, fullProposal);

    // 5. Ledger: POLICY_CHECK_COMPLETED
    await ledgerRepository.append({
      id: `evt_${uuidv4().substring(0, 8)}`,
      intentId: intent.id,
      proposalId: fullProposal.id,
      eventType: "POLICY_CHECK_COMPLETED",
      timestamp: new Date().toISOString(),
      actor: "INTENT_ENGINE",
      summary: `Evaluated ${decisionResult.checks.length} policy checks. Passed: ${
        decisionResult.checks.filter((c) => c.passed).length
      }, Failed: ${decisionResult.violations.length}.`,
    });

    // 6. Ledger: INTENT_DRIFT_DETECTED if applicable
    if (decisionResult.driftReport.hasDrift) {
      await ledgerRepository.append({
        id: `evt_${uuidv4().substring(0, 8)}`,
        intentId: intent.id,
        proposalId: fullProposal.id,
        eventType: "INTENT_DRIFT_DETECTED",
        timestamp: new Date().toISOString(),
        actor: "INTENT_ENGINE",
        riskScore: decisionResult.riskScore,
        summary: `🚨 INTENT DRIFT: ${decisionResult.driftReport.summary}`,
        metadata: {
          driftSeverity: decisionResult.driftReport.severity,
          driftItems: decisionResult.driftReport.driftItems,
        },
      });
    }

    // 7. Ledger: DECISION_MADE
    await ledgerRepository.append({
      id: `evt_${uuidv4().substring(0, 8)}`,
      intentId: intent.id,
      proposalId: fullProposal.id,
      eventType: "DECISION_MADE",
      timestamp: new Date().toISOString(),
      actor: "INTENT_ENGINE",
      decision: decisionResult.decision,
      riskScore: decisionResult.riskScore,
      summary: `Engine Decision: ${decisionResult.decision} (Risk Score: ${decisionResult.riskScore}/100).`,
      details: decisionResult.explanation,
      metadata: {
        decisionId: decisionResult.id,
        violationsCount: decisionResult.violations.length,
      },
    });

    // 8. Auto-create Approval Request if ASK_APPROVAL
    if (decisionResult.decision === "ASK_APPROVAL") {
      const approval = await approvalService.createApproval({
        intentId: intent.id,
        decisionId: decisionResult.id,
        proposal: fullProposal,
        reason: decisionResult.explanation,
      });
      decisionResult.approvalId = approval.id;
    }

    // 9. Save Decision in Repository
    await decisionRepository.save(decisionResult);

    res.status(200).json({
      success: true,
      data: decisionResult,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDecisionsByIntentIdHandler = async (
  req: Request,
  res: Response<ApiResponse<DecisionResult[]>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { intentId } = req.params;
    const decisions = await decisionRepository.findByIntentId(intentId);

    res.status(200).json({
      success: true,
      data: decisions,
      meta: {
        timestamp: new Date().toISOString(),
        total: decisions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDemoScenariosHandler = async (
  _req: Request,
  res: Response<ApiResponse<DemoScenario[]>>
): Promise<void> => {
  const scenarios: DemoScenario[] = [
    {
      id: "scenario_1_safe_approval",
      title: "Scenario 1 — Safe Purchase (Within Budget + Approval Mandate)",
      description: "Agent proposes ₹3,499 for Nike running shoes under a ₹4,000 budget with approval required.",
      category: "shopping",
      intentId: "intent_demo_running_shoes",
      rawIntent: "Buy me running shoes under ₹4,000 and ask me before purchasing.",
      proposal: {
        product: "Nike Air Pegasus Running Shoes",
        merchant: "Nike India",
        amount: 3499,
        currency: "INR",
        quantity: 1,
        action: "purchase",
      },
      expectedDecision: "ASK_APPROVAL",
      expectedRisk: 20,
      highlightNote: "Within ₹4,000 max budget, but triggers ASK_APPROVAL because user policy explicitly mandates human review.",
    },
    {
      id: "scenario_2_budget_drift",
      title: "Scenario 2 — Budget Drift Violation (+₹3,999 Exceedance)",
      description: "Agent attempts to buy Nike Vaporfly shoes at ₹7,999 against a ₹4,000 max budget limit.",
      category: "shopping",
      intentId: "intent_demo_running_shoes",
      rawIntent: "Buy me running shoes under ₹4,000 and ask me before purchasing.",
      proposal: {
        product: "Nike Vaporfly Elite Pro Shoes",
        merchant: "Nike India",
        amount: 7999,
        currency: "INR",
        quantity: 1,
        action: "purchase",
      },
      expectedDecision: "BLOCK",
      expectedRisk: 90,
      highlightNote: "🚨 CRITICAL INTENT DRIFT: Exceeds budget by +₹3,999 (+99.9%). Engine deterministically BLOCKS without human approval.",
    },
    {
      id: "scenario_3_autonomous_allow",
      title: "Scenario 3 — Autonomous Auto-Authorize (Within Constraints)",
      description: "Agent proposes ₹649 for office stationery against a ₹1,000 budget with no approval mandate.",
      category: "shopping",
      intentId: "intent_demo_office_stationery",
      rawIntent: "Buy office stationery under ₹1,000 automatically without asking.",
      proposal: {
        product: "Premium Mesh Desk Organizer & Pen Set",
        merchant: "Amazon",
        amount: 649,
        currency: "INR",
        quantity: 1,
        action: "purchase",
      },
      expectedDecision: "ALLOW",
      expectedRisk: 5,
      highlightNote: "Fully compliant with budget, merchant, and permissions. Auto-authorize allowed without human prompt.",
    },
    {
      id: "scenario_4_subscription_breach",
      title: "Scenario 4 — Unauthorized Subscription Breach",
      description: "Agent attempts to sign up for a monthly recurring subscription when the user only authorized one-time purchase.",
      category: "subscription",
      intentId: "intent_demo_running_shoes",
      rawIntent: "Buy me running shoes under ₹4,000. Do not subscribe.",
      proposal: {
        product: "VIP Runner Club Recurring Membership",
        merchant: "Nike India",
        amount: 999,
        currency: "INR",
        quantity: 1,
        action: "subscribe",
        isSubscription: true,
      },
      expectedDecision: "BLOCK",
      expectedRisk: 85,
      highlightNote: "🚨 PERMISSION BREACH: Agent attempted recurring charge without subscription permission. Engine immediately BLOCKS.",
    },
  ];

  res.status(200).json({
    success: true,
    data: scenarios,
    meta: {
      timestamp: new Date().toISOString(),
      total: scenarios.length,
    },
  });
};
