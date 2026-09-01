import { Request, Response } from "express";
import { ApiResponse, LedgerEvent } from "../types";
import { intentRepository, inMemoryIntentRepository } from "../repositories/intent.repository";
import { decisionRepository, inMemoryDecisionRepository } from "../repositories/decision.repository";
import { approvalRepository, inMemoryApprovalRepository } from "../repositories/approval.repository";
import { paymentRepository, inMemoryPaymentRepository } from "../repositories/payment.repository";
import { ledgerRepository, inMemoryLedgerRepository } from "../repositories/ledger.repository";

export interface DashboardSummaryData {
  activeIntents: number;
  decisionsEvaluated: number;
  driftDetected: number;
  approvalRequests: number;
  payments: number;
  blockedActions: number;
  successfulPayments: number;
  razorpayTestOrders: number;
  verifiedPayments: number;
  paymentFailures: number;
  contextMismatches: number;
}

export const getDashboardSummaryHandler = async (
  _req: Request,
  res: Response<ApiResponse<DashboardSummaryData>>
): Promise<void> => {
  const [intentCount, decisionCount, approvalCounts, paymentCounts, allEvents] = await Promise.all([
    intentRepository.count(),
    decisionRepository.count(),
    approvalRepository.count(),
    paymentRepository.count(),
    ledgerRepository.findAll(),
  ]);

  const driftCount = allEvents.filter((e) => e.eventType === "INTENT_DRIFT_DETECTED").length;
  const blockedCount = allEvents.filter((e) => e.decision === "BLOCK" || e.eventType === "PAYMENT_BLOCKED").length;
  const razorpayOrders = allEvents.filter((e) => e.eventType === "RAZORPAY_ORDER_CREATED").length;
  const verifiedPayments = allEvents.filter((e) => e.eventType === "RAZORPAY_PAYMENT_VERIFIED" || e.eventType === "PAYMENT_COMPLETED").length;
  const paymentFailures = allEvents.filter((e) => e.eventType === "RAZORPAY_PAYMENT_FAILED" || e.eventType === "PAYMENT_FAILED").length;
  const contextMismatches = allEvents.filter((e) => e.eventType === "PAYMENT_CONTEXT_MISMATCH").length;

  res.status(200).json({
    success: true,
    data: {
      activeIntents: intentCount,
      decisionsEvaluated: decisionCount,
      driftDetected: driftCount,
      approvalRequests: approvalCounts.total,
      payments: paymentCounts.total,
      blockedActions: blockedCount,
      successfulPayments: paymentCounts.completed,
      razorpayTestOrders: razorpayOrders,
      verifiedPayments,
      paymentFailures,
      contextMismatches,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
};

export const getDashboardActivityHandler = async (
  _req: Request,
  res: Response<ApiResponse<LedgerEvent[]>>
): Promise<void> => {
  const allEvents = await ledgerRepository.findAll();
  const latestActivity = allEvents.slice(0, 10);

  res.status(200).json({
    success: true,
    data: latestActivity,
    meta: {
      timestamp: new Date().toISOString(),
      total: latestActivity.length,
    },
  });
};

export const resetDemoHandler = async (
  _req: Request,
  res: Response<ApiResponse<{ message: string }>>
): Promise<void> => {
  // Re-seed initial demo intents, clear approvals, decisions, payments, and seed ledger cleanly
  inMemoryIntentRepository.seedInitialData();
  inMemoryApprovalRepository.clear();
  inMemoryDecisionRepository.clear();
  inMemoryPaymentRepository.clear();
  inMemoryLedgerRepository.seedInitialEvents();

  res.status(200).json({
    success: true,
    data: {
      message: "Demo environment state reset successfully.",
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
};
