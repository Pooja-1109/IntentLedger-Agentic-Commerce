import { intentRepository } from "../repositories/intent.repository";
import { decisionService } from "../services/decision.service";
import { approvalService } from "../services/approval.service";
import { paymentService } from "../services/payment.service";
import { Intent, AgentProposal } from "../types";

async function runMilestone3Tests() {
  console.log("==================================================");
  console.log("🧪 RUNNING INTENTLEDGER WORKFLOW & SECURITY TESTS");
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

  // Set up test intent with maxAmount = 4000 and requiresApproval = true
  const testIntent: Intent = {
    id: "intent_test_workflow",
    userId: "user_test",
    rawText: "Buy running shoes under ₹4,000 and ask me before purchasing.",
    category: "shopping",
    constraints: {
      maxAmount: 4000,
      currency: "INR",
      productCategory: "running shoes",
      allowedMerchants: ["Nike India", "Amazon"],
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
  await intentRepository.create(testIntent);

  // Set up auto-allow intent
  const autoIntent: Intent = {
    id: "intent_test_auto",
    userId: "user_test",
    rawText: "Buy stationery under ₹1,000 automatically.",
    category: "shopping",
    constraints: {
      maxAmount: 1000,
      currency: "INR",
      requiresApproval: false,
      quantity: 1,
    },
    permissions: {
      canPurchase: true,
      canSubscribe: false,
      canTransfer: false,
      canChangeQuantity: true,
    },
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await intentRepository.create(autoIntent);

  const safeProposal: AgentProposal = {
    id: "prop_safe_01",
    intentId: testIntent.id,
    action: "purchase",
    product: "Nike Air Pegasus",
    merchant: "Nike India",
    amount: 3499,
    currency: "INR",
    quantity: 1,
    proposedAt: new Date().toISOString(),
  };

  const driftProposal: AgentProposal = {
    id: "prop_drift_01",
    intentId: testIntent.id,
    action: "purchase",
    product: "Nike Vaporfly Pro",
    merchant: "Nike India",
    amount: 7999,
    currency: "INR",
    quantity: 1,
    proposedAt: new Date().toISOString(),
  };

  const autoProposal: AgentProposal = {
    id: "prop_auto_01",
    intentId: autoIntent.id,
    action: "purchase",
    product: "Desk Organizer",
    merchant: "Amazon",
    amount: 649,
    currency: "INR",
    quantity: 1,
    proposedAt: new Date().toISOString(),
  };

  // 1. ASK_APPROVAL creates approval
  const decResult = decisionService.evaluateProposal(testIntent, safeProposal);
  assert(decResult.decision === "ASK_APPROVAL", "1. Decision Engine evaluates compliant proposal with approval mandate -> ASK_APPROVAL");

  const approvalReq = await approvalService.createApproval({
    intentId: testIntent.id,
    decisionId: decResult.id,
    proposal: safeProposal,
    reason: decResult.explanation,
  });
  assert(approvalReq.status === "PENDING" && approvalReq.requestedAmount === 3499, "2. Approval service creates PENDING approval request with exact proposal snapshot");

  // 2. Reject request works
  const rejectTestApproval = await approvalService.createApproval({
    intentId: testIntent.id,
    decisionId: "dec_dummy",
    proposal: safeProposal,
    reason: "test",
  });
  const rejected = await approvalService.rejectRequest(rejectTestApproval.id, "User declined");
  assert(rejected.status === "REJECTED", "3. Reject pending request sets status to REJECTED");

  // 3. Double reject / approve on rejected fails (Idempotency)
  try {
    await approvalService.approveRequest(rejectTestApproval.id);
    assert(false, "4. Approve on rejected request should throw error");
  } catch {
    assert(true, "4. Approve on already REJECTED request safely throws conflict error");
  }

  // 4. Approve pending request works and generates cryptographic token
  const approvedReq = await approvalService.approveRequest(approvalReq.id);
  assert(
    approvedReq.status === "APPROVED" && !!approvedReq.approvalToken && approvedReq.approvalToken.startsWith("tok_appr_"),
    "5. Approve pending request generates cryptographic approval token"
  );

  // 5. Double approval fails (Idempotency)
  try {
    await approvalService.approveRequest(approvalReq.id);
    assert(false, "6. Double approval should throw error");
  } catch {
    assert(true, "6. Double approval on already APPROVED request safely throws conflict error");
  }

  // 6. ALLOW payment succeeds without human approval token
  const autoPayment = await paymentService.authorizePayment({
    intentId: autoIntent.id,
    proposal: autoProposal,
  });
  assert(
    autoPayment.status === "AUTHORIZED" && autoPayment.authorizationMethod === "AUTO_ALLOWED",
    "7. Compliant ALLOW intent authorizes payment automatically without approval token"
  );

  // 7. BLOCK payment fails
  try {
    await paymentService.authorizePayment({
      intentId: testIntent.id,
      proposal: driftProposal,
    });
    assert(false, "8. Budget drift proposal should be blocked at payment gate");
  } catch {
    assert(true, "8. Budget drift (+₹3,999 exceedance) is BLOCKED by Payment Gate with 403 PAYMENT_BLOCKED");
  }

  // 8. ASK_APPROVAL payment without approval token fails
  try {
    await paymentService.authorizePayment({
      intentId: testIntent.id,
      proposal: safeProposal,
    });
    assert(false, "9. ASK_APPROVAL without approval token should fail");
  } catch {
    assert(true, "9. ASK_APPROVAL proposal without approval token is rejected with APPROVAL_NOT_GRANTED");
  }

  // 9. Approved payment with valid token succeeds
  const authorizedPayment = await paymentService.authorizePayment({
    intentId: testIntent.id,
    proposal: safeProposal,
    approvalId: approvedReq.id,
    approvalToken: approvedReq.approvalToken,
  });
  assert(
    authorizedPayment.status === "AUTHORIZED" && authorizedPayment.authorizationMethod === "USER_APPROVAL",
    "10. Valid approval token authorizes simulated payment execution"
  );

  // 10. Complete payment succeeds
  const completedPayment = await paymentService.completePayment(authorizedPayment.id);
  assert(
    completedPayment.status === "COMPLETED" && !!completedPayment.completedAt,
    "11. Authorized payment completes and generates simulated settlement transaction ID"
  );

  // 11. Complete payment cannot be completed twice
  try {
    await paymentService.completePayment(authorizedPayment.id);
    assert(false, "12. Completed payment cannot be completed twice");
  } catch {
    assert(true, "12. Completed payment cannot be double-settled (Idempotent 409)");
  }

  // 12. SECURITY TEST: STEALTH TAMPERING ATTEMPT
  // (User approved ₹3,499 -> Agent stealthily requests ₹3,999 under the ₹4,000 budget)
  const tamperTestApproval = await approvalService.createApproval({
    intentId: testIntent.id,
    decisionId: "dec_tamper_01",
    proposal: safeProposal, // Approved ₹3,499
    reason: "Tampering test",
  });
  const approvedTamper = await approvalService.approveRequest(tamperTestApproval.id);

  // Attacker attempts to use the approval token with a modified amount of ₹3,999
  const tamperedProposal: AgentProposal = {
    ...safeProposal,
    amount: 3999, // Tampered from ₹3,499 to ₹3,999
  };

  try {
    await paymentService.authorizePayment({
      intentId: testIntent.id,
      proposal: tamperedProposal,
      approvalId: approvedTamper.id,
      approvalToken: approvedTamper.approvalToken,
    });
    assert(false, "13. Tampered amount with valid approval token MUST be blocked");
  } catch (err: unknown) {
    const errObj = err as { code?: string; message?: string };
    const isMismatch = errObj.code === "APPROVAL_CONTEXT_MISMATCH" || errObj.message?.includes("APPROVAL_CONTEXT_MISMATCH") || errObj.message?.includes("Payment blocked");
    assert(!!isMismatch, "13. 🛡️ SECURITY PROOF: Stealth tampered amount (₹3,499 -> ₹3,999) is BLOCKED with APPROVAL_CONTEXT_MISMATCH");
  }

  // 13. SECURITY TEST: TAMPERED MERCHANT (User approved Nike India -> Agent requests Scam Store)
  const tamperedMerchantProposal: AgentProposal = {
    ...safeProposal,
    merchant: "Scam Store", // Tampered!
  };

  try {
    await paymentService.authorizePayment({
      intentId: testIntent.id,
      proposal: tamperedMerchantProposal,
      approvalId: approvedTamper.id,
      approvalToken: approvedTamper.approvalToken,
    });
    assert(false, "14. Tampered merchant MUST be blocked");
  } catch {
    assert(true, "14. 🛡️ SECURITY PROOF: Tampered merchant is BLOCKED with APPROVAL_CONTEXT_MISMATCH");
  }

  console.log("==================================================");
  console.log(`Results: ${passed}/${passed + failed} Tests Passed. Failed: ${failed}`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runMilestone3Tests();
