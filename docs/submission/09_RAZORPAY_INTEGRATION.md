# Razorpay Integration Details

- **Test Mode Enforcement:** Configured with `RAZORPAY_MODE=test` to ensure zero real financial risk during demonstrations.
- **Paise Minor-Unit Conversion:** Exact currency mathematical utilities (`toMinorUnits` / `fromMinorUnits`) translate rupees to integer paise without floating-point inaccuracies (`₹3,499` -> `349900` paise).
- **Pre-Payment Authorization:** Orders are only created via `razorpay.orders.create()` after IntentLedger verifies policy satisfaction.
- **Server-Side Signature Settlement:** Checkout responses are verified using `crypto.createHmac("sha256", secret).update(orderId + "|" + paymentId).digest("hex")`.
- **Webhook Processing:** Incoming event signatures (`x-razorpay-signature`) are validated before recording payment lifecycle events to the ledger.
- **Simulated Provider Fallback:** Transparent offline fallback enables evaluation in environments without Razorpay test keys.
