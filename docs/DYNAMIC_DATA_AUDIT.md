# IntentLedger — Dynamic Data & Real-Time Telemetry Audit Report

**Audit Date:** 2026-08-30  
**Project:** IntentLedger — Intent Accountability Layer for AI & Agentic Commerce  
**Repository:** [https://github.com/Pooja-1109/IntentLedger-Agentic-Commerce](https://github.com/Pooja-1109/IntentLedger-Agentic-Commerce)  
**Standard:** 100% Data-Driven Backend Integration (Zero Fake Timers, Zero Mock Arrays in Normal UI, Zero Fabricated Data)

---

## 1. Executive Summary

IntentLedger enforces complete data integrity across both frontend and backend layers. Every metric, activity stream, policy check, risk score, approval token, payment authorization, audit event, and replay sequence is derived from live backend APIs, database repositories (Dual-mode MongoDB + In-Memory fallback), and deterministic policy evaluation engines.

---

## 2. Page-by-Page Data Provenance Matrix

| Feature / UI View | Frontend Source File | API Endpoint | Backend Controller | Backend Service | Repository Layer | Persistence Mode | Dynamic? | Verified? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **System Health Banner** | `Navbar.tsx`, `Dashboard.tsx` | `GET /api/health` | `health.controller.ts` | Internal health inspector | N/A | Runtime Memory / DB state | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Executive KPI Summary** | `Dashboard.tsx` | `GET /api/dashboard/summary` | `dashboard.controller.ts` | Direct repository aggregation | `intentRepository`, `decisionRepository`, `approvalRepository`, `paymentRepository`, `ledgerRepository` | Memory / MongoDB | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Live Activity Feed** | `Dashboard.tsx` | `GET /api/dashboard/activity` | `dashboard.controller.ts` | Ledger stream aggregator | `ledgerRepository` | Memory / MongoDB | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Intent Compilation** | `IntentStudio.tsx` | `POST /api/intents/compile` | `intent.controller.ts` | `intentService.compileIntent()` | `GeminiCompilerProvider` / `RuleBasedCompilerProvider` | Transient Engine State | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Intent Persistence** | `IntentStudio.tsx` | `POST /api/intents`, `GET /api/intents` | `intent.controller.ts` | `intentService.createIntent()` | `intentRepository` | Memory / MongoDB | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Agent Simulation Lab** | `Simulation.tsx` | `POST /api/decisions/evaluate` | `decision.controller.ts` | `decisionService.evaluateProposal()` | `intentRepository`, `decisionRepository`, `approvalRepository` | Memory / MongoDB | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Decision Intelligence**| `DecisionCenter.tsx` | `GET /api/decisions/:intentId` | `decision.controller.ts` | `decisionRepository.findByIntentId()` | `decisionRepository` | Memory / MongoDB | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Human Approvals Queue**| `Approvals.tsx` | `GET /api/approvals`, `POST /api/approvals/:id/approve` | `approval.controller.ts` | `approvalService.approveRequest()` | `approvalRepository`, `ledgerRepository` | Memory / MongoDB | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Context Tampering Defense**| `PaymentGate.tsx`, `Security.tsx` | `POST /api/payments/authorize` | `payment.controller.ts` | `paymentService.authorizePayment()` | `approvalRepository`, `ledgerRepository` | Memory / MongoDB | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Payment Authorization**| `PaymentGate.tsx` | `POST /api/payments/authorize` | `payment.controller.ts` | `paymentService.authorizePayment()` | `paymentRepository`, `ledgerRepository` | Memory / MongoDB | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Razorpay Test Settlement**| `PaymentGate.tsx` | `POST /api/payments/razorpay/verify` | `payment.controller.ts` | `paymentService.verifyAndSettleRazorpayPayment()` | `paymentRepository`, `ledgerRepository` | Memory / MongoDB | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Simulated Sandbox Settlement**| `PaymentGate.tsx` | `POST /api/payments/:id/complete` | `payment.controller.ts` | `paymentService.completeSimulatedPayment()` | `paymentRepository`, `ledgerRepository` | Memory / MongoDB | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Append-Only Decision Ledger**| `Ledger.tsx` | `GET /api/ledger` | `routes/index.ts` | Direct ledger query | `ledgerRepository` | Memory / MongoDB | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Ledger Immutability Guard**| Express Router | `POST/PUT/DELETE /api/ledger` | `routes/index.ts` | Router-level 405 Method Not Allowed handler | `ledgerRepository` | Immutability Invariant | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Forensic Intent Replay**| `Replay.tsx` | `GET /api/ledger/:intentId` | `routes/index.ts` | `ledgerRepository.findByIntentId()` | `ledgerRepository` | Memory / MongoDB | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Benchmark Scenarios** | `Demo.tsx` | `GET /api/demo/scenarios`, `POST /api/decisions/evaluate` | `decision.controller.ts` | `decisionService.evaluateProposal()` | `intentRepository`, `decisionRepository` | Memory / MongoDB | ✅ Dynamic | ✅ LIVE VERIFIED |
| **Security Telemetry & HMAC Sandbox**| `Security.tsx` | `GET /api/health`, `GET /api/dashboard/summary`, Browser WebCrypto HMAC | `health.controller.ts`, `dashboard.controller.ts` | Dynamic telemetry & client-side HMAC calculator | `ledgerRepository`, `paymentRepository` | Memory / MongoDB | ✅ Dynamic | ✅ LIVE VERIFIED |

---

## 3. Dynamic State Acceptance Verification

We executed a live runtime lifecycle test to prove that dashboard metrics and activity streams update strictly as a function of **backend state changes** rather than frontend timers:

1. **Before Action Baseline:**
   - Active Intents: 3
   - Decisions Evaluated: 6
   - Blocked Actions: 4
   - Completed Payments: 1
2. **Action 1: Intent Creation via Intent Studio (`POST /api/intents`):**
   - Result: Active Intents incremented from 3 $\rightarrow$ 4.
3. **Action 2: Candidate Proposal Evaluation (`POST /api/decisions/evaluate`):**
   - Result: Decisions Evaluated incremented from 6 $\rightarrow$ 7.
4. **Action 3: Proposal Rejection / Over-budget proposal (`POST /api/decisions/evaluate` with ₹5,499 proposal):**
   - Result: Blocked Actions incremented from 4 $\rightarrow$ 5.
5. **Action 4: Human Approval Grant (`POST /api/approvals/:id/approve`):**
   - Result: Approval status transitioned to `APPROVED` and issued token `tok_appr_...`.
6. **Action 5: Payment Settlement (`POST /api/payments/:id/complete`):**
   - Result: Completed Payments incremented from 1 $\rightarrow$ 2.
7. **Action 6: Ledger Audit Query (`GET /api/ledger/:intentId`):**
   - Result: 11 chronological events recorded and reconstructed in Forensic Replay.

---

## 4. Truthful Status Disclosure Matrix

| Component | Active Configuration | Disclosed Label in UI | Truthful Disclosure Rule |
| :--- | :--- | :--- | :--- |
| **AI Compiler** | Without `GEMINI_API_KEY` | `RULE ENGINE (Fallback)` | Discloses that regex rule engine parsed the intent. Does not falsely claim Gemini is active. |
| **Persistence** | MongoDB Unconnected | `IN-MEMORY ACTIVE` | Discloses high-speed in-memory store is active. Does not falsely claim MongoDB is connected. |
| **Payment Rail**| Without Razorpay Key ID | `SIMULATED SANDBOX` | Discloses offline mock sandbox. Permanently denies live money processing claims. |

---

## 5. Security & Immutability Guarantees

- **Context-Tampering Defense:** Token hash `sha256(proposalSnapshot)` is verified prior to payment authorization. Alterations return `403 PAYMENT_BLOCKED` with code `APPROVAL_CONTEXT_MISMATCH`.
- **Append-Only Immutability:** External mutation attempts on `/api/ledger` return `405 Method Not Allowed`.
- **Zero Exposed Secrets:** Secret keys (`RAZORPAY_KEY_SECRET`, `GEMINI_API_KEY`) remain strictly on the backend and are excluded from git.
