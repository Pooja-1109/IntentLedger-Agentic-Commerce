# IntentLedger — 3-Minute Live Judge Presentation Script

**Speaker:** Lead Engineer / Presenter  
**Audience:** Razorpay AI Buildathon Judges  

---

### [0:00 - 0:30] The Core Problem & Hook
> "AI agents are becoming capable of searching the web, negotiating deals, and buying things autonomously on behalf of users.
>
> But here is the critical vulnerability: payment gateways are built for human checkout. If an AI shopping agent goes rogue, suffers prompt injection, or hallucinates, there is no safety layer verifying whether the agent's action still matches the user's original intent.
>
> That is why we built **IntentLedger** — an Intent Accountability and Authorization Layer for Agentic Commerce.
>
> Our thesis is simple:
> **Razorpay executes the payment. IntentLedger decides whether the AI agent is authorized to initiate it.**"

---

### [0:30 - 1:15] Intent Studio & Structured Policy
> "Let's look at **Intent Studio** (`/studio`).
>
> The user doesn't need to learn a complex policy syntax. They simply provide natural language:
> *'Buy me running shoes under ₹4,000 and ask me before purchasing.'*
>
> IntentLedger's AI Compiler (powered by Gemini) extracts the budget cap of ₹4,000, requires human confirmation, and explicitly prohibits recurring charges.
>
> Crucially, the AI is advisory. The deterministic policy engine enforces the final boundary."

---

### [1:15 - 2:00] Live Demo: Safe Purchase vs. Agent Drift
> "Now let's switch to the **Live Demo** (`/demo`).
>
> In **Scenario A**, our agent finds running shoes for ₹3,499. IntentLedger detects that this is within budget, prompts for human confirmation, issues a cryptographic approval token, and creates a Razorpay test order.
>
> But what happens when the agent hallucinates? In **Scenario B**, the agent attempts to buy shoes for ₹7,999.
>
> IntentLedger immediately halts the transaction with a **BLOCK** verdict. Notice that the payment rail is never touched. No Razorpay order is created. The user's money is safe."

---

### [2:00 - 2:45] The Hero Security Demo: Context Tampering
> "Now let's test our primary defense: **Scenario D — Context Tampering**.
>
> Suppose the user approved ₹3,499. A rogue agent intercepts the approval token and tries to use it to buy a ₹7,999 item.
>
> When the agent calls the Payment Gate, IntentLedger compares the incoming proposal against the immutable cryptographic proposal snapshot.
>
> The result: **HTTP 403 APPROVAL_CONTEXT_MISMATCH**.
>
> The token is valid, but the action is not. Approval is bound to the exact item snapshot, not blanket authority."

---

### [2:45 - 3:00] Audit Ledger, Replay & Conclusion
> "Finally, every event is recorded in an **Append-Only Decision Ledger** (`/ledger`) and can be reconstructed in our **Intent Replay Player** (`/replay`) for dispute investigation.
>
> With 49 automated tests passing, full Razorpay test-mode integration, and fallback modes for all services, IntentLedger provides the missing safety rail for autonomous agentic commerce.
>
> Thank you!"
