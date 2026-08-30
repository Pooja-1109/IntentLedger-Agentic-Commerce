import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Bot,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Zap,
  CreditCard,
  History,
  RotateCcw,
  CheckSquare,
  Key,
  HelpCircle,
} from "lucide-react";
import { DecisionBadge } from "../components/StatusBadge";
import { apiService, HealthCheckData } from "../services/api";
import { Intent, DecisionResult, ApprovalRequest, PaymentExecution, LedgerEvent } from "../types";

type DemoScenarioKey = "safe" | "drift" | "subscription" | "tampering";

export const DemoPage: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<DemoScenarioKey>("safe");
  const [currentStage, setCurrentStage] = useState<number>(1); // 1 to 7
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
  const [timelineEvents, setTimelineEvents] = useState<LedgerEvent[]>([]);
  const [securityError, setSecurityError] = useState<string | null>(null);

  // Load initial intent data & health
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
    setTimelineEvents([]);
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
      setAmount(3499); // Will be approved at 3499 then tampered to 7999
      setAction("purchase");
    }
  };

  // Step 2 -> 3: Evaluate Candidate Proposal
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
      setCurrentStage(3);

      if (result.decision === "ASK_APPROVAL" && result.approvalId) {
        const appr = await apiService.getApprovalById(result.approvalId);
        setApprovalRequest(appr);
      }
    } catch (err: unknown) {
      setSecurityError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Approve Human Request
  const handleApprove = async () => {
    if (!approvalRequest) return;
    setLoading(true);
    try {
      const approved = await apiService.approveApproval(approvalRequest.id);
      setApprovalRequest(approved);
      setCurrentStage(4);
    } catch (err: unknown) {
      setSecurityError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Authorize Payment (or Trigger Tampering Demo)
  const handleAuthorizePayment = async () => {
    if (!activeIntent) return;
    setLoading(true);
    setSecurityError(null);

    try {
      const reqAmount = activeScenario === "tampering" ? 7999 : amount; // Attack tampering simulation

      const payment = await apiService.authorizePayment({
        intentId: activeIntent.id,
        proposal: {
          id: `prop_demo_${Date.now().toString().slice(-4)}`,
          intentId: activeIntent.id,
          product,
          merchant,
          amount: reqAmount,
          currency: "INR",
          quantity: 1,
          action,
          proposedAt: new Date().toISOString(),
        },
        approvalId: approvalRequest?.id,
        approvalToken: approvalRequest?.approvalToken,
      });

      setAuthorizedPayment(payment);
      setCurrentStage(5);
    } catch (err: unknown) {
      setSecurityError(err instanceof Error ? err.message : "Payment authorization denied");
    } finally {
      setLoading(false);
    }
  };

  // Complete Payment (Razorpay Checkout or Simulated Bridge)
  const handleCompletePayment = async () => {
    if (!authorizedPayment) return;
    setLoading(true);
    setSecurityError(null);

    try {
      if (isRazorpayTestMode) {
        const orderData = await apiService.createRazorpayOrder(authorizedPayment.id);

        if (!window.Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Razorpay Checkout SDK"));
            document.body.appendChild(script);
          });
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "IntentLedger Autonomous Agent",
          description: `Authorization Context: ${authorizedPayment.product}`,
          order_id: orderData.orderId,
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verified = await apiService.verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                internalPaymentId: authorizedPayment.id,
              });
              setCompletedPayment(verified);
              setCurrentStage(6);

              if (activeIntent) {
                const events = await apiService.getLedgerByIntentId(activeIntent.id);
                setTimelineEvents(events);
              }
            } catch (vErr: unknown) {
              setSecurityError(vErr instanceof Error ? vErr.message : "Signature verification failed");
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Simulated completion
        const completed = await apiService.completePayment(authorizedPayment.id);
        setCompletedPayment(completed);
        setCurrentStage(6);

        if (activeIntent) {
          const events = await apiService.getLedgerByIntentId(activeIntent.id);
          setTimelineEvents(events);
        }
      }
    } catch (err: unknown) {
      setSecurityError(err instanceof Error ? err.message : "Payment execution failed");
    } finally {
      setLoading(false);
    }
  };

  // Safe Demo Reset
  const handleResetDemo = async () => {
    setLoading(true);
    try {
      await apiService.resetDemo();
      handleSelectScenario("safe");
      const refreshedIntents = await apiService.getIntents();
      if (refreshedIntents.length > 0) setActiveIntent(refreshedIntents[0]);
    } catch (err) {
      console.error("Failed to reset demo:", err);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: "Intent", status: currentStage >= 1 ? "✓ COMPLETE" : "○ WAITING" },
    { num: 2, label: "Agent", status: currentStage >= 2 ? "✓ COMPLETE" : "○ WAITING" },
    { num: 3, label: "Decision", status: decisionResult ? `✓ ${decisionResult.decision}` : currentStage === 3 ? "● ACTIVE" : "○ WAITING" },
    { num: 4, label: "Approval", status: approvalRequest?.status === "APPROVED" ? "✓ APPROVED" : currentStage === 4 ? "● ACTIVE" : "○ WAITING" },
    { num: 5, label: "Payment", status: completedPayment ? "✓ SETTLED" : authorizedPayment ? "● AUTHORIZED" : currentStage === 5 ? "● ACTIVE" : "○ WAITING" },
    { num: 6, label: "Ledger", status: completedPayment || decisionResult?.decision === "BLOCK" ? "✓ RECORDED" : "○ WAITING" },
    { num: 7, label: "Replay", status: completedPayment || decisionResult?.decision === "BLOCK" ? "✓ READY" : "○ WAITING" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* 20-Second Pitch & Judge Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary-light text-xs font-extrabold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Judge Demo Mode</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-surface-200 text-slate-400 font-mono">
              Buildathon Edition
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white">IntentLedger Live Demo</h1>
          <p className="text-sm text-slate-300 font-medium mt-1 max-w-2xl leading-relaxed">
            <strong>AI agents can act. IntentLedger makes sure they can only pay within what the user actually authorized.</strong>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Razorpay executes the payment. IntentLedger enforces the boundary.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setShowJudgeScript(!showJudgeScript)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-100 border border-surface-border hover:border-primary/50 text-indigo-300 text-xs font-bold transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showJudgeScript ? "Hide Judge Script" : "Judge Walkthrough (30s)"}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDemo}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-100 border border-surface-border hover:border-surface-borderHover text-slate-300 text-xs font-bold transition-all"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Optional Judge Walkthrough Script Collapsible */}
      {showJudgeScript && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-surface-100 border border-indigo-500/40 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-indigo-300 tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-300" />
              <span>30-Second Judge Walkthrough Script</span>
            </span>
            <span className="text-[10px] text-slate-400">8 Core Security Steps</span>
          </div>

          <ol className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs text-slate-200">
            <li className="p-2.5 rounded-xl bg-surface-200/80 border border-surface-border">
              <strong className="text-indigo-300 block mb-0.5">1. Tell what you want</strong>
              Natural language user prompt defines spending bounds.
            </li>
            <li className="p-2.5 rounded-xl bg-surface-200/80 border border-surface-border">
              <strong className="text-indigo-300 block mb-0.5">2. AI compiles policy</strong>
              Gemini extracts structured budget & permissions.
            </li>
            <li className="p-2.5 rounded-xl bg-surface-200/80 border border-surface-border">
              <strong className="text-indigo-300 block mb-0.5">3. Agent proposes action</strong>
              Autonomous agent selects a candidate product.
            </li>
            <li className="p-2.5 rounded-xl bg-surface-200/80 border border-surface-border">
              <strong className="text-indigo-300 block mb-0.5">4. Engine checks drift</strong>
              Deterministic checks yield ALLOW, APPROVE, or BLOCK.
            </li>
            <li className="p-2.5 rounded-xl bg-surface-200/80 border border-surface-border">
              <strong className="text-indigo-300 block mb-0.5">5. Human approves</strong>
              Issues cryptographic token locked to item snapshot.
            </li>
            <li className="p-2.5 rounded-xl bg-surface-200/80 border border-surface-border">
              <strong className="text-indigo-300 block mb-0.5">6. Payment rail invoked</strong>
              Razorpay order created only after server verifies context.
            </li>
            <li className="p-2.5 rounded-xl bg-surface-200/80 border border-surface-border">
              <strong className="text-indigo-300 block mb-0.5">7. Tampering blocked</strong>
              Altered payload invalidates token before order creation.
            </li>
            <li className="p-2.5 rounded-xl bg-surface-200/80 border border-surface-border">
              <strong className="text-indigo-300 block mb-0.5">8. Audit & Replay</strong>
              Every state transition recorded in append-only ledger.
            </li>
          </ol>
        </div>
      )}

      {/* Scenario Selector Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            key: "safe",
            title: "Scenario A: Safe Purchase",
            desc: "Nike Pegasus @ ₹3,499 under ₹4,000 budget with approval mandate.",
            badge: "ALLOW / APPROVE",
            badgeColor: "text-emerald-400 border-emerald-500/30 bg-emerald-950",
          },
          {
            key: "drift",
            title: "Scenario B: Agent Drift (+₹3,999)",
            desc: "Agent attempts ₹7,999 against ₹4,000 budget limit.",
            badge: "🚨 BLOCK",
            badgeColor: "text-rose-400 border-rose-500/30 bg-rose-950",
          },
          {
            key: "subscription",
            title: "Scenario C: Subscription Breach",
            desc: "Agent attempts recurring plan when user authorized one-time only.",
            badge: "🚨 BLOCK",
            badgeColor: "text-rose-400 border-rose-500/30 bg-rose-950",
          },
          {
            key: "tampering",
            title: "Scenario D: 🛡️ Context Tampering",
            desc: "User approves ₹3,499; rogue agent submits ₹7,999 with same token.",
            badge: "🛡️ SECURITY ATTACK",
            badgeColor: "text-amber-300 border-amber-500/30 bg-amber-950",
          },
        ].map((sc) => (
          <button
            key={sc.key}
            onClick={() => handleSelectScenario(sc.key as DemoScenarioKey)}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              activeScenario === sc.key
                ? "bg-surface-100 border-primary shadow-glow"
                : "bg-surface-100/60 border-surface-border hover:border-surface-borderHover"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-white group-hover:text-primary-light transition-colors">
                {sc.title}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              {sc.desc}
            </p>
            <div className="mt-3">
              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${sc.badgeColor}`}>
                {sc.badge}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Horizontal Lifecycle Stepper */}
      <div className="rounded-2xl bg-surface-100 border border-surface-border p-4 shadow-xl overflow-x-auto">
        <div className="flex items-center justify-between min-w-max gap-3">
          {steps.map((st) => (
            <div key={st.num} className="flex items-center gap-2">
              <div
                className={`flex flex-col gap-0.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  currentStage >= st.num
                    ? "bg-primary text-white shadow-glow"
                    : "bg-surface-200 text-slate-500 border border-surface-border"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">
                    {st.num}
                  </span>
                  <span>{st.label}</span>
                </div>
                <span className="text-[9px] opacity-80 font-mono pl-5">
                  {st.status}
                </span>
              </div>
              {st.num < steps.length && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Interactive Stage Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Intent & Candidate Proposal (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                01. Stored Intent Policy
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-surface-200 border border-surface-border px-2 py-0.5 rounded">
              Active Boundary
            </span>
          </div>

          {/* Active Intent Details */}
          {activeIntent && (
            <div className="p-4 rounded-xl bg-surface-200 border border-surface-border space-y-2.5">
              <div className="text-[10px] font-bold uppercase text-slate-400">Natural Language Intent:</div>
              <p className="text-xs text-slate-200 font-medium italic">
                "{activeIntent.rawText}"
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-border text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Authorized Cap</span>
                  <span className="text-sm font-extrabold text-emerald-400">
                    ₹{activeIntent.constraints.maxAmount?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Human Approval</span>
                  <span className="text-xs font-bold text-amber-400">
                    {activeIntent.constraints.requiresApproval ? "Mandatory" : "Auto-Authorize"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Candidate Agent Proposal Box */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  02. AI Agent Candidate Action
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Candidate Action</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-200 border border-purple-500/30 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Proposed Product</span>
                  <div className="text-xs font-bold text-white mt-0.5">{product}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Merchant: <strong className="text-slate-200">{merchant}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Requested Price</span>
                  <span className="text-base font-extrabold text-white">
                    ₹{amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {action === "subscribe" && (
                <div className="p-2 rounded bg-purple-950/60 border border-purple-500/30 text-[11px] text-purple-300 font-semibold">
                  ⚠️ Action Type: Recurring Monthly Subscription
                </div>
              )}
            </div>

            {/* Evaluate Trigger */}
            <button
              type="button"
              onClick={handleEvaluateProposal}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-accent-violet hover:from-primary-hover hover:to-indigo-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-glow transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Zap className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Evaluate Intent Policy</span>
            </button>
          </div>
        </div>

        {/* Right Column: Policy Verdict, Approval & Payment Flow (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Top Stage Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  03. IntentLedger Verdict & Governance
                </h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Server Evaluated</span>
            </div>

            {/* Security Error / Block Banner */}
            {securityError && (
              <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs space-y-2 animate-fadeIn shadow-glow-rose">
                <div className="flex items-center gap-2 font-extrabold text-rose-300 text-sm uppercase">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>Security Violation Detected</span>
                </div>
                <p className="leading-relaxed font-medium">{securityError}</p>
                {activeScenario === "tampering" && (
                  <div className="p-3 rounded-xl bg-rose-900/80 border border-rose-700/60 text-[11px] text-rose-200 font-mono">
                    🛡️ APPROVAL_CONTEXT_MISMATCH: User approved ₹3,499. Payment requested ₹7,999. Transaction blocked permanently. Razorpay order was NOT created.
                  </div>
                )}
              </div>
            )}

            {/* Stage A: Waiting for Evaluation */}
            {!decisionResult && !securityError && (
              <div className="py-16 text-center space-y-3 rounded-2xl bg-surface-200 border border-surface-border">
                <div className="w-12 h-12 rounded-2xl bg-surface-100 border border-surface-border mx-auto flex items-center justify-center text-slate-500">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-slate-400 max-w-xs mx-auto">
                  Click <strong className="text-slate-200">"Evaluate Intent Policy"</strong> to test how IntentLedger checks candidate action against the user's intent.
                </div>
              </div>
            )}

            {/* Stage B: Decision Result Display */}
            {decisionResult && (
              <div className="space-y-4 animate-fadeIn">
                {/* Major Decision Card */}
                <div
                  className={`p-5 rounded-2xl border text-center transition-all ${
                    decisionResult.decision === "ALLOW"
                      ? "bg-emerald-950/50 border-emerald-500/50 shadow-glow-emerald"
                      : decisionResult.decision === "ASK_APPROVAL"
                      ? "bg-amber-950/50 border-amber-500/50 shadow-glow-amber"
                      : "bg-rose-950/50 border-rose-500/50 shadow-glow-rose"
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Deterministic Safety Verdict
                  </div>
                  <div className="flex justify-center my-2">
                    <DecisionBadge decision={decisionResult.decision} size="lg" />
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    {decisionResult.explanation}
                  </p>
                </div>

                {/* Intent Drift Diagnostic Card */}
                {decisionResult.driftReport.hasDrift && (
                  <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Intent Drift Detected</span>
                      </span>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-900 text-rose-200">
                        {decisionResult.driftReport.severity}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded bg-surface-200 border border-surface-border">
                        <span className="text-[10px] text-slate-400 block uppercase">Authorized</span>
                        <strong className="text-emerald-400">₹{activeIntent?.constraints.maxAmount?.toLocaleString()}</strong>
                      </div>
                      <div className="p-2 rounded bg-surface-200 border border-surface-border">
                        <span className="text-[10px] text-slate-400 block uppercase">Requested</span>
                        <strong className="text-rose-400">₹{amount.toLocaleString()}</strong>
                      </div>
                      <div className="p-2 rounded bg-surface-200 border border-surface-border">
                        <span className="text-[10px] text-slate-400 block uppercase">Deviation</span>
                        <strong className="text-rose-300">
                          {decisionResult.driftReport.driftItems[0]?.deviation || `+₹${(amount - 4000).toLocaleString()}`}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stage C: Human Approval Required */}
                {decisionResult.decision === "ASK_APPROVAL" && approvalRequest && (
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>04. Human Authorization Required</span>
                      </span>
                      <span className="text-[10px] font-mono text-amber-300">
                        {approvalRequest.status}
                      </span>
                    </div>

                    {approvalRequest.status === "PENDING" ? (
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={loading}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-glow-emerald transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Purchase of ₹{amount.toLocaleString()}</span>
                      </button>
                    ) : (
                      <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5" />
                          <span>Cryptographic Approval Token Issued (10m TTL)</span>
                        </span>
                        <span className="font-mono text-[10px] truncate max-w-[140px]">
                          {approvalRequest.approvalToken}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Stage D: Payment Execution Gate */}
                {(decisionResult.decision === "ALLOW" || approvalRequest?.status === "APPROVED") && !completedPayment && (
                  <div className="p-4 rounded-xl bg-surface-200 border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        <span>05. Payment Rail Execution</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400">
                        {isRazorpayTestMode ? "Razorpay Test Mode" : "Simulated Bridge"}
                      </span>
                    </div>

                    {!authorizedPayment ? (
                      <button
                        type="button"
                        onClick={handleAuthorizePayment}
                        disabled={loading}
                        className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-extrabold shadow-glow transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span>
                          {activeScenario === "tampering"
                            ? "Test Malicious Payment (Attempt ₹7,999)"
                            : `Authorize Payment of ₹${amount.toLocaleString()}`}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCompletePayment}
                        disabled={loading}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-extrabold shadow-glow-emerald transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {isRazorpayTestMode ? "Open Razorpay Test Checkout" : "Complete Simulated Settlement"}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Stage E: Settled & Ledger Stream */}
                {completedPayment && (
                  <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 uppercase flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>06. Payment Cryptographically Verified</span>
                      </span>
                      <span className="text-xs font-mono text-emerald-300">SETTLED</span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <div>Transaction ID: <span className="font-mono text-indigo-300">{completedPayment.gatewayTransactionId}</span></div>
                      {completedPayment.razorpayOrderId && (
                        <div>Razorpay Order: <span className="font-mono text-purple-300">{completedPayment.razorpayOrderId}</span></div>
                      )}
                      <div>Amount: <strong className="text-emerald-400">₹{completedPayment.amount.toLocaleString()}</strong></div>
                    </div>

                    {/* Live Ledger Timeline list */}
                    {timelineEvents.length > 0 && (
                      <div className="p-3 rounded-xl bg-surface-200 border border-surface-border text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Append-Only Audit Trail:</span>
                        <div className="space-y-0.5 text-[11px] text-slate-300 font-mono">
                          {timelineEvents.slice(0, 5).map((e) => (
                            <div key={e.id} className="truncate text-indigo-300">✓ {e.eventType}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex items-center gap-3">
                      <Link
                        to="/replay"
                        className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-center text-xs font-extrabold text-white shadow-glow flex items-center justify-center gap-1.5 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>07. Replay Full Lifecycle</span>
                      </Link>

                      <Link
                        to="/ledger"
                        className="flex-1 py-2.5 px-4 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-center text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <History className="w-3.5 h-3.5 text-purple-400" />
                        <span>Decision Ledger</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 p-3 rounded-xl bg-surface-200/80 border border-surface-border flex items-center justify-between">
            <span className="font-semibold text-slate-300">
              The AI can propose. The user defines the intent. IntentLedger enforces the boundary.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
