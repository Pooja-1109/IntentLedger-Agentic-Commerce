import mongoose, { Schema } from "mongoose";
import {
  Intent,
  DecisionResult,
  ApprovalRequest,
  PaymentExecution,
  LedgerEvent,
} from "../../types";

// ============================================================================
// 1. Intent Model
// ============================================================================
export interface IntentDoc extends Omit<Intent, "id"> {
  _id: string;
}

const IntentSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    rawText: { type: String, required: true },
    category: { type: String, required: true, index: true },
    constraints: {
      maxAmount: { type: Number },
      currency: { type: String, default: "INR" },
      merchant: { type: String },
      productCategory: { type: String },
      allowedMerchants: [{ type: String }],
      blockedMerchants: [{ type: String }],
      quantity: { type: Number, default: 1 },
      requiresApproval: { type: Boolean, default: true },
    },
    permissions: {
      canPurchase: { type: Boolean, default: true },
      canSubscribe: { type: Boolean, default: false },
      canTransfer: { type: Boolean, default: false },
      canChangeQuantity: { type: Boolean, default: true },
    },
    status: { type: String, enum: ["active", "completed", "cancelled", "expired"], default: "active", index: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false, timestamps: false }
);

IntentSchema.index({ createdAt: -1 });

export const IntentModel = mongoose.models.Intent || mongoose.model<IntentDoc>("Intent", IntentSchema);

// ============================================================================
// 2. Decision Model
// ============================================================================
export interface DecisionDoc extends Omit<DecisionResult, "id"> {
  _id: string;
}

const DecisionSchema = new Schema(
  {
    _id: { type: String, required: true },
    intentId: { type: String, required: true, index: true },
    proposalId: { type: String, required: true },
    proposal: { type: Schema.Types.Mixed },
    intent: { type: Schema.Types.Mixed },
    decision: { type: String, enum: ["ALLOW", "ASK_APPROVAL", "BLOCK"], required: true, index: true },
    riskScore: { type: Number, required: true },
    violations: [{ type: Schema.Types.Mixed }],
    warnings: [{ type: String }],
    explanation: { type: String, required: true },
    checks: [{ type: Schema.Types.Mixed }],
    driftReport: { type: Schema.Types.Mixed },
    evaluatedAt: { type: String, required: true },
    requiresUserApproval: { type: Boolean, default: false },
    approvalId: { type: String, index: true },
  },
  { _id: false, timestamps: false }
);

DecisionSchema.index({ evaluatedAt: -1 });

export const DecisionModel = mongoose.models.Decision || mongoose.model<DecisionDoc>("Decision", DecisionSchema);

// ============================================================================
// 3. Approval Model
// ============================================================================
export interface ApprovalDoc extends Omit<ApprovalRequest, "id"> {
  _id: string;
}

const ApprovalSchema = new Schema(
  {
    _id: { type: String, required: true },
    intentId: { type: String, required: true, index: true },
    decisionId: { type: String, required: true, index: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "EXPIRED"], default: "PENDING", index: true },
    requestedAmount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    proposal: { type: Schema.Types.Mixed, required: true },
    proposalSnapshot: { type: Schema.Types.Mixed, required: true },
    reason: { type: String, required: true },
    createdAt: { type: String, required: true },
    resolvedAt: { type: String },
    approvalToken: { type: String, index: true },
    expiresAt: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false, timestamps: false }
);

ApprovalSchema.index({ createdAt: -1 });

export const ApprovalModel = mongoose.models.Approval || mongoose.model<ApprovalDoc>("Approval", ApprovalSchema);

// ============================================================================
// 4. Payment Model
// ============================================================================
export interface PaymentDoc extends Omit<PaymentExecution, "id"> {
  _id: string;
}

const PaymentSchema = new Schema(
  {
    _id: { type: String, required: true },
    intentId: { type: String, required: true, index: true },
    decisionId: { type: String, index: true },
    approvalId: { type: String, index: true },
    proposalId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    merchant: { type: String, required: true },
    product: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "PENDING",
        "AUTHORIZED",
        "ORDER_CREATED",
        "CHECKOUT_OPENED",
        "PAYMENT_RECEIVED",
        "PAYMENT_VERIFIED",
        "COMPLETED",
        "BLOCKED",
        "FAILED",
      ],
      required: true,
      index: true,
    },
    authorizationMethod: { type: String, enum: ["AUTO_ALLOWED", "USER_APPROVAL"], required: true },
    paymentRail: { type: String, enum: ["simulated", "razorpay_test"], default: "simulated", index: true },
    approvalToken: { type: String },
    gatewayTransactionId: { type: String, required: true, index: true },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: { type: String },
    amountInPaise: { type: Number },
    isSimulated: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    completedAt: { type: String },
    failureReason: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false, timestamps: false }
);

PaymentSchema.index({ createdAt: -1 });

export const PaymentModel = mongoose.models.Payment || mongoose.model<PaymentDoc>("Payment", PaymentSchema);

// ============================================================================
// 5. Ledger Model (Append-Only)
// ============================================================================
export interface LedgerDoc extends Omit<LedgerEvent, "id"> {
  _id: string;
}

const LedgerSchema = new Schema(
  {
    _id: { type: String, required: true },
    intentId: { type: String, required: true, index: true },
    proposalId: { type: String },
    decisionId: { type: String },
    approvalId: { type: String },
    paymentId: { type: String },
    eventType: { type: String, required: true, index: true },
    timestamp: { type: String, required: true },
    actor: { type: String, enum: ["USER", "AI_AGENT", "INTENT_ENGINE", "PAYMENT_GATEWAY", "SYSTEM"], required: true },
    decision: { type: String },
    riskScore: { type: Number },
    summary: { type: String, required: true },
    details: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false, timestamps: false }
);

LedgerSchema.index({ timestamp: 1 });
LedgerSchema.index({ timestamp: -1 });

export const LedgerModel = mongoose.models.Ledger || mongoose.model<LedgerDoc>("Ledger", LedgerSchema);
