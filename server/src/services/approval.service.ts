import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { ApprovalRequest, AgentProposal } from "../types";
import { approvalRepository } from "../repositories/approval.repository";
import { ledgerRepository } from "../repositories/ledger.repository";
import { AppError } from "../middleware/error.middleware";

export class ApprovalService {
  /**
   * Automatically creates a pending approval request when Decision Engine yields ASK_APPROVAL
   */
  async createApproval(data: {
    intentId: string;
    decisionId: string;
    proposal: AgentProposal;
    reason: string;
  }): Promise<ApprovalRequest> {
    const approvalId = `appr_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const approval: ApprovalRequest = {
      id: approvalId,
      intentId: data.intentId,
      decisionId: data.decisionId,
      status: "PENDING",
      requestedAmount: data.proposal.amount,
      currency: data.proposal.currency,
      proposal: data.proposal,
      // Deep snapshot clone of the proposal to detect any tampering before payment
      proposalSnapshot: JSON.parse(JSON.stringify(data.proposal)),
      reason: data.reason,
      createdAt: now,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24hr expiration
    };

    const saved = await approvalRepository.create(approval);

    const currencySym = saved.currency === "INR" ? "₹" : "$";

    // Record APPROVAL_REQUESTED in Decision Ledger
    await ledgerRepository.append({
      id: `evt_${uuidv4().substring(0, 8)}`,
      intentId: saved.intentId,
      decisionId: saved.decisionId,
      approvalId: saved.id,
      proposalId: saved.proposal.id,
      eventType: "APPROVAL_REQUESTED",
      timestamp: now,
      actor: "INTENT_ENGINE",
      summary: `Human approval requested for '${saved.proposal.product}' from ${saved.proposal.merchant} (${currencySym}${saved.requestedAmount.toLocaleString()}).`,
      details: saved.reason,
      metadata: {
        approvalId: saved.id,
        amount: saved.requestedAmount,
        currency: saved.currency,
      },
    });

    return saved;
  }

  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    return approvalRepository.findPending();
  }

  async getAllApprovals(): Promise<ApprovalRequest[]> {
    return approvalRepository.list();
  }

  async getApprovalById(id: string): Promise<ApprovalRequest | null> {
    return approvalRepository.findById(id);
  }

  async getApprovalsByIntentId(intentId: string): Promise<ApprovalRequest[]> {
    return approvalRepository.findByIntentId(intentId);
  }

  /**
   * User explicitly approves a pending agent proposal
   * Generates a secure, cryptographic approval token
   */
  async approveRequest(id: string): Promise<ApprovalRequest> {
    const existing = await approvalRepository.findById(id);
    if (!existing) {
      throw new AppError(`Approval request '${id}' not found`, 404, "APPROVAL_NOT_FOUND");
    }

    if (existing.status === "APPROVED") {
      throw new AppError("Approval request has already been approved", 409, "IDEMPOTENCY_CONFLICT");
    }

    if (existing.status === "REJECTED") {
      throw new AppError("Cannot approve an already rejected request", 409, "IDEMPOTENCY_CONFLICT");
    }

    if (existing.status === "EXPIRED") {
      throw new AppError("Cannot approve an expired approval request", 409, "IDEMPOTENCY_CONFLICT");
    }

    // Generate cryptographic approval token (SHA-256 bound token)
    const rawEntropy = crypto.randomBytes(32).toString("hex");
    const approvalToken = `tok_appr_${crypto.createHash("sha256").update(`${id}:${existing.intentId}:${existing.decisionId}:${rawEntropy}`).digest("hex").substring(0, 32)}`;
    const now = new Date().toISOString();

    const updated = await approvalRepository.update(id, {
      status: "APPROVED",
      resolvedAt: now,
      approvalToken,
    });

    if (!updated) {
      throw new AppError("Failed to update approval status", 500, "INTERNAL_ERROR");
    }

    const currencySym = updated.currency === "INR" ? "₹" : "$";

    // Record APPROVAL_GRANTED in Decision Ledger
    await ledgerRepository.append({
      id: `evt_${uuidv4().substring(0, 8)}`,
      intentId: updated.intentId,
      decisionId: updated.decisionId,
      approvalId: updated.id,
      proposalId: updated.proposal.id,
      eventType: "APPROVAL_GRANTED",
      timestamp: now,
      actor: "USER",
      summary: `User explicitly APPROVED agent purchase of '${updated.proposal.product}' (${currencySym}${updated.requestedAmount.toLocaleString()}).`,
      details: "Cryptographic approval token issued for simulated payment gateway.",
      metadata: {
        approvalId: updated.id,
        tokenPrefix: approvalToken.substring(0, 16) + "...",
      },
    });

    return updated;
  }

  /**
   * User explicitly rejects a pending agent proposal
   */
  async rejectRequest(id: string, reason?: string): Promise<ApprovalRequest> {
    const existing = await approvalRepository.findById(id);
    if (!existing) {
      throw new AppError(`Approval request '${id}' not found`, 404, "APPROVAL_NOT_FOUND");
    }

    if (existing.status === "APPROVED") {
      throw new AppError("Cannot reject an already approved request", 409, "IDEMPOTENCY_CONFLICT");
    }

    if (existing.status === "REJECTED") {
      throw new AppError("Approval request has already been rejected", 409, "IDEMPOTENCY_CONFLICT");
    }

    const now = new Date().toISOString();

    const updated = await approvalRepository.update(id, {
      status: "REJECTED",
      resolvedAt: now,
      reason: reason ? `${existing.reason} (Rejection reason: ${reason})` : existing.reason,
    });

    if (!updated) {
      throw new AppError("Failed to update approval status", 500, "INTERNAL_ERROR");
    }

    const currencySym = updated.currency === "INR" ? "₹" : "$";

    // Record APPROVAL_REJECTED in Decision Ledger
    await ledgerRepository.append({
      id: `evt_${uuidv4().substring(0, 8)}`,
      intentId: updated.intentId,
      decisionId: updated.decisionId,
      approvalId: updated.id,
      proposalId: updated.proposal.id,
      eventType: "APPROVAL_REJECTED",
      timestamp: now,
      actor: "USER",
      summary: `User explicitly REJECTED agent purchase of '${updated.proposal.product}' (${currencySym}${updated.requestedAmount.toLocaleString()}).`,
      metadata: {
        approvalId: updated.id,
      },
    });

    return updated;
  }
}

export const approvalService = new ApprovalService();
