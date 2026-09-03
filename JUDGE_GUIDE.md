# IntentLedger — Judge Quick Start & Evaluation Guide

**Razorpay Buildathon — Open Track Submission**

**Repository:** [https://github.com/Pooja-1109/IntentLedger-Agentic-Commerce](https://github.com/Pooja-1109/IntentLedger-Agentic-Commerce)

---

## 30-Second Summary

IntentLedger solves a fundamental gap in AI commerce:
**AI agents can discover and propose actions, but they must not have unrestricted payment authority.**

- **Razorpay** executes the payment rail.
- **IntentLedger** decides whether the AI agent is authorized to initiate it.

---

## Quick Setup & Start

```bash
# 1. Clone the repository
git clone https://github.com/Pooja-1109/IntentLedger-Agentic-Commerce.git
cd IntentLedger-Agentic-Commerce

# 2. Install all dependencies
npm run install:all

# 3. Start full stack (Frontend + Backend concurrently)
npm run dev
```

- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API Engine:** [http://localhost:5000](http://localhost:5000)
- **Direct Demo Link:** [http://localhost:5173/demo](http://localhost:5173/demo)

---

## Recommended 3-Minute Evaluation Sequence

### Step 1: Safe Purchase (Scenario A)
- Select **Scenario A: Safe Purchase**
- Intent is capped at ₹4,000 with mandatory approval.
- Agent proposes Nike Pegasus at ₹3,499.
- Click **"Evaluate Intent Policy"** → Status becomes `ASK_APPROVAL`.
- Click **"Approve Purchase"** → Cryptographic token issued.
- Click **"Authorize Payment"** → Payment authorized.
- Click **"Complete Payment"** → Settled & verified.

### Step 2: Agent Budget Drift (Scenario B)
- Select **Scenario B: Agent Drift (+₹3,999)**
- Agent proposes Nike Vaporfly at ₹7,999 against ₹4,000 limit.
- Click **"Evaluate Intent Policy"** → Immediate **🚨 BLOCK** verdict.
- **Key Insight:** Notice that **NO Razorpay order is created**.

### Step 3: Subscription Prohibition (Scenario C)
- Select **Scenario C: Subscription Trap**
- Agent proposes recurring monthly VIP subscription at ₹499/mo against one-time purchase policy.
- Click **"Evaluate Intent Policy"** → Immediate **🚨 BLOCK** verdict.
- **Key Insight:** Prevents autonomous recurring membership enrollment.

### Step 4: Hero Security Attack Demo (Scenario D)
- Select **Scenario D: 🛡️ Context Tampering**
- User approves ₹3,499.
- Rogue agent attempts to submit a modified amount of ₹7,999 using the same approval token.
- Click **"Test Malicious Payment"** → IntentLedger blocks the attack:
  $$\text{HTTP 403 APPROVAL\_CONTEXT\_MISMATCH}$$
- **Key Insight:** Demonstrates that human approval is bound to the exact item snapshot, preventing token reuse or rogue price inflation.

### Step 5: Full Audit & Forensic Replay
- Navigate to **Audit Ledger** (`/ledger`) to see chronological cryptographic logs.
- Navigate to **Intent Replay** (`/replay`) and press **"Play Lifecycle"** to watch the forensic reconstruction.

---

## Automated Test Suite Verification

Run all automated unit and integration tests from the `server` directory:
```bash
cd server
npm test
```
*Result: 64/64 passing tests (Decision Engine, Workflow & Security, Compiler & AI Fallback, Persistence, Razorpay Rail, and Dynamic Commerce Availability).*
