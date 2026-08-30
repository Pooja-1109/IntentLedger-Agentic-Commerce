# IntentLedger — Security Threat Model & Defense Invariants

This document outlines the threat vectors relevant to autonomous agent commerce and the automated security controls implemented within IntentLedger.

---

## Threat Matrix

| Threat Vector | Attack Scenario | IntentLedger Defense Mechanism | Automated Result |
| :--- | :--- | :--- | :--- |
| **Budget Drift Exceedance** | Agent attempts ₹7,999 when user specified ₹4,000 cap | Deterministic comparison against `constraints.maxAmount` | `BLOCK` verdict, `PROPOSED_AMOUNT_EXCEEDS_MAXIMUM`, zero order creation |
| **Subscription Trap** | Agent selects recurring monthly plan when user authorized one-time purchase | Boolean permission validation on `permissions.canSubscribe` | `BLOCK` verdict, `SUBSCRIPTION_NOT_PERMITTED` |
| **Context Tampering (Hero Attack)** | User approves ₹3,499; rogue agent submits ₹7,999 with valid token | Cryptographic hash match against immutable `proposalSnapshot` | `HTTP 403 APPROVAL_CONTEXT_MISMATCH`, immediate halt |
| **Approval Token Replay** | Stale approval token submitted hours after issuance | 10-Minute timestamp TTL check on token validation | `HTTP 403 APPROVAL_EXPIRED` |
| **Approval Double-Spending** | Reusing a single approval token for multiple checkouts | State machine enforcement: approval marked `CONSUMED` | `HTTP 409 CONFLICT` |
| **Signature Forgery** | Attacker crafts fake Razorpay response payload | Timing-safe HMAC SHA-256 validation using secret | `HTTP 400 PAYMENT_VERIFICATION_FAILED` |
| **Webhook Spoofing** | Untrusted third-party submits fake payment event | Server-side signature validation of `x-razorpay-signature` | `HTTP 400 WEBHOOK_VERIFICATION_FAILED` |
| **Audit Ledger Tampering** | Malicious agent or actor attempts to alter/delete audit events | Public API blocks `POST/PUT/DELETE/PATCH /ledger` | `HTTP 405 Method Not Allowed (LEDGER_IMMUTABLE)` |
| **Minor Unit Rounding Errors** | Floating point rounding inconsistencies across payment rails | Integer paise minor-unit conversions (`349900` paise) | Mathematically exact currency representation |

---

## Defense Invariant

$$\text{Authorization} = \mathcal{F}(\text{Intent Policy}, \text{Agent Proposal}, \text{Snapshot Hash}, \text{TTL})$$

Where any divergence between $\text{Agent Proposal}$ and $\text{Snapshot Hash}$ immediately yields $\text{Authorization} = \text{DENIED}$.
