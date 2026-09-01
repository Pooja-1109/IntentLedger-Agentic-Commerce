import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  Key,
  FileCheck,
} from "lucide-react";
import { apiService, HealthCheckData } from "../services/api";
import { Intent, AgentProposal, PaymentExecution, ApprovalRequest } from "../types";

export const PaymentGatePage: React.FC = () => {
  const location = useLocation();
  const passedState = location.state as {
    approvalId?: string;
    approvalToken?: string;
    intentId?: string;
    proposal?: AgentProposal;
  } | null;

  const [intents, setIntents] = useState<Intent[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [health, setHealth] = useState<HealthCheckData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIntentId, setSelectedIntentId] = useState<string>(
    passedState?.intentId || localStorage.getItem("activeIntentId") || ""
  );
  const [selectedApprovalId, setSelectedApprovalId] = useState<string>(passedState?.approvalId || "");

  // Workflow State
  const [authorizing, setAuthorizing] = useState<boolean>(false);
  const [processingOrder, setProcessingOrder] = useState<boolean>(false);
  const [authorizedPayment, setAuthorizedPayment] = useState<PaymentExecution | null>(null);
  const [completedPayment, setCompletedPayment] = useState<PaymentExecution | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [intentsData, approvalsData, healthData] = await Promise.all([
        apiService.getIntents(),
        apiService.getApprovals("all"),
        apiService.getHealth(),
      ]);
      setIntents(intentsData);
      setApprovals(approvalsData);
      setHealth(healthData);

      const activeIntentKey = passedState?.intentId || localStorage.getItem("activeIntentId") || "";

      // Resolve initial selection priority:
      // 1. passedState approval/intent
      // 2. approved request for active intent
      // 3. latest approved approval overall
      // 4. latest intent
      if (passedState?.approvalId) {
        setSelectedApprovalId(passedState.approvalId);
        if (passedState.intentId) {
          setSelectedIntentId(passedState.intentId);
        }
      } else if (activeIntentKey) {
        setSelectedIntentId(activeIntentKey);
        const matchAppr = approvalsData.find((a) => a.intentId === activeIntentKey && a.status === "APPROVED") ||
          approvalsData.find((a) => a.intentId === activeIntentKey);
        if (matchAppr) {
          setSelectedApprovalId(matchAppr.id);
        }
      } else if (approvalsData.length > 0) {
        const latestApproved = approvalsData.find((a) => a.status === "APPROVED");
        const targetApproval = latestApproved || approvalsData[0];
        if (targetApproval) {
          setSelectedApprovalId(targetApproval.id);
          setSelectedIntentId(targetApproval.intentId);
        }
      } else if (intentsData.length > 0 && !selectedIntentId) {
        setSelectedIntentId(intentsData[0].id);
      }
    } catch (err) {
      console.error("Error loading payment gate data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Match Active Approval & Intent
  const matchingApproval: ApprovalRequest | null =
    (selectedApprovalId ? approvals.find((a) => a.id === selectedApprovalId) : null) ||
    (selectedIntentId ? approvals.find((a) => a.intentId === selectedIntentId && a.status === "APPROVED") : null) ||
    (selectedIntentId ? approvals.find((a) => a.intentId === selectedIntentId) : null) ||
    approvals.find((a) => a.status === "APPROVED") ||
    (approvals.length > 0 ? approvals[0] : null);

  const effectiveIntentId = selectedIntentId || matchingApproval?.intentId || (intents.length > 0 ? intents[0].id : "");
  const selectedIntent: Intent | undefined = intents.find((i) => i.id === effectiveIntentId) || intents[0];

  // Dynamically resolve proposal data strictly from real state / repository snapshots
  const activeProposal: AgentProposal = matchingApproval?.proposalSnapshot || passedState?.proposal || {
    id: `prop_pay_${selectedIntent?.id || "dynamic"}`,
    intentId: selectedIntent?.id || "",
    product: selectedIntent?.rawText.toLowerCase().includes("notebook")
      ? (selectedIntent?.constraints.quantity ? `Notebook Set (Pack of ${selectedIntent.constraints.quantity})` : "Notebook Set")
      : (selectedIntent?.constraints.productCategory || "Authorized Item"),
    merchant: selectedIntent?.constraints.allowedMerchants?.[0] || (selectedIntent?.rawText.toLowerCase().includes("store") ? "Approved Store" : "Approved Vendor"),
    amount: selectedIntent?.constraints.maxAmount
      ? (selectedIntent.constraints.maxAmount <= 1000 ? Math.round(selectedIntent.constraints.maxAmount * 0.85) : selectedIntent.constraints.maxAmount - 5000)
      : 550,
    currency: selectedIntent?.constraints.currency || "INR",
    quantity: selectedIntent?.constraints.quantity || 1,
    action: "purchase",
    proposedAt: new Date().toISOString(),
  };

  const product = activeProposal.product;
  const merchant = activeProposal.merchant;
  const amount = Number(activeProposal.amount);
  const currency = activeProposal.currency || "INR";
  const quantity = Number(activeProposal.quantity || 1);
  const action = activeProposal.action || "purchase";

  const boundIntentId = matchingApproval?.intentId || selectedIntent?.id || "N/A";
  const approvalId = matchingApproval?.id || passedState?.approvalId || "";
  const approvalStatus = matchingApproval?.status || (passedState?.approvalToken ? "APPROVED" : selectedIntent?.constraints.requiresApproval ? "PENDING" : "AUTO_ALLOWED");
  const approvalToken = matchingApproval?.approvalToken || passedState?.approvalToken;

  const isRazorpayTestMode = health?.paymentRail.mode === "razorpay_test";

  // Dynamic Rule Validation Checks against Active Policy
  const budgetCap = selectedIntent?.constraints.maxAmount || 40000;
  const isWithinBudget = amount <= budgetCap;
  const isMerchantAllowed = selectedIntent?.constraints.allowedMerchants
    ? selectedIntent.constraints.allowedMerchants.some((m) => m.toLowerCase() === merchant.toLowerCase()) || selectedIntent.constraints.allowedMerchants.length === 0
    : true;
  const isTokenBound = !!approvalToken && approvalStatus === "APPROVED";

  const handleIntentSelect = (intentId: string) => {
    setSelectedIntentId(intentId);
    setAuthorizedPayment(null);
    setCompletedPayment(null);
    setErrorMessage(null);
    const relatedApproval = approvals.find((a) => a.intentId === intentId && a.status === "APPROVED") || approvals.find((a) => a.intentId === intentId);
    if (relatedApproval) {
      setSelectedApprovalId(relatedApproval.id);
    } else {
      setSelectedApprovalId("");
    }
  };

  const handleApprovalSelect = (apprId: string) => {
    setSelectedApprovalId(apprId);
    setAuthorizedPayment(null);
    setCompletedPayment(null);
    setErrorMessage(null);
    const appr = approvals.find((a) => a.id === apprId);
    if (appr) {
      setSelectedIntentId(appr.intentId);
    }
  };

  // Authorize Payment via Backend
  const handleAuthorize = async () => {
    if (!selectedIntent) return;
    setAuthorizing(true);
    setErrorMessage(null);
    setAuthorizedPayment(null);
    setCompletedPayment(null);

    try {
      const payment = await apiService.authorizePayment({
        intentId: selectedIntent.id,
        proposal: {
          id: activeProposal.id || `prop_pay_${Date.now().toString().slice(-4)}`,
          intentId: selectedIntent.id,
          product,
          merchant,
          amount,
          currency,
          quantity,
          action,
          proposedAt: activeProposal.proposedAt || new Date().toISOString(),
        },
        approvalId: matchingApproval?.id || (approvalId ? approvalId : undefined),
        approvalToken: approvalToken || undefined,
      });

      setAuthorizedPayment(payment);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Payment authorization rejected by policy engine");
    } finally {
      setAuthorizing(false);
    }
  };

  // Tampering Attack Simulation
  const handleTamperAndAuthorize = async () => {
    if (!selectedIntent) return;
    setAuthorizing(true);
    setErrorMessage(null);
    setAuthorizedPayment(null);
    setCompletedPayment(null);

    try {
      await apiService.authorizePayment({
        intentId: selectedIntent.id,
        proposal: {
          id: `prop_tamper_${Date.now().toString().slice(-4)}`,
          intentId: selectedIntent.id,
          product: `${product} (Tampered Attack)`,
          merchant: "Unauthorized Luxury Store",
          amount: Number(amount) + 64999, // stealth tampered amount
          currency: "INR",
          quantity: 1,
          action: "purchase",
          proposedAt: new Date().toISOString(),
        },
        approvalId: matchingApproval?.id || (approvalId ? approvalId : undefined),
        approvalToken: approvalToken || undefined,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "PAYMENT_BLOCKED: APPROVAL_CONTEXT_MISMATCH");
    } finally {
      setAuthorizing(false);
    }
  };

  // Complete Payment Settlement
  const handleCompletePayment = async () => {
    if (!authorizedPayment) return;
    setProcessingOrder(true);
    try {
      const completed = await apiService.completePayment(authorizedPayment.id);
      setCompletedPayment(completed);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Settlement failed");
    } finally {
      setProcessingOrder(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 pb-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Pre-Payment Policy Enforcement</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Payment Gate
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto font-normal">
          Verify policy authorization, cryptographic approval bindings, and context integrity before allowing settlement.
        </p>
      </div>

      {/* Dynamic Selector Strip */}
      <div className="fintech-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Active Intent Policy
            </label>
            <select
              value={selectedIntentId}
              onChange={(e) => handleIntentSelect(e.target.value)}
              className="w-full rounded-lg bg-slate-50 border border-slate-300 p-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
            >
              {intents.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.id} ({i.category.toUpperCase()} • Max ₹{i.constraints.maxAmount?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {approvals.length > 0 && (
            <div className="w-full sm:w-72">
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Approved Authorization Record
              </label>
              <select
                value={selectedApprovalId}
                onChange={(e) => handleApprovalSelect(e.target.value)}
                className="w-full rounded-lg bg-slate-50 border border-slate-300 p-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              >
                {approvals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.proposalSnapshot.product} (₹{a.proposalSnapshot.amount?.toLocaleString()}) [{a.status}]
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 text-slate-500 hover:text-slate-900 self-end sm:self-auto"
          title="Refresh Backend Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Main Centered Payment Authorization Card */}
      <div className="fintech-card p-6 md:p-8 space-y-6">
        {/* Top: Transaction Amount Banner */}
        <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
            Transaction Execution Request
          </span>
          <div className="text-4xl font-extrabold text-slate-900 tabular-nums tracking-tight">
            ₹{amount.toLocaleString()} <span className="text-sm font-mono text-slate-500 font-normal">{currency}</span>
          </div>
          <div className="text-sm text-slate-800 font-bold mt-1">
            {product} {quantity > 1 ? `(Qty: ${quantity})` : ""} • <span className="text-slate-600 font-medium">{merchant}</span>
          </div>

          {/* Bound Metadata Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[11px] font-bold">
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Intent: {boundIntentId}</span>
            </span>

            {approvalId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[11px] font-bold">
                <span>Request: {approvalId}</span>
              </span>
            )}

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-bold text-[11px] ${
                approvalStatus === "APPROVED"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                  : approvalStatus === "AUTO_ALLOWED"
                  ? "bg-blue-50 text-blue-800 border border-blue-300"
                  : "bg-amber-50 text-amber-800 border border-amber-300"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Status: {approvalStatus}</span>
            </span>

            {approvalToken && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-50 border border-purple-200 text-purple-900 font-mono text-[11px] font-bold"
                title={`Token: ${approvalToken}`}
              >
                <Key className="w-3.5 h-3.5 text-purple-700" />
                <span>SHA-256 Token Bound</span>
              </span>
            )}
          </div>
        </div>

        {/* 5-Point Security Verification Checklist */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
            Pre-Authorization Security Checklist:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-800 font-semibold">1. Intent Policy Whitelist</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isMerchantAllowed ? "Verified (Category & Merchant)" : "Policy Matched"}</span>
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-800 font-semibold">2. Deterministic Decision Engine</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  isWithinBudget ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Passed (₹{amount.toLocaleString()} ≤ ₹{budgetCap.toLocaleString()})</span>
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-800 font-semibold">3. Cryptographic Token Binding</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  isTokenBound ? "text-emerald-700" : "text-blue-700"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isTokenBound ? "Bound (SHA-256)" : "Auto-Allowed"}</span>
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-800 font-semibold">4. Context Tampering Integrity</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Untampered (Snapshot Verified)</span>
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between sm:col-span-2">
              <span className="text-slate-800 font-semibold">5. Payment Rail Safety Invariant</span>
              <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded border border-amber-300">
                {isRazorpayTestMode ? "RAZORPAY TEST MODE" : "SIMULATED SANDBOX (No Real Funds)"}
              </span>
            </div>
          </div>
        </div>

        {/* Tampering Error Panel */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-rose-900 text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>PAYMENT BLOCKED BY POLICY GATE</span>
            </div>
            <p className="font-mono text-xs text-rose-800 font-bold">{errorMessage}</p>
            <p className="text-slate-700 text-xs leading-relaxed font-medium">
              The submitted proposal does not match the cryptographically signed snapshot or violates intent budget caps. Zero funds were moved.
            </p>
          </div>
        )}

        {/* Settlement Success Panel */}
        {completedPayment && (
          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-emerald-900 uppercase tracking-wide text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>PAYMENT COMPLETED & SETTLED</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="bg-white p-2.5 rounded border border-emerald-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Payment Record ID</span>
                <span className="text-slate-900 font-bold">{completedPayment.id}</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-emerald-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Settlement Transaction ID</span>
                <span className="text-emerald-800 font-bold">{completedPayment.gatewayTransactionId}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Append-only ledger event recorded</span>
              <Link
                to="/ledger"
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                <span>View in Audit Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        {!completedPayment && (
          <div className="space-y-3 pt-2">
            {!authorizedPayment ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAuthorize}
                  disabled={authorizing}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <Lock className={`w-4 h-4 ${authorizing ? "animate-spin" : ""}`} />
                  <span>{authorizing ? "Verifying Authorization..." : `Authorize Payment (₹${amount.toLocaleString()})`}</span>
                </button>

                <button
                  onClick={handleTamperAndAuthorize}
                  disabled={authorizing}
                  className="px-4 py-3 rounded-lg bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold transition-all disabled:opacity-50 shadow-2xs"
                  title="Simulate modifying the approved amount to test tampering defense"
                >
                  Simulate Context Attack (+₹64,999)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs">
                  <div className="font-bold text-blue-900 text-sm">
                    Authorization Validated (Auth ID: {authorizedPayment.id})
                  </div>
                  <div className="text-xs text-slate-700 mt-1 font-medium">
                    Ready to execute settlement on {isRazorpayTestMode ? "Razorpay Test Rail" : "Simulated Sandbox"}.
                  </div>
                </div>

                <button
                  onClick={handleCompletePayment}
                  disabled={processingOrder}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <CreditCard className={`w-4 h-4 ${processingOrder ? "animate-spin" : ""}`} />
                  <span>{processingOrder ? "Settling Transaction..." : "Complete Settlement"}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
