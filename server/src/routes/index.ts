import { Router, Request, Response } from "express";
import { getHealth, getStats } from "../controllers/health.controller";
import {
  getDashboardSummaryHandler,
  getDashboardActivityHandler,
  resetDemoHandler,
} from "../controllers/dashboard.controller";
import {
  compileIntentHandler,
  createIntentHandler,
  getAllIntentsHandler,
  getIntentByIdHandler,
} from "../controllers/intent.controller";
import {
  evaluateDecisionHandler,
  getDecisionsByIntentIdHandler,
  getDemoScenariosHandler,
} from "../controllers/decision.controller";
import {
  getApprovalsHandler,
  getApprovalByIdHandler,
  approveApprovalHandler,
  rejectApprovalHandler,
} from "../controllers/approval.controller";
import {
  authorizePaymentHandler,
  createOrderHandler,
  verifyPaymentHandler,
  completePaymentHandler,
  getPaymentByIdHandler,
  listPaymentsHandler,
  razorpayWebhookHandler,
} from "../controllers/payment.controller";
import { ledgerRepository } from "../repositories/ledger.repository";
import { ApiResponse } from "../types";

export const apiRouter = Router();

// Health & System Statistics
apiRouter.get("/health", getHealth);
apiRouter.get("/stats", getStats);

// Dynamic Dashboard & Activity
apiRouter.get("/dashboard/summary", getDashboardSummaryHandler);
apiRouter.get("/dashboard/activity", getDashboardActivityHandler);
apiRouter.post("/demo/reset", resetDemoHandler);

// Intent Management & Compilation
apiRouter.post("/intents/compile", compileIntentHandler);
apiRouter.post("/intents", createIntentHandler);
apiRouter.get("/intents", getAllIntentsHandler);
apiRouter.get("/intents/:id", getIntentByIdHandler);

// Decision Engine & Policy Checks
apiRouter.post("/decisions/evaluate", evaluateDecisionHandler);
apiRouter.get("/decisions/:intentId", getDecisionsByIntentIdHandler);

// Demo Benchmark Scenarios
apiRouter.get("/demo/scenarios", getDemoScenariosHandler);

// Human Approvals
apiRouter.get("/approvals", getApprovalsHandler);
apiRouter.get("/approvals/:id", getApprovalByIdHandler);
apiRouter.post("/approvals/:id/approve", approveApprovalHandler);
apiRouter.post("/approvals/:id/reject", rejectApprovalHandler);

// Payment Gate & Razorpay Rail
apiRouter.post("/payments/authorize", authorizePaymentHandler);
apiRouter.post("/payments/razorpay/order", createOrderHandler);
apiRouter.post("/payments/:id/order", createOrderHandler);
apiRouter.post("/payments/razorpay/verify", verifyPaymentHandler);
apiRouter.post("/payments/:id/complete", completePaymentHandler);
apiRouter.get("/payments/:id", getPaymentByIdHandler);
apiRouter.get("/payments", listPaymentsHandler);

// Webhook Receiver
apiRouter.post("/webhooks/razorpay", razorpayWebhookHandler);

// Audit Decision Ledger (Read-Only via Public API)
apiRouter.get("/ledger", async (req: Request, res: Response<ApiResponse>) => {
  const { intentId, eventType } = req.query as { intentId?: string; eventType?: string };
  const events = await ledgerRepository.findAll({ intentId, eventType });
  res.status(200).json({
    success: true,
    data: events,
    meta: {
      timestamp: new Date().toISOString(),
      total: events.length,
    },
  });
});

apiRouter.get("/ledger/:intentId", async (req: Request, res: Response<ApiResponse>) => {
  const { intentId } = req.params;
  const events = await ledgerRepository.findAll({ intentId });
  // For Intent Replay, order chronologically (oldest to newest)
  const chronological = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  res.status(200).json({
    success: true,
    data: chronological,
    meta: {
      timestamp: new Date().toISOString(),
      total: chronological.length,
    },
  });
});

// Enforce Ledger Immutability: Block external mutation attempts
apiRouter.all(["/ledger", "/ledger/*"], (req: Request, res: Response<ApiResponse>) => {
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    return res.status(405).json({
      success: false,
      error: {
        code: "LEDGER_IMMUTABLE",
        message: `Ledger is an append-only cryptographic audit stream. Direct ${req.method} operations are strictly prohibited.`,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});
