import { intentRepository } from "../repositories/intent.repository";
import { decisionRepository } from "../repositories/decision.repository";
import { approvalRepository } from "../repositories/approval.repository";
import { paymentRepository } from "../repositories/payment.repository";
import { ledgerRepository } from "../repositories/ledger.repository";
import { Intent, DecisionResult, ApprovalRequest, PaymentExecution, LedgerEvent } from "../types";

async function runPersistenceTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING PERSISTENCE & DASHBOARD AGGREGATION TESTS");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   ${detail}`);
      failed++;
    }
  }

  // 1. Intent Persistence
  const testIntent: Intent = {
    id: "intent_persist_01",
    userId: "user_persist",
    rawText: "Buy groceries under ₹2,000",
    category: "shopping",
    constraints: { maxAmount: 2000, currency: "INR", requiresApproval: true },
    permissions: { canPurchase: true, canSubscribe: false, canTransfer: false, canChangeQuantity: true },
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const savedIntent = await intentRepository.create(testIntent);
  const fetchedIntent = await intentRepository.findById(testIntent.id);
  assert(
    fetchedIntent?.id === testIntent.id && fetchedIntent?.constraints.maxAmount === 2000,
    "1. Intent Repository successfully persists and retrieves intent record"
  );

  // 2. Decision Persistence
  const testDecision: DecisionResult = {
    id: "dec_persist_01",
    intentId: savedIntent.id,
    proposalId: "prop_01",
    decision: "ALLOW",
    riskScore: 10,
    violations: [],
    warnings: [],
    explanation: "Compliant",
    checks: [],
    driftReport: { hasDrift: false, severity: "NONE", driftItems: [], summary: "Safe" },
    evaluatedAt: new Date().toISOString(),
    requiresUserApproval: false,
  };
  await decisionRepository.save(testDecision);
  const fetchedDecision = await decisionRepository.findById(testDecision.id);
  assert(
    fetchedDecision?.id === testDecision.id && fetchedDecision?.decision === "ALLOW",
    "2. Decision Repository persists evaluation result"
  );

  // 3. Approval Persistence
  const testApproval: ApprovalRequest = {
    id: "appr_persist_01",
    intentId: savedIntent.id,
    decisionId: testDecision.id,
    status: "PENDING",
    requestedAmount: 1500,
    currency: "INR",
    proposal: {
      id: "prop_01",
      intentId: savedIntent.id,
      product: "Groceries Box",
      merchant: "Blinkit",
      amount: 1500,
      currency: "INR",
      quantity: 1,
      action: "purchase",
      proposedAt: new Date().toISOString(),
    },
    proposalSnapshot: {
      id: "prop_01",
      intentId: savedIntent.id,
      product: "Groceries Box",
      merchant: "Blinkit",
      amount: 1500,
      currency: "INR",
      quantity: 1,
      action: "purchase",
      proposedAt: new Date().toISOString(),
    },
    reason: "Mandatory confirmation",
    createdAt: new Date().toISOString(),
  };
  await approvalRepository.create(testApproval);
  const pendingApprovals = await approvalRepository.findPending();
  assert(
    pendingApprovals.some((a) => a.id === testApproval.id),
    "3. Approval Repository persists pending request and queries pending queue"
  );

  // 4. Payment Persistence
  const testPayment: PaymentExecution = {
    id: "pay_persist_01",
    intentId: savedIntent.id,
    amount: 1500,
    currency: "INR",
    merchant: "Blinkit",
    product: "Groceries Box",
    status: "COMPLETED",
    authorizationMethod: "USER_APPROVAL",
    paymentRail: "simulated",
    gatewayTransactionId: "rzp_sim_test_01",
    isSimulated: true,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
  await paymentRepository.create(testPayment);
  const fetchedPayment = await paymentRepository.findById(testPayment.id);
  assert(
    fetchedPayment?.id === testPayment.id && fetchedPayment?.status === "COMPLETED",
    "4. Payment Repository persists payment execution with transaction ID"
  );

  // 5. Append-Only Ledger Immutability
  const testEvent: LedgerEvent = {
    id: "evt_persist_01",
    intentId: savedIntent.id,
    eventType: "PAYMENT_COMPLETED",
    timestamp: new Date().toISOString(),
    actor: "PAYMENT_GATEWAY",
    summary: "Test payment completion event logged to immutable ledger.",
  };
  await ledgerRepository.append(testEvent);
  const events = await ledgerRepository.findByIntentId(savedIntent.id);
  assert(
    events.some((e) => e.id === testEvent.id),
    "5. Append-only Ledger records chronological audit event"
  );

  // 6. Metrics & Dashboard Aggregation
  const intentCount = await intentRepository.count();
  const paymentCounts = await paymentRepository.count();
  assert(
    intentCount >= 1 && paymentCounts.completed >= 1,
    "6. Real-time metric counters compute active intents and completed payments accurately"
  );

  // 7. Ledger Immutability Check
  const hasUpdateMethod = "update" in ledgerRepository;
  const hasDeleteMethod = "delete" in ledgerRepository;
  assert(
    !hasUpdateMethod && !hasDeleteMethod,
    "7. Ledger repository enforces append-only immutability contract (no update/delete methods)"
  );

  console.log("==================================================");
  console.log(`Persistence Results: ${passed}/${passed + failed} Tests Passed. Failed: ${failed}`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runPersistenceTests();
