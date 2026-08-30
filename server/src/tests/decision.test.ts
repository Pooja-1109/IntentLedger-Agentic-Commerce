import { DecisionService } from "../services/decision.service";
import { Intent, AgentProposal } from "../types";

const decisionService = new DecisionService();

// Mock Intent Helpers
const createBaseIntent = (overrides: Partial<Intent> = {}): Intent => ({
  id: "intent_test_01",
  userId: "user_test",
  rawText: "Buy running shoes under ₹4,000",
  category: "shopping",
  constraints: {
    maxAmount: 4000,
    currency: "INR",
    productCategory: "running shoes",
    allowedMerchants: ["Nike India", "Adidas", "Amazon"],
    requiresApproval: false,
    quantity: 1,
    ...(overrides.constraints || {}),
  },
  permissions: {
    canPurchase: true,
    canSubscribe: false,
    canTransfer: false,
    canChangeQuantity: false,
    ...(overrides.permissions || {}),
  },
  status: "active",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const createBaseProposal = (overrides: Partial<AgentProposal> = {}): AgentProposal => ({
  id: "prop_test_01",
  intentId: "intent_test_01",
  action: "purchase",
  product: "Nike Running Shoes",
  merchant: "Nike India",
  amount: 3499,
  currency: "INR",
  quantity: 1,
  proposedAt: new Date().toISOString(),
  ...overrides,
});

interface TestCase {
  name: string;
  intent: Intent;
  proposal: AgentProposal;
  expectedDecision: "ALLOW" | "ASK_APPROVAL" | "BLOCK";
  expectedViolationCode?: string;
}

const testCases: TestCase[] = [
  // 1. Valid proposal with requiresApproval = false -> ALLOW
  {
    name: "1. Valid proposal within budget without approval mandate -> ALLOW",
    intent: createBaseIntent({ constraints: { maxAmount: 4000, requiresApproval: false } }),
    proposal: createBaseProposal({ amount: 3499 }),
    expectedDecision: "ALLOW",
  },
  // 2. Approval required -> ASK_APPROVAL
  {
    name: "2. Compliant proposal with requiresApproval = true -> ASK_APPROVAL",
    intent: createBaseIntent({ constraints: { maxAmount: 4000, requiresApproval: true } }),
    proposal: createBaseProposal({ amount: 3499 }),
    expectedDecision: "ASK_APPROVAL",
  },
  // 3. Budget exceeded -> BLOCK
  {
    name: "3. Budget exceeded (₹7,999 vs ₹4,000 limit) -> BLOCK",
    intent: createBaseIntent({ constraints: { maxAmount: 4000, requiresApproval: false } }),
    proposal: createBaseProposal({ amount: 7999 }),
    expectedDecision: "BLOCK",
    expectedViolationCode: "PROPOSED_AMOUNT_EXCEEDS_MAXIMUM",
  },
  // 4. Blocked merchant -> BLOCK
  {
    name: "4. Explicitly blocked merchant -> BLOCK",
    intent: createBaseIntent({ constraints: { maxAmount: 4000, requiresApproval: false, blockedMerchants: ["Suspicious Store"] } }),
    proposal: createBaseProposal({ merchant: "Suspicious Store" }),
    expectedDecision: "BLOCK",
    expectedViolationCode: "MERCHANT_EXPLICITLY_BLOCKED",
  },
  // 5. Unauthorized merchant not in whitelist -> BLOCK
  {
    name: "5. Merchant not in allowed whitelist -> BLOCK",
    intent: createBaseIntent({ constraints: { maxAmount: 4000, requiresApproval: false, allowedMerchants: ["Nike India", "Adidas"] } }),
    proposal: createBaseProposal({ merchant: "Unknown Grey Market" }),
    expectedDecision: "BLOCK",
    expectedViolationCode: "MERCHANT_NOT_ALLOWED",
  },
  // 6. Unauthorized subscription -> BLOCK
  {
    name: "6. Agent attempts subscription when canSubscribe = false -> BLOCK",
    intent: createBaseIntent({ permissions: { canPurchase: true, canSubscribe: false, canTransfer: false, canChangeQuantity: false } }),
    proposal: createBaseProposal({ action: "subscribe", isSubscription: true }),
    expectedDecision: "BLOCK",
    expectedViolationCode: "SUBSCRIPTION_NOT_PERMITTED",
  },
  // 7. Quantity exceeded -> BLOCK
  {
    name: "7. Quantity exceeded (3 units vs max 1) -> BLOCK",
    intent: createBaseIntent({ constraints: { maxAmount: 4000, requiresApproval: false, quantity: 1 } }),
    proposal: createBaseProposal({ quantity: 3 }),
    expectedDecision: "BLOCK",
    expectedViolationCode: "QUANTITY_EXCEEDED",
  },
  // 8. Unauthorized purchase action -> BLOCK
  {
    name: "8. Purchase action disallowed (canPurchase = false) -> BLOCK",
    intent: createBaseIntent({ permissions: { canPurchase: false, canSubscribe: false, canTransfer: false, canChangeQuantity: false } }),
    proposal: createBaseProposal({ action: "purchase" }),
    expectedDecision: "BLOCK",
    expectedViolationCode: "PURCHASE_NOT_PERMITTED",
  },
  // 9. Multiple violations -> BLOCK (Priority BLOCK over ASK_APPROVAL)
  {
    name: "9. Multiple violations with approval mandated -> BLOCK",
    intent: createBaseIntent({ constraints: { maxAmount: 4000, requiresApproval: true, blockedMerchants: ["Bad Store"] } }),
    proposal: createBaseProposal({ amount: 9999, merchant: "Bad Store" }),
    expectedDecision: "BLOCK",
    expectedViolationCode: "PROPOSED_AMOUNT_EXCEEDS_MAXIMUM",
  },
];

console.log("==================================================");
console.log("🧪 RUNNING INTENT DECISION ENGINE UNIT TESTS");
console.log("==================================================");

let passedCount = 0;
let failedCount = 0;

testCases.forEach((tc) => {
  const result = decisionService.evaluateProposal(tc.intent, tc.proposal);
  const decisionMatches = result.decision === tc.expectedDecision;
  const violationMatches = tc.expectedViolationCode
    ? result.violations.some((v) => v.code === tc.expectedViolationCode)
    : result.violations.length === 0;

  if (decisionMatches && violationMatches) {
    console.log(`✅ [PASS] ${tc.name}`);
    console.log(`   Decision: ${result.decision}, Risk: ${result.riskScore}/100, Violations: ${result.violations.length}`);
    passedCount++;
  } else {
    console.error(`❌ [FAIL] ${tc.name}`);
    console.error(`   Expected Decision: ${tc.expectedDecision}, Got: ${result.decision}`);
    if (tc.expectedViolationCode) {
      console.error(`   Expected Violation: ${tc.expectedViolationCode}, Got: ${result.violations.map((v) => v.code).join(", ")}`);
    }
    failedCount++;
  }
});

console.log("==================================================");
console.log(`Results: ${passedCount}/${testCases.length} Tests Passed. Failed: ${failedCount}`);
console.log("==================================================");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
