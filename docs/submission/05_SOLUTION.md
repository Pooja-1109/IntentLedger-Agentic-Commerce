# The Solution

IntentLedger delivers a defense-in-depth authorization gateway:
1. **Natural Language to Typed Policy:** Converts natural English prompts into structured schemas with explicit budget caps, merchant rules, and permission flags.
2. **Deterministic Evaluation:** Decouples policy verification from LLM non-determinism, enforcing exact mathematical constraints.
3. **Cryptographic Approval Context Binding:** Human approvals issue SHA-256 tokens tied to an immutable snapshot of the product, merchant, currency, and amount.
4. **Gate-Level Payment Protection:** Razorpay order creation is blocked permanently if proposal context differs from the approved snapshot.
5. **Immutable Decision Ledger:** Every intent, check, drift alert, approval, and settlement is recorded to an append-only audit stream.
