# IntentLedger — Complete Architecture & Sequence Specification

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Studio as Intent Studio UI
    participant Compiler as Gemini AI Compiler / Fallback
    participant Agent as AI Shopping Agent
    participant Engine as IntentLedger Decision Engine
    participant Approvals as Human Approval Center
    participant Gate as Payment Gate
    participant Razorpay as Razorpay Test Rail
    participant Ledger as Append-Only Decision Ledger

    %% 1. Intent Registration
    User->>Studio: "Buy running shoes under ₹4,000 and ask me before purchasing."
    Studio->>Compiler: POST /api/intents/compile
    Compiler-->>Studio: Structured Policy { maxAmount: 4000, requiresApproval: true, canPurchase: true }
    Studio->>Engine: POST /api/intents (Save Intent Policy)
    Engine->>Ledger: Append INTENT_CREATED

    %% 2. Agent Proposal
    Agent->>Engine: POST /api/decisions/evaluate (Candidate: Nike Pegasus ₹3,499)
    Engine->>Engine: Deterministic Policy Check (Budget, Merchant, Permissions)
    Engine->>Approvals: Create PENDING Approval Request
    Engine->>Ledger: Append DECISION_EVALUATED (ASK_APPROVAL)
    Engine-->>Agent: Decision: ASK_APPROVAL { approvalId }

    %% 3. Human Confirmation & Token Issuance
    Approvals->>User: Display Exact Proposal Snapshot (₹3,499, Nike India)
    User->>Approvals: Approve Request
    Approvals->>Approvals: Generate Cryptographic Token (sha256 + 10m TTL)
    Approvals->>Ledger: Append APPROVAL_GRANTED

    %% 4. Payment Authorization & Gate
    Agent->>Gate: POST /api/payments/authorize { intentId, proposal, approvalToken }
    Gate->>Gate: Verify Context Integrity (Token == sha256(proposalSnapshot))
    Gate->>Gate: Check 10-Minute Expiry & Idempotency
    Gate->>Ledger: Append PAYMENT_AUTHORIZED
    Gate-->>Agent: Authorized { paymentId }

    %% 5. Order Creation & Settlement
    Agent->>Gate: POST /api/payments/razorpay/order
    Gate->>Razorpay: razorpay.orders.create({ amount: 349900 paise, currency: "INR" })
    Razorpay-->>Gate: { orderId: "order_test_xxx" }
    Gate-->>Agent: Order Ready
    Agent->>Razorpay: Checkout Execution
    Razorpay-->>Gate: Signature Callback { payment_id, order_id, signature }
    Gate->>Gate: Verify HMAC SHA-256 Signature
    Gate->>Ledger: Append PAYMENT_SETTLED & RAZORPAY_PAYMENT_VERIFIED
    Gate-->>User: Cryptographic Settlement Confirmed
```

---

## Architecture Boundaries

1. **Advisory AI Boundary:**
   - Gemini models extract natural-language intent into a structured JSON schema.
   - The LLM has **zero** permission to execute payments or override constraints.

2. **Deterministic Enforcement Boundary:**
   - The Decision Engine enforces mathematical invariants (`amount <= maxAmount`, `merchant in allowedMerchants`, `isSubscription <= canSubscribe`).
   - Rejects violations with explicit drift metrics.

3. **Cryptographic Context Binding:**
   - Approval tokens are mathematically bound to the immutable `proposalSnapshot`.
   - Any alteration of amount, merchant, or product triggers `403 APPROVAL_CONTEXT_MISMATCH`.

4. **Downstream Payment Rails:**
   - Orders are created via Razorpay Test Mode SDK only after policy authorization passes.
   - Forged payment responses or tampered amounts are rejected server-side via timing-safe HMAC SHA-256 verification.
