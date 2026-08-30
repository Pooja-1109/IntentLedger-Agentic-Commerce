# Security & Verification Architecture

1. **Deterministic Budget Validation:** Strict inequality evaluation prevents budget overruns.
2. **Snapshot-Bound Approval Tokens:** Token includes cryptographic digest of product, merchant, currency, and amount.
3. **10-Minute Token TTL:** Time-limited approvals prevent delayed reuse.
4. **Idempotent Payment Execution:** Duplicate settlement calls are rejected with `409 Conflict`.
5. **Server-Side HMAC SHA-256 Verification:** Validates Razorpay checkout signatures (`razorpay_signature`) and webhook events using timing-safe buffer comparisons.
6. **Append-Only Immutability:** Public ledger endpoints block `POST`, `PUT`, `DELETE`, and `PATCH` methods with HTTP 405.
