import { Request, Response } from "express";
import { ApiResponse, SystemStats } from "../types";
import { intentRepository } from "../repositories/intent.repository";
import { ledgerRepository } from "../repositories/ledger.repository";
import { decisionRepository } from "../repositories/decision.repository";
import { approvalRepository } from "../repositories/approval.repository";
import { paymentRepository } from "../repositories/payment.repository";
import { isMongoConnected } from "../config/database";
import { getAiCompilerHealth } from "../config/ai.config";
import { razorpayTestPaymentProvider } from "../services/payment-providers/razorpay-test-payment.provider";

export const getHealth = async (_req: Request, res: Response<ApiResponse>): Promise<void> => {
  const [intentCount, ledgerCount] = await Promise.all([
    intentRepository.count(),
    ledgerRepository.count(),
  ]);

  const dbStatus = isMongoConnected() ? "connected" : "fallback";
  const dbProvider = isMongoConnected() ? "mongodb" : "memory";
  const aiHealth = getAiCompilerHealth();

  const paymentMode = process.env.PAYMENT_MODE || "simulated";
  let paymentRailStatus = "simulated";
  if (paymentMode === "razorpay_test") {
    paymentRailStatus = razorpayTestPaymentProvider.isConfigured()
      ? "razorpay_test"
      : "configuration_missing";
  }

  res.status(200).json({
    success: true,
    data: {
      status: "healthy",
      service: "IntentLedger API Engine",
      version: "1.0.0",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      services: {
        api: "online",
        database: {
          provider: dbProvider,
          status: dbStatus,
        },
        aiCompiler: {
          provider: aiHealth.provider,
          model: aiHealth.model,
          status: aiHealth.status,
        },
        policyEngine: "active",
        paymentRail: paymentRailStatus,
        ledger: "active",
      },
      paymentRail: {
        mode: paymentMode,
        status: paymentRailStatus,
        keyIdConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.trim() !== ""),
        keySecretConfigured: !!(process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET.trim() !== ""),
      },
      database: {
        type: dbProvider,
        status: isMongoConnected() ? "connected" : "in_memory",
        stats: {
          activeIntents: intentCount,
          ledgerEvents: ledgerCount,
        },
      },
      aiCompiler: aiHealth,
    },
    meta: {
      timestamp: new Date().toISOString(),
      mode: isMongoConnected() ? "mongodb" : "in_memory",
      paymentRail: paymentMode as any,
    },
  });
};

export const getStats = async (_req: Request, res: Response<ApiResponse<SystemStats>>): Promise<void> => {
  const [intentCount, ledgerCount, decisionCount, approvalCounts, paymentCounts, allEvents] = await Promise.all([
    intentRepository.count(),
    ledgerRepository.count(),
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
      driftDetectedCount: driftCount,
      pendingApprovals: approvalCounts.pending,
      totalApprovals: approvalCounts.total,
      completedPayments: paymentCounts.completed,
      blockedActions: blockedCount,
      totalLedgerEvents: ledgerCount,
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
