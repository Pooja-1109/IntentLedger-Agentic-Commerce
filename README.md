# IntentLedger — Intent Accountability Layer for AI & Agentic Commerce

> **"Razorpay executes the payment. IntentLedger decides whether the AI agent is authorized to initiate it."**

[![Tests](https://img.shields.io/badge/tests-49%2F49%20passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)]()
[![Razorpay](https://img.shields.io/badge/Razorpay-Test%20Mode-blue.svg)]()
[![AI](https://img.shields.io/badge/AI-Gemini%203.6%20Flash-purple.svg)]()

---

## 1. The Problem

AI shopping and payment agents are rapidly gaining autonomous capabilities to discover products, negotiate with merchants, and initiate checkout on behalf of users. However, traditional payment rails expect direct human agency and cannot determine whether an agent's proposed action still respects the user's original boundaries.

When a user instructs:
> *"Buy me running shoes under ₹4,000 and ask me before purchasing."*

A rogue or hallucinating agent might:
1. Propose premium shoes at **₹7,999** (Budget Drift).
2. Sign the user up for a **₹499/month recurring membership** (Subscription Trap).
3. Attempt to reuse a human approval for a different, higher-priced product (Context Tampering).

Without an independent, deterministic intent boundary, AI agents have unrestricted control over payment credentials.

---

## 2. The Solution

**IntentLedger** provides a cryptographic, deterministic intent accountability layer between **Users**, **AI Agents**, and **Payment Rails (Razorpay)**.

```
USER INTENT (Natural Language)
       ↓
INTENT COMPILER (Gemini 3.6 Flash / Rule Fallback)
       ↓
STRUCTURED INTENT POLICY (Typed Constraints & Permissions)
       ↓
AI AGENT CANDIDATE PROPOSAL (Product, Price, Merchant, Action)
       ↓
DETERMINISTIC DECISION ENGINE (ALLOW / ASK_APPROVAL / BLOCK)
       ↓
HUMAN APPROVAL CENTER (Cryptographic Token + Immutable Proposal Snapshot)
       ↓
PAYMENT GATE (Context Integrity & 10m TTL Validation)
       ↓
PAYMENT RAIL (Razorpay Test Mode / Simulated Sandbox)
       ↓
APPEND-ONLY DECISION LEDGER (Immutable Audit Stream)
       ↓
FORENSIC INTENT REPLAY (Step-by-Step Lifecycle Reconstruction)
```

---

## 3. Core Architectural Principle

**USER INTENT ≠ AGENT AUTHORITY**

The AI agent can discover and propose actions. IntentLedger independently evaluates the proposal against deterministic policy rules. The payment rail is invoked **only after** IntentLedger verifies policy satisfaction or cryptographic human authorization.

---

## 4. Benchmark Scenarios Demonstrated

| Scenario | Candidate Action | User Policy | Verdict | Payment Rail State |
| :--- | :--- | :--- | :--- | :--- |
| **Scenario A: Safe Purchase** | Nike Pegasus @ ₹3,499 | Max ₹4,000, Approval Required | `ASK_APPROVAL` → `APPROVED` | **Authorized → Razorpay Test Order Created → Cryptographically Verified** |
| **Scenario B: Budget Drift** | Nike Vaporfly @ ₹7,999 | Max ₹4,000 | `BLOCK` (+₹3,999 Drift) | **BLOCKED BEFORE ORDER CREATION** |
| **Scenario C: Subscription Trap** | Monthly VIP @ ₹499/mo | One-Time Purchase Only | `BLOCK` (Unauthorized Subscription) | **BLOCKED BEFORE ORDER CREATION** |
| **Scenario D: Hero Context Tampering** | User Approved ₹3,499; Agent submits ₹7,999 with same token | Exact Snapshot Bound | `403 APPROVAL_CONTEXT_MISMATCH` | **BLOCKED PERMANENTLY — NO RAZORPAY ORDER CREATED** |

---

## 5. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express, TypeScript, Zod Schema Validation
- **AI Compiler:** Google Gemini (`gemini-3.6-flash`) with Deterministic Rule Engine Fallback
- **Persistence:** Dual-Mode Architecture (MongoDB Mongoose + High-Speed In-Memory Store)
- **Payment Gateway:** Razorpay Node.js SDK (Test Mode) + Simulated Sandbox Bridge
- **Security:** Timing-safe HMAC SHA-256 signatures, cryptographic proposal snapshots, append-only ledger

---

## 6. Running Locally

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/IntentLedger.git
cd IntentLedger

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### 2. Environment Configuration
Create a `.env` file in the `server` directory (or use `.env.example` defaults):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Persistence: "mongodb" | "memory"
PERSISTENCE_MODE=memory

# Payment Rail: "simulated" | "razorpay_test"
PAYMENT_MODE=simulated
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# AI Compiler (Optional)
GEMINI_MODEL=gemini-3.6-flash
GEMINI_API_KEY=
```

### 3. Start the Backend Server
```bash
cd server
npm run build
npm start
# Server runs on http://localhost:5000
```

### 4. Start the Frontend Client
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 7. Running the Automated Test Suite

IntentLedger includes **49 automated unit and integration tests** covering decision logic, approval lifecycles, cryptographic context binding, and Razorpay test-mode payment verification:

```bash
cd server
npm test
```

```text
==================================================
🧪 RUNNING INTENT DECISION ENGINE UNIT TESTS (9/9)
🧪 RUNNING INTENTLEDGER WORKFLOW & SECURITY TESTS (14/14)
🧪 RUNNING INTENT COMPILER & AI FALLBACK TESTS (6/6)
🧪 RUNNING PERSISTENCE & DASHBOARD AGGREGATION TESTS (7/7)
🧪 RUNNING RAZORPAY TEST-MODE & PAYMENT RAIL TESTS (13/13)
==================================================
Total: 49/49 Tests Passed. Failed: 0
==================================================
```

---

## 8. Security & Test-Mode Disclaimer

- **Test Mode Only:** IntentLedger interacts with Razorpay in **Test Mode (`RAZORPAY_MODE=test`)**. No real monetary transactions or bank settlements occur.
- **Offline Reliability:** If Razorpay API keys or MongoDB are not provided, IntentLedger gracefully and truthfully falls back to its built-in Simulated Payment Provider and in-memory repository.
- **AI Advisory Boundary:** The Gemini AI Compiler is advisory; all budget limits, authorization checks, and token signatures are enforced by the deterministic policy engine.
