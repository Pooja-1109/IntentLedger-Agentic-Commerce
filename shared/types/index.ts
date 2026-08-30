/**
 * IntentLedger Shared Domain Types
 * Core contracts shared between frontend and backend
 */

export type IntentCategory = "shopping" | "payment" | "subscription" | "transfer" | "other";

export interface IntentConstraints {
  maxAmount?: number;
  currency?: string;
  merchant?: string;
  productCategory?: string;
  allowedMerchants?: string[];
  blockedMerchants?: string[];
  quantity?: number;
  requiresApproval: boolean;
}

export interface IntentPermissions {
  canPurchase: boolean;
  canSubscribe: boolean;
  canTransfer: boolean;
  canChangeQuantity: boolean;
}

export interface Intent {
  id: string;
  userId: string;
  rawText: string;
  category: IntentCategory;
  constraints: IntentConstraints;
  permissions: IntentPermissions;
  status: "active" | "completed" | "cancelled" | "expired";
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export type AgentActionType = "purchase" | "subscribe" | "transfer" | "quote" | "reserve";

export interface AgentProposal {
  id: string;
  intentId: string;
  agentId?: string;
  agentName?: string;
  action: AgentActionType;
  product: string;
  merchant: string;
  amount: number;
  currency: string;
  quantity: number;
  isSubscription?: boolean;
  subscriptionFrequency?: "weekly" | "monthly" | "yearly";
  proposedAt: string;
  metadata?: Record<string, unknown>;
}

export type DecisionType = "ALLOW" | "ASK_APPROVAL" | "BLOCK";

export type ViolationCode =
  | "PROPOSED_AMOUNT_EXCEEDS_MAXIMUM"
  | "MERCHANT_NOT_ALLOWED"
  | "MERCHANT_EXPLICITLY_BLOCKED"
  | "SUBSCRIPTION_NOT_PERMITTED"
  | "TRANSFER_NOT_PERMITTED"
  | "PURCHASE_NOT_PERMITTED"
  | "QUANTITY_EXCEEDED"
  | "CURRENCY_MISMATCH"
  | "CATEGORY_MISMATCH"
  | "INTENT_EXPIRED"
  | "INTENT_CANCELLED"
  | "MANUAL_APPROVAL_REQUIRED"
  | "APPROVAL_CONTEXT_MISMATCH"
  | "APPROVAL_EXPIRED"
  | "APPROVAL_TOKEN_INVALID"
  | "APPROVAL_NOT_GRANTED"
  | "PAYMENT_CONTEXT_MISMATCH"
  | "PAYMENT_VERIFICATION_FAILED";

export interface PolicyCheck {
  id: string;
  name: string;
  status: "PASS" | "WARN" | "FAIL";
  passed: boolean;
  severity: "critical" | "warning" | "info";
  message: string;
  expectedValue?: string | number | boolean;
  actualValue?: string | number | boolean;
}

export interface PolicyViolation {
  code: ViolationCode | string;
  field: string;
  expected: unknown;
  actual: unknown;
  deviation?: number;
  explanation: string;
}

export interface IntentDriftItem {
  field: string;
  label: string;
  originalIntent: string | number | boolean;
  proposedAction: string | number | boolean;
  deviation?: string;
  type: "INCREASE" | "DECREASE" | "CHANGED" | "UNAUTHORIZED" | "MATCH";
  isViolation: boolean;
}

export interface IntentDriftReport {
  hasDrift: boolean;
  severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  driftItems: IntentDriftItem[];
  summary: string;
}

export interface DecisionResult {
  id: string;
  intentId: string;
  proposalId: string;
  proposal?: AgentProposal;
  intent?: Intent;
  decision: DecisionType;
  riskScore: number;
  violations: PolicyViolation[];
  warnings: string[];
  explanation: string;
  checks: PolicyCheck[];
  driftReport: IntentDriftReport;
  evaluatedAt: string;
  requiresUserApproval: boolean;
  approvalId?: string;
}

export type LedgerEventType =
  | "INTENT_CREATED"
  | "INTENT_COMPILED"
  | "AGENT_PROPOSAL_CREATED"
  | "POLICY_CHECK_STARTED"
  | "POLICY_CHECK_COMPLETED"
  | "INTENT_DRIFT_DETECTED"
  | "DECISION_MADE"
  | "APPROVAL_REQUESTED"
  | "APPROVAL_GRANTED"
  | "APPROVAL_REJECTED"
  | "APPROVAL_EXPIRED"
  | "PAYMENT_AUTHORIZATION_REQUESTED"
  | "PAYMENT_AUTHORIZED"
  | "RAZORPAY_ORDER_CREATED"
  | "RAZORPAY_CHECKOUT_STARTED"
  | "RAZORPAY_PAYMENT_RECEIVED"
  | "RAZORPAY_PAYMENT_VERIFIED"
  | "RAZORPAY_PAYMENT_FAILED"
  | "PAYMENT_COMPLETED"
  | "PAYMENT_CONTEXT_MISMATCH"
  | "PAYMENT_BLOCKED"
  | "PAYMENT_FAILED"
  | "WEBHOOK_RECEIVED";

export interface LedgerEvent {
  id: string;
  intentId: string;
  proposalId?: string;
  decisionId?: string;
  approvalId?: string;
  paymentId?: string;
  eventType: LedgerEventType;
  timestamp: string;
  actor: "USER" | "AI_AGENT" | "INTENT_ENGINE" | "PAYMENT_GATEWAY" | "SYSTEM";
  decision?: DecisionType;
  riskScore?: number;
  summary: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface ApprovalRequest {
  id: string;
  intentId: string;
  decisionId: string;
  status: ApprovalStatus;
  requestedAmount: number;
  currency: string;
  proposal: AgentProposal;
  proposalSnapshot: AgentProposal;
  reason: string;
  createdAt: string;
  resolvedAt?: string;
  approvalToken?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "ORDER_CREATED"
  | "CHECKOUT_OPENED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_VERIFIED"
  | "COMPLETED"
  | "BLOCKED"
  | "FAILED";

export type AuthorizationMethod = "AUTO_ALLOWED" | "USER_APPROVAL";
export type PaymentRail = "simulated" | "razorpay_test";

export interface PaymentExecution {
  id: string;
  intentId: string;
  decisionId?: string;
  approvalId?: string;
  proposalId?: string;
  amount: number;
  currency: string;
  merchant: string;
  product: string;
  status: PaymentStatus;
  authorizationMethod: AuthorizationMethod;
  paymentRail: PaymentRail;
  approvalToken?: string;
  gatewayTransactionId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amountInPaise?: number;
  isSimulated: boolean;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
  ledgerEventId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthorizedPaymentContext {
  intentId: string;
  decisionId: string;
  approvalId?: string;
  amount: number;
  currency: string;
  merchant: string;
  product: string;
  action: AgentActionType;
  authorizationMethod: AuthorizationMethod;
  approvalToken?: string;
}

export interface RazorpayCheckoutData {
  orderId: string;
  keyId: string;
  amount: number; // In paise
  currency: string;
  paymentId: string;
  intentId: string;
  notes?: Record<string, string>;
}

export interface RazorpayVerificationPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  internalPaymentId: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  category: string;
  intentId: string;
  rawIntent: string;
  proposal: {
    product: string;
    merchant: string;
    amount: number;
    currency: string;
    quantity: number;
    action: AgentActionType;
    isSubscription?: boolean;
  };
  expectedDecision: DecisionType;
  expectedRisk: number;
  highlightNote: string;
}

export interface SystemStats {
  activeIntents: number;
  decisionsEvaluated: number;
  driftDetectedCount: number;
  pendingApprovals: number;
  totalApprovals: number;
  completedPayments: number;
  blockedActions: number;
  totalLedgerEvents: number;
  razorpayTestOrders?: number;
  verifiedPayments?: number;
  paymentFailures?: number;
  contextMismatches?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    mode?: "ai" | "deterministic_fallback" | "in_memory" | "mongodb" | string;
    paymentRail?: PaymentRail;
    total?: number;
    [key: string]: unknown;
  };
}
