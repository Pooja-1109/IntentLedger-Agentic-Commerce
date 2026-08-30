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
  AlertTriangle,
  History,
  RotateCcw,
  Zap,
  Info,
  Server,
  Key,
} from "lucide-react";
import { apiService, HealthCheckData } from "../services/api";
import { Intent, AgentProposal, PaymentExecution, ApprovalRequest } from "../types";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

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
  const [product, setProduct] = useState<string>(
    passedState?.proposal?.product || "Nike Air Pegasus Running Shoes"
  );
  const [merchant, setMerchant] = useState<string>(
    passedState?.proposal?.merchant || "Nike India"
  );
  const [amount, setAmount] = useState<number>(
    passedState?.proposal?.amount || 3499
  );
  const currency = passedState?.proposal?.currency || "INR";
  const quantity = passedState?.proposal?.quantity || 1;
  const action = passedState?.proposal?.action || "purchase";

  // Workflow State
  const [authorizing, setAuthorizing] = useState<boolean>(false);
  const [processingOrder, setProcessingOrder] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [authorizedPayment, setAuthorizedPayment] = useState<PaymentExecution | null>(null);
  const [completedPayment, setCompletedPayment] = useState<PaymentExecution | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tamperAttempted, setTamperAttempted] = useState<boolean>(false);

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
    setTamperAttempted(false);

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
      setErrorMessage(err instanceof Error ? err.message : "Payment authorization denied");
    } finally {
      setAuthorizing(false);
    }
  };

  // Create Razorpay Order & Trigger Checkout Modal
  const handleOpenRazorpayCheckout = async () => {
    if (!authorizedPayment) return;
    setProcessingOrder(true);
    setErrorMessage(null);

    try {
      const orderData = await apiService.createRazorpayOrder(authorizedPayment.id);

      // Dynamically load Razorpay standard checkout script if needed
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay Checkout SDK script"));
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
          setVerifying(true);
          try {
            const verified = await apiService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              internalPaymentId: authorizedPayment.id,
            });
            setCompletedPayment(verified);
          } catch (verErr: unknown) {
            setErrorMessage(verErr instanceof Error ? verErr.message : "Signature verification failed");
          } finally {
            setVerifying(false);
          }
        },
        prefill: {
          name: "IntentLedger Test User",
          email: "agentic-test@intentledger.dev",
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to initiate Razorpay checkout");
    } finally {
      setProcessingOrder(false);
    }
  };

  // Complete Simulated Settlement (When in simulated mode)
  const handleCompleteSimulated = async () => {
    if (!authorizedPayment) return;
    setProcessingOrder(true);
    setErrorMessage(null);

    try {
      const completed = await apiService.completePayment(authorizedPayment.id);
      setCompletedPayment(completed);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to complete payment");
    } finally {
      setProcessingOrder(false);
    }
  };

  // Tampering Security Demonstration
  const handleTestTampering = async () => {
    if (!selectedIntent || !matchingApproval) return;
    setAuthorizing(true);
    setErrorMessage(null);
    setAuthorizedPayment(null);
    setCompletedPayment(null);
    setTamperAttempted(true);

    try {
      // Attacker attempts to change amount to ₹7,999 while using approved token of ₹3,499
      await apiService.authorizePayment({
        intentId: selectedIntent.id,
        proposal: {
          id: `prop_tamper_${Date.now().toString().slice(-4)}`,
          intentId: selectedIntent.id,
          product,
          merchant,
          amount: 7999, // Tampered!
          currency,
          quantity,
          action,
          proposedAt: new Date().toISOString(),
        },
        approvalId: matchingApproval.id,
        approvalToken: matchingApproval.approvalToken,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Tampering detected and blocked");
    } finally {
      setAuthorizing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            Deterministic Financial Safety Gate
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Payment Gate & Rail</h1>
          <p className="text-sm text-slate-400 mt-1">
            Enforces server-side intent re-evaluation, cryptographic approval context binding, and official Razorpay Test-Mode order execution.
          </p>
        </div>

        {/* Rail Mode Status Pill */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-100 border border-surface-border text-xs self-start md:self-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400 font-bold uppercase text-[10px]">Payment Rail:</span>
          <span className="font-extrabold text-white">
            {isRazorpayTestMode ? "RAZORPAY TEST MODE" : "SIMULATED PAYMENT"}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30 font-bold uppercase">
            No Real Money
          </span>
        </div>
      </div>

      {/* Developer Configuration Pill */}
      <div className="rounded-xl bg-surface-100/70 border border-surface-border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Server className="w-4 h-4 text-indigo-400" />
          <span className="text-slate-300 font-semibold">Rail Configuration:</span>
          <span className="text-slate-400 font-mono text-[11px]">
            Mode: <strong className="text-slate-200">{health?.paymentRail.mode || "simulated"}</strong>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-mono text-[11px]">
            Key ID:{" "}
            <strong className={health?.paymentRail.keyIdConfigured ? "text-emerald-400" : "text-slate-400"}>
              {health?.paymentRail.keyIdConfigured ? "CONFIGURED" : "MISSING (Simulated Fallback)"}
            </strong>
          </span>
        </div>

        <span className="text-[10px] text-slate-500 font-medium">
          Protected by IntentLedger Authorization Gateway
        </span>
      </div>

      {/* Main Payment Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Transaction Details & Context (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Transaction Payload
              </h2>
            </div>
            <span className="text-[10px] font-bold bg-surface-200 border border-surface-border px-2 py-0.5 rounded text-slate-400">
              Agent Action
            </span>
          </div>

          {/* Intent Selector */}
          {intents.length > 0 && (
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Authorized Intent Boundary:
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

          {/* Proposal Details (Editable) */}
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-200/90 border border-surface-border space-y-2">
              <span className="text-[10px] font-bold uppercase text-purple-400 block">Candidate Item</span>
              <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full rounded-lg bg-surface-100 border border-surface-border p-2 text-white font-bold"
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Merchant</span>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full rounded-lg bg-surface-100 border border-surface-border p-2 text-slate-200 font-medium mt-0.5"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Amount (INR)</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-lg bg-surface-100 border border-surface-border p-2 text-emerald-400 font-extrabold mt-0.5"
                  />
                </div>
              </div>
            </div>

            {/* Approval Status Card */}
            <div className="p-3.5 rounded-xl bg-surface-200 border border-surface-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Human Approval Status
                </span>
                {matchingApproval?.status === "APPROVED" ? (
                  <span className="text-[10px] font-extrabold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Token Verified
                  </span>
                ) : selectedIntent?.constraints.requiresApproval ? (
                  <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Pending Human Approval
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-cyan-400">
                    Auto-Authorize Policy
                  </span>
                )}
              </div>

              {matchingApproval?.status === "APPROVED" && (
                <div className="p-2 rounded bg-surface-100 border border-emerald-500/20 text-[11px] font-mono text-emerald-300 truncate">
                  Token: {matchingApproval.approvalToken}
                </div>
              )}
            </div>
          </div>

          {/* Tamper Test Trigger Button */}
          <div className="pt-2 border-t border-surface-border space-y-2">
            <div className="text-[10px] font-bold uppercase text-rose-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>Security Demo: Tampering Test</span>
            </div>
            <button
              type="button"
              onClick={handleTestTampering}
              disabled={authorizing || !matchingApproval}
              className="w-full py-2 px-3 rounded-lg bg-rose-950/60 hover:bg-rose-950 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 text-xs font-bold transition-all text-left flex items-center justify-between disabled:opacity-50"
            >
              <span>Test Price Tampering (₹3,499 → ₹7,999)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <p className="text-[10px] text-slate-400">
              Demonstrates backend rejection when an approved token is reused for an altered amount.
            </p>
          </div>
        </div>

        {/* Right Column: Execution Gate, Order Creation & Settlement (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary-light" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  2. Gate Authorization & Settlement
                </h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Backend Enforced</span>
            </div>

            {/* Error / Blocked Alert */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>PAYMENT AUTHORIZATION DENIED</span>
                </div>
                <p className="leading-relaxed">{errorMessage}</p>
                {tamperAttempted && (
                  <div className="p-2.5 rounded bg-rose-900/60 border border-rose-700/50 text-[11px] text-rose-300 font-mono">
                    🛡️ Error: APPROVAL_CONTEXT_MISMATCH — Payment proposal does not match cryptographic approval snapshot. No Razorpay order was created.
                  </div>
                )}
              </div>
            )}

            {/* Security Audit Explanation Card */}
            <div className="p-3.5 rounded-xl bg-surface-200/90 border border-surface-border space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 font-bold text-[11px] uppercase">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>Why This Payment Is Allowed / Protected</span>
              </div>
              <ul className="space-y-1 text-slate-400 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span> Within user-approved budget cap (Max ₹{selectedIntent?.constraints.maxAmount?.toLocaleString()})
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span> Server re-evaluates intent boundary before calling payment provider
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span> Cryptographic token locked to exact approved amount and item snapshot
                </li>
              </ul>
            </div>

            {/* Stage 1: Authorization Step */}
            {!authorizedPayment && !completedPayment && !errorMessage && (
              <div className="p-8 rounded-2xl bg-surface-200 border border-surface-border text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-100 border border-surface-border mx-auto flex items-center justify-center text-primary-light shadow-glow">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Payment Gate Standing By</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Click "Authorize Payment" to trigger the backend Intent Policy verification before execution.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAuthorize}
                  disabled={authorizing}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-hover hover:to-indigo-500 text-white text-xs font-extrabold shadow-glow transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${authorizing ? "animate-spin" : ""}`} />
                  <span>{authorizing ? "Verifying Policy & Token..." : "Authorize Payment"}</span>
                </button>
              </div>
            )}

            {/* Stage 2: Authorized -> Ready for Settlement / Checkout */}
            {authorizedPayment && !completedPayment && (
              <div className="p-6 rounded-2xl bg-surface-200 border border-emerald-500/40 space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Payment Authorized
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ID: {authorizedPayment.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-surface-100 border border-surface-border">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Product</span>
                    <span className="font-bold text-white mt-0.5 block">{authorizedPayment.product}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-100 border border-surface-border">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Settlement Amount</span>
                    <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">
                      ₹{authorizedPayment.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Rail Information */}
                <div className="p-3.5 rounded-xl bg-surface-100 border border-surface-border text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Active Rail: {isRazorpayTestMode ? "Razorpay Test-Mode Gateway" : "Simulated Sandbox Bridge"}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Authorization verified. Ready to create payment order and process settlement.
                  </p>
                </div>

                {isRazorpayTestMode ? (
                  <button
                    type="button"
                    onClick={handleOpenRazorpayCheckout}
                    disabled={processingOrder || verifying}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-glow transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${processingOrder || verifying ? "animate-spin" : ""}`} />
                    <span>
                      {processingOrder ? "Creating Razorpay Test Order..." : verifying ? "Verifying HMAC Signature..." : "Open Razorpay Test Checkout"}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCompleteSimulated}
                    disabled={processingOrder}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs tracking-wider uppercase shadow-glow-emerald transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${processingOrder ? "animate-spin" : ""}`} />
                    <span>{processingOrder ? "Settling Sandbox Transaction..." : "Complete Simulated Payment"}</span>
                  </button>
                )}
              </div>
            )}

            {/* Stage 3: Payment Settled & Completed */}
            {completedPayment && (
              <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-5 animate-fadeIn shadow-glow-emerald">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/60 text-xs font-extrabold uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Payment Cryptographically Verified
                  </span>
                  <span className="text-xs text-emerald-300 font-mono">
                    SETTLED
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-surface-200/90 border border-surface-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Amount Settled (Test):</span>
                    <span className="text-lg font-extrabold text-emerald-400">
                      ₹{completedPayment.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Payment ID:</span>
                    <span className="font-mono text-indigo-300">{completedPayment.gatewayTransactionId}</span>
                  </div>
                  {completedPayment.razorpayOrderId && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Razorpay Order ID:</span>
                      <span className="font-mono text-purple-300">{completedPayment.razorpayOrderId}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Settlement Timestamp:</span>
                    <span className="text-slate-300">{new Date(completedPayment.completedAt || "").toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    to="/ledger"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-center text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <History className="w-3.5 h-3.5 text-purple-400" />
                    <span>View in Decision Ledger</span>
                  </Link>

                  <Link
                    to="/replay"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-center text-xs font-extrabold text-white shadow-glow flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Replay Lifecycle</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 p-3 rounded-xl bg-surface-200/80 border border-surface-border flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key className="w-3 h-3 text-emerald-400" />
              <span>Razorpay Test Mode / Simulated Bridge — Zero Real Financial Risk</span>
            </span>
            <Link to="/ledger" className="text-primary-light font-semibold hover:text-white">
              Audit Stream →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
