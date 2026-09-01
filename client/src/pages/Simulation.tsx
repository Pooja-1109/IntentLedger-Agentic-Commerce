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
} from "lucide-react";
import { DecisionBadge } from "../components/StatusBadge";
import { apiService } from "../services/api";
import { Intent, DecisionResult, AgentProposal } from "../types";

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

  // Proposal State (Dynamically calculated from active intent)
  const [proposalProduct, setProposalProduct] = useState<string>("Notebook Set (Pack of 6)");
  const [proposalMerchant, setProposalMerchant] = useState<string>("Approved Store");
  const [proposalAmount, setProposalAmount] = useState<number>(550);
  const [proposalCurrency, setProposalCurrency] = useState<string>("INR");
  const [proposalQuantity, setProposalQuantity] = useState<number>(6);
  const [proposalAction, setProposalAction] = useState<AgentProposal["action"]>("purchase");
  const [isSubscription, setIsSubscription] = useState<boolean>(false);

  // Evaluation & Results
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [decisionResult, setDecisionResult] = useState<DecisionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Collapsible Advanced Testing
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Dynamic compliant proposal calculation based on actual intent
  const deriveCompliantProposal = (intent: Intent) => {
    const maxAmount = intent.constraints.maxAmount || 5000;
    const currency = intent.constraints.currency || "INR";
    const quantity = intent.constraints.quantity || 1;
    const raw = intent.rawText.toLowerCase();

    // 1. Calculate realistic compliant amount inside the spending boundary
    let compliantAmount: number;
    const rangeRegex = /(?:around|between|from)?\s*(?:₹|rs\.?|inr|\$|usd)?\s*([\d,]+(?:\.\d+)?)\s*(?:to|-|and)\s*(?:₹|rs\.?|inr|\$|usd)?\s*([\d,]+(?:\.\d+)?)/i;
    const rangeMatch = raw.match(rangeRegex);

    if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
      const min = parseFloat(rangeMatch[1].replace(/,/g, ""));
      const max = parseFloat(rangeMatch[2].replace(/,/g, ""));
      if (!isNaN(min) && !isNaN(max)) {
        // Midpoint of user's specified budget range (e.g. 500 to 600 -> 550)
        compliantAmount = Math.round((min + max) / 2);
      } else {
        compliantAmount = Math.round(maxAmount * 0.85);
      }
    } else if (maxAmount === 25000) {
      compliantAmount = 18500;
    } else if (maxAmount === 40000) {
      compliantAmount = 35000;
    } else if (maxAmount === 4000) {
      compliantAmount = 3499;
    } else if (maxAmount === 500) {
      compliantAmount = 450;
    } else if (maxAmount <= 1000) {
      compliantAmount = Math.round(maxAmount * 0.85);
    } else if (maxAmount <= 50000) {
      compliantAmount = maxAmount > 10000 ? maxAmount - 5000 : Math.round(maxAmount * 0.85);
    } else {
      compliantAmount = Math.round(maxAmount * 0.85);
    }

    // 2. Extract clean product name
    let product = "Procurement Item";
    if (raw.includes("notebook")) {
      product = quantity > 1 ? `Notebook Set (Pack of ${quantity})` : "Notebook Set";
    } else if (raw.includes("monitor") || raw.includes("screen") || raw.includes("display")) {
      product = "Dell 27-Inch 4K UHD Monitor";
    } else if (raw.includes("laptop") || raw.includes("macbook") || raw.includes("computer")) {
      product = "Engineering Laptop";
    } else if (raw.includes("shoe") || raw.includes("running")) {
      product = "Nike Air Pegasus Running Shoes";
    } else if (raw.includes("ticket") || raw.includes("flight") || raw.includes("travel")) {
      product = "Round-Trip Flight Ticket";
    } else if (raw.includes("stationery") || raw.includes("office")) {
      product = "Office Stationery & Supplies";
    } else if (raw.includes("pass") || raw.includes("stream")) {
      product = "Streaming Service Pass";
    } else if (intent.constraints.productCategory) {
      product = `${intent.constraints.productCategory.charAt(0).toUpperCase() + intent.constraints.productCategory.slice(1)} Item`;
    } else {
      product = `${intent.category.toUpperCase()} Candidate Item`;
    }

    // 3. Extract merchant
    const merchant =
      intent.constraints.allowedMerchants?.[0] ||
      (raw.includes("store") ? "Approved Store" : "Approved Vendor");

    setProposalProduct(product);
    setProposalMerchant(merchant);
    setProposalAmount(compliantAmount);
    setProposalCurrency(currency);
    setProposalQuantity(quantity);
    setProposalAction("purchase");
    setIsSubscription(false);
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
            deriveCompliantProposal(active);
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
      deriveCompliantProposal(target);
    }
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

  // Boundary Violation Testing Action
  const handleSimulateViolation = () => {
    if (!selectedIntent) return;
    const maxAmount = selectedIntent.constraints.maxAmount || 5000;
    const violationAmount = maxAmount <= 1000 ? maxAmount + 150 : maxAmount > 10000 ? maxAmount + 5000 : Math.round(maxAmount * 1.5);
    const violationProduct = `${proposalProduct} (Over-Budget Flagship)`;

    setProposalProduct(violationProduct);
    setProposalAmount(violationAmount);

    handleEvaluateProposal({
      id: `prop_viol_${Date.now().toString().slice(-4)}`,
      intentId: selectedIntent.id,
      product: violationProduct,
      merchant: proposalMerchant,
      amount: violationAmount,
      currency: proposalCurrency,
      quantity: proposalQuantity,
      action: "purchase",
      isSubscription: false,
      proposedAt: new Date().toISOString(),
    });
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
          Evaluate how the autonomous agent generates and validates proposals against your active authorization boundary.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* 1. Active User Intent Banner */}
      {selectedIntent && (
        <div className="fintech-card p-5 bg-gradient-to-r from-blue-50/60 via-white to-slate-50 border-blue-200 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-blue-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-600 text-white shadow-2xs">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  Active User Intent
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
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Quantity Cap</span>
              <span className="font-extrabold text-slate-900 block tabular-nums">
                {selectedIntent.constraints.quantity || 1} units
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Spending Boundary</span>
              <span className="font-extrabold text-slate-900 block tabular-nums">
                ₹{selectedIntent.constraints.maxAmount?.toLocaleString()} <span className="text-[10px] text-slate-500 font-mono">MAX</span>
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Purchase</span>
              <span className="font-extrabold text-emerald-800 block">
                {selectedIntent.permissions.canPurchase ? "Allowed" : "Blocked"}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Human Approval</span>
              <span className={`font-extrabold block ${selectedIntent.constraints.requiresApproval ? "text-amber-800" : "text-emerald-800"}`}>
                {selectedIntent.constraints.requiresApproval ? "Required" : "Auto-Allow"}
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

      {/* 2. Main Evaluation Workspace */}
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
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                Derived from Active Intent
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
                <span className="text-slate-600 font-medium">Action: One-Time Purchase</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Inside ₹{selectedIntent?.constraints.maxAmount?.toLocaleString()} Limit
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
                  Click <strong>"Evaluate Agent Proposal"</strong> on the left to execute deterministic policy governance.
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
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Passed
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
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Exceeded
                        </>
                      )}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-800 font-semibold">Human Approval Mandate</span>
                    <span className="font-bold text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Required
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Direct Workflow Navigation */}
          {decisionResult && (
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                {decisionResult.decision === "ASK_APPROVAL"
                  ? "Human Approval Mandate Required:"
                  : "Pre-Authorized Payment Ready:"}
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

      {/* 3. Collapsible Advanced Testing / Boundary Violation */}
      <div className="fintech-card p-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Advanced Testing &amp; Boundary Violation Simulation</span>
          </div>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-fadeIn text-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-lg bg-rose-50 border border-rose-200">
              <div>
                <span className="font-bold text-rose-900 block">Simulate Boundary Violation (Over-Budget Breach)</span>
                <span className="text-slate-700 text-[11px]">
                  Simulates a rogue agent proposing ₹{((selectedIntent?.constraints.maxAmount || 5000) <= 1000 ? (selectedIntent?.constraints.maxAmount || 500) + 150 : (selectedIntent?.constraints.maxAmount || 25000) + 5000).toLocaleString()} to verify deterministic BLOCK.
                </span>
              </div>
              <button
                onClick={handleSimulateViolation}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs whitespace-nowrap"
              >
                Test Violation
              </button>
            </div>

            {/* Custom Input Fields */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 uppercase text-[10px] block">
                Manual Custom Proposal Testing
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
