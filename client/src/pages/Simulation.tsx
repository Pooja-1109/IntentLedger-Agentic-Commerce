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
import { Intent, DecisionResult, DemoScenario, AgentProposal } from "../types";

export const SimulationPage: React.FC = () => {
  const location = useLocation();
  const passedState = location.state as {
    intentId?: string;
    intent?: Intent;
  } | null;

  const [intents, setIntents] = useState<Intent[]>([]);
  const [selectedIntentId, setSelectedIntentId] = useState<string>(passedState?.intentId || "");
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);

  // Simulation Mode: "ai_agent" vs "manual_advanced"
  const [showManualForm, setShowManualForm] = useState<boolean>(false);

  // Proposal Form State (Synced dynamically with active simulations)
  const [proposalProduct, setProposalProduct] = useState<string>("Engineering Laptop");
  const [proposalMerchant, setProposalMerchant] = useState<string>("Approved Vendor");
  const [proposalAmount, setProposalAmount] = useState<number>(35000);
  const [proposalCurrency, setProposalCurrency] = useState<string>("INR");
  const [proposalQuantity, setProposalQuantity] = useState<number>(1);
  const [proposalAction, setProposalAction] = useState<AgentProposal["action"]>("purchase");
  const [isSubscription, setIsSubscription] = useState<boolean>(false);

  // Evaluation & Results State
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [decisionResult, setDecisionResult] = useState<DecisionResult | null>(null);
  const [simulatedMode, setSimulatedMode] = useState<"compliant" | "violation" | "custom" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [intentsData, scenariosData] = await Promise.all([
          apiService.getIntents(),
          apiService.getDemoScenarios(),
        ]);
        setIntents(intentsData);
        setScenarios(scenariosData);

        // Resolve active intent: passed intent -> latest intent
        let activeId = passedState?.intentId || "";
        if (!activeId && intentsData.length > 0) {
          activeId = intentsData[0].id;
        }

        if (activeId) {
          setSelectedIntentId(activeId);
          const activeIntent = intentsData.find((i) => i.id === activeId) || intentsData[0];
          if (activeIntent) {
            syncProposalFromIntent(activeIntent);
          }
        }
      } catch (err) {
        console.error("Error loading simulation data:", err);
      }
    };

    loadInitialData();
  }, []);

  const selectedIntent = intents.find((i) => i.id === selectedIntentId) || intents[0];

  // Dynamically sync default proposal template whenever active intent changes
  const syncProposalFromIntent = (intent: Intent) => {
    const maxAmount = intent.constraints.maxAmount || 40000;
    const currency = intent.constraints.currency || "INR";

    // Realistic compliant amount (~85-88% of budget cap)
    let compliantAmount = 35000;
    if (maxAmount <= 1000) {
      compliantAmount = Math.max(100, Math.round(maxAmount * 0.65));
    } else if (maxAmount <= 5000) {
      compliantAmount = maxAmount === 4000 ? 3499 : Math.max(500, Math.round(maxAmount * 0.87));
    } else if (maxAmount <= 50000) {
      compliantAmount = maxAmount > 10000 ? maxAmount - 5000 : Math.round(maxAmount * 0.85);
    } else {
      compliantAmount = Math.round(maxAmount * 0.85);
    }

    // Extract product name from raw intent text or category
    let product = "Engineering Laptop";
    const raw = intent.rawText.toLowerCase();
    if (raw.includes("laptop") || raw.includes("macbook") || raw.includes("computer")) {
      product = "Engineering Laptop";
    } else if (raw.includes("shoe") || raw.includes("running")) {
      product = "Nike Air Pegasus Running Shoes";
    } else if (raw.includes("ticket") || raw.includes("flight") || raw.includes("travel")) {
      product = "Round-Trip Flight Ticket";
    } else if (raw.includes("stationery") || raw.includes("office") || raw.includes("supplies")) {
      product = "Office Stationery & Desk Set";
    } else if (raw.includes("pass") || raw.includes("stream") || raw.includes("subscription")) {
      product = "Streaming Service Pass";
    } else if (intent.category === "shopping") {
      product = "Procurement Item";
    } else {
      product = `${intent.category.toUpperCase()} Candidate Item`;
    }

    const merchant = intent.constraints.allowedMerchants?.[0] || "Approved Vendor";

    setProposalProduct(product);
    setProposalMerchant(merchant);
    setProposalAmount(compliantAmount);
    setProposalCurrency(currency);
    setProposalQuantity(1);
    setProposalAction("purchase");
    setIsSubscription(false);
  };

  const handleIntentChange = (intentId: string) => {
    setSelectedIntentId(intentId);
    setDecisionResult(null);
    setErrorMsg(null);
    setSimulatedMode(null);
    const target = intents.find((i) => i.id === intentId);
    if (target) {
      syncProposalFromIntent(target);
    }
  };

  const handleApplyScenario = (scenario: DemoScenario) => {
    const matchingIntent = intents.find((i) => i.id === scenario.intentId);
    if (matchingIntent) {
      setSelectedIntentId(matchingIntent.id);
    }
    setProposalProduct(scenario.proposal.product);
    setProposalMerchant(scenario.proposal.merchant);
    setProposalAmount(scenario.proposal.amount);
    setProposalCurrency(scenario.proposal.currency || "INR");
    setProposalQuantity(scenario.proposal.quantity || 1);
    setProposalAction(scenario.proposal.action || "purchase");
    setIsSubscription(!!scenario.proposal.isSubscription);
    setDecisionResult(null);
    setErrorMsg(null);
    setSimulatedMode("custom");
  };

  // 1. Simulate Compliant Agent Proposal (Zero Manual Typing)
  const handleSimulateCompliant = async () => {
    if (!selectedIntent) {
      setErrorMsg("Please select an active user intent first.");
      return;
    }

    const maxAmount = selectedIntent.constraints.maxAmount || 40000;
    const currency = selectedIntent.constraints.currency || "INR";

    let compliantAmount = 35000;
    if (maxAmount <= 1000) {
      compliantAmount = Math.max(100, Math.round(maxAmount * 0.65));
    } else if (maxAmount <= 5000) {
      compliantAmount = maxAmount === 4000 ? 3499 : Math.max(500, Math.round(maxAmount * 0.87));
    } else if (maxAmount <= 50000) {
      compliantAmount = maxAmount > 10000 ? maxAmount - 5000 : Math.round(maxAmount * 0.85);
    } else {
      compliantAmount = Math.round(maxAmount * 0.85);
    }

    let product = "Engineering Laptop";
    const raw = selectedIntent.rawText.toLowerCase();
    if (raw.includes("laptop") || raw.includes("macbook") || raw.includes("computer")) {
      product = "Engineering Laptop";
    } else if (raw.includes("shoe") || raw.includes("running")) {
      product = "Nike Air Pegasus Running Shoes";
    } else if (raw.includes("ticket") || raw.includes("flight") || raw.includes("travel")) {
      product = "Round-Trip Flight Ticket";
    } else if (raw.includes("stationery") || raw.includes("office") || raw.includes("supplies")) {
      product = "Office Stationery & Desk Set";
    } else if (raw.includes("pass") || raw.includes("stream")) {
      product = "Streaming Service Pass";
    } else if (selectedIntent.category === "shopping") {
      product = "Procurement Item";
    }

    const merchant = selectedIntent.constraints.allowedMerchants?.[0] || "Approved Vendor";

    // Update state display
    setProposalProduct(product);
    setProposalMerchant(merchant);
    setProposalAmount(compliantAmount);
    setProposalCurrency(currency);
    setProposalQuantity(1);
    setProposalAction("purchase");
    setIsSubscription(false);
    setSimulatedMode("compliant");

    setEvaluating(true);
    setErrorMsg(null);

    try {
      const result = await apiService.evaluateProposal({
        intentId: selectedIntent.id,
        proposal: {
          product,
          merchant,
          amount: compliantAmount,
          currency,
          quantity: 1,
          action: "purchase",
          isSubscription: false,
        },
      });
      setDecisionResult(result);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Proposal evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  // 2. Simulate Boundary Violation (Over Budget / Breach)
  const handleSimulateViolation = async () => {
    if (!selectedIntent) {
      setErrorMsg("Please select an active user intent first.");
      return;
    }

    const maxAmount = selectedIntent.constraints.maxAmount || 40000;
    const currency = selectedIntent.constraints.currency || "INR";

    let violationAmount = 45000;
    if (maxAmount <= 1000) {
      violationAmount = Math.round(maxAmount * 1.5);
    } else if (maxAmount <= 5000) {
      violationAmount = maxAmount === 4000 ? 7999 : Math.round(maxAmount * 1.5);
    } else if (maxAmount <= 50000) {
      violationAmount = maxAmount + 5000; // e.g. 45000 for 40000
    } else {
      violationAmount = Math.round(maxAmount * 1.25);
    }

    let product = "Flagship Engineering Laptop (Over Budget)";
    const raw = selectedIntent.rawText.toLowerCase();
    if (raw.includes("laptop") || raw.includes("macbook")) {
      product = "Flagship Engineering Laptop (Over Budget)";
    } else if (raw.includes("shoe") || raw.includes("running")) {
      product = "Nike Vaporfly Elite Pro Shoes";
    } else if (raw.includes("ticket") || raw.includes("flight")) {
      product = "First-Class Flight Ticket (Budget Breach)";
    } else {
      product = "Premium Unauthorized Product";
    }

    const merchant = selectedIntent.constraints.allowedMerchants?.[0] || "Approved Vendor";

    // Update state display
    setProposalProduct(product);
    setProposalMerchant(merchant);
    setProposalAmount(violationAmount);
    setProposalCurrency(currency);
    setProposalQuantity(1);
    setProposalAction("purchase");
    setIsSubscription(false);
    setSimulatedMode("violation");

    setEvaluating(true);
    setErrorMsg(null);

    try {
      const result = await apiService.evaluateProposal({
        intentId: selectedIntent.id,
        proposal: {
          product,
          merchant,
          amount: violationAmount,
          currency,
          quantity: 1,
          action: "purchase",
          isSubscription: false,
        },
      });
      setDecisionResult(result);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Proposal evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  // 3. Custom / Manual Evaluation
  const handleEvaluateCustom = async () => {
    if (!selectedIntent) {
      setErrorMsg("Please select an active user intent first.");
      return;
    }

    setEvaluating(true);
    setErrorMsg(null);
    setSimulatedMode("custom");

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
        },
      });
      setDecisionResult(result);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Proposal evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Autonomous Agent Evaluation Lab
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Agent Simulation
        </h1>
        <p className="text-sm text-slate-600 mt-1 font-normal">
          Simulate how an autonomous shopping agent proposes transactions against active intent boundaries.
        </p>
      </div>

      {/* 1. ACTIVE INTENT DETECTED HERO CARD */}
      {selectedIntent && (
        <div className="fintech-card p-5 bg-gradient-to-r from-blue-50/70 via-white to-indigo-50/50 border-blue-200 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-600 text-white shadow-2xs">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  Active Intent Boundary Detected
                </span>
                <h2 className="text-base font-extrabold text-slate-900 font-mono">
                  {selectedIntent.id}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Switch Intent:</label>
              <select
                value={selectedIntentId}
                onChange={(e) => handleIntentChange(e.target.value)}
                className="text-xs font-bold rounded-lg bg-white border border-slate-300 p-2 text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
              >
                {intents.map((intent) => (
                  <option key={intent.id} value={intent.id}>
                    {intent.id} • {intent.category.toUpperCase()} (Max ₹{intent.constraints.maxAmount?.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Intent Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-white border border-blue-100 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Category</span>
              <span className="font-extrabold text-blue-700 block mt-0.5 uppercase text-xs">
                {selectedIntent.category}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-blue-100 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Budget Cap</span>
              <span className="font-extrabold text-slate-900 tabular-nums block mt-0.5 text-sm">
                ₹{selectedIntent.constraints.maxAmount?.toLocaleString()} <span className="text-[10px] font-mono text-slate-500">INR</span>
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-blue-100 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Purchase Rule</span>
              <span className="font-extrabold text-emerald-800 block mt-0.5 text-xs">
                {selectedIntent.permissions.canPurchase ? "ALLOWED" : "BLOCKED"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-blue-100 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Subscription</span>
              <span
                className={`font-extrabold block mt-0.5 text-xs ${
                  selectedIntent.permissions.canSubscribe ? "text-emerald-800" : "text-rose-700"
                }`}
              >
                {selectedIntent.permissions.canSubscribe ? "ALLOWED" : "FORBIDDEN"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-blue-100 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Approval Mandate</span>
              <span
                className={`font-extrabold block mt-0.5 text-xs ${
                  selectedIntent.constraints.requiresApproval ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {selectedIntent.constraints.requiresApproval ? "REQUIRED" : "AUTO-ALLOW"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-blue-100 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Merchant Scope</span>
              <span className="font-bold text-slate-800 block mt-0.5 text-xs truncate" title={selectedIntent.constraints.allowedMerchants?.join(", ") || "Approved Whitelist"}>
                {selectedIntent.constraints.allowedMerchants?.[0] || "Approved Vendor"}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/90 border border-blue-100 text-xs text-slate-700 italic font-medium">
            "{selectedIntent.rawText}"
          </div>
        </div>
      )}

      {/* Preset Scenarios Strip */}
      <div className="fintech-card p-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase text-slate-700">
            Quick Evaluation Presets:
          </span>
          <span className="text-[11px] text-slate-500 font-mono font-medium">Click to Load &amp; Test</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleApplyScenario(sc)}
              className="text-left p-3.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 text-xs transition-all group shadow-2xs"
            >
              <div className="font-bold text-slate-900 group-hover:text-blue-600 flex items-center justify-between">
                <span>{sc.title.split("—")[0]}</span>
                <span className="text-xs text-slate-700 font-mono font-bold">₹{sc.proposal.amount}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 line-clamp-1 font-medium">
                {sc.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Agent Simulation & Candidate Proposal (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* AI Autonomous Proposal Generator Card */}
          <div className="fintech-card p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  AI Agent Proposal Actions
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-semibold">Zero-Manual Typing Mode</span>
            </div>

            {/* AI Simulation Trigger Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleSimulateCompliant}
                disabled={evaluating || !selectedIntent}
                className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-2 border-emerald-300 text-left space-y-2 transition-all shadow-2xs group active:scale-95 disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                    Compliant Flow
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-950 group-hover:text-emerald-800">
                    Simulate Compliant Agent
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed font-medium">
                    Proposes compliant purchase (e.g. ₹35,000 for ₹40,000 intent) within budget.
                  </p>
                </div>
              </button>

              <button
                onClick={handleSimulateViolation}
                disabled={evaluating || !selectedIntent}
                className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-amber-50 hover:from-rose-100 hover:to-amber-100 border-2 border-rose-300 text-left space-y-2 transition-all shadow-2xs group active:scale-95 disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-rose-600 text-white shadow-2xs">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded uppercase">
                    Drift / Breach
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-rose-950 group-hover:text-rose-800">
                    Simulate Boundary Violation
                  </h4>
                  <p className="text-xs text-rose-800 mt-0.5 leading-relaxed font-medium">
                    Proposes an exceeding action (e.g. ₹45,000 against ₹40,000 cap) to test BLOCK.
                  </p>
                </div>
              </button>
            </div>

            {/* Generated Proposal Snapshot View */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Current Candidate Agent Proposal Payload
                </span>
                {simulatedMode && (
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      simulatedMode === "compliant"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : simulatedMode === "violation"
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : "bg-blue-100 text-blue-800 border border-blue-300"
                    }`}
                  >
                    {simulatedMode === "compliant"
                      ? "COMPLIANT AGENT"
                      : simulatedMode === "violation"
                      ? "VIOLATION ATTEMPT"
                      : "CUSTOM INPUT"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Candidate Item</span>
                  <span className="font-extrabold text-slate-900 block mt-0.5 truncate">{proposalProduct}</span>
                </div>

                <div className="p-2.5 rounded bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Merchant Store</span>
                  <span className="font-extrabold text-slate-900 block mt-0.5 truncate">{proposalMerchant}</span>
                </div>

                <div className="p-2.5 rounded bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Proposed Amount</span>
                  <span className="font-extrabold text-slate-900 tabular-nums block mt-0.5 text-sm">
                    ₹{Number(proposalAmount).toLocaleString()} <span className="text-xs text-slate-500 font-mono font-normal">INR</span>
                  </span>
                </div>

                <div className="p-2.5 rounded bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Action &amp; Frequency</span>
                  <span className="font-extrabold text-slate-900 block mt-0.5 uppercase text-xs">
                    {proposalAction} {isSubscription ? "(Recurring)" : "(One-Time)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Collapsible Manual Proposal / Advanced Testing */}
            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowManualForm(!showManualForm)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                  <span>Manual Proposal / Advanced Custom Testing</span>
                </div>
                {showManualForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showManualForm && (
                <div className="mt-3 p-4 rounded-xl bg-white border border-slate-200 space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Item / Product Name
                      </label>
                      <input
                        type="text"
                        value={proposalProduct}
                        onChange={(e) => setProposalProduct(e.target.value)}
                        className="w-full rounded-lg bg-white border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Merchant / Store
                      </label>
                      <input
                        type="text"
                        value={proposalMerchant}
                        onChange={(e) => setProposalMerchant(e.target.value)}
                        className="w-full rounded-lg bg-white border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Proposed Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={proposalAmount}
                        onChange={(e) => setProposalAmount(Number(e.target.value))}
                        className="w-full rounded-lg bg-white border border-slate-300 p-2 text-xs font-extrabold text-slate-900 tabular-nums focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Currency
                      </label>
                      <input
                        type="text"
                        disabled
                        value={proposalCurrency}
                        className="w-full rounded-lg bg-slate-100 border border-slate-300 p-2 text-xs text-slate-600 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Action Type
                      </label>
                      <select
                        value={proposalAction}
                        onChange={(e) => {
                          const val = e.target.value as "purchase" | "subscribe";
                          setProposalAction(val);
                          setIsSubscription(val === "subscribe");
                        }}
                        className="w-full rounded-lg bg-white border border-slate-300 p-2 text-xs text-slate-900 font-semibold"
                      >
                        <option value="purchase">One-Time Purchase</option>
                        <option value="subscribe">Recurring Subscription</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-800 font-bold">
                        <input
                          type="checkbox"
                          checked={isSubscription}
                          onChange={(e) => setIsSubscription(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Authorizes Recurring Billing</span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleEvaluateCustom}
                    disabled={evaluating}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <Zap className={`w-3.5 h-3.5 ${evaluating ? "animate-spin" : ""}`} />
                    <span>{evaluating ? "Evaluating..." : "Evaluate Custom Proposal"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Decision Verdict & Workflow Progression (6 cols) */}
        <div className="lg:col-span-6 fintech-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Deterministic Decision Verdict
              </span>
              <span className="text-[11px] font-mono text-slate-500 font-semibold">
                Intent Policy Engine
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 my-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {!decisionResult ? (
              <div className="py-24 text-center space-y-2">
                <Bot className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">Awaiting Agent Simulation</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
                  Click <strong>"Simulate Compliant Agent"</strong> or <strong>"Simulate Boundary Violation"</strong> on the left to test the active intent policy.
                </p>
              </div>
            ) : (
              <div className="space-y-4 mt-3">
                {/* Hero Decision Status Banner */}
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
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Policy Decision
                    </div>
                    <div className="mt-1">
                      <DecisionBadge decision={decisionResult.decision} size="lg" />
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-600">
                      Risk Assessment
                    </div>
                    <div
                      className={`text-3xl font-extrabold tabular-nums mt-0.5 ${
                        decisionResult.riskScore > 50
                          ? "text-rose-600"
                          : decisionResult.riskScore > 20
                          ? "text-amber-600"
                          : "text-emerald-700"
                      }`}
                    >
                      {decisionResult.riskScore}/100
                    </div>
                  </div>
                </div>

                {/* Metric Strip */}
                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Proposed</span>
                    <span className="font-extrabold text-slate-900 tabular-nums text-sm">
                      ₹{proposalAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Budget Cap</span>
                    <span className="font-extrabold text-slate-900 tabular-nums text-sm">
                      ₹{selectedIntent?.constraints.maxAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Drift Status</span>
                    <span
                      className={`font-extrabold tabular-nums text-sm ${
                        decisionResult.driftReport?.hasDrift ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {decisionResult.driftReport?.hasDrift
                        ? decisionResult.driftReport.severity
                        : "NONE"}
                    </span>
                  </div>
                </div>

                {/* Granular Rule Checks Breakdown */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-800 block">
                    Enforced Rule Verifications:
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {decisionResult.checks.map((chk) => (
                      <div
                        key={chk.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-2 text-xs"
                      >
                        <div className="flex items-start gap-2">
                          {chk.status === "PASS" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : chk.status === "WARN" ? (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          ) : (
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block">{chk.name}</span>
                            <span className="text-xs text-slate-700 font-medium">{chk.message}</span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                            chk.status === "PASS"
                              ? "status-pill-emerald"
                              : chk.status === "WARN"
                              ? "status-pill-amber"
                              : "status-pill-rose"
                          }`}
                        >
                          {chk.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Route Link to next stage */}
          {decisionResult && (
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                {decisionResult.decision === "ASK_APPROVAL"
                  ? "Human Authorization Required:"
                  : decisionResult.decision === "ALLOW"
                  ? "Pre-Authorized Payment Ready:"
                  : "Transaction Denied by Policy:"}
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
                    },
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm active:scale-95"
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
    </div>
  );
};
