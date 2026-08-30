# IntentLedger — Milestone 6 Codebase Audit & Architecture Assessment

**Project:** IntentLedger — Autonomous Agent Intent Accountability Layer  
**Competition:** Razorpay Buildathon — Open Track  
**Timestamp:** 2026-08-30  

---

## 1. Executive Summary & Core Positioning

IntentLedger acts as a critical authorization and safety boundary between **User Intent**, **Autonomous AI Agents**, and **Payment Execution Rails (Razorpay)**:

> *"Razorpay executes the payment. IntentLedger decides whether the AI agent is authorized to initiate it."*

```
USER INTENT (Natural Language)
       ↓
INTENT COMPILER (Gemini / Deterministic Fallback)
       ↓
STRUCTURED POLICY (Immutable Constraints & Permissions)
       ↓
AI AGENT CANDIDATE PROPOSAL
       ↓
DETERMINISTIC DECISION ENGINE (ALLOW / ASK_APPROVAL / BLOCK)
       ↓
HUMAN APPROVAL CENTER (Cryptographic Token + Exact Proposal Snapshot)
       ↓
PAYMENT GATE (Context Integrity & TTL Verification)
       ↓
PAYMENT EXECUTION (Razorpay Test Mode / Simulated Sandbox)
       ↓
IMMUTABLE DECISION LEDGER (Append-Only Audit Stream)
       ↓
INTENT REPLAY (Forensic Timeline Reconstruction)
```

---

## 2. Completed Milestones & Capabilities

| Component | Status | Details |
| :--- | :--- | :--- |
| **Monorepo Architecture** | ✅ Complete | Node.js Express TypeScript backend (`:5000`), React Vite Tailwind frontend (`:5173`) |
| **Deterministic Decision Engine** | ✅ Complete | 0-100 Risk scoring, budget checks, merchant whitelists, subscription controls, quantity limits |
| **Intent Drift Detection** | ✅ Complete | Mathematical delta computation (`+₹3,999` deviation), severity assessment (`LOW`/`MEDIUM`/`HIGH`/`CRITICAL`) |
| **Human Approval Center** | ✅ Complete | Cryptographic SHA-256 tokens (`token = sha256(intentId + proposalSnapshot + secret + timestamp)`), 10-minute TTL |
| **Payment Gate** | ✅ Complete | Pre-payment policy verification, proposal snapshot matching, idempotency guards |
| **Razorpay Test Rail** | ✅ Complete | Minor units conversion (paise), HMAC SHA-256 verification, webhook integrity check |
| **Simulated Payment Provider** | ✅ Complete | Offline testing and demo execution without network/credential dependencies |
| **Append-Only Ledger** | ✅ Complete | Cryptographic event logging with HTTP 405 Method Not Allowed mutation guards |
| **Intent Replay Player** | ✅ Complete | Scrubber-controlled time-travel reconstruction of entire transaction lifecycles |
| **AI Compiler & Transparency** | ✅ Complete | Centralized `gemini-3.6-flash` config with deterministic rule engine fallback |
| **Persistence Modes** | ✅ Complete | Dual-engine support: MongoDB Mongoose persistence with in-memory fallback |

---

## 3. Automated Test Coverage (49 / 49 Tests Passing)

1. **`decision.test.ts` (9/9 passing):**
   - Valid proposals within budget (`ALLOW`)
   - Requires-approval policies (`ASK_APPROVAL`)
   - Budget exceedance (`BLOCK`)
   - Blacklisted/non-whitelisted merchants (`BLOCK`)
   - Prohibited subscriptions (`BLOCK`)
   - Quantity limit breaches (`BLOCK`)
   - Prohibited purchase actions (`BLOCK`)
   - Multi-violation compound breaches (`BLOCK`)

2. **`workflow.test.ts` (14/14 passing):**
   - Approval lifecycle (`PENDING` -> `APPROVED` / `REJECTED`)
   - Double-approval rejection (Conflict 409)
   - Auto-authorization for `ALLOW` policies
   - Budget drift rejection at Payment Gate (`PAYMENT_BLOCKED`)
   - Missing token rejection (`APPROVAL_NOT_GRANTED`)
   - Simulated payment settlement & idempotency
   - **Hero Security Proof:** Stealth amount tampering (`₹3,499` approved -> `₹3,999` attempted) blocked with `APPROVAL_CONTEXT_MISMATCH`
   - **Merchant tampering** blocked with `APPROVAL_CONTEXT_MISMATCH`

3. **`compiler.test.ts` (6/6 passing):**
   - Natural language budget, currency, category extraction
   - Prohibition extraction (no recurring subscriptions, no extended warranties)
   - Allowed/blocked merchant boundaries
   - Centralized `gemini-3.6-flash` configuration and truthful health reporting

4. **`persistence.test.ts` (7/7 passing):**
   - Intent, Decision, Approval, Payment, and Ledger persistence
   - Real-time KPI aggregation calculations
   - Append-only immutability contract validation

5. **`razorpay.test.ts` (13/13 passing):**
   - Exact minor units (paise) math (`₹3,499` <-> `349900` paise)
   - Timing-safe HMAC SHA-256 signature verification & forgery rejection
   - Webhook signature validation
   - Decision Engine payment gating before order creation
   - 10-minute approval token TTL expiry
   - Idempotent order creation
   - **Tampering context mismatch** blocking order creation
   - Cryptographic settlement verification and context mismatch rejection

---

## 4. Milestone 6 Polish Opportunities & Roadmap

- [x] Centralize AI Configuration (`server/src/config/ai.config.ts`) with `gemini-3.6-flash` and truthful health reporting.
- [x] Protect Ledger with explicit HTTP 405 rejection for `POST/PUT/DELETE/PATCH /ledger`.
- [x] AI Transparency cards in Intent Studio distinguishing advisory interpretation from deterministic enforcement.
- [x] Judge Demo Mode with 20-second pitch, 30-second walkthrough script, and high-contrast Scenario D hero security demo.
- [x] Dedicated Security Center (`/security`) detailing the 8-tier defense-in-depth architecture and threat mitigation matrix.
- [x] Professional Hackathon Documentation (`README.md`, `docs/architecture.md`, `docs/threat-model.md`, `JUDGE_GUIDE.md`, `docs/demo-script.md`, `docs/submission/*`).
