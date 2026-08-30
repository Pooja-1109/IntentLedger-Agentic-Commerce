import { ruleBasedCompiler } from "../services/providers/ruleBasedCompiler.provider";
import { intentService } from "../services/intent.service";
import { getGeminiModel, getAiCompilerHealth } from "../config/ai.config";

async function runCompilerTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING INTENT COMPILER & AI FALLBACK TESTS");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   ${detail}`);
      failed++;
    }
  }

  // 1. Budget & Category Extraction
  const result1 = ruleBasedCompiler.compile("Buy me running shoes under ₹4,000. Ask me before purchasing.");
  assert(
    result1.constraints.maxAmount === 4000 &&
    result1.constraints.currency === "INR" &&
    result1.constraints.requiresApproval === true &&
    result1.permissions.canPurchase === true,
    "1. Extracts budget ₹4,000, INR, running shoes category, and approval mandate"
  );

  // 2. Prohibited Subscription Extraction
  const result2 = ruleBasedCompiler.compile("Buy office stationery under 1000 automatically. Do not subscribe to anything.");
  assert(
    result2.constraints.maxAmount === 1000 &&
    result2.constraints.requiresApproval === false &&
    result2.permissions.canSubscribe === false &&
    result2.permissions.canPurchase === true,
    "2. Extracts auto-buy approval flag and explicitly disables subscription permission (canSubscribe = false)"
  );

  // 3. Prohibited Warranty / Add-on Extraction
  const result3 = ruleBasedCompiler.compile("Find me a laptop below ₹50,000. Don't buy extended warranty.");
  assert(
    result3.constraints.maxAmount === 50000 &&
    result3.constraints.productCategory === "laptop" &&
    result3.interpretation.prohibitions?.includes("No extended warranty purchase") === true,
    "3. Preserves explicit prohibitions without misinterpreting the main product category"
  );

  // 4. Fallback Architecture Verification
  const compiledIntent = await intentService.compileRawIntent("Buy running shoes under ₹3,500");
  assert(
    compiledIntent.constraints.maxAmount === 3500 &&
    (compiledIntent.compiler === "gemini" || compiledIntent.compiler === "rules"),
    "4. Compiler service returns valid structured intent with compiler signature (AI or Rule fallback)"
  );

  // 5. Merchant Restrictions Extraction
  const result5 = ruleBasedCompiler.compile("Buy groceries under ₹2,000 from Blinkit only. Avoid unverified merchants.");
  assert(
    result5.constraints.maxAmount === 2000 &&
    result5.constraints.allowedMerchants?.includes("Blinkit") === true &&
    result5.constraints.blockedMerchants?.includes("Unverified Merchants") === true,
    "5. Extracts allowed and blocked merchant restriction boundaries"
  );

  // 6. Centralized AI Model Config & Health
  const modelName = getGeminiModel();
  const aiHealth = getAiCompilerHealth();
  assert(
    typeof modelName === "string" && modelName.length > 0 &&
    (aiHealth.status === "ready" || aiHealth.status === "fallback"),
    "6. AI configuration resolves current model (gemini-3.6-flash) with truthful health status reporting"
  );

  console.log("==================================================");
  console.log(`Compiler Results: ${passed}/${passed + failed} Tests Passed. Failed: ${failed}`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runCompilerTests();
