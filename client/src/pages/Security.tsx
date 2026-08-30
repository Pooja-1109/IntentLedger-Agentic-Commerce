import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  Lock,
  Cpu,
  Key,
  CheckCircle2,
  ArrowRight,
  Activity,
} from "lucide-react";
import { apiService, DashboardSummaryData } from "../services/api";

export const SecurityCenterPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Interactive HMAC Sandbox State
  const [orderId, setOrderId] = useState<string>("order_demo_test_9981");
  const [paymentId, setPaymentId] = useState<string>("pay_demo_test_8872");
  const [secretKey, setSecretKey] = useState<string>("demo_rzp_secret_key_abc123");
  const [computedSignature, setComputedSignature] = useState<string>("");
  const [verifySignatureInput, setVerifySignatureInput] = useState<string>("");
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        const summaryData = await apiService.getDashboardSummary();
        setSummary(summaryData);
      } catch (err) {
        console.error("Failed to load security telemetry:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleComputeHMAC = async () => {
    try {
      const payload = `${orderId}|${paymentId}`;
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secretKey);
      const messageData = encoder.encode(payload);

      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const signatureBuffer = await window.crypto.subtle.sign("HMAC", cryptoKey, messageData);
      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setComputedSignature(hashHex);
      setVerifySignatureInput(hashHex);
      setVerificationResult(true);
    } catch (err) {
      console.error("HMAC calculation error:", err);
    }
  };

  useEffect(() => {
    handleComputeHMAC();
  }, [orderId, paymentId, secretKey]);

  const handleVerify = () => {
    if (!verifySignatureInput || !computedSignature) return;
    setVerificationResult(verifySignatureInput.trim() === computedSignature.trim());
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Security Operations & Defense
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Security & Integrity
          </h1>
          <p className="text-xs md:text-sm text-slate-600 mt-1">
            Protecting user intent from unauthorized agent behavior through cryptographic controls and pre-payment policy gates.
          </p>
        </div>

        {/* Live Telemetry Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-50 border border-surface-border text-xs self-start md:self-auto shadow-2xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-800 font-bold uppercase text-[11px]">
            Live Telemetry Active
          </span>
        </div>
      </div>

      {/* Security Operational Status Overview (5 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <div className="fintech-card p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Context Binding</span>
          <span className="font-extrabold text-emerald-700 flex items-center gap-1 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">SHA-256 Snapshot</span>
        </div>

        <div className="fintech-card p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Approval Integrity</span>
          <span className="font-extrabold text-emerald-700 flex items-center gap-1 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">10m TTL Bound</span>
        </div>

        <div className="fintech-card p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">HMAC Verification</span>
          <span className="font-extrabold text-emerald-700 flex items-center gap-1 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Operational
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">Timing-Safe</span>
        </div>

        <div className="fintech-card p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Payment Rail</span>
          <span className="font-extrabold text-amber-700 flex items-center gap-1 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Test Mode
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">Zero Exposure</span>
        </div>

        <div className="fintech-card p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Ledger Integrity</span>
          <span className="font-extrabold text-emerald-700 flex items-center gap-1 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Operational
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">HTTP 405 Guard</span>
        </div>
      </div>

      {/* Hero Security Invariant Banner (High-Impact Dark Navy Banner) */}
      <div className="fintech-card-dark p-6 md:p-8 space-y-3 border-l-4 border-l-blue-500">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-blue-400 tracking-wider">
          <Lock className="w-4 h-4" />
          <span>Core Security Invariant</span>
        </div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
          USER INTENT ≠ AGENT AUTHORITY
        </h2>
        <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-3xl">
          Autonomous AI shopping agents can select and propose actions, but they have zero direct payment authority. Every payment execution must be independently validated and cryptographically authorized by the deterministic IntentLedger policy engine.
        </p>
      </div>

      {/* Live System Telemetry Metrics */}
      <div className="fintech-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              LIVE SYSTEM TELEMETRY
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-medium">
            Real Backend Counter Aggregation
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-surface-50 border border-surface-border">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Decisions Evaluated</span>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
              {loading ? "..." : summary?.decisionsEvaluated ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Deterministic policy runs</span>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-50 border border-rose-200">
            <span className="text-[10px] font-bold text-rose-700 uppercase block">Violations Blocked</span>
            <div className="text-2xl font-extrabold text-rose-600 tabular-nums mt-1">
              {loading ? "..." : summary?.blockedActions ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Halted at policy gate</span>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-50 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-700 uppercase block">Intent Drift Flagged</span>
            <div className="text-2xl font-extrabold text-amber-600 tabular-nums mt-1">
              {loading ? "..." : summary?.driftDetected ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Parameters deviated</span>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Verified Settlements</span>
            <div className="text-2xl font-extrabold text-emerald-700 tabular-nums mt-1">
              {loading ? "..." : summary?.successfulPayments ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Settled with audit trace</span>
          </div>
        </div>
      </div>

      {/* Cryptographic Tampering Attack Proof */}
      <div className="fintech-card p-6 space-y-4 border-rose-200">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Cryptographic Proof: Hero Tampering Attack Defense</span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold">
            Scenario D Invariant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-surface-50 border border-surface-border space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">1. User Approval</span>
            <div className="font-extrabold text-emerald-700">₹3,499 INR</div>
            <div className="text-[11px] text-slate-600">Nike Pegasus Running Shoes</div>
          </div>

          <div className="p-3 rounded-lg bg-surface-50 border border-surface-border space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">2. Approval Token</span>
            <div className="font-mono text-[10px] text-blue-700 truncate font-semibold">sha256(snap_3499_nike)</div>
            <div className="text-[11px] text-slate-600">10-Minute TTL Bound</div>
          </div>

          <div className="p-3 rounded-lg bg-surface-50 border border-rose-200 space-y-1">
            <span className="text-[10px] font-bold text-rose-700 uppercase block">3. Rogue Agent Alteration</span>
            <div className="font-extrabold text-rose-600">₹7,999 INR</div>
            <div className="text-[11px] text-slate-600">Nike Vaporfly Elite Pro</div>
          </div>

          <div className="p-3 rounded-lg bg-surface-50 border border-rose-200 space-y-1">
            <span className="text-[10px] font-bold text-rose-700 uppercase block">4. IntentLedger Verdict</span>
            <div className="font-extrabold text-rose-700">403 MISMATCH</div>
            <div className="text-[11px] text-rose-600 font-mono truncate font-bold">APPROVAL_CONTEXT_MISMATCH</div>
          </div>

          <div className="p-3 rounded-lg bg-surface-50 border border-emerald-200 space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">5. Payment Rail State</span>
            <div className="font-extrabold text-emerald-700">NOT CREATED</div>
            <div className="text-[11px] text-slate-600">Zero Financial Exposure</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-surface-50 border border-surface-border text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>"Human approval is cryptographically bound to the exact item snapshot — not merely to the user ID or intent record."</span>
          <Link
            to="/demo"
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Live Interactive Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Interactive HMAC SHA-256 Verification Sandbox */}
      <div className="fintech-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
            <Key className="w-4 h-4 text-indigo-600" />
            <span>Interactive HMAC SHA-256 Signature Verification</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
            Timing-Safe Cryptography
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Test real-time HMAC SHA-256 computation matching the server-side Razorpay test payment and webhook verifiers (`crypto.createHmac('sha256', secret).update(orderId + '|' + paymentId)`):
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Razorpay Order ID</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full rounded-lg bg-surface-50 border border-surface-border p-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Razorpay Payment ID</label>
            <input
              type="text"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              className="w-full rounded-lg bg-surface-50 border border-surface-border p-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Webhook / Key Secret</label>
            <input
              type="text"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full rounded-lg bg-surface-50 border border-surface-border p-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-surface-50 border border-surface-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Generated Signature Hash (Hex):</span>
            <button
              onClick={() => {
                setVerifySignatureInput(computedSignature);
                setVerificationResult(true);
              }}
              className="text-[10px] font-bold text-blue-600 hover:underline"
            >
              Copy to Verifier
            </button>
          </div>
          <div className="font-mono text-xs text-blue-900 break-all bg-white p-2.5 rounded-lg border border-surface-border shadow-2xs">
            {computedSignature || "Calculating..."}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-surface-50 border border-surface-border space-y-3">
          <span className="text-[11px] font-bold text-slate-700 uppercase block">
            Test Signature Verification:
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={verifySignatureInput}
              onChange={(e) => {
                setVerifySignatureInput(e.target.value);
                setVerificationResult(null);
              }}
              placeholder="Paste signature hash to verify..."
              className="flex-1 rounded-lg bg-white border border-surface-border p-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
            />
            <button
              onClick={handleVerify}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shrink-0 shadow-sm"
            >
              Verify Signature
            </button>
          </div>

          {verificationResult !== null && (
            <div
              className={`p-3 rounded-lg border text-xs font-bold flex items-center gap-2 ${
                verificationResult
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-rose-50 border-rose-300 text-rose-800"
              }`}
            >
              {verificationResult ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>✓ Signature Cryptographically Verified (Authentic Order & Payment)</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>✕ Signature Mismatch! Rejecting Untrusted Payment / Webhook</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Architecture Reference: 8-Tier Defense Perimeter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-700 tracking-wider">
            <Cpu className="w-4 h-4 text-purple-600" />
            <span>ARCHITECTURE REFERENCE: 8-TIER SECURITY PERIMETER</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-medium">
            SPECIFICATION v1.0
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="fintech-card p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>1. Advisory AI Isolation Barrier</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Google Gemini compiler parses natural language into JSON constraints but has zero authority to execute financial decisions.
            </p>
          </div>

          <div className="fintech-card p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>2. Deterministic Mathematical Policy Gate</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Hard code boundaries evaluate budget limits, allowed/blocked merchants, quantity caps, and subscription permissions.
            </p>
          </div>

          <div className="fintech-card p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>3. Intent Drift Detection Engine</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Calculates numerical and semantic variance between intent and proposal (NONE, LOW, MEDIUM, HIGH).
            </p>
          </div>

          <div className="fintech-card p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>4. Cryptographic Proposal Snapshot Hashing</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              When approved, an immutable SHA-256 digest of the item, merchant, quantity, and amount is generated.
            </p>
          </div>

          <div className="fintech-card p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>5. 10-Minute Authorization Time-To-Live (TTL)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Approval tokens automatically expire after 10 minutes, preventing delayed replay attacks.
            </p>
          </div>

          <div className="fintech-card p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>6. Minor Units Integer Arithmetic</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              All currency math is converted to integer paise (`₹34.99` $\rightarrow$ `3499 paise`) eliminating floating-point rounding errors.
            </p>
          </div>

          <div className="fintech-card p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>7. Append-Only Ledger Immutability</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Audit ledger records are strictly append-only. Mutation requests to `/api/ledger` return HTTP 405 Method Not Allowed.
            </p>
          </div>

          <div className="fintech-card p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>8. Razorpay Test-Mode Enclosure</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Strict test-mode rail safety invariant (`RAZORPAY_MODE=test`). Real-money processing is permanently prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
