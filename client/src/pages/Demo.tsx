import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  ArrowRight,
  Zap,
  CreditCard,
  RotateCcw,
  CheckSquare,
  HelpCircle,
  Lock,
} from "lucide-react";
import { DecisionBadge } from "../components/StatusBadge";
import { apiService, HealthCheckData } from "../services/api";
import { Intent, DecisionResult, ApprovalRequest, PaymentExecution } from "../types";

type DemoScenarioKey = "safe" | "drift" | "subscription" | "tampering";

export const DemoPage: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<DemoScenarioKey>("safe");
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [activeIntent, setActiveIntent] = useState<Intent | null>(null);
  const [health, setHealth] = useState<HealthCheckData | null>(null);
  const [showJudgeScript, setShowJudgeScript] = useState<boolean>(false);

  // Proposal State
  const [product, setProduct] = useState<string>("Nike Air Pegasus Running Shoes");
  const [merchant, setMerchant] = useState<string>("Nike India");
  const [amount, setAmount] = useState<number>(3499);
  const [action, setAction] = useState<"purchase" | "subscribe">("purchase");

  // Workflow execution state
  const [loading, setLoading] = useState<boolean>(false);
  const [decisionResult, setDecisionResult] = useState<DecisionResult | null>(null);
  const [approvalRequest, setApprovalRequest] = useState<ApprovalRequest | null>(null);
  const [authorizedPayment, setAuthorizedPayment] = useState<PaymentExecution | null>(null);
  const [completedPayment, setCompletedPayment] = useState<PaymentExecution | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [intentsData, healthData] = await Promise.all([
          apiService.getIntents(),
          apiService.getHealth(),
        ]);
        if (intentsData.length > 0) {
          setActiveIntent(intentsData[0]);
        }
        setHealth(healthData);
      } catch (err) {
        console.error("Failed to load demo intent/health:", err);
      }
    };
    init();
  }, []);

  const isRazorpayTestMode = health?.paymentRail.mode === "razorpay_test" && health.paymentRail.keyIdConfigured;

  const handleSelectScenario = (key: DemoScenarioKey) => {
    setActiveScenario(key);
    setCurrentStage(1);
    setDecisionResult(null);
    setApprovalRequest(null);
    setAuthorizedPayment(null);
    setCompletedPayment(null);
    setSecurityError(null);

    if (key === "safe") {
      setProduct("Nike Air Pegasus Running Shoes");
      setMerchant("Nike India");
      setAmount(3499);
      setAction("purchase");
    } else if (key === "drift") {
      setProduct("Nike Vaporfly Elite Pro Shoes");
      setMerchant("Nike India");
      setAmount(7999);
      setAction("purchase");
    } else if (key === "subscription") {
      setProduct("VIP Runner Recurring Membership");
      setMerchant("Nike India");
      setAmount(499);
      setAction("subscribe");
    } else if (key === "tampering") {
      setProduct("Nike Air Pegasus Running Shoes");
      setMerchant("Nike India");
      setAmount(3499);
      setAction("purchase");
    }
  };

  // Step 2: Evaluate Proposal
  const handleEvaluateProposal = async () => {
    if (!activeIntent) return;
    setLoading(true);
    setSecurityError(null);
    try {
      const result = await apiService.evaluateProposal({
        intentId: activeIntent.id,
        proposal: {
          product,
          merchant,
          amount,
          currency: "INR",
          quantity: 1,
          action,
          isSubscription: action === "subscribe",
        },
      });
      setDecisionResult(result);

      if (result.decision === "ASK_APPROVAL" && result.approvalId) {
        const approvalsList = await apiService.getApprovals("pending");
        const found = approvalsList.find((a) => a.id === result.approvalId);
        if (found) {
          setApprovalRequest(found);
        }
      }

      setCurrentStage(3);
    } catch (err: unknown) {
      setSecurityError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Human Approval
  const handleApprove = async () => {
    if (!approvalRequest) return;
    setLoading(true);
    setSecurityError(null);
    try {
      const updated = await apiService.approveApproval(approvalRequest.id);
      setApprovalRequest({
        ...approvalRequest,
        status: "APPROVED",
        approvalToken: updated.approvalToken,
      });
      setCurrentStage(5);
    } catch (err: unknown) {
      setSecurityError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Authorize Payment
  const handleAuthorizePayment = async () => {
    if (!activeIntent) return;
    setLoading(true);
    setSecurityError(null);

    const isTamperAttack = activeScenario === "tampering";
    const paymentAmount = isTamperAttack ? 7999 : amount;
    const paymentProduct = isTamperAttack ? "Nike Vaporfly Elite Pro (Tampered)" : product;

    try {
      const payment = await apiService.authorizePayment({
        intentId: activeIntent.id,
        proposal: {
          id: `prop_demo_${Date.now().toString().slice(-4)}`,
          intentId: activeIntent.id,
          product: paymentProduct,
          merchant,
          amount: paymentAmount,
          currency: "INR",
          quantity: 1,
          action,
          proposedAt: new Date().toISOString(),
        },
        approvalId: approvalRequest?.id,
        approvalToken: approvalRequest?.approvalToken,
      });
      setAuthorizedPayment(payment);
      setCurrentStage(6);
    } catch (err: unknown) {
      setSecurityError(err instanceof Error ? err.message : "Payment authorization rejected");
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Complete Settlement
  const handleCompleteSettlement = async () => {
    if (!authorizedPayment) return;
    setLoading(true);
    try {
      const completed = await apiService.completePayment(authorizedPayment.id);
      setCompletedPayment(completed);
      setCurrentStage(7);
    } catch (err: unknown) {
      setSecurityError(err instanceof Error ? err.message : "Settlement failed");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: "Intent" },
    { num: 2, label: "Proposal" },
    { num: 3, label: "Policy Check" },
    { num: 4, label: "Approval" },
    { num: 5, label: "Payment Gate" },
    { num: 6, label: "Settlement" },
    { num: 7, label: "Ledger Audit" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Interactive Judge Evaluation
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Judge Demo Tour
          </h1>
          <p className="text-xs md:text-sm text-slate-600 mt-1">
            Step-by-step interactive demonstration of IntentLedger's intent compilation, deterministic governance, and cryptographic authorization.
          </p>
        </div>

        <button
          onClick={() => setShowJudgeScript(!showJudgeScript)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-surface-border hover:border-surface-borderHover text-slate-700 text-xs font-semibold self-start md:self-auto shadow-2xs"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>{showJudgeScript ? "Hide Judge Notes" : "Show 30s Pitch Script"}</span>
        </button>
      </div>

      {/* 30-Second Judge Pitch Card */}
      {showJudgeScript && (
        <div className="fintech-card p-5 space-y-2 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-200">
          <div className="text-xs font-bold uppercase text-blue-800 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>30-Second Elevator Pitch:</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            "Autonomous AI shopping agents can select and propose actions, but they have zero direct payment authority. IntentLedger translates natural-language user intent into enforceable mathematical policy, detects intent drift, binds cryptographic approval tokens, and enforces pre-payment authorization before funds move."
          </p>
        </div>
      )}

      {/* 4 Benchmark Scenario Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { key: "safe", title: "Scenario A: Safe Compliant", tag: "ALLOW / ASK" },
          { key: "drift", title: "Scenario B: Budget Drift", tag: "BLOCK (+₹3,999)" },
          { key: "subscription", title: "Scenario C: Subscription", tag: "BLOCK (Prohibited)" },
          { key: "tampering", title: "Scenario D: Hero Tamper", tag: "SECURITY PROOF" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => handleSelectScenario(s.key as DemoScenarioKey)}
            className={`p-3 rounded-lg border text-left text-xs transition-all ${
              activeScenario === s.key
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-slate-600 hover:text-slate-900 border-surface-border shadow-2xs"
            }`}
          >
            <div className="font-bold text-[11px]">{s.title}</div>
            <div className="text-[10px] opacity-80 font-mono mt-0.5">{s.tag}</div>
          </button>
        ))}
      </div>

      {/* 7-Step Progress Stepper */}
      <div className="fintech-card p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {steps.map((st) => (
            <div
              key={st.num}
              className={`p-2 rounded-lg transition-all ${
                st.num === currentStage
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : st.num < currentStage
                  ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200"
                  : "bg-slate-50 text-slate-400 font-normal"
              }`}
            >
              <div className="text-[9px] font-mono opacity-80">STEP {st.num}</div>
              <div className="text-[11px] truncate mt-0.5">{st.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Guided Execution Card */}
      <div className="fintech-card p-6 md:p-8 space-y-6">
        {/* Stage 1 & 2: Define Intent & Candidate Proposal */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {currentStage <= 2 ? "1. Bound User Intent & Agent Proposal" : "Active Transaction Context"}
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Live API Execution</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-surface-50 border border-surface-border space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Bound User Intent:</span>
              <p className="font-semibold text-slate-900 italic">
                "{activeIntent?.rawText || 'Buy running shoes under ₹4,000 and ask me before purchasing.'}"
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded bg-white border border-surface-border font-bold text-slate-700 shadow-2xs">
                  Limit: ₹{activeIntent?.constraints.maxAmount?.toLocaleString()}
                </span>
                <span className="px-2 py-0.5 rounded bg-white border border-surface-border font-bold text-slate-700 shadow-2xs">
                  {activeIntent?.constraints.requiresApproval ? "Approval Mandated" : "Auto-Allow"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-surface-50 border border-surface-border space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Autonomous Agent Proposal:</span>
              <div className="font-bold text-slate-900 text-sm">
                {product}
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Merchant: <strong className="text-slate-900">{merchant}</strong></span>
                <span className="text-base font-extrabold text-slate-900 tabular-nums">
                  ₹{amount.toLocaleString()} INR
                </span>
              </div>
            </div>
          </div>

          {currentStage <= 2 && (
            <div className="pt-2">
              <button
                onClick={handleEvaluateProposal}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <Zap className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Evaluate Agent Proposal against Policy Gate</span>
              </button>
            </div>
          )}
        </div>

        {/* Stage 3: Decision Engine Verdict */}
        {decisionResult && currentStage >= 3 && (
          <div className="space-y-4 pt-4 border-t border-surface-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Decision Engine Policy Check
              </h3>
              <DecisionBadge decision={decisionResult.decision} size="md" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Verdict</span>
                <span className="font-extrabold text-slate-900 block mt-0.5">{decisionResult.decision}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Risk Score</span>
                <span className="font-extrabold text-slate-900 block mt-0.5">{decisionResult.riskScore}/100</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Drift Status</span>
                <span className={`font-extrabold block mt-0.5 ${decisionResult.driftReport?.hasDrift ? "text-rose-600" : "text-emerald-700"}`}>
                  {decisionResult.driftReport?.hasDrift ? decisionResult.driftReport.severity : "Zero Drift"}
                </span>
              </div>
            </div>

            {/* Stage 4: Approval Action */}
            {decisionResult.decision === "ASK_APPROVAL" && currentStage === 3 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-3">
                <div className="text-xs text-amber-900 font-semibold">
                  Human approval is mandated before payment can be authorized.
                </div>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Grant Human Approval (Generate Cryptographic Token)</span>
                </button>
              </div>
            )}

            {/* Stage 5: Payment Gate Authorization */}
            {currentStage === 5 && (
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-border space-y-3">
                <div className="text-xs text-slate-800 font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>
                    {activeScenario === "tampering"
                      ? "Attacker modifying proposed amount to ₹7,999 before payment..."
                      : "Cryptographic approval token active. Ready for payment authorization."}
                  </span>
                </div>
                <button
                  onClick={handleAuthorizePayment}
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white text-xs font-bold transition-all shadow-sm ${
                    activeScenario === "tampering"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>
                    {activeScenario === "tampering"
                      ? "Attempt Tampered Payment Authorization (₹7,999)"
                      : "Authorize Payment at Payment Gate"}
                  </span>
                </button>
              </div>
            )}

            {/* Security Error / Context Mismatch Notice */}
            {securityError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-2 text-rose-800">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>PAYMENT PERMANENTLY BLOCKED</span>
                </div>
                <div className="font-mono text-[11px] text-rose-700 font-semibold">{securityError}</div>
                <p className="text-[11px] text-slate-600 pt-1">
                  The Payment Gate cryptographically verified that the submission did not match the approved proposal snapshot. Zero money moved.
                </p>
              </div>
            )}

            {/* Stage 6: Settlement Action */}
            {authorizedPayment && currentStage === 6 && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-3">
                <div className="text-xs text-emerald-900 font-bold">
                  Payment Pre-Authorized! Auth ID: {authorizedPayment.id}
                </div>
                <button
                  onClick={handleCompleteSettlement}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Complete Settlement ({isRazorpayTestMode ? "Razorpay Test Rail" : "Simulated Sandbox"})</span>
                </button>
              </div>
            )}

            {/* Stage 7: Ledger Proof */}
            {completedPayment && currentStage === 7 && (
              <div className="p-5 rounded-xl bg-surface-50 border border-emerald-300 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 uppercase">
                    ✓ Full Transaction Lifecycle Completed
                  </span>
                  <span className="font-mono text-slate-500 font-semibold">Tx: {completedPayment.gatewayTransactionId}</span>
                </div>
                <p className="text-slate-600">
                  All decisions, cryptographic tokens, and settlements have been recorded into the append-only ledger.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    to="/ledger"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-surface-border text-slate-700 text-xs font-bold shadow-2xs"
                  >
                    <span>Inspect Ledger</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    to="/replay"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                  >
                    <span>Forensic Replay</span>
                    <RotateCcw className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
