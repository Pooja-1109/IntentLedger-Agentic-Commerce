import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Bot,
} from "lucide-react";
import { DecisionBadge } from "../components/StatusBadge";
import { apiService } from "../services/api";
import { Intent, DecisionResult } from "../types";

export const DecisionCenterPage: React.FC = () => {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [selectedIntentId, setSelectedIntentId] = useState<string>("");
  const [decisions, setDecisions] = useState<DecisionResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterCheck, setFilterCheck] = useState<"ALL" | "PASS" | "WARN" | "FAIL">("ALL");

  useEffect(() => {
    const loadIntentsAndDecisions = async () => {
      setLoading(true);
      try {
        const intentsData = await apiService.getIntents();
        setIntents(intentsData);

        if (intentsData.length > 0) {
          const initialIntentId = intentsData[0].id;
          setSelectedIntentId(initialIntentId);
          const decs = await apiService.getDecisionsByIntentId(initialIntentId);
          setDecisions(decs);
        }
      } catch (err) {
        console.error("Error loading decisions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadIntentsAndDecisions();
  }, []);

  const handleIntentChange = async (newIntentId: string) => {
    setSelectedIntentId(newIntentId);
    setLoading(true);
    try {
      const decs = await apiService.getDecisionsByIntentId(newIntentId);
      setDecisions(decs);
    } catch (err) {
      console.error("Error fetching decisions for intent:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedIntent = intents.find((i) => i.id === selectedIntentId) || intents[0];
  const latestDecision = decisions.length > 0 ? decisions[0] : null;

  const filteredChecks = latestDecision
    ? filterCheck === "ALL"
      ? latestDecision.checks
      : latestDecision.checks.filter((c) => c.status === filterCheck)
    : [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-semibold uppercase tracking-wider mb-2">
            Deterministic Governance Analysis
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Intent Decision Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Forensic policy evaluation, mathematical drift calculation, and granular rule verification for every agent action.
          </p>
        </div>

        {/* Intent Selector */}
        {intents.length > 0 && (
          <div className="w-full md:w-80">
            <select
              value={selectedIntentId}
              onChange={(e) => handleIntentChange(e.target.value)}
              className="w-full text-xs font-semibold rounded-xl bg-surface-100 border border-surface-border p-3 text-slate-200 focus:outline-none focus:border-primary shadow-lg"
            >
              {intents.map((intent) => (
                <option key={intent.id} value={intent.id}>
                  {intent.category.toUpperCase()} • Max ₹{intent.constraints.maxAmount?.toLocaleString()} — "{intent.rawText.substring(0, 30)}..."
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs animate-pulse">
          Loading decision intelligence...
        </div>
      ) : !latestDecision ? (
        <div className="rounded-2xl bg-surface-100 border border-surface-border p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-200 border border-surface-border mx-auto flex items-center justify-center text-slate-400">
            <Sliders className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Evaluated Proposals for this Intent Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Run an autonomous shopping agent simulation in the Simulation Lab to generate real-time policy evaluation results.
          </p>
          <Link
            to="/simulation"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-glow transition-all"
          >
            <Bot className="w-4 h-4" />
            <span>Launch Simulation Lab</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Banner: Decision Summary & Risk Meter */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Decision & Explanation */}
            <div className="lg:col-span-8 rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Latest Decision Verdict
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ID: {latestDecision.id}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <DecisionBadge decision={latestDecision.decision} size="lg" />
                <span className="text-xs text-slate-400">
                  Evaluated at {new Date(latestDecision.evaluatedAt).toLocaleTimeString()}
                </span>
              </div>

              <p className="text-sm text-slate-200 font-medium leading-relaxed">
                {latestDecision.explanation}
              </p>

              {latestDecision.warnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{latestDecision.warnings.join(" ")}</span>
                </div>
              )}
            </div>

            {/* Risk Meter */}
            <div className="lg:col-span-4 rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Deterministic Policy Risk Score
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span
                    className={`text-4xl font-extrabold font-mono ${
                      latestDecision.riskScore <= 20
                        ? "text-emerald-400"
                        : latestDecision.riskScore <= 50
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {latestDecision.riskScore}
                  </span>
                  <span className="text-sm text-slate-500">/ 100</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-surface-200 rounded-full h-2 mt-3 overflow-hidden border border-surface-border">
                  <div
                    className={`h-full transition-all duration-500 ${
                      latestDecision.riskScore <= 20
                        ? "bg-emerald-400"
                        : latestDecision.riskScore <= 50
                        ? "bg-amber-400"
                        : "bg-rose-400"
                    }`}
                    style={{ width: `${latestDecision.riskScore}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-400 p-2.5 rounded-lg bg-surface-200 border border-surface-border">
                {latestDecision.riskScore <= 20
                  ? "✓ Safe: Fully compliant with user constraints."
                  : latestDecision.riskScore <= 50
                  ? "⚠ Moderate: Compliant, but human approval mandated."
                  : "✕ Critical: Blocked due to policy drift or unauthorized action."}
              </div>
            </div>
          </div>

          {/* Violations Section (if any) */}
          {latestDecision.violations.length > 0 && (
            <div className="rounded-2xl bg-rose-950/40 border border-rose-500/40 p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Critical Policy Violations ({latestDecision.violations.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {latestDecision.violations.map((violation, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-surface-200/90 border border-surface-border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-rose-400">
                        {violation.code}
                      </span>
                      {violation.deviation && (
                        <span className="text-xs font-extrabold text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-500/30">
                          +₹{violation.deviation.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200">{violation.explanation}</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-surface-border">
                      <div>Authorized: <strong className="text-slate-200">{String(violation.expected)}</strong></div>
                      <div>Proposed: <strong className="text-rose-300">{String(violation.actual)}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Side-by-Side: Intent vs Proposed Agent Action */}
          {latestDecision.proposal && selectedIntent && (
            <div className="rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Intent Policy vs Proposed Action Delta Comparison
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 uppercase tracking-wider font-semibold border-b border-surface-border bg-surface-200/50">
                    <tr>
                      <th className="py-3 px-4">Policy Dimension</th>
                      <th className="py-3 px-4">User Intent Limit</th>
                      <th className="py-3 px-4">Agent Proposed Value</th>
                      <th className="py-3 px-4">Evaluation Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-slate-300">
                    {/* Budget */}
                    <tr className="hover:bg-surface-200/50">
                      <td className="py-3 px-4 font-semibold text-slate-200">Budget Limit</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">
                        ₹{selectedIntent.constraints.maxAmount?.toLocaleString()} Max
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        ₹{latestDecision.proposal.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {latestDecision.proposal.amount > (selectedIntent.constraints.maxAmount || 0) ? (
                          <span className="text-rose-400 font-bold">✕ Exceeds by +₹{(latestDecision.proposal.amount - (selectedIntent.constraints.maxAmount || 0)).toLocaleString()}</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">✓ Within Budget</span>
                        )}
                      </td>
                    </tr>

                    {/* Merchant */}
                    <tr className="hover:bg-surface-200/50">
                      <td className="py-3 px-4 font-semibold text-slate-200">Merchant Whitelist</td>
                      <td className="py-3 px-4">
                        {selectedIntent.constraints.allowedMerchants
                          ? selectedIntent.constraints.allowedMerchants.join(", ")
                          : "Any Merchant"}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">{latestDecision.proposal.merchant}</td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-bold">✓ Verified</span>
                      </td>
                    </tr>

                    {/* Action & Subscription */}
                    <tr className="hover:bg-surface-200/50">
                      <td className="py-3 px-4 font-semibold text-slate-200">Payment Action</td>
                      <td className="py-3 px-4">One-Time Purchase Only</td>
                      <td className="py-3 px-4 capitalize text-white">
                        {latestDecision.proposal.isSubscription ? "Recurring Subscription" : latestDecision.proposal.action}
                      </td>
                      <td className="py-3 px-4">
                        {latestDecision.proposal.isSubscription && !selectedIntent.permissions.canSubscribe ? (
                          <span className="text-rose-400 font-bold">✕ Unauthorized Recurring Charge</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">✓ Authorized</span>
                        )}
                      </td>
                    </tr>

                    {/* Approval Policy */}
                    <tr className="hover:bg-surface-200/50">
                      <td className="py-3 px-4 font-semibold text-slate-200">Approval Requirement</td>
                      <td className="py-3 px-4">
                        {selectedIntent.constraints.requiresApproval ? "Explicit Approval Required" : "Auto-Authorize Allowed"}
                      </td>
                      <td className="py-3 px-4 text-white">Candidate Payment</td>
                      <td className="py-3 px-4">
                        {selectedIntent.constraints.requiresApproval ? (
                          <span className="text-amber-400 font-bold">⚠ Mandates Human Confirmation</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">✓ Direct Execution Allowed</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Granular Policy Checks Table */}
          <div className="rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Granular Policy Checks Checklist ({latestDecision.checks.length})
              </h3>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-surface-200 p-1 rounded-xl border border-surface-border text-xs">
                {(["ALL", "PASS", "WARN", "FAIL"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterCheck(tab)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      filterCheck === tab
                        ? "bg-primary text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {filteredChecks.map((check) => (
                <div
                  key={check.id}
                  className="p-3.5 rounded-xl bg-surface-200/80 border border-surface-border flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {check.status === "PASS" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : check.status === "WARN" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{check.name}</div>
                      <p className="text-xs text-slate-300 mt-0.5">{check.message}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      check.status === "PASS"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                        : check.status === "WARN"
                        ? "bg-amber-950 text-amber-300 border border-amber-500/30"
                        : "bg-rose-950 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {check.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
