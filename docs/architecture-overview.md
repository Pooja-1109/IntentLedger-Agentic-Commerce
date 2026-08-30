# IntentLedger — Architecture Overview for Judges

## In 30 Seconds:

```
                  ┌───────────────────────────────┐
                  │      USER NATURAL INTENT      │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   INTENT COMPILER (Gemini)    │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   STRUCTURED INTENT POLICY   │
                  └───────────────┬───────────────┘
                                  │
AI AGENT CANDIDATE PROPOSAL ─────►│
                                  ▼
                  ┌───────────────────────────────┐
                  │  DETERMINISTIC DECISION CORE  │
                  └───────────────┬───────────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
         [ ALLOW ]         [ ASK_APPROVAL ]        [ BLOCK ]
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   HUMAN APPROVAL CENTER       │
                  │   (Cryptographic Token)       │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │    INTENT PAYMENT GATE        │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   RAZORPAY PAYMENT RAIL       │
                  │   (Test-Mode Execution)       │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   APPEND-ONLY AUDIT LEDGER    │
                  └───────────────────────────────┘
```

### Key Innovations:
1. **Separation of Proposal & Authority:** Agents can propose; only IntentLedger authorizes.
2. **Context-Bound Approvals:** Approving ₹3,499 locks the token to ₹3,499. Modifying the proposal to ₹7,999 permanently invalidates the token.
3. **Downstream Payment Rails:** Razorpay orders are generated **only after** IntentLedger verifies policy satisfaction.
4. **Append-Only Immutability:** Full lifecycle replayability for financial auditing and dispute resolution.
