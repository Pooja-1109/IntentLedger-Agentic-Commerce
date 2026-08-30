# Innovation & Technical Highlights

1. **User Intent ≠ Agent Authority:** Autonomous agents are treated as untrusted proposer entities. Only the deterministic IntentLedger policy engine holds authorization authority.
2. **Context-Bound Approvals:** Approving ₹3,499 locks the approval token to ₹3,499. Changing the proposal to ₹7,999 permanently invalidates the token, producing `403 APPROVAL_CONTEXT_MISMATCH`.
3. **Advisory AI vs. Deterministic Enforcement:** Clear separation of concerns where LLMs are used for semantic extraction, while deterministic rules enforce safety boundaries.
4. **Time-Travel Forensic Replay:** Full state reconstruction player enabling step-by-step auditability for customer disputes and security investigations.
