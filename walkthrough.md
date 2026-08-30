# IntentLedger — Milestone 5 Walkthrough: Razorpay Test-Mode Agentic Payment Rail + Secure Checkout + Authorization Binding

## Overview & Architecture Summary

Milestone 5 upgrades **IntentLedger** from a purely simulated payment gate into a production-grade **Razorpay Test-Mode Agentic Payment Rail** while keeping the core security thesis intact:

> **"Razorpay executes the payment. IntentLedger decides whether the AI agent is authorized to initiate it."**

Even if a rogue or drifting AI agent modifies ₹3,499 to ₹7,999 after receiving human approval, IntentLedger rejects the request on the server with `APPROVAL_CONTEXT_MISMATCH` before any payment order can be created at the gateway.

```
USER INTENT (Natural Language)
     ↓
[ GEMINI 1.5 COMPILER / RULES ] ──→ Typed Intent Policy (Budget, Merchants, Permissions)
     ↓
AI AGENT CANDIDATE PROPOSAL
     ↓
[ INTENTLEDGER DECISION ENGINE ] ──→ ALLOW / ASK_APPROVAL / BLOCK
     ↓
[ HUMAN APPROVAL CENTER ] ──→ Cryptographic Token + Immutable Proposal Snapshot (10m TTL)
     ↓
[ PAYMENT GATE & AUTHORIZATION ] ──→ Validates Snapshot Context (Anti-Tampering)
     ↓
[ RAZORPAY TEST PAYMENT RAIL ]
  ├── 1. `createOrder()` ──→ Exact Minor Units Conversion (₹3,499 ──→ 349900 paise)
  ├── 2. Razorpay Checkout JS Modal / Simulated Bridge
  └── 3. `verifyPayment()` ──→ Timing-Safe Server-Side HMAC-SHA256 Signature Verification
     ↓
[ APPEND-ONLY DECISION LEDGER ] ──→ Audit Stream & Time-Travel Replay
```

---

## Key Milestone 5 Accomplishments

### 1. Payment Provider Abstraction (`IPaymentProvider`)
Implemented a decoupled provider layer under `server/src/services/payment-providers/`:
- `IPaymentProvider` contract with `createOrder(context)` and `verifyPayment(params)`.
- `SimulatedPaymentProvider`: Zero-credential offline sandbox execution.
- `RazorpayTestPaymentProvider`: Official Razorpay Node.js SDK integration generating test orders with metadata notes (`intent_id`, `decision_id`, `approval_id`, `action`).
- `MockRazorpayProvider`: Deterministic mock provider for hermetic automated unit testing.

### 2. Minor Units (Paise) Conversion Utilities
- Created `server/src/utils/currency.util.ts`:
  - `toMinorUnits(amount, currency)`: Rounds and converts standard amounts (e.g. ₹3,499) to minor units (`349900` paise).
  - `fromMinorUnits(minorUnits, currency)`: Precision conversion back to rupees.

### 3. Timing-Safe Cryptographic Signature Verification
- Created `server/src/integrations/razorpay/razorpay.util.ts`:
  - `verifyRazorpaySignature(orderId, paymentId, signature, secret)`: Validates `hmac_sha256(order_id + "|" + payment_id, secret)` using timing-safe buffer comparison to eliminate side-channel timing attacks.
  - `verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret)`: Timing-safe validation for incoming Razorpay webhooks.

### 4. Strict Pre-Order Authorization Invariant & Anti-Tampering
- `PaymentService.authorizePayment()` re-evaluates the intent boundary on the backend before order creation.
- If Decision Engine yields `BLOCK` -> No order is created.
- If approval token is expired (>10 minutes) -> Rejects with `403 APPROVAL_EXPIRED`.
- **🛡️ Tamper Protection Guard (Scenario D)**: If a proposal is modified (e.g. amount modified from ₹3,499 to ₹7,999) while presenting an approved token:
  - Detects context mismatch against `proposalSnapshot`.
  - Rejects with `403 APPROVAL_CONTEXT_MISMATCH`.
  - Logs `PAYMENT_CONTEXT_MISMATCH` and `PAYMENT_BLOCKED` to the ledger.
  - **No Razorpay order is ever created.**

### 5. Client & Demo Upgrades
- `PaymentGatePage` (`/payment`): Upgraded with dual-mode rail indicator (`SIMULATED PAYMENT RAIL` vs `RAZORPAY TEST MODE - NO REAL MONEY`), Razorpay Checkout JS modal integration, and security audit explanation cards.
- `DemoPage` (`/demo`): Upgraded horizontal stepper (`01 INTENT -> 02 AGENT -> 03 DECISION -> 04 APPROVAL -> 05 PAYMENT -> 06 LEDGER -> 07 REPLAY`) and Scenario D tamper attack demonstration.
- `Dashboard` (`/`): Real-time live status bar showing API, MongoDB/In-Memory, Gemini AI/Rules, Policy Engine, and Payment Rail status.

---

## Verification & Automated Test Results

Ran full automated test suite containing **47 tests** across 5 test suites:
- `decision.test.ts`: **9/9 PASS**
- `workflow.test.ts`: **14/14 PASS**
- `compiler.test.ts`: **5/5 PASS**
- `persistence.test.ts`: **6/6 PASS**
- `razorpay.test.ts`: **13/13 PASS**

### Test Results Breakdown (`npm test`):
```text
==================================================
🧪 RUNNING INTENT DECISION ENGINE UNIT TESTS (9/9)
==================================================
✅ [PASS] 1. Valid proposal within budget without approval mandate -> ALLOW
✅ [PASS] 2. Compliant proposal with requiresApproval = true -> ASK_APPROVAL
✅ [PASS] 3. Budget exceeded (₹7,999 vs ₹4,000 limit) -> BLOCK
✅ [PASS] 4. Explicitly blocked merchant -> BLOCK
✅ [PASS] 5. Merchant not in allowed whitelist -> BLOCK
✅ [PASS] 6. Agent attempts subscription when canSubscribe = false -> BLOCK
✅ [PASS] 7. Quantity exceeded (3 units vs max 1) -> BLOCK
✅ [PASS] 8. Purchase action disallowed (canPurchase = false) -> BLOCK
✅ [PASS] 9. Multiple violations with approval mandated -> BLOCK

==================================================
🧪 RUNNING INTENTLEDGER WORKFLOW & SECURITY TESTS (14/14)
==================================================
✅ [PASS] 1. Decision Engine evaluates compliant proposal with approval mandate -> ASK_APPROVAL
✅ [PASS] 2. Approval service creates PENDING approval request with exact proposal snapshot
✅ [PASS] 3. Reject pending request sets status to REJECTED
✅ [PASS] 4. Approve on already REJECTED request safely throws conflict error
✅ [PASS] 5. Approve pending request generates cryptographic approval token
✅ [PASS] 6. Double approval on already APPROVED request safely throws conflict error
✅ [PASS] 7. Compliant ALLOW intent authorizes payment automatically without approval token
✅ [PASS] 8. Budget drift (+₹3,999 exceedance) is BLOCKED by Payment Gate with 403 PAYMENT_BLOCKED
✅ [PASS] 9. ASK_APPROVAL proposal without approval token is rejected with APPROVAL_NOT_GRANTED
✅ [PASS] 10. Valid approval token authorizes simulated payment execution
✅ [PASS] 11. Authorized payment completes and generates simulated settlement transaction ID
✅ [PASS] 12. Completed payment cannot be double-settled (Idempotent 409)
✅ [PASS] 13. 🛡️ SECURITY PROOF: Stealth tampered amount (₹3,499 -> ₹3,999) is BLOCKED with APPROVAL_CONTEXT_MISMATCH
✅ [PASS] 14. 🛡️ SECURITY PROOF: Tampered merchant is BLOCKED with APPROVAL_CONTEXT_MISMATCH

==================================================
🧪 RUNNING INTENT COMPILER & AI FALLBACK TESTS (5/5)
==================================================
✅ [PASS] 1. Extracts budget ₹4,000, INR, running shoes category, and approval mandate
✅ [PASS] 2. Extracts auto-buy approval flag and explicitly disables subscription permission (canSubscribe = false)
✅ [PASS] 3. Preserves explicit prohibitions without misinterpreting the main product category
✅ [PASS] 4. Compiler service returns valid structured intent with compiler signature
✅ [PASS] 5. Extracts allowed and blocked merchant restriction boundaries

==================================================
🧪 RUNNING PERSISTENCE & DASHBOARD AGGREGATION TESTS (6/6)
==================================================
✅ [PASS] 1. Intent Repository successfully persists and retrieves intent record
✅ [PASS] 2. Decision Repository persists evaluation result
✅ [PASS] 3. Approval Repository persists pending request and queries pending queue
✅ [PASS] 4. Payment Repository persists payment execution with transaction ID
✅ [PASS] 5. Append-only Ledger records chronological audit event
✅ [PASS] 6. Real-time metric counters compute active intents and completed payments accurately

==================================================
🧪 RUNNING RAZORPAY TEST-MODE & PAYMENT RAIL TESTS (13/13)
==================================================
✅ [PASS] 1. Converts standard amount ₹3,499 exactly to 349900 paise and back
✅ [PASS] 2. Cryptographic HMAC SHA-256 signature verification validates authentic signatures and rejects forged ones
✅ [PASS] 3. Webhook signature validator accepts valid webhook HMAC and rejects untrusted webhooks
✅ [PASS] 4. Decision Engine BLOCK on budget drift (+₹3,999) halts payment authorization before any order can be created
✅ [PASS] 5. Subscription breach (canSubscribe = false) is permanently BLOCKED from payment authorization
✅ [PASS] 6. Authorization rejects expired approval tokens (>10 minutes TTL) with APPROVAL_EXPIRED
✅ [PASS] 7. Valid human approval successfully authorizes payment execution
✅ [PASS] 8. Payment Gate creates Razorpay test order with exact minor units (349900 paise) and safe checkout metadata
✅ [PASS] 9. Duplicate order creation is idempotent and reuses existing authorized order
✅ [PASS] 10. 🛡️ SECURITY PROOF: Tampered amount (₹3,499 -> ₹3,999) using valid token is BLOCKED with APPROVAL_CONTEXT_MISMATCH and NO order is created
✅ [PASS] 11. Server-side Razorpay payment signature verification cryptographically settles transaction
✅ [PASS] 12. Forged signature is rejected with PAYMENT_VERIFICATION_FAILED and marked as FAILED
✅ [PASS] 13. Order ID context mismatch during settlement is BLOCKED with PAYMENT_CONTEXT_MISMATCH

==================================================
TOTAL RESULTS: 47/47 Tests Passed (0 Failures)
==================================================
```

Both Backend (`npm run build`) and Frontend (`npm run build`) compile with **zero errors**.
