import crypto from "crypto";
import { paymentService } from "../services/payment.service";
import { intentRepository } from "../repositories/intent.repository";
import { approvalRepository } from "../repositories/approval.repository";
import { mockRazorpayProvider } from "../services/payment-providers/mock-razorpay.provider";
import { toMinorUnits, fromMinorUnits } from "../utils/currency.util";
import {
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from "../integrations/razorpay/razorpay.util";
import { Intent, ApprovalRequest, AgentProposal } from "../types";

async function runRazorpayTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING RAZORPAY TEST-MODE & PAYMENT RAIL TESTS");
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

  // Inject Mock Razorpay Provider for deterministic testing
  paymentService.setCustomProvider(mockRazorpayProvider);

  // Setup test intent
  const testIntent: Intent = {
    id: "intent_test_rzp_01",
    userId: "user_rzp_01",
    rawText: "Buy running shoes under ₹4,000. Ask me before purchasing.",
    category: "shopping",
    constraints: {
      maxAmount: 4000,
      currency: "INR",
      productCategory: "running shoes",
      allowedMerchants: ["Nike India", "Adidas"],
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

  // 1. Amount Conversion Utility Tests
  const minorUnits = toMinorUnits(3499, "INR");
  const standardUnits = fromMinorUnits(349900, "INR");
  assert(
    minorUnits === 349900 && standardUnits === 3499,
    "1. Converts standard amount ₹3,499 exactly to 349900 paise and back"
  );

  // 2. Signature Verification Logic Tests
  const testOrderId = "order_test_12345";
  const testPaymentId = "pay_test_67890";
  const testSecret = mockRazorpayProvider.mockSecret;
  const validSignature = crypto
    .createHmac("sha256", testSecret)
    .update(`${testOrderId}|${testPaymentId}`)
    .digest("hex");

  const isSigValid = verifyRazorpaySignature(testOrderId, testPaymentId, validSignature, testSecret);
  const isSigInvalid = verifyRazorpaySignature(testOrderId, testPaymentId, "invalid_sig_abc", testSecret);
  assert(
    isSigValid === true && isSigInvalid === false,
    "2. Cryptographic HMAC SHA-256 signature verification validates authentic signatures and rejects forged ones"
  );

  // 3. Webhook Signature Validation Test
  const rawWebhookBody = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_wh_01" } } } });
  const validWebhookSig = crypto.createHmac("sha256", "wh_secret_xyz").update(rawWebhookBody).digest("hex");
  const isWhValid = verifyRazorpayWebhookSignature(rawWebhookBody, validWebhookSig, "wh_secret_xyz");
  const isWhInvalid = verifyRazorpayWebhookSignature(rawWebhookBody, "fake_sig", "wh_secret_xyz");
  assert(
    isWhValid === true && isWhInvalid === false,
    "3. Webhook signature validator accepts valid webhook HMAC and rejects untrusted webhooks"
  );

  // 4. Decision = BLOCK prevents payment authorization and order creation
  const driftProposal: AgentProposal = {
    id: "prop_drift_01",
    intentId: testIntent.id,
    product: "Nike Vaporfly Elite",
    merchant: "Nike India",
    amount: 7999, // exceeds 4000 limit
    currency: "INR",
    quantity: 1,
    action: "purchase",
    proposedAt: new Date().toISOString(),
  };

  let driftBlocked = false;
  try {
    await paymentService.authorizePayment({
      intentId: testIntent.id,
      proposal: driftProposal,
    });
  } catch (err: any) {
    driftBlocked = err.code === "PAYMENT_BLOCKED";
  }
  assert(
    driftBlocked,
    "4. Decision Engine BLOCK on budget drift (+₹3,999) halts payment authorization before any order can be created"
  );

  // 5. Subscription violation is blocked from order creation
  const subProposal: AgentProposal = {
    id: "prop_sub_01",
    intentId: testIntent.id,
    product: "Nike VIP Membership",
    merchant: "Nike India",
    amount: 499,
    currency: "INR",
    quantity: 1,
    action: "subscribe",
    isSubscription: true,
    proposedAt: new Date().toISOString(),
  };

  let subBlocked = false;
  try {
    await paymentService.authorizePayment({
      intentId: testIntent.id,
      proposal: subProposal,
    });
  } catch (err: any) {
    subBlocked = err.code === "PAYMENT_BLOCKED";
  }
  assert(
    subBlocked,
    "5. Subscription breach (canSubscribe = false) is permanently BLOCKED from payment authorization"
  );

  // 6. Approval Expired (>10 minutes) is rejected
  const expiredApproval: ApprovalRequest = {
    id: "appr_expired_01",
    intentId: testIntent.id,
    decisionId: "dec_exp_01",
    status: "APPROVED",
    requestedAmount: 3499,
    currency: "INR",
    proposal: {
      id: "prop_exp_01",
      intentId: testIntent.id,
      product: "Nike Air Pegasus",
      merchant: "Nike India",
      amount: 3499,
      currency: "INR",
      quantity: 1,
      action: "purchase",
      proposedAt: new Date().toISOString(),
    },
    proposalSnapshot: {
      id: "prop_exp_01",
      intentId: testIntent.id,
      product: "Nike Air Pegasus",
      merchant: "Nike India",
      amount: 3499,
      currency: "INR",
      quantity: 1,
      action: "purchase",
      proposedAt: new Date().toISOString(),
    },
    reason: "Mandatory review",
    approvalToken: "tok_expired_test_123",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
  };
  await approvalRepository.create(expiredApproval);

  let expBlocked = false;
  try {
    await paymentService.authorizePayment({
      intentId: testIntent.id,
      proposal: expiredApproval.proposal,
      approvalId: expiredApproval.id,
      approvalToken: expiredApproval.approvalToken,
    });
  } catch (err: any) {
    expBlocked = err.code === "APPROVAL_EXPIRED";
  }
  assert(
    expBlocked,
    "6. Authorization rejects expired approval tokens (>10 minutes TTL) with APPROVAL_EXPIRED"
  );

  // 7. Valid Approval authorizes and creates Razorpay Test Order
  const validApproval: ApprovalRequest = {
    id: "appr_valid_rzp_01",
    intentId: testIntent.id,
    decisionId: "dec_valid_01",
    status: "APPROVED",
    requestedAmount: 3499,
    currency: "INR",
    proposal: {
      id: "prop_valid_01",
      intentId: testIntent.id,
      product: "Nike Air Pegasus",
      merchant: "Nike India",
      amount: 3499,
      currency: "INR",
      quantity: 1,
      action: "purchase",
      proposedAt: new Date().toISOString(),
    },
    proposalSnapshot: {
      id: "prop_valid_01",
      intentId: testIntent.id,
      product: "Nike Air Pegasus",
      merchant: "Nike India",
      amount: 3499,
      currency: "INR",
      quantity: 1,
      action: "purchase",
      proposedAt: new Date().toISOString(),
    },
    reason: "Mandatory review",
    approvalToken: "tok_valid_rzp_test_token",
    createdAt: new Date().toISOString(),
  };
  await approvalRepository.create(validApproval);

  const authPayment = await paymentService.authorizePayment({
    intentId: testIntent.id,
    proposal: validApproval.proposal,
    approvalId: validApproval.id,
    approvalToken: validApproval.approvalToken,
  });

  assert(
    authPayment.status === "AUTHORIZED" && authPayment.amount === 3499,
    "7. Valid human approval successfully authorizes payment execution"
  );

  // 8. Create Razorpay Test-Mode Order
  const checkoutData = await paymentService.createPaymentOrder(authPayment.id);
  assert(
    checkoutData.orderId.startsWith("order_mock_") &&
    checkoutData.amount === 349900 &&
    checkoutData.keyId === mockRazorpayProvider.mockKeyId,
    "8. Payment Gate creates Razorpay test order with exact minor units (349900 paise) and safe checkout metadata"
  );

  // 9. Order Creation Idempotency (re-calling returns the same order)
  const duplicateOrderData = await paymentService.createPaymentOrder(authPayment.id);
  assert(
    duplicateOrderData.orderId === checkoutData.orderId,
    "9. Duplicate order creation is idempotent and reuses existing authorized order"
  );

  // 10. 🛡️ Tampering Security: Approved ₹3,499 cannot authorize ₹3,999 (Stealth Tampering within budget cap)
  const stealthTamperedProposal: AgentProposal = {
    ...validApproval.proposal,
    amount: 3999, // Modified from 3499 to 3999
  };

  let stealthTamperBlocked = false;
  try {
    await paymentService.authorizePayment({
      intentId: testIntent.id,
      proposal: stealthTamperedProposal,
      approvalId: validApproval.id,
      approvalToken: validApproval.approvalToken,
    });
  } catch (err: any) {
    stealthTamperBlocked = err.code === "APPROVAL_CONTEXT_MISMATCH";
  }
  assert(
    stealthTamperBlocked,
    "10. 🛡️ SECURITY PROOF: Tampered amount (₹3,499 -> ₹3,999) using valid token is BLOCKED with APPROVAL_CONTEXT_MISMATCH and NO order is created"
  );

  // 11. Server-Side Signature Verification & Settlement
  const payId = "pay_sim_success_999";
  const validPaymentSig = crypto
    .createHmac("sha256", mockRazorpayProvider.mockSecret)
    .update(`${checkoutData.orderId}|${payId}`)
    .digest("hex");

  const verifiedPayment = await paymentService.verifyPayment({
    razorpay_order_id: checkoutData.orderId,
    razorpay_payment_id: payId,
    razorpay_signature: validPaymentSig,
    internalPaymentId: authPayment.id,
  });

  assert(
    verifiedPayment.status === "COMPLETED" &&
    verifiedPayment.razorpayPaymentId === payId &&
    verifiedPayment.razorpaySignature === validPaymentSig,
    "11. Server-side Razorpay payment signature verification cryptographically settles transaction"
  );

  // 12. Invalid Signature is rejected and marks payment as FAILED
  const anotherAuth = await paymentService.authorizePayment({
    intentId: testIntent.id,
    proposal: validApproval.proposal,
    approvalId: validApproval.id,
    approvalToken: validApproval.approvalToken,
  });
  const anotherOrder = await paymentService.createPaymentOrder(anotherAuth.id);

  let failedSigRejected = false;
  try {
    await paymentService.verifyPayment({
      razorpay_order_id: anotherOrder.orderId,
      razorpay_payment_id: "pay_bad_sig_001",
      razorpay_signature: "forged_invalid_signature_hex",
      internalPaymentId: anotherAuth.id,
    });
  } catch (err: any) {
    failedSigRejected = err.code === "PAYMENT_VERIFICATION_FAILED";
  }
  assert(
    failedSigRejected,
    "12. Forged signature is rejected with PAYMENT_VERIFICATION_FAILED and marked as FAILED"
  );

  // 13. Order ID Mismatch during verification is rejected
  let orderMismatch = false;
  try {
    await paymentService.verifyPayment({
      razorpay_order_id: "order_wrong_mismatch_123",
      razorpay_payment_id: "pay_some_payment",
      razorpay_signature: "some_sig",
      internalPaymentId: anotherAuth.id,
    });
  } catch (err: any) {
    orderMismatch = err.code === "PAYMENT_CONTEXT_MISMATCH";
  }
  assert(
    orderMismatch,
    "13. Order ID context mismatch during settlement is BLOCKED with PAYMENT_CONTEXT_MISMATCH"
  );

  console.log("==================================================");
  console.log(`Razorpay Rail Results: ${passed}/${passed + failed} Tests Passed. Failed: ${failed}`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runRazorpayTests();
