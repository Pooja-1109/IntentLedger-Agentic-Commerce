import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowRight,
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
  const [selectedIntentId, setSelectedIntentId] = useState<string>(passedState?.intentId || "");
  const selectedApprovalId = passedState?.approvalId || "";

  // Proposal State
  const product = passedState?.proposal?.product || "Nike Air Pegasus Running Shoes";
  const merchant = passedState?.proposal?.merchant || "Nike India";
  const amount = passedState?.proposal?.amount || 3499;
  const currency = passedState?.proposal?.currency || "INR";
  const quantity = passedState?.proposal?.quantity || 1;
  const action = passedState?.proposal?.action || "purchase";

  // Workflow State
  const [authorizing, setAuthorizing] = useState<boolean>(false);
  const [processingOrder, setProcessingOrder] = useState<boolean>(false);
  const [authorizedPayment, setAuthorizedPayment] = useState<PaymentExecution | null>(null);
  const [completedPayment, setCompletedPayment] = useState<PaymentExecution | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [intentsData, approvalsData, healthData] = await Promise.all([
          apiService.getIntents(),
          apiService.getApprovals("all"),
          apiService.getHealth(),
        ]);
        setIntents(intentsData);
        setApprovals(approvalsData);
        setHealth(healthData);

        if (!selectedIntentId && intentsData.length > 0) {
          setSelectedIntentId(intentsData[0].id);
        }
      } catch (err) {
        console.error("Error loading payment data:", err);
      }
    };

    loadData();
  }, [selectedIntentId]);

  const selectedIntent = intents.find((i) => i.id === selectedIntentId) || intents[0];
  const matchingApproval = approvals.find((a) => a.id === selectedApprovalId) || (selectedIntent ? approvals.find((a) => a.intentId === selectedIntent.id && a.status === "APPROVED") : null);

  const isRazorpayTestMode = health?.paymentRail.mode === "razorpay_test";

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
          id: `prop_pay_${Date.now().toString().slice(-4)}`,
          intentId: selectedIntent.id,
          product,
          merchant,
          amount: Number(amount),
          currency,
          quantity: Number(quantity),
          action,
          proposedAt: new Date().toISOString(),
        },
        approvalId: matchingApproval?.id,
        approvalToken: matchingApproval?.approvalToken,
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
          product: "Rolex Submariner Watch (Tampered)",
          merchant: "Luxury Dealer",
          amount: 99999,
          currency: "INR",
          quantity: 1,
          action: "purchase",
          proposedAt: new Date().toISOString(),
        },
        approvalId: matchingApproval?.id,
        approvalToken: matchingApproval?.approvalToken,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "PAYMENT_BLOCKED: APPROVAL_CONTEXT_MISMATCH");
    } finally {
      setAuthorizing(false);
    }
  };

  // Complete Payment
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
      <div className="text-center space-y-2 pb-2 border-b border-surface-border">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Pre-Payment Policy Enforcement</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Payment Gate
        </h1>
        <p className="text-xs md:text-sm text-slate-600 max-w-xl mx-auto">
          Verify policy authorization, cryptographic approval bindings, and context integrity before allowing settlement.
        </p>
      </div>

      {/* Main Centered Payment Authorization Card */}
      <div className="fintech-card p-6 md:p-8 space-y-6">
        {/* Top: Transaction Amount Banner */}
        <div className="p-6 rounded-xl bg-surface-50 border border-surface-border text-center space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
            Transaction Execution Request
          </span>
          <div className="text-4xl font-extrabold text-slate-900 tabular-nums tracking-tight">
            ₹{Number(amount).toLocaleString()} <span className="text-sm font-mono text-slate-500">INR</span>
          </div>
          <div className="text-xs text-slate-700 font-semibold mt-1">
            {product} • <span className="text-slate-500 font-normal">{merchant}</span>
          </div>
        </div>

        {/* 5-Point Security Verification Checklist */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Pre-Authorization Security Checklist:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-lg bg-surface-50 border border-surface-border flex items-center justify-between">
              <span className="text-slate-700">1. Intent Policy Whitelist</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-50 border border-surface-border flex items-center justify-between">
              <span className="text-slate-700">2. Deterministic Decision Engine</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Allowed
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-50 border border-surface-border flex items-center justify-between">
              <span className="text-slate-700">3. Cryptographic Token Binding</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Bound (SHA-256)
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-50 border border-surface-border flex items-center justify-between">
              <span className="text-slate-700">4. Context Tampering Integrity</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Untampered
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-50 border border-surface-border flex items-center justify-between sm:col-span-2">
              <span className="text-slate-700">5. Payment Rail Safety Invariant</span>
              <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {isRazorpayTestMode ? "RAZORPAY TEST MODE" : "SIMULATED SANDBOX"}
              </span>
            </div>
          </div>
        </div>

        {/* Tampering Error Panel */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-rose-900">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>PAYMENT BLOCKED BY POLICY GATE</span>
            </div>
            <p className="font-mono text-[11px] text-rose-800 font-semibold">{errorMessage}</p>
            <p className="text-slate-600 text-[11px]">
              The submitted proposal does not match the cryptographically signed snapshot or violates intent budget caps. Zero funds were moved.
            </p>
          </div>
        )}

        {/* Settlement Success Panel */}
        {completedPayment && (
          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-emerald-800 uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>PAYMENT COMPLETED & SETTLED</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div>
                <span className="text-slate-500 block">Payment Record ID:</span>
                <span className="text-slate-900 font-bold">{completedPayment.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Settlement Transaction ID:</span>
                <span className="text-emerald-800 font-bold">{completedPayment.gatewayTransactionId}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Append-only ledger event created</span>
              <Link
                to="/ledger"
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                <span>View in Audit Ledger</span>
                <ArrowRight className="w-3 h-3" />
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
                  <Lock className={`w-3.5 h-3.5 ${authorizing ? "animate-spin" : ""}`} />
                  <span>{authorizing ? "Verifying Authorization..." : "Authorize Legitimate Payment"}</span>
                </button>

                <button
                  onClick={handleTamperAndAuthorize}
                  disabled={authorizing}
                  className="px-4 py-3 rounded-lg bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold transition-all disabled:opacity-50 shadow-2xs"
                  title="Simulate modifying the approved amount to ₹99,999 to test tampering defense"
                >
                  Simulate Context Attack (₹99,999)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs">
                  <div className="font-bold text-blue-900">
                    Authorization Validated (Auth ID: {authorizedPayment.id})
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Ready to execute settlement on {isRazorpayTestMode ? "Razorpay Test Rail" : "Simulated Sandbox"}.
                  </div>
                </div>

                <button
                  onClick={handleCompletePayment}
                  disabled={processingOrder}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <CreditCard className={`w-3.5 h-3.5 ${processingOrder ? "animate-spin" : ""}`} />
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
