import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Bot,
  ArrowRight,
  ShieldCheck,
  Activity,
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

  const latestDecision = decisions.length > 0 ? decisions[0] : null;

  const filteredChecks = latestDecision
    ? filterCheck === "ALL"
      ? latestDecision.checks
      : latestDecision.checks.filter((c) => c.status === filterCheck)
    : [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Deterministic Governance Analysis
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Decision Center
          </h1>
          <p className="text-xs md:text-sm text-slate-600 mt-1">
            Understand exactly why an AI transaction was allowed, reviewed, or blocked with mathematical drift and rule verification.
          </p>
        </div>

        {/* Intent Selector */}
        {intents.length > 0 && (
          <div className="w-full md:w-80">
            <select
              value={selectedIntentId}
              onChange={(e) => handleIntentChange(e.target.value)}
              className="w-full text-xs font-semibold rounded-lg bg-white border border-surface-border p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
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
        <div className="py-24 text-center text-slate-400 text-xs animate-pulse">
          Loading decision intelligence from backend...
        </div>
      ) : !latestDecision ? (
        <div className="fintech-card p-12 text-center space-y-4">
          <Bot className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No Decisions Recorded for this Intent</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Evaluate a candidate proposal in Commerce Simulator to view real-time governance analysis.
          </p>
          <Link
            to="/simulation"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
          >
            <span>Open Simulator</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero Decision Summary Banner */}
          <div className="fintech-card p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Evaluated Policy Decision
                </span>
                <div className="flex items-center gap-3">
                  <DecisionBadge decision={latestDecision.decision} size="lg" />
                  <span className="text-xs text-slate-500 font-mono">
                    Decision ID: {latestDecision.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Risk Score
                  </span>
                  <span
                    className={`text-2xl font-extrabold tabular-nums ${
                      latestDecision.riskScore > 50
                        ? "text-rose-600"
                        : latestDecision.riskScore > 20
                        ? "text-amber-600"
                        : "text-emerald-700"
                    }`}
                  >
                    {latestDecision.riskScore}/100
                  </span>
                </div>
              </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Product Name</span>
                <span className="font-bold text-slate-900 line-clamp-1 mt-0.5">
                  {latestDecision.proposal?.product || "Candidate Item"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Merchant Store</span>
                <span className="font-bold text-slate-900 line-clamp-1 mt-0.5">
                  {latestDecision.proposal?.merchant || "Merchant"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Proposed Amount</span>
                <span className="font-extrabold text-slate-900 tabular-nums mt-0.5 block">
                  ₹{latestDecision.proposal?.amount?.toLocaleString()} INR
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Drift Status</span>
                <span
                  className={`font-extrabold tabular-nums mt-0.5 block ${
                    latestDecision.driftReport?.hasDrift ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {latestDecision.driftReport?.hasDrift
                    ? `DRIFT DETECTED (${latestDecision.driftReport.severity})`
                    : "Zero Drift (Compliant)"}
                </span>
              </div>
            </div>
          </div>

          {/* Decision Trace View */}
          <div className="fintech-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Deterministic Execution Trace
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">6-Stage Evaluation Sequence</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border text-center space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 block">STEP 1</span>
                <div className="font-bold text-slate-800">Proposal Ingest</div>
                <span className="text-[10px] text-emerald-700 block font-semibold">✓ Received</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border text-center space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 block">STEP 2</span>
                <div className="font-bold text-slate-800">Policy Whitelist</div>
                <span className="text-[10px] text-emerald-700 block font-semibold">✓ Matched</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border text-center space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 block">STEP 3</span>
                <div className="font-bold text-slate-800">Constraint Gate</div>
                <span
                  className={`text-[10px] block font-bold ${
                    latestDecision.violations.length === 0 ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {latestDecision.violations.length === 0 ? "✓ Passed" : `✕ ${latestDecision.violations.length} Failures`}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border text-center space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 block">STEP 4</span>
                <div className="font-bold text-slate-800">Drift Severity</div>
                <span
                  className={`text-[10px] block font-bold ${
                    latestDecision.driftReport?.severity === "NONE" ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {latestDecision.driftReport?.severity || "NONE"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border text-center space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 block">STEP 5</span>
                <div className="font-bold text-slate-800">Risk Assessment</div>
                <span className="text-[10px] text-blue-700 block font-bold">
                  {latestDecision.riskScore}/100
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border text-center space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 block">STEP 6</span>
                <div className="font-bold text-slate-800">Final Verdict</div>
                <span
                  className={`text-[10px] block font-bold uppercase ${
                    latestDecision.decision === "ALLOW"
                      ? "text-emerald-700"
                      : latestDecision.decision === "ASK_APPROVAL"
                      ? "text-amber-700"
                      : "text-rose-600"
                  }`}
                >
                  {latestDecision.decision}
                </span>
              </div>
            </div>
          </div>

          {/* Granular Policy Check Table */}
          <div className="fintech-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Granular Rule Verifications ({latestDecision.checks.length})
                </h3>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-surface-border text-xs">
                {(["ALL", "PASS", "WARN", "FAIL"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterCheck(mode)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                      filterCheck === mode
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-slate-500 uppercase text-[10px] tracking-wider bg-slate-50/50">
                    <th className="py-2.5 px-3">Rule ID</th>
                    <th className="py-2.5 px-3">Rule Name</th>
                    <th className="py-2.5 px-3">Verification Details</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredChecks.map((chk) => (
                    <tr key={chk.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 font-semibold">
                        {chk.id}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {chk.name}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {chk.message}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            chk.status === "PASS"
                              ? "status-pill-emerald"
                              : chk.status === "WARN"
                              ? "status-pill-amber"
                              : "status-pill-rose"
                          }`}
                        >
                          {chk.status === "PASS" && <CheckCircle2 className="w-3 h-3" />}
                          {chk.status === "WARN" && <AlertTriangle className="w-3 h-3" />}
                          {chk.status === "FAIL" && <ShieldAlert className="w-3 h-3" />}
                          <span>{chk.status === "PASS" ? "PASSED" : chk.status === "WARN" ? "WARNING" : "FAILED"}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
