import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Bot,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  SlidersHorizontal,
  FileCheck,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import { DecisionBadge } from "../components/StatusBadge";
import { apiService } from "../services/api";
import { Intent, DecisionResult, AgentProposal, AvailabilityResult, CommerceCandidate } from "../types";

export const SimulationPage: React.FC = () => {
  const location = useLocation();
  const passedState = location.state as {
    intentId?: string;
    intent?: Intent;
  } | null;

  const [intents, setIntents] = useState<Intent[]>([]);
  const [selectedIntentId, setSelectedIntentId] = useState<string>(
    passedState?.intentId || localStorage.getItem("activeIntentId") || ""
  );

  // Availability & Dynamic Candidates State
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [loadingAvailability, setLoadingAvailability] = useState<boolean>(false);

  // Active Proposal State
  const [proposalProduct, setProposalProduct] = useState<string>("Cord Set Kurti");
  const [proposalMerchant, setProposalMerchant] = useState<string>("Approved Store");
  const [proposalAmount, setProposalAmount] = useState<number>(1299);
  const [proposalCurrency, setProposalCurrency] = useState<string>("INR");
  const [proposalQuantity, setProposalQuantity] = useState<number>(1);
  const [proposalAction, setProposalAction] = useState<AgentProposal["action"]>("purchase");
  const [isSubscription, setIsSubscription] = useState<boolean>(false);

  // Evaluation & Results
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [decisionResult, setDecisionResult] = useState<DecisionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Collapsible Advanced Testing
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Fetch candidates and set proposal based on intent
  const fetchCandidateAvailability = async (intent: Intent, preselectCandidateId?: string) => {
    setLoadingAvailability(true);
    try {
      const availData = await apiService.getCommerceCandidates(intent.id);
      setAvailability(availData);

      const targetCandidate = preselectCandidateId
        ? availData.candidates.find((c) => c.id === preselectCandidateId) || availData.recommendedCandidate
        : availData.recommendedCandidate;

      if (targetCandidate) {
        setSelectedCandidateId(targetCandidate.id);
        setProposalProduct(targetCandidate.name);
        setProposalMerchant(targetCandidate.merchant);
        setProposalAmount(targetCandidate.totalPrice);
        setProposalCurrency(targetCandidate.currency);
        setProposalQuantity(targetCandidate.quantity);
        setProposalAction(targetCandidate.isSubscription ? "subscribe" : "purchase");
        setIsSubscription(targetCandidate.isSubscription || false);
      }
    } catch (err) {
      console.error("Failed to fetch commerce availability:", err);
      // Fallback proposal calculation
      const maxAmount = intent.constraints.maxAmount || 1500;
      const amount = Math.round(maxAmount * 0.86);
      setProposalProduct(intent.constraints.productCategory === "clothing" ? "Cord Set Kurti" : "Candidate Item");
      setProposalMerchant(intent.constraints.allowedMerchants?.[0] || "Approved Store");
      setProposalAmount(amount);
      setProposalCurrency(intent.constraints.currency || "INR");
      setProposalQuantity(intent.constraints.quantity || 1);
    } finally {
      setLoadingAvailability(false);
    }
  };

  useEffect(() => {
    const loadIntents = async () => {
      try {
        const intentsData = await apiService.getIntents();
        setIntents(intentsData);

        const storedId = localStorage.getItem("activeIntentId");
        let activeId = passedState?.intentId || storedId || "";
        if (!activeId && intentsData.length > 0) {
          activeId = intentsData[0].id;
        }

        if (activeId) {
          setSelectedIntentId(activeId);
          const active = intentsData.find((i) => i.id === activeId) || intentsData[0];
          if (active) {
            fetchCandidateAvailability(active);
          }
        }
      } catch (err) {
        console.error("Error loading intents in simulation:", err);
      }
    };

    loadIntents();
  }, []);

  const selectedIntent = intents.find((i) => i.id === selectedIntentId) || intents[0];

  const handleIntentChange = (intentId: string) => {
    setSelectedIntentId(intentId);
    localStorage.setItem("activeIntentId", intentId);
    setDecisionResult(null);
    setErrorMsg(null);
    const target = intents.find((i) => i.id === intentId);
    if (target) {
      fetchCandidateAvailability(target);
    }
  };

  const handleSelectCandidate = (candidate: CommerceCandidate) => {
    setSelectedCandidateId(candidate.id);
    setProposalProduct(candidate.name);
    setProposalMerchant(candidate.merchant);
    setProposalAmount(candidate.totalPrice);
    setProposalCurrency(candidate.currency);
    setProposalQuantity(candidate.quantity);
    setProposalAction(candidate.isSubscription ? "subscribe" : "purchase");
    setIsSubscription(candidate.isSubscription || false);
    setDecisionResult(null);
    setErrorMsg(null);
  };

  // Primary Action: Evaluate Agent Proposal
  const handleEvaluateProposal = async (customProposal?: AgentProposal) => {
    if (!selectedIntent) {
      setErrorMsg("Please select an active user intent policy.");
      return;
    }

    setEvaluating(true);
    setErrorMsg(null);

    const targetProposal = customProposal || {
      id: `prop_sim_${Date.now().toString().slice(-4)}`,
      intentId: selectedIntent.id,
      product: proposalProduct,
      merchant: proposalMerchant,
      amount: Number(proposalAmount),
      currency: proposalCurrency,
      quantity: Number(proposalQuantity),
      action: proposalAction,
      isSubscription,
      proposedAt: new Date().toISOString(),
    };

    try {
      const result = await apiService.evaluateProposal({
        intentId: selectedIntent.id,
        proposal: targetProposal,
      });
      setDecisionResult(result);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Proposal evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Autonomous Agent Governance
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Agent Simulation
        </h1>
        <p className="text-sm text-slate-600 mt-0.5 font-normal">
          AI agents dynamically discover purchasable market candidates while IntentLedger deterministically enforces authorization boundaries.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* 1. Active User Intent Authority Banner */}
      {selectedIntent && (
        <div className="fintech-card p-5 bg-gradient-to-r from-blue-50/60 via-white to-slate-50 border-blue-200 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-blue-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-600 text-white shadow-2xs">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  User Authorization Authority
                </span>
                <div className="text-sm font-extrabold text-slate-900 font-mono">
                  {selectedIntent.id}
                </div>
              </div>
            </div>

            {intents.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Policy:</span>
                <select
                  value={selectedIntentId}
                  onChange={(e) => handleIntentChange(e.target.value)}
                  className="text-xs font-bold rounded-lg bg-white border border-slate-300 p-1.5 text-slate-900 shadow-2xs"
                >
                  {intents.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.id} ({i.category.toUpperCase()} • Max ₹{i.constraints.maxAmount?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-white border border-blue-100 text-xs text-slate-800 italic font-medium">
            "{selectedIntent.rawText}"
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Category</span>
              <span className="font-extrabold text-blue-700 block uppercase">{selectedIntent.category}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Quantity Limit</span>
              <span className="font-extrabold text-slate-900 block tabular-nums">
                {selectedIntent.constraints.quantity || 1} units
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Spending Authority</span>
              <span className="font-extrabold text-slate-900 block tabular-nums">
                ₹{selectedIntent.constraints.maxAmount?.toLocaleString()} <span className="text-[10px] text-slate-500 font-mono">MAX</span>
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Purchase</span>
              <span className="font-extrabold text-emerald-800 block">
                {selectedIntent.permissions.canPurchase ? "Authorized" : "Blocked"}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Human Review</span>
              <span className={`font-extrabold block ${selectedIntent.constraints.requiresApproval ? "text-amber-800" : "text-emerald-800"}`}>
                {selectedIntent.constraints.requiresApproval ? "Mandatory Review" : "Auto-Authorize"}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Merchant Scope</span>
              <span className="font-bold text-slate-800 block truncate">
                {selectedIntent.constraints.allowedMerchants?.[0] || "Approved Store"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Commerce Availability Layer: Dynamic Candidate Discovery */}
      <div className="fintech-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Market Candidates Discovered by Autonomous Agent
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Dynamic Availability Layer (Pricing &amp; Catalog Aware)
          </span>
        </div>

        {loadingAvailability ? (
          <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Discovering market candidate options...</span>
          </div>
        ) : availability && availability.candidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {availability.candidates.map((cand) => {
              const isSelected = cand.id === selectedCandidateId;
              const maxAmt = selectedIntent?.constraints.maxAmount || 0;
              const isWithin = cand.totalPrice <= maxAmt;
              const isDrift = cand.totalPrice > maxAmt;

              return (
                <button
                  key={cand.id}
                  type="button"
                  onClick={() => handleSelectCandidate(cand)}
                  className={`text-left p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
                      : "bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                          cand.matchTier === "within_budget"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : cand.matchTier === "exact_budget"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        {cand.matchTier === "within_budget"
                          ? "Within Authority"
                          : cand.matchTier === "exact_budget"
                          ? "Optimal Match"
                          : "Market Exceedance"}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          Selected Proposal
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                        {cand.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {cand.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                        {cand.quantity > 1 ? `₹${cand.unitPrice} × ${cand.quantity}` : cand.merchant}
                      </span>
                      <span className="text-base font-extrabold text-slate-900 tabular-nums">
                        ₹{cand.totalPrice.toLocaleString()}{" "}
                        <span className="text-[10px] font-mono text-slate-500 font-normal">INR</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold block ${
                          isWithin ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {isWithin ? "✓ Compliant" : "🚨 Over Limit"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isDrift ? `+₹${(cand.totalPrice - maxAmt).toLocaleString()}` : `₹${cand.totalPrice} / ₹${maxAmt}`}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* 3. Main Evaluation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Agent Proposal */}
        <div className="lg:col-span-6 fintech-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  AI Agent Proposal
                </h3>
              </div>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                Dynamic Market Selection
              </span>
            </div>

            {/* Generated Proposal Card */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Product Item</span>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">
                  {proposalProduct}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs pt-1 border-t border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Quantity</span>
                  <span className="font-extrabold text-slate-900 block mt-0.5">{proposalQuantity} units</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Merchant</span>
                  <span className="font-bold text-slate-800 block mt-0.5 truncate">{proposalMerchant}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Proposed Price</span>
                  <span className="font-extrabold text-slate-900 block mt-0.5 tabular-nums text-sm">
                    ₹{proposalAmount.toLocaleString()} <span className="text-xs font-mono text-slate-500 font-normal">INR</span>
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs flex items-center justify-between">
                <span className="text-slate-600 font-medium">
                  Action: {isSubscription ? "Recurring Subscription" : "One-Time Purchase"}
                </span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    proposalAmount <= (selectedIntent?.constraints.maxAmount || 0)
                      ? "text-emerald-700"
                      : "text-rose-600"
                  }`}
                >
                  {proposalAmount <= (selectedIntent?.constraints.maxAmount || 0) ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Inside ₹{selectedIntent?.constraints.maxAmount?.toLocaleString()} Limit
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" /> Exceeds ₹{selectedIntent?.constraints.maxAmount?.toLocaleString()} Limit
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleEvaluateProposal()}
              disabled={evaluating}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold transition-all shadow-sm active:scale-95"
            >
              <Zap className={`w-4 h-4 ${evaluating ? "animate-spin" : ""}`} />
              <span>{evaluating ? "Evaluating Deterministic Policy..." : "Evaluate Agent Proposal"}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Deterministic Decision Verdict */}
        <div className="lg:col-span-6 fintech-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Deterministic Decision Verdict
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-semibold">
                Intent Policy Engine
              </span>
            </div>

            {!decisionResult ? (
              <div className="py-20 text-center space-y-2">
                <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">Awaiting Evaluation</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
                  Click <strong>"Evaluate Agent Proposal"</strong> on the left to execute deterministic policy governance on the selected candidate.
                </p>
              </div>
            ) : (
              <div className="space-y-4 mt-2 animate-fadeIn">
                {/* Decision Badge Card */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    decisionResult.decision === "ALLOW"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                      : decisionResult.decision === "ASK_APPROVAL"
                      ? "bg-amber-50 border-amber-300 text-amber-950"
                      : "bg-rose-50 border-rose-300 text-rose-950"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Final Governance Verdict
                    </span>
                    <div className="mt-1">
                      <DecisionBadge decision={decisionResult.decision} size="lg" />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-600 block">
                      Risk Score
                    </span>
                    <span
                      className={`text-2xl font-extrabold tabular-nums ${
                        decisionResult.riskScore > 50
                          ? "text-rose-600"
                          : decisionResult.riskScore > 20
                          ? "text-amber-700"
                          : "text-emerald-700"
                      }`}
                    >
                      {decisionResult.riskScore}/100
                    </span>
                  </div>
                </div>

                {/* Concise Checklist Matrix */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-800 font-semibold">Within User Authority</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        proposalAmount <= (selectedIntent?.constraints.maxAmount || 0)
                          ? "text-emerald-700"
                          : "text-rose-600"
                      }`}
                    >
                      {proposalAmount <= (selectedIntent?.constraints.maxAmount || 0) ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Passed
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Exceeded Limit
                        </>
                      )}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-800 font-semibold">Purchase Permission</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Allowed
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-800 font-semibold">
                      Budget (₹{proposalAmount.toLocaleString()} / ₹{selectedIntent?.constraints.maxAmount?.toLocaleString()})
                    </span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        proposalAmount <= (selectedIntent?.constraints.maxAmount || 0)
                          ? "text-emerald-700"
                          : "text-rose-600"
                      }`}
                    >
                      {proposalAmount <= (selectedIntent?.constraints.maxAmount || 0) ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Passed
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> +₹{(proposalAmount - (selectedIntent?.constraints.maxAmount || 0)).toLocaleString()} Exceeded
                        </>
                      )}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-800 font-semibold">Human Approval Mandate</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        selectedIntent?.constraints.requiresApproval ? "text-amber-800" : "text-emerald-700"
                      }`}
                    >
                      {selectedIntent?.constraints.requiresApproval ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Required
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Auto-Authorized
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Explanation Banner */}
                {decisionResult.decision === "BLOCK" && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                    <span className="font-bold block">🚨 Policy Enforcement Blocked Transaction:</span>
                    <span className="text-[11px] text-rose-800">{decisionResult.explanation}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Direct Workflow Navigation */}
          {decisionResult && (
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                {decisionResult.decision === "ASK_APPROVAL"
                  ? "Human Approval Mandate Required:"
                  : decisionResult.decision === "ALLOW"
                  ? "Pre-Authorized Payment Ready:"
                  : "Zero Funds Moved:"}
              </span>

              {decisionResult.decision !== "BLOCK" ? (
                <Link
                  to={decisionResult.decision === "ASK_APPROVAL" ? "/approvals" : "/payment"}
                  state={{
                    intentId: selectedIntent.id,
                    approvalId: decisionResult.approvalId,
                    proposal: {
                      product: proposalProduct,
                      merchant: proposalMerchant,
                      amount: Number(proposalAmount),
                      currency: proposalCurrency,
                      quantity: Number(proposalQuantity),
                      action: proposalAction,
                      proposedAt: new Date().toISOString(),
                    },
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm active:scale-95"
                >
                  <span>
                    {decisionResult.decision === "ASK_APPROVAL"
                      ? "Open Approval Center"
                      : "Proceed to Payment Gate"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="font-bold text-rose-600 font-mono text-xs">
                  BLOCKED (Zero Funds Moved)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Collapsible Advanced Custom Parameters Testing */}
      <div className="fintech-card p-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Advanced Custom Proposal Parameter Tuning</span>
          </div>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-fadeIn text-xs">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 uppercase text-[10px] block">
                Manual Custom Override
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Item Name</label>
                  <input
                    type="text"
                    value={proposalProduct}
                    onChange={(e) => setProposalProduct(e.target.value)}
                    className="w-full rounded-md bg-white border border-slate-300 p-1.5 text-xs font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={proposalQuantity}
                    onChange={(e) => setProposalQuantity(Number(e.target.value))}
                    className="w-full rounded-md bg-white border border-slate-300 p-1.5 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Merchant</label>
                  <input
                    type="text"
                    value={proposalMerchant}
                    onChange={(e) => setProposalMerchant(e.target.value)}
                    className="w-full rounded-md bg-white border border-slate-300 p-1.5 text-xs font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={proposalAmount}
                    onChange={(e) => setProposalAmount(Number(e.target.value))}
                    className="w-full rounded-md bg-white border border-slate-300 p-1.5 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
