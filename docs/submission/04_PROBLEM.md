# The Problem

1. **Unconstrained Autonomous Spending:** Payment gateways are architected around human session tokens and interactive checkouts. Giving AI agents direct API keys or card tokens exposes users to unrestricted spending.
2. **Intent Drift:** Due to prompt ambiguity, non-deterministic model behaviors, or prompt injection, an AI agent may drift from a user's original mandate (e.g. buying a ₹7,999 item when authorized for ₹4,000).
3. **Hidden Subscription Traps:** Agents optimizing for convenience frequently authorize recurring subscription billing instead of one-time transactions.
4. **Approval Replay & Tampering:** Existing approval workflows approve general permission rather than an exact, immutable proposal snapshot, leaving transactions open to price alteration attacks.
