import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Zap,
  Sliders,
  History,
} from "lucide-react";
import { DecisionBadge } from "../components/StatusBadge";
import { apiService } from "../services/api";
import { Intent, DecisionResult, DemoScenario, AgentProposal } from "../types";

export const SimulationPage: React.FC = () => {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [selectedIntentId, setSelectedIntentId] = useState<string>("");
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Proposal Form State
  const [proposalProduct, setProposalProduct] = useState<string>("Nike Air Pegasus Running Shoes");
  const [proposalMerchant, setProposalMerchant] = useState<string>("Nike India");
  const [proposalAmount, setProposalAmount] = useState<number>(3499);
  const [proposalCurrency, setProposalCurrency] = useState<string>("INR");
  const [proposalQuantity, setProposalQuantity] = useState<number>(1);
  const [proposalAction, setProposalAction] = useState<AgentProposal["action"]>("purchase");
  const [isSubscription, setIsSubscription] = useState<boolean>(false);

  // Evaluation & Results State
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [decisionResult, setDecisionResult] = useState<DecisionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load initial intents and demo scenarios
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingInitial(true);
      try {
        const [intentsData, scenariosData] = await Promise.all([
          apiService.getIntents(),
          apiService.getDemoScenarios(),
        ]);
        setIntents(intentsData);
        setScenarios(scenariosData);

        if (intentsData.length > 0) {
          setSelectedIntentId(intentsData[0].id);
        }
      } catch (err) {
        console.error("Error loading simulation data:", err);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadInitialData();
  }, []);

  const selectedIntent = intents.find((i) => i.id === selectedIntentId) || intents[0];

  // Quick Scenario Preset Loader
  const handleApplyScenario = (scenario: DemoScenario) => {
    // Find matching intent if exists, or pick current
    const matchingIntent = intents.find((i) => i.id === scenario.intentId);
    if (matchingIntent) {
      setSelectedIntentId(matchingIntent.id);
    }
    setProposalProduct(scenario.proposal.product);
    setProposalMerchant(scenario.proposal.merchant);
    setProposalAmount(scenario.proposal.amount);
    setProposalCurrency(scenario.proposal.currency);
    setProposalQuantity(scenario.proposal.quantity);
    setProposalAction(scenario.proposal.action);
    setIsSubscription(!!scenario.proposal.isSubscription);
    setDecisionResult(null);
    setErrorMsg(null);
  };

  // Evaluate Agent Proposal against backend
  const handleEvaluate = async () => {
    if (!selectedIntent) {
      setErrorMsg("Please select an active user intent first.");
      return;
    }

    setEvaluating(true);
    setErrorMsg(null);

    try {
      const result = await apiService.evaluateProposal({
        intentId: selectedIntent.id,
        proposal: {
          product: proposalProduct,
          merchant: proposalMerchant,
          amount: Number(proposalAmount),
          currency: proposalCurrency,
          quantity: Number(proposalQuantity),
          action: proposalAction,
          isSubscription,
          agentName: "Autonomous Shopping Agent",
        },
      });
      setDecisionResult(result);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to evaluate proposal");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-semibold uppercase tracking-wider mb-2">
          Interactive Policy Governance & Evaluation
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Agent Simulation Lab</h1>
        <p className="text-sm text-slate-400 mt-1">
          Test what happens when an autonomous AI agent acts on a user's intent. IntentLedger enforces deterministic safety gates and flags intent drift before payment execution.
        </p>
      </div>

      {/* Benchmark Scenarios Bar */}
      {scenarios.length > 0 && (
        <div className="rounded-xl bg-surface-100/60 border border-surface-border p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>One-Click Test Scenarios:</span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">Populates candidate agent payload</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {scenarios.map((sc) => (
              <button
                key={sc.id}
                onClick={() => handleApplyScenario(sc)}
                className="text-left p-3 rounded-lg bg-surface-200 border border-surface-border hover:border-primary/50 hover:bg-surface-50 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-primary-light transition-colors">
                    {sc.title.split("—")[1] || sc.title}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                      sc.expectedDecision === "ALLOW"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                        : sc.expectedDecision === "ASK_APPROVAL"
                        ? "bg-amber-950 text-amber-300 border border-amber-500/30"
                        : "bg-rose-950 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {sc.expectedDecision}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2">
                  {sc.highlightNote}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3-Column Interactive Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =========================================================================
            COLUMN 1: USER INTENT (Left - 4 Cols)
            ========================================================================= */}
        <div className="lg:col-span-4 rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  1. Active User Intent
                </h2>
              </div>
              <Link
                to="/studio"
                className="text-[11px] text-primary-light hover:text-white font-semibold transition-colors"
              >
                + New Intent
              </Link>
            </div>

            {/* Intent Selector */}
            {intents.length > 0 && (
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Select Registered Intent Boundary:
                </label>
                <select
                  value={selectedIntentId}
                  onChange={(e) => setSelectedIntentId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-lg bg-surface-200 border border-surface-border p-2.5 text-slate-200 focus:outline-none focus:border-primary"
                >
                  {intents.map((intent) => (
                    <option key={intent.id} value={intent.id}>
                      {intent.category.toUpperCase()} • Max ₹{intent.constraints.maxAmount?.toLocaleString()} — "{intent.rawText.substring(0, 35)}..."
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Intent Details Display */}
            {selectedIntent ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-surface-200/90 border border-surface-border">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Natural Language Intent:
                  </div>
                  <p className="text-xs text-slate-200 italic font-medium leading-relaxed">
                    "{selectedIntent.rawText}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg bg-surface-200 border border-surface-border">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Max Budget</span>
                    <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block">
                      {selectedIntent.constraints.currency || "INR"} {selectedIntent.constraints.maxAmount?.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-200 border border-surface-border">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Approval Mandate</span>
                    <span
                      className={`text-xs font-bold mt-1 block ${
                        selectedIntent.constraints.requiresApproval ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {selectedIntent.constraints.requiresApproval ? "Mandatory" : "Auto-Authorize"}
                    </span>
                  </div>
                </div>

                {selectedIntent.constraints.allowedMerchants && selectedIntent.constraints.allowedMerchants.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-surface-200 border border-surface-border text-xs">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Allowed Merchants:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedIntent.constraints.allowedMerchants.map((m, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-surface-100 border border-surface-border text-[10px] text-slate-300">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Permissions Matrix */}
                <div className="p-3 rounded-lg bg-surface-200 border border-surface-border space-y-1.5 text-[11px]">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Permissions:</span>
                  <div className="grid grid-cols-2 gap-1 text-slate-300">
                    <div>Purchase: <strong className={selectedIntent.permissions.canPurchase ? "text-emerald-400" : "text-rose-400"}>{selectedIntent.permissions.canPurchase ? "YES" : "NO"}</strong></div>
                    <div>Subscribe: <strong className={selectedIntent.permissions.canSubscribe ? "text-emerald-400" : "text-rose-400"}>{selectedIntent.permissions.canSubscribe ? "YES" : "NO"}</strong></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-4 text-center">
                {loadingInitial ? "Loading intents..." : "No intents available."}
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 p-3 rounded-xl bg-surface-200 border border-surface-border">
            <span className="font-semibold text-slate-300">Deterministic Policy Rule:</span> The AI agent cannot exceed these boundaries. Any violation will trigger a block.
          </div>
        </div>

        {/* =========================================================================
            COLUMN 2: AGENT PROPOSAL (Center - 4 Cols)
            ========================================================================= */}
        <div className="lg:col-span-4 rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                2. AI Agent Candidate Proposal
              </h2>
            </div>
            <span className="text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded">
              Autonomous
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setProposalProduct("Nike Air Pegasus Running Shoes");
                setProposalMerchant("Nike India");
                setProposalAmount(3499);
                setProposalAction("purchase");
                setIsSubscription(false);
              }}
              className="p-2 rounded-lg bg-surface-200 hover:bg-surface-50 border border-surface-border text-center text-[10px] font-bold text-slate-300 hover:text-emerald-300 transition-all"
            >
              🛡️ Safe (₹3,499)
            </button>
            <button
              type="button"
              onClick={() => {
                setProposalProduct("Nike Vaporfly Elite Pro Shoes");
                setProposalMerchant("Nike India");
                setProposalAmount(7999);
                setProposalAction("purchase");
                setIsSubscription(false);
              }}
              className="p-2 rounded-lg bg-surface-200 hover:bg-surface-50 border border-rose-500/30 text-center text-[10px] font-bold text-rose-300 transition-all"
            >
              🚨 Drift (₹7,999)
            </button>
            <button
              type="button"
              onClick={() => {
                setProposalProduct("VIP Runner Recurring Plan");
                setProposalMerchant("Nike India");
                setProposalAmount(999);
                setProposalAction("subscribe");
                setIsSubscription(true);
              }}
              className="p-2 rounded-lg bg-surface-200 hover:bg-surface-50 border border-purple-500/30 text-center text-[10px] font-bold text-purple-300 transition-all"
            >
              ⚠️ Subscription
            </button>
          </div>

          {/* Editable Fields */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Proposed Product:
              </label>
              <input
                type="text"
                value={proposalProduct}
                onChange={(e) => setProposalProduct(e.target.value)}
                className="w-full rounded-lg bg-surface-200 border border-surface-border p-2.5 text-slate-200 focus:outline-none focus:border-primary font-medium"
                placeholder="Product name"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Proposed Merchant:
                </label>
                <input
                  type="text"
                  value={proposalMerchant}
                  onChange={(e) => setProposalMerchant(e.target.value)}
                  className="w-full rounded-lg bg-surface-200 border border-surface-border p-2.5 text-slate-200 focus:outline-none focus:border-primary font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Proposed Price (INR):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
                  <input
                    type="number"
                    value={proposalAmount}
                    onChange={(e) => setProposalAmount(Number(e.target.value))}
                    className="w-full rounded-lg bg-surface-200 border border-surface-border p-2.5 pl-7 text-slate-100 font-bold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Quantity:
                </label>
                <input
                  type="number"
                  min={1}
                  value={proposalQuantity}
                  onChange={(e) => setProposalQuantity(Number(e.target.value))}
                  className="w-full rounded-lg bg-surface-200 border border-surface-border p-2.5 text-slate-200 focus:outline-none focus:border-primary font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Action Type:
                </label>
                <select
                  value={proposalAction}
                  onChange={(e) => {
                    const act = e.target.value as AgentProposal["action"];
                    setProposalAction(act);
                    if (act === "subscribe") setIsSubscription(true);
                  }}
                  className="w-full rounded-lg bg-surface-200 border border-surface-border p-2.5 text-slate-200 focus:outline-none focus:border-primary font-medium"
                >
                  <option value="purchase">Purchase</option>
                  <option value="subscribe">Subscribe (Recurring)</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isSubscription}
                onChange={(e) => setIsSubscription(e.target.checked)}
                className="w-4 h-4 rounded bg-surface-200 border-surface-border text-primary focus:ring-0"
              />
              <span className="text-[11px] text-slate-300 font-medium">
                Recurring Subscription Payment Flag
              </span>
            </label>
          </div>

          {/* Evaluate CTA Button */}
          <button
            type="button"
            onClick={handleEvaluate}
            disabled={evaluating}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-accent-violet hover:from-primary-hover hover:to-indigo-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-glow transition-all active:scale-98 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${evaluating ? "animate-spin" : ""}`} />
            <span>{evaluating ? "Evaluating Policy..." : "Evaluate Agent Action"}</span>
          </button>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* =========================================================================
            COLUMN 3: INTENTLEDGER DECISION & DRIFT DIAGNOSTIC (Right - 4 Cols)
            ========================================================================= */}
        <div className="lg:col-span-4 rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  3. IntentLedger Verdict
                </h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Deterministic Engine</span>
            </div>

            {decisionResult ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Major Decision Banner */}
                <div
                  className={`p-5 rounded-2xl border text-center transition-all ${
                    decisionResult.decision === "ALLOW"
                      ? "bg-emerald-950/50 border-emerald-500/50 shadow-glow-emerald"
                      : decisionResult.decision === "ASK_APPROVAL"
                      ? "bg-amber-950/50 border-amber-500/50 shadow-glow-amber"
                      : "bg-rose-950/50 border-rose-500/50 shadow-glow-rose"
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Safety Gate Decision
                  </div>
                  <div className="flex justify-center my-2">
                    <DecisionBadge decision={decisionResult.decision} size="lg" />
                  </div>
                  <p className="text-xs text-slate-300 mt-2 font-medium">
                    {decisionResult.explanation}
                  </p>
                </div>

                {/* Risk Score Indicator */}
                <div className="p-3.5 rounded-xl bg-surface-200 border border-surface-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Deterministic Risk Score
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {decisionResult.riskScore <= 20
                        ? "Low Risk (Safe)"
                        : decisionResult.riskScore <= 50
                        ? "Moderate (Approval Required)"
                        : "Critical Policy Violation"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xl font-extrabold font-mono ${
                        decisionResult.riskScore <= 20
                          ? "text-emerald-400"
                          : decisionResult.riskScore <= 50
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {decisionResult.riskScore}
                    </span>
                    <span className="text-[10px] text-slate-500"> / 100</span>
                  </div>
                </div>

                {/* THE WOW MOMENT: Intent Drift Diagnostic Card */}
                {decisionResult.driftReport.hasDrift && (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase tracking-wider">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Intent Drift Detected</span>
                      </span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-900/80 text-rose-200 border border-rose-600">
                        {decisionResult.driftReport.severity}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {decisionResult.driftReport.driftItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-surface-200/90 border border-surface-border space-y-1"
                        >
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-400">{item.label}</span>
                            <span className={item.isViolation ? "text-rose-400" : "text-emerald-400"}>
                              {item.deviation}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300">
                            <div>Authorized: <strong className="text-white">{String(item.originalIntent)}</strong></div>
                            <div>Proposed: <strong className="text-white">{String(item.proposedAction)}</strong></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Policy Checks Breakdown */}
                <div className="p-3.5 rounded-xl bg-surface-200 border border-surface-border space-y-2">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Policy Checks Diagnostic:
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {decisionResult.checks.map((check) => (
                      <div
                        key={check.id}
                        className="flex items-center justify-between p-2 rounded bg-surface-100/70"
                      >
                        <div className="flex items-center gap-2">
                          {check.status === "PASS" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : check.status === "WARN" ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          )}
                          <span className="text-slate-300 font-medium text-[11px]">
                            {check.name}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            check.status === "PASS"
                              ? "text-emerald-400"
                              : check.status === "WARN"
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          {check.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-200 border border-surface-border mx-auto flex items-center justify-center text-slate-500">
                  <Sliders className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-slate-400">
                  Select an intent and click <strong className="text-slate-200">"Evaluate Agent Action"</strong> to test policy clearance.
                </div>
              </div>
            )}
          </div>

          {decisionResult && (
            <div className="pt-3 border-t border-surface-border flex items-center justify-between">
              <Link
                to="/decisions"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Full Policy Breakdown</span>
                <ArrowRight className="w-3 h-3" />
              </Link>

              <Link
                to="/ledger"
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <History className="w-3 h-3" />
                <span>Audit Trail</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
