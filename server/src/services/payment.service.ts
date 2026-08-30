import { v4 as uuidv4 } from "uuid";
import {
  PaymentExecution,
  AgentProposal,
  AuthorizationMethod,
  AuthorizedPaymentContext,
  RazorpayCheckoutData,
  RazorpayVerificationPayload,
  PaymentRail,
} from "../types";
import { intentRepository } from "../repositories/intent.repository";
import { approvalRepository } from "../repositories/approval.repository";
import { paymentRepository } from "../repositories/payment.repository";
import { ledgerRepository } from "../repositories/ledger.repository";
import { decisionService } from "./decision.service";
import { AppError } from "../middleware/error.middleware";
import { IPaymentProvider } from "./payment-providers/payment-provider.interface";
import { simulatedPaymentProvider } from "./payment-providers/simulated-payment.provider";
import { razorpayTestPaymentProvider } from "./payment-providers/razorpay-test-payment.provider";

export class PaymentService {
  private customProvider: IPaymentProvider | null = null;

  /**
   * Allows injecting a custom or mock provider (used for automated unit testing)
   */
  setCustomProvider(provider: IPaymentProvider | null): void {
    this.customProvider = provider;
  }

  getPaymentProvider(): IPaymentProvider {
    if (this.customProvider) {
      return this.customProvider;
    }

    const mode = process.env.PAYMENT_MODE || "simulated";
    if (mode === "razorpay_test" && razorpayTestPaymentProvider.isConfigured()) {
      return razorpayTestPaymentProvider;
    }

    return simulatedPaymentProvider;
  }

  getActivePaymentRail(): PaymentRail {
    return this.getPaymentProvider().name;
  }

  /**
   * Authorizes a payment request by validating the full intent policy and approval token on the backend.
   * Enforces tamper protection against modified proposals.
   */
  async authorizePayment(data: {
    intentId: string;
    proposal: AgentProposal;
    approvalId?: string;
    approvalToken?: string;
  }): Promise<PaymentExecution> {
    const paymentId = `pay_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();
    const currencySym = data.proposal.currency === "INR" ? "₹" : "$";
    const provider = this.getPaymentProvider();

    // 1. Load Intent
    const intent = await intentRepository.findById(data.intentId);
    if (!intent) {
      throw new AppError(`Intent with ID '${data.intentId}' not found`, 404, "INTENT_NOT_FOUND");
    }

    // 2. Ledger: PAYMENT_AUTHORIZATION_REQUESTED
    await ledgerRepository.append({
      id: `evt_${uuidv4().substring(0, 8)}`,
      intentId: intent.id,
      proposalId: data.proposal.id,
      paymentId,
      eventType: "PAYMENT_AUTHORIZATION_REQUESTED",
      timestamp: now,
      actor: "PAYMENT_GATEWAY",
      summary: `Payment authorization requested for '${data.proposal.product}' from ${data.proposal.merchant} (${currencySym}${data.proposal.amount.toLocaleString()}).`,
      metadata: {
        amount: data.proposal.amount,
        currency: data.proposal.currency,
        approvalProvided: !!data.approvalToken,
        rail: provider.name,
      },
    });

    // 3. Re-evaluate proposal strictly on the backend (Never trust client decision)
    const decisionResult = decisionService.evaluateProposal(intent, data.proposal);

    // 4. If Policy Engine yields BLOCK -> Deny Payment
    if (decisionResult.decision === "BLOCK") {
      const blockedPayment: PaymentExecution = {
        id: paymentId,
        intentId: intent.id,
        decisionId: decisionResult.id,
        proposalId: data.proposal.id,
        amount: data.proposal.amount,
        currency: data.proposal.currency,
        merchant: data.proposal.merchant,
        product: data.proposal.product,
        status: "BLOCKED",
        authorizationMethod: "AUTO_ALLOWED",
        paymentRail: provider.name,
        gatewayTransactionId: `tx_blocked_${uuidv4().substring(0, 8)}`,
        isSimulated: provider.name === "simulated",
        createdAt: now,
        failureReason: `Payment blocked by Intent Policy Engine: ${decisionResult.violations.map((v) => v.explanation).join(" ")}`,
      };

      await paymentRepository.create(blockedPayment);

      await ledgerRepository.append({
        id: `evt_${uuidv4().substring(0, 8)}`,
        intentId: intent.id,
        decisionId: decisionResult.id,
        paymentId,
        eventType: "PAYMENT_BLOCKED",
        timestamp: new Date().toISOString(),
        actor: "PAYMENT_GATEWAY",
        decision: "BLOCK",
        riskScore: decisionResult.riskScore,
        summary: `🚨 PAYMENT BLOCKED: Policy violation prevents authorization of ${currencySym}${data.proposal.amount.toLocaleString()}. No order created.`,
        details: decisionResult.explanation,
        metadata: {
          violations: decisionResult.violations,
          drift: decisionResult.driftReport,
        },
      });

      throw new AppError(
        `Payment authorization denied by Intent Policy Engine: ${decisionResult.explanation}`,
        403,
        "PAYMENT_BLOCKED",
        {
          violations: decisionResult.violations,
          drift: decisionResult.driftReport,
        }
      );
    }

    let authMethod: AuthorizationMethod = "AUTO_ALLOWED";
    let matchedApprovalId = data.approvalId;

    // 5. If Policy Engine yields ASK_APPROVAL -> Verify Approval Token & Tamper Protection
    if (decisionResult.decision === "ASK_APPROVAL") {
      authMethod = "USER_APPROVAL";

      if (!data.approvalToken && !data.approvalId) {
        await ledgerRepository.append({
          id: `evt_${uuidv4().substring(0, 8)}`,
          intentId: intent.id,
          decisionId: decisionResult.id,
          paymentId,
          eventType: "PAYMENT_BLOCKED",
          timestamp: new Date().toISOString(),
          actor: "PAYMENT_GATEWAY",
          summary: "🚨 PAYMENT BLOCKED: User approval required but no approval token was presented.",
        });

        throw new AppError(
          "Payment requires explicit human approval token",
          403,
          "APPROVAL_NOT_GRANTED"
        );
      }

      // Find approval record
      let approval = data.approvalId ? await approvalRepository.findById(data.approvalId) : null;

      if (!approval && data.approvalToken) {
        const allApprovals = await approvalRepository.list();
        approval = allApprovals.find((a) => a.approvalToken === data.approvalToken) || null;
      }

      if (!approval) {
        throw new AppError("Approval record not found", 404, "APPROVAL_NOT_FOUND");
      }

      matchedApprovalId = approval.id;

      // Check 10-minute Approval Expiry
      const approvalCreatedTime = new Date(approval.createdAt).getTime();
      const tenMinutesInMs = 10 * 60 * 1000;
      const isExpired =
        approval.status === "EXPIRED" ||
        Date.now() - approvalCreatedTime > tenMinutesInMs;

      if (isExpired) {
        await approvalRepository.update(approval.id, { status: "EXPIRED" });

        await ledgerRepository.append({
          id: `evt_${uuidv4().substring(0, 8)}`,
          intentId: intent.id,
          decisionId: decisionResult.id,
          approvalId: approval.id,
          paymentId,
          eventType: "APPROVAL_EXPIRED",
          timestamp: new Date().toISOString(),
          actor: "SYSTEM",
          summary: `Approval request ${approval.id} has expired (exceeded 10m TTL). Authorization rejected.`,
        });

        throw new AppError(
          "Approval token has expired. A fresh approval is required.",
          403,
          "APPROVAL_EXPIRED"
        );
      }

      if (approval.status !== "APPROVED") {
        throw new AppError(
          `Approval request is not in APPROVED state (current: ${approval.status})`,
          403,
          "APPROVAL_NOT_GRANTED"
        );
      }

      if (data.approvalToken && approval.approvalToken !== data.approvalToken) {
        throw new AppError("Cryptographic approval token is invalid", 403, "APPROVAL_TOKEN_INVALID");
      }

      // =========================================================================
      // SECURITY CRITICAL: TAMPER PROTECTION
      // Verify payment proposal against approved snapshot
      // =========================================================================
      const snapshot = approval.proposalSnapshot;
      const isTampered =
        Number(data.proposal.amount) !== Number(snapshot.amount) ||
        data.proposal.merchant.trim().toLowerCase() !== snapshot.merchant.trim().toLowerCase() ||
        data.proposal.product.trim().toLowerCase() !== snapshot.product.trim().toLowerCase() ||
        data.proposal.action !== snapshot.action ||
        Number(data.proposal.quantity) !== Number(snapshot.quantity);

      if (isTampered) {
        const tamperMsg = `Payment blocked: Approved proposal context does not match payment request. Approved: ${snapshot.product} at ${currencySym}${snapshot.amount}, Requested: ${data.proposal.product} at ${currencySym}${data.proposal.amount}.`;

        await ledgerRepository.append({
          id: `evt_${uuidv4().substring(0, 8)}`,
          intentId: intent.id,
          decisionId: decisionResult.id,
          approvalId: approval.id,
          paymentId,
          eventType: "PAYMENT_CONTEXT_MISMATCH",
          timestamp: new Date().toISOString(),
          actor: "PAYMENT_GATEWAY",
          summary: `🚨 TAMPERING DETECTED: ${tamperMsg}`,
          details: "Approval token cannot be reused for a modified candidate action.",
          metadata: {
            approvedSnapshot: snapshot,
            tamperedProposal: data.proposal,
          },
        });

        await ledgerRepository.append({
          id: `evt_${uuidv4().substring(0, 8)}`,
          intentId: intent.id,
          decisionId: decisionResult.id,
          paymentId,
          eventType: "PAYMENT_BLOCKED",
          timestamp: new Date().toISOString(),
          actor: "PAYMENT_GATEWAY",
          summary: "Payment rejected due to context mismatch tampering. No order created.",
        });

        throw new AppError(
          tamperMsg,
          403,
          "APPROVAL_CONTEXT_MISMATCH",
          {
            approved: snapshot,
            requested: data.proposal,
          }
        );
      }
    }

    // 6. Payment Authorized Successfully
    const authorizedPayment: PaymentExecution = {
      id: paymentId,
      intentId: intent.id,
      decisionId: decisionResult.id,
      approvalId: matchedApprovalId,
      proposalId: data.proposal.id,
      amount: data.proposal.amount,
      currency: data.proposal.currency,
      merchant: data.proposal.merchant,
      product: data.proposal.product,
      status: "AUTHORIZED",
      authorizationMethod: authMethod,
      paymentRail: provider.name,
      approvalToken: data.approvalToken,
      gatewayTransactionId: `rzp_sim_${uuidv4().substring(0, 12)}`,
      isSimulated: provider.name === "simulated",
      createdAt: now,
    };

    const saved = await paymentRepository.create(authorizedPayment);

    // 7. Ledger: PAYMENT_AUTHORIZED
    await ledgerRepository.append({
      id: `evt_${uuidv4().substring(0, 8)}`,
      intentId: saved.intentId,
      decisionId: saved.decisionId,
      approvalId: saved.approvalId,
      paymentId: saved.id,
      eventType: "PAYMENT_AUTHORIZED",
      timestamp: new Date().toISOString(),
      actor: "PAYMENT_GATEWAY",
      summary: `Payment authorized for '${saved.product}' (${currencySym}${saved.amount.toLocaleString()}) via ${authMethod === "USER_APPROVAL" ? "Human Approval Token" : "Auto-Authorize Policy"}.`,
      metadata: {
        transactionId: saved.gatewayTransactionId,
        authMethod,
        rail: provider.name,
      },
    });

    return saved;
  }

  /**
   * Creates a Razorpay Order (or Simulated Order) for an already authorized payment
   */
  async createPaymentOrder(paymentId: string): Promise<RazorpayCheckoutData> {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new AppError(`Payment '${paymentId}' not found`, 404, "PAYMENT_NOT_FOUND");
    }

    if (payment.status === "BLOCKED") {
      throw new AppError("Cannot create order for a BLOCKED payment authorization", 403, "PAYMENT_BLOCKED");
    }

    if (payment.status === "COMPLETED") {
      throw new AppError("Payment is already completed", 409, "IDEMPOTENCY_CONFLICT");
    }

    // Idempotency check: If an order already exists for this payment, reuse it
    if (payment.razorpayOrderId) {
      const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_simulated";
      return {
        orderId: payment.razorpayOrderId,
        keyId,
        amount: payment.amountInPaise || payment.amount * 100,
        currency: payment.currency,
        paymentId: payment.id,
        intentId: payment.intentId,
      };
    }

    // Prepare immutable authorized context
    const context: AuthorizedPaymentContext = {
      intentId: payment.intentId,
      decisionId: payment.decisionId || "dec_auto",
      approvalId: payment.approvalId,
      amount: payment.amount,
      currency: payment.currency,
      merchant: payment.merchant,
      product: payment.product,
      action: "purchase",
      authorizationMethod: payment.authorizationMethod,
      approvalToken: payment.approvalToken,
    };

    const provider = this.getPaymentProvider();
    const orderResult = await provider.createOrder(context);

    // Update payment record with order details
    await paymentRepository.update(payment.id, {
      status: "ORDER_CREATED",
      razorpayOrderId: orderResult.orderId,
      amountInPaise: orderResult.amountInMinorUnits,
    });

    // Ledger: RAZORPAY_ORDER_CREATED
    await ledgerRepository.append({
      id: `evt_${uuidv4().substring(0, 8)}`,
      intentId: payment.intentId,
      decisionId: payment.decisionId,
      approvalId: payment.approvalId,
      paymentId: payment.id,
      eventType: "RAZORPAY_ORDER_CREATED",
      timestamp: new Date().toISOString(),
      actor: "PAYMENT_GATEWAY",
      summary: `Payment rail order created: ${orderResult.orderId} for ${payment.currency} ${payment.amount} (${orderResult.amountInMinorUnits} minor units).`,
      metadata: {
        orderId: orderResult.orderId,
        rail: provider.name,
        amountInPaise: orderResult.amountInMinorUnits,
      },
    });

    return {
      orderId: orderResult.orderId,
      keyId: orderResult.keyId || process.env.RAZORPAY_KEY_ID || "rzp_test_simulated",
      amount: orderResult.amountInMinorUnits,
      currency: orderResult.currency,
      paymentId: payment.id,
      intentId: payment.intentId,
      notes: orderResult.notes,
    };
  }

  /**
   * Verifies Razorpay signature and marks payment verified
   */
  async verifyPayment(payload: RazorpayVerificationPayload): Promise<PaymentExecution> {
    const payment = await paymentRepository.findById(payload.internalPaymentId);
    if (!payment) {
      throw new AppError(`Internal payment '${payload.internalPaymentId}' not found`, 404, "PAYMENT_NOT_FOUND");
    }

    if (payment.status === "COMPLETED") {
      return payment;
    }

    if (payment.status === "BLOCKED") {
      throw new AppError("Cannot verify signature for a BLOCKED payment", 403, "PAYMENT_BLOCKED");
    }

    // Verify order ID matches
    if (payment.razorpayOrderId && payment.razorpayOrderId !== payload.razorpay_order_id) {
      await ledgerRepository.append({
        id: `evt_${uuidv4().substring(0, 8)}`,
        intentId: payment.intentId,
        paymentId: payment.id,
        eventType: "PAYMENT_CONTEXT_MISMATCH",
        timestamp: new Date().toISOString(),
        actor: "PAYMENT_GATEWAY",
        summary: `Order ID mismatch during verification: Expected ${payment.razorpayOrderId}, received ${payload.razorpay_order_id}.`,
      });

      throw new AppError("Order ID mismatch during verification", 400, "PAYMENT_CONTEXT_MISMATCH");
    }

    const provider = this.getPaymentProvider();
    const verification = await provider.verifyPayment({
      orderId: payload.razorpay_order_id,
      paymentId: payload.razorpay_payment_id,
      signature: payload.razorpay_signature,
      expectedAmount: payment.amount,
      expectedCurrency: payment.currency,
    });

    const now = new Date().toISOString();

    if (!verification.verified) {
      await paymentRepository.update(payment.id, {
        status: "FAILED",
        failureReason: verification.error || "Signature verification failed",
      });

      await ledgerRepository.append({
        id: `evt_${uuidv4().substring(0, 8)}`,
        intentId: payment.intentId,
        decisionId: payment.decisionId,
        approvalId: payment.approvalId,
        paymentId: payment.id,
        eventType: "RAZORPAY_PAYMENT_FAILED",
        timestamp: now,
        actor: "PAYMENT_GATEWAY",
        summary: `🚨 PAYMENT VERIFICATION FAILED: Razorpay signature is invalid (${verification.error}). Payment rejected.`,
        metadata: {
          orderId: payload.razorpay_order_id,
          paymentId: payload.razorpay_payment_id,
          error: verification.error,
        },
      });

      throw new AppError("Razorpay signature verification failed", 400, "PAYMENT_VERIFICATION_FAILED");
    }

    // Signature is valid! Update payment record
    const updated = await paymentRepository.update(payment.id, {
      status: "COMPLETED",
      gatewayTransactionId: payload.razorpay_payment_id,
      razorpayPaymentId: payload.razorpay_payment_id,
      razorpaySignature: payload.razorpay_signature,
      completedAt: now,
    });

    if (!updated) {
      throw new AppError("Failed to update verified payment", 500, "INTERNAL_ERROR");
    }

    // Ledger: RAZORPAY_PAYMENT_VERIFIED
    await ledgerRepository.append({
      id: `evt_${uuidv4().substring(0, 8)}`,
      intentId: updated.intentId,
      decisionId: updated.decisionId,
      approvalId: updated.approvalId,
      paymentId: updated.id,
      eventType: "RAZORPAY_PAYMENT_VERIFIED",
      timestamp: now,
      actor: "PAYMENT_GATEWAY",
      summary: `Razorpay payment ${payload.razorpay_payment_id} verified cryptographically against order ${payload.razorpay_order_id}.`,
      metadata: {
        orderId: payload.razorpay_order_id,
        paymentId: payload.razorpay_payment_id,
        signature: payload.razorpay_signature,
      },
    });

    // Ledger: PAYMENT_COMPLETED
    await ledgerRepository.append({
      id: `evt_${uuidv4().substring(0, 8)}`,
      intentId: updated.intentId,
      decisionId: updated.decisionId,
      approvalId: updated.approvalId,
      paymentId: updated.id,
      eventType: "PAYMENT_COMPLETED",
      timestamp: now,
      actor: "PAYMENT_GATEWAY",
      summary: `Payment of ${updated.currency} ${updated.amount.toLocaleString()} settled successfully (ID: ${payload.razorpay_payment_id}).`,
      metadata: {
        transactionId: payload.razorpay_payment_id,
        rail: provider.name,
      },
    });

    return updated;
  }

  /**
   * Completes a previously authorized simulated payment transaction
   */
  async completePayment(id: string): Promise<PaymentExecution> {
    const existing = await paymentRepository.findById(id);
    if (!existing) {
      throw new AppError(`Payment with ID '${id}' not found`, 404, "PAYMENT_NOT_FOUND");
    }

    if (existing.status === "COMPLETED") {
      throw new AppError("Payment has already been completed", 409, "IDEMPOTENCY_CONFLICT");
    }

    if (existing.status !== "AUTHORIZED" && existing.status !== "ORDER_CREATED") {
      throw new AppError(`Cannot complete payment in '${existing.status}' status`, 403, "PAYMENT_NOT_AUTHORIZED");
    }

    const now = new Date().toISOString();
    const updated = await paymentRepository.update(id, {
      status: "COMPLETED",
      completedAt: now,
    });

    if (!updated) {
      throw new AppError("Failed to complete payment transaction", 500, "INTERNAL_ERROR");
    }

    const currencySym = updated.currency === "INR" ? "₹" : "$";

    // Record PAYMENT_COMPLETED in Decision Ledger
    await ledgerRepository.append({
      id: `evt_${uuidv4().substring(0, 8)}`,
      intentId: updated.intentId,
      decisionId: updated.decisionId,
      approvalId: updated.approvalId,
      paymentId: updated.id,
      eventType: "PAYMENT_COMPLETED",
      timestamp: now,
      actor: "PAYMENT_GATEWAY",
      summary: `Payment of ${currencySym}${updated.amount.toLocaleString()} COMPLETED successfully (Transaction ID: ${updated.gatewayTransactionId}).`,
      details: "Payment settled under IntentLedger authorization.",
      metadata: {
        transactionId: updated.gatewayTransactionId,
        completedAt: now,
        isSimulated: updated.isSimulated,
      },
    });

    return updated;
  }

  async getPaymentById(id: string): Promise<PaymentExecution | null> {
    return paymentRepository.findById(id);
  }

  async getPaymentsByIntentId(intentId: string): Promise<PaymentExecution[]> {
    return paymentRepository.findByIntentId(intentId);
  }

  async listPayments(): Promise<PaymentExecution[]> {
    return paymentRepository.list();
  }
}

export const paymentService = new PaymentService();
