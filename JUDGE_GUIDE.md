# IntentLedger — Judge Quick Start & Evaluation Guide

**Razorpay Buildathon — Open Track Submission**

---

## 30-Second Summary

IntentLedger solves a fundamental gap in AI commerce:
**AI agents can discover and propose actions, but they must not have unrestricted payment authority.**

- **Razorpay** executes the payment rail.
- **IntentLedger** decides whether the AI agent is authorized to initiate it.

---

## Quick Setup & Start

1. **Backend Server:** `cd server && npm run build && npm start` (Running on `http://localhost:5000`)
2. **Frontend App:** `cd client && npm run dev` (Running on `http://localhost:5173`)
3. **Open Live Demo:** [http://localhost:5173/demo](http://localhost:5173/demo)

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

### Step 3: Hero Security Attack Demo (Scenario D)
- Select **Scenario D: 🛡️ Context Tampering**
- User approves ₹3,499.
- Rogue agent attempts to submit a modified amount of ₹7,999 using the same approval token.
- Click **"Test Malicious Payment"** → IntentLedger blocks the attack:
  $$\text{HTTP 403 APPROVAL\_CONTEXT\_MISMATCH}$$
- **Key Insight:** Demonstrates that human approval is bound to the exact item snapshot, preventing token reuse or rogue price inflation.

### Step 4: Full Audit & Forensic Replay
- Navigate to **Audit Ledger** (`/ledger`) to see chronological cryptographic logs.
- Navigate to **Intent Replay** (`/replay`) and press **"Play Lifecycle"** to watch the forensic reconstruction.

---

## Test Suite Verification

Run all automated unit and integration tests from the `server` directory:
```bash
cd server
npm test
```
*Result: 49/49 passing tests.*
