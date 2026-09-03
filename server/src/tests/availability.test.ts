import { availabilityService } from "../services/availability.service";
import { decisionService } from "../services/decision.service";
import { approvalService } from "../services/approval.service";
import { paymentService } from "../services/payment.service";
import { intentRepository } from "../repositories/intent.repository";
import { approvalRepository } from "../repositories/approval.repository";
import { ledgerRepository } from "../repositories/ledger.repository";
import { paymentRepository } from "../repositories/payment.repository";
import { Intent, AgentProposal } from "../types";

async function runAvailabilityTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING DYNAMIC AVAILABILITY & COMMERCE PRICING TESTS");
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

  // Set up cord set kurti intent (₹1,500 limit, requires approval)
  const kurtiIntent: Intent = {
    id: "intent_test_cord_set_kurti",
    userId: "user_fashion_01",
    rawText: "I want to buy a cord set kurti for ₹1,500. Ask me before purchasing.",
    category: "shopping",
    constraints: {
      maxAmount: 1500,
      currency: "INR",
      productCategory: "clothing",
      allowedMerchants: ["Myntra", "Ajio", "Approved Fashion Store"],
      requiresApproval: true,
      quantity: 1,
    },
    permissions: {
      canPurchase: true,
      canSubscribe: false,
      canTransfer: false,
      canChangeQuantity: false,
    },
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await intentRepository.create(kurtiIntent);

  // 1. Available price below authority produces valid proposal and ASK_APPROVAL verdict
  const kurtiAvailability = availabilityService.getCandidatesForIntent(kurtiIntent);
  const valueCandidate = kurtiAvailability.candidates.find((c) => c.matchTier === "within_budget");
  assert(
    !!valueCandidate && valueCandidate.totalPrice === 1299 && valueCandidate.totalPrice < 1500,
    "1. Available price below authority (₹1,299 vs ₹1,500 max) generates realistic compliant proposal"
  );

  const valueProposal: AgentProposal = {
    id: "prop_kurti_value_01",
    intentId: kurtiIntent.id,
    action: "purchase",
    product: valueCandidate!.name,
    merchant: valueCandidate!.merchant,
    amount: valueCandidate!.totalPrice,
    currency: "INR",
    quantity: 1,
    proposedAt: new Date().toISOString(),
  };
  const valueDecision = decisionService.evaluateProposal(kurtiIntent, valueProposal);
  assert(
    valueDecision.decision === "ASK_APPROVAL" && valueDecision.violations.length === 0,
    "1b. Proposal below authority evaluates to ASK_APPROVAL (Review Mandate) due to human approval constraint"
  );

  // 2. Available price near / at authority is valid
  const exactCandidate = kurtiAvailability.candidates.find((c) => c.matchTier === "exact_budget");
  assert(
    !!exactCandidate && exactCandidate.totalPrice <= 1500 && exactCandidate.totalPrice > 1350,
    "2. Available price near boundary (₹1,449 vs ₹1,500 limit) produces valid proposal within spending authority"
  );
  const exactProposal: AgentProposal = {
    id: "prop_kurti_exact_01",
    intentId: kurtiIntent.id,
    action: "purchase",
    product: exactCandidate!.name,
    merchant: exactCandidate!.merchant,
    amount: exactCandidate!.totalPrice,
    currency: "INR",
    quantity: 1,
    proposedAt: new Date().toISOString(),
  };
  const exactDecision = decisionService.evaluateProposal(kurtiIntent, exactProposal);
  assert(
    exactDecision.decision === "ASK_APPROVAL" && exactDecision.violations.length === 0,
    "2b. Candidate at boundary is compliant and triggers ASK_APPROVAL review mandate"
  );

  // 3. Available price above authority is deterministically BLOCKED
  const driftCandidate = kurtiAvailability.candidates.find((c) => c.matchTier === "budget_drift");
  assert(
    !!driftCandidate && driftCandidate.totalPrice === 1699 && driftCandidate.totalPrice > 1500,
    "3. Available price above authority (₹1,699 vs ₹1,500 limit) discovers realistic market exceedance candidate"
  );
  const driftProposal: AgentProposal = {
    id: "prop_kurti_drift_01",
    intentId: kurtiIntent.id,
    action: "purchase",
    product: driftCandidate!.name,
    merchant: driftCandidate!.merchant,
    amount: driftCandidate!.totalPrice,
    currency: "INR",
    quantity: 1,
    proposedAt: new Date().toISOString(),
  };
  const driftDecision = decisionService.evaluateProposal(kurtiIntent, driftProposal);
  assert(
    driftDecision.decision === "BLOCK" &&
    driftDecision.violations.some((v) => v.code === "PROPOSED_AMOUNT_EXCEEDS_MAXIMUM"),
    "3b. Over-budget candidate (₹1,699) is deterministically BLOCKED with PROPOSED_AMOUNT_EXCEEDS_MAXIMUM"
  );

  // 4. Security rule: Agent proposal NEVER modifies user authorization boundary
  const fetchedIntentAfterProposals = await intentRepository.findById(kurtiIntent.id);
  assert(
    fetchedIntentAfterProposals?.constraints.maxAmount === 1500,
    "4. 🛡️ SECURITY PROOF: Agent proposal never mutates user authorization boundary (stays fixed at ₹1,500)"
  );

  // 5. Different product categories produce different realistic candidate prices
  const laptopIntent: Intent = {
    id: "intent_test_laptop",
    userId: "user_tech_01",
    rawText: "Allow my procurement agent to buy an engineering laptop under ₹40,000 with human approval.",
    category: "shopping",
    constraints: { maxAmount: 40000, currency: "INR", productCategory: "laptop", requiresApproval: true, quantity: 1 },
    permissions: { canPurchase: true, canSubscribe: false, canTransfer: false, canChangeQuantity: false },
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const monitorIntent: Intent = {
    id: "intent_test_monitor",
    userId: "user_tech_01",
    rawText: "Allow my procurement agent to buy a monitor up to ₹25,000 from an approved vendor.",
    category: "shopping",
    constraints: { maxAmount: 25000, currency: "INR", productCategory: "monitor", requiresApproval: true, quantity: 1 },
    permissions: { canPurchase: true, canSubscribe: false, canTransfer: false, canChangeQuantity: false },
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const laptopAvail = availabilityService.getCandidatesForIntent(laptopIntent);
  const monitorAvail = availabilityService.getCandidatesForIntent(monitorIntent);

  assert(
    laptopAvail.candidates[0].totalPrice > 30000 &&
    monitorAvail.candidates[0].totalPrice > 15000 &&
    laptopAvail.candidates[0].totalPrice !== monitorAvail.candidates[0].totalPrice &&
    kurtiAvailability.candidates[0].totalPrice === 1299,
    "5. Different product categories produce distinct realistic prices (Laptop: ₹35,000+, Monitor: ₹18,500+, Kurti: ₹1,299)"
  );

  // 6. Quantity affects total transaction amount (unitPrice * quantity)
  const notebookIntent: Intent = {
    id: "intent_test_notebooks",
    userId: "user_stat_01",
    rawText: "I want to buy a set of 6 notebooks for around ₹500 to ₹600 from an approved store.",
    category: "shopping",
    constraints: { maxAmount: 600, currency: "INR", productCategory: "notebooks", requiresApproval: true, quantity: 6 },
    permissions: { canPurchase: true, canSubscribe: false, canTransfer: false, canChangeQuantity: true },
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const notebookAvail = availabilityService.getCandidatesForIntent(notebookIntent);
  const nbCand = notebookAvail.candidates[0];
  assert(
    nbCand.quantity === 6 &&
    nbCand.totalPrice === nbCand.unitPrice * nbCand.quantity &&
    nbCand.totalPrice <= 600,
    "6. Quantity multiplies unit price into accurate total transaction amount (6 × ₹85 = ₹510)"
  );

  // 7. Same proposal snapshot is preserved through Decision -> Approval -> Payment Gate -> Ledger
  const kurtiApproval = await approvalService.createApproval({
    intentId: kurtiIntent.id,
    decisionId: valueDecision.id,
    proposal: valueProposal,
    reason: valueDecision.explanation,
  });
  const approvedKurti = await approvalService.approveRequest(kurtiApproval.id);

  assert(
    approvedKurti.requestedAmount === 1299 &&
    approvedKurti.proposal.product === "Daily Cotton Cord Set Kurti" &&
    approvedKurti.proposal.amount === 1299,
    "7. Canonical proposal snapshot (₹1,299 'Daily Cotton Cord Set Kurti') preserved identically in approval"
  );

  const kurtiPayment = await paymentService.authorizePayment({
    intentId: kurtiIntent.id,
    proposal: approvedKurti.proposal,
    approvalId: approvedKurti.id,
    approvalToken: approvedKurti.approvalToken,
  });
  assert(
    kurtiPayment.status === "AUTHORIZED" &&
    kurtiPayment.amount === 1299 &&
    kurtiPayment.product === "Daily Cotton Cord Set Kurti",
    "7b. Payment Gate authorizes exact canonical snapshot (₹1,299) without alteration"
  );

  const completedKurtiPay = await paymentService.completePayment(kurtiPayment.id);
  assert(
    completedKurtiPay.status === "COMPLETED" && completedKurtiPay.amount === 1299,
    "7c. Payment completes and records exact canonical transaction"
  );

  // 8. Blocked proposal cannot create approval or payment
  try {
    await paymentService.authorizePayment({
      intentId: kurtiIntent.id,
      proposal: driftProposal,
    });
    assert(false, "8. Over-budget proposal should be blocked from payment");
  } catch {
    assert(true, "8. Blocked proposal (₹1,699 > ₹1,500) halts payment authorization before order creation");
  }

  // 9. Refresh does not lose the canonical transaction
  const fetchedPay = await paymentRepository.findById(completedKurtiPay.id);
  const fetchedLedger = await ledgerRepository.findByIntentId(kurtiIntent.id);
  assert(
    fetchedPay?.status === "COMPLETED" &&
    fetchedPay.amount === 1299 &&
    fetchedLedger.length >= 2,
    "9. State refresh / persistence lookup faithfully preserves completed transaction and ledger events"
  );

  // 10. Helper generateProposalForIntent returns reproducible dynamic proposals
  const directProp = availabilityService.generateProposalForIntent(kurtiIntent);
  assert(
    directProp.amount === 1299 && directProp.currency === "INR" && directProp.product.includes("Cord Set Kurti"),
    "10. Dynamic proposal generation utility yields reproducible, structured agent proposals"
  );

  console.log("==================================================");
  console.log(`Availability Results: ${passed}/${passed + failed} Tests Passed. Failed: ${failed}`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runAvailabilityTests();
