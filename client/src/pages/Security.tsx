import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Cpu,
  Key,
  CreditCard,
  History,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const SecurityCenterPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-semibold uppercase tracking-wider mb-2">
          Defense-in-Depth Architecture
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          Security & Authorization Center
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Comprehensive forensic breakdown of the IntentLedger security perimeter, cryptographic context binding, and tamper-resistance mechanisms.
        </p>
      </div>

      {/* Hero Security Invariant Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-surface-100 via-surface-200 to-surface-100 border border-surface-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-amber-300 tracking-wider">
            <Lock className="w-4 h-4 text-amber-300" />
            <span>Core Security Invariant</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">
            USER INTENT ≠ AGENT AUTHORITY
          </h2>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl">
            Autonomous AI shopping agents can select and propose actions, but they have zero direct payment authority. Every payment execution must be independently validated and cryptographically authorized by the deterministic IntentLedger policy engine.
          </p>
        </div>
      </div>

      {/* Live Security Proof: Hero Attack Demonstration */}
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/50 space-y-4 shadow-glow-rose">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-300 font-extrabold text-sm uppercase tracking-wider">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>Cryptographic Security Proof: Hero Tampering Attack</span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-rose-900/80 text-rose-200 border border-rose-500/40">
            Scenario D Invariant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-surface-200/90 border border-surface-border space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">1. User Approval</span>
            <div className="font-extrabold text-emerald-400">₹3,499 INR</div>
            <div className="text-[11px] text-slate-300">Nike Pegasus Running Shoes</div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-200/90 border border-surface-border space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">2. Approval Token</span>
            <div className="font-mono text-[10px] text-indigo-300 truncate">sha256(snap_3499_nike)</div>
            <div className="text-[11px] text-slate-300">10-Minute TTL Bound</div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-200/90 border border-surface-border space-y-1">
            <span className="text-[10px] font-bold text-rose-400 uppercase block">3. Rogue Agent Alteration</span>
            <div className="font-extrabold text-rose-400">₹7,999 INR</div>
            <div className="text-[11px] text-slate-300">Nike Vaporfly Elite Pro</div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-200/90 border border-rose-500/40 space-y-1">
            <span className="text-[10px] font-bold text-rose-300 uppercase block">4. IntentLedger Verdict</span>
            <div className="font-extrabold text-rose-300">403 MISMATCH</div>
            <div className="text-[11px] text-rose-400 font-mono">APPROVAL_CONTEXT_MISMATCH</div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-200/90 border border-emerald-500/40 space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase block">5. Payment Rail State</span>
            <div className="font-extrabold text-emerald-300">NOT CREATED</div>
            <div className="text-[11px] text-slate-300">Zero Financial Exposure</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-100/90 border border-surface-border text-xs text-slate-300 flex items-center justify-between">
          <span className="font-medium">
            "Human approval is cryptographically bound to the exact item snapshot — not merely to the user ID or intent record."
          </span>
          <Link
            to="/demo"
            className="text-xs font-bold text-primary-light hover:text-white flex items-center gap-1 shrink-0 ml-4"
          >
            <span>Run in Live Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 8-Tier Security Perimeter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tier 1 */}
        <div className="p-5 rounded-2xl bg-surface-100 border border-surface-border space-y-3">
          <div className="w-9 h-9 rounded-xl bg-surface-200 border border-surface-border flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">1. Intent Boundary</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Natural-language prompts are compiled into typed constraints with upper budget caps, merchant rules, and permission flags.
          </p>
        </div>

        {/* Tier 2 */}
        <div className="p-5 rounded-2xl bg-surface-100 border border-surface-border space-y-3">
          <div className="w-9 h-9 rounded-xl bg-surface-200 border border-surface-border flex items-center justify-center text-purple-400">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">2. Deterministic Engine</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Rule engine evaluates candidate actions independently of the LLM. Produces explainable ALLOW, ASK_APPROVAL, or BLOCK verdicts.
          </p>
        </div>

        {/* Tier 3 */}
        <div className="p-5 rounded-2xl bg-surface-100 border border-surface-border space-y-3">
          <div className="w-9 h-9 rounded-xl bg-surface-200 border border-surface-border flex items-center justify-center text-amber-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">3. Human Approval Center</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            When required by user policy, human approval must be granted. Requests feature full product, merchant, and price clarity.
          </p>
        </div>

        {/* Tier 4 */}
        <div className="p-5 rounded-2xl bg-surface-100 border border-surface-border space-y-3">
          <div className="w-9 h-9 rounded-xl bg-surface-200 border border-surface-border flex items-center justify-center text-cyan-400">
            <Key className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">4. Context Binding</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Issued approval tokens contain a cryptographic digest of the exact snapshot with a strict 10-minute time-to-live.
          </p>
        </div>

        {/* Tier 5 */}
        <div className="p-5 rounded-2xl bg-surface-100 border border-surface-border space-y-3">
          <div className="w-9 h-9 rounded-xl bg-surface-200 border border-surface-border flex items-center justify-center text-emerald-400">
            <CreditCard className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">5. Payment Gate</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Payment execution is strictly downstream of authorization. Order creation is blocked if context or budget is violated.
          </p>
        </div>

        {/* Tier 6 */}
        <div className="p-5 rounded-2xl bg-surface-100 border border-surface-border space-y-3">
          <div className="w-9 h-9 rounded-xl bg-surface-200 border border-surface-border flex items-center justify-center text-indigo-400">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">6. Cryptographic Verification</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Server-side timing-safe HMAC SHA-256 verifies Razorpay checkout signatures and incoming webhooks against forged payloads.
          </p>
        </div>

        {/* Tier 7 */}
        <div className="p-5 rounded-2xl bg-surface-100 border border-surface-border space-y-3">
          <div className="w-9 h-9 rounded-xl bg-surface-200 border border-surface-border flex items-center justify-center text-purple-400">
            <History className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">7. Append-Only Ledger</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            All decisions, drift alerts, approvals, and settlements are permanently logged. Direct mutation/deletion APIs return 405 Method Not Allowed.
          </p>
        </div>

        {/* Tier 8 */}
        <div className="p-5 rounded-2xl bg-surface-100 border border-surface-border space-y-3">
          <div className="w-9 h-9 rounded-xl bg-surface-200 border border-surface-border flex items-center justify-center text-teal-400">
            <RotateCcw className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">8. Forensic Replay</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Auditors can step through the entire transaction lifecycle step-by-step to inspect exact evidence payloads and verdicts.
          </p>
        </div>
      </div>

      {/* Threat Mitigation Matrix */}
      <div className="rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-base font-bold text-white">
            Threat Model & Automated Mitigations
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 uppercase tracking-wider font-semibold border-b border-surface-border bg-surface-200/50">
              <tr>
                <th className="py-3 px-4">Threat Vector</th>
                <th className="py-3 px-4">Attack Mechanism</th>
                <th className="py-3 px-4">IntentLedger Defense</th>
                <th className="py-3 px-4">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-slate-300">
              <tr className="hover:bg-surface-200/50">
                <td className="py-3 px-4 font-bold text-slate-200">Budget Drift</td>
                <td className="py-3 px-4">Agent attempts ₹7,999 when user set ₹4,000 cap</td>
                <td className="py-3 px-4">Deterministic maxAmount check</td>
                <td className="py-3 px-4 text-rose-400 font-bold">BLOCK (No order created)</td>
              </tr>
              <tr className="hover:bg-surface-200/50">
                <td className="py-3 px-4 font-bold text-slate-200">Subscription Trap</td>
                <td className="py-3 px-4">Agent attempts recurring billing for one-time intent</td>
                <td className="py-3 px-4">canSubscribe boolean permission validation</td>
                <td className="py-3 px-4 text-rose-400 font-bold">BLOCK (403 SUBSCRIPTION_NOT_PERMITTED)</td>
              </tr>
              <tr className="hover:bg-surface-200/50">
                <td className="py-3 px-4 font-bold text-slate-200">Context Tampering</td>
                <td className="py-3 px-4">Agent uses ₹3,499 token to buy ₹7,999 item</td>
                <td className="py-3 px-4">Cryptographic proposalSnapshot matching</td>
                <td className="py-3 px-4 text-rose-400 font-bold">403 APPROVAL_CONTEXT_MISMATCH</td>
              </tr>
              <tr className="hover:bg-surface-200/50">
                <td className="py-3 px-4 font-bold text-slate-200">Token Replay / Delay</td>
                <td className="py-3 px-4">Stale approval token submitted hours later</td>
                <td className="py-3 px-4">10-Minute TTL timestamp validation</td>
                <td className="py-3 px-4 text-rose-400 font-bold">403 APPROVAL_EXPIRED</td>
              </tr>
              <tr className="hover:bg-surface-200/50">
                <td className="py-3 px-4 font-bold text-slate-200">Signature Forgery</td>
                <td className="py-3 px-4">Rogue client sends fake razorpay_signature</td>
                <td className="py-3 px-4">Timing-safe HMAC SHA-256 server check</td>
                <td className="py-3 px-4 text-rose-400 font-bold">400 PAYMENT_VERIFICATION_FAILED</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
