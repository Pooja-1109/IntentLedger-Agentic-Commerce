import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  History,
  ArrowRight,
  CreditCard,
  Bot,
  Zap,
  ShieldAlert,
  RotateCcw,
  Server,
  Database,
  Cpu,
  ShieldCheck,
} from "lucide-react";
import { PipelineFlow } from "../components/PipelineFlow";
import { StatusPill } from "../components/StatusBadge";
import { apiService, DashboardSummaryData, HealthCheckData } from "../services/api";
import { Intent, LedgerEvent } from "../types";

export const Dashboard: React.FC = () => {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [ledgerEvents, setLedgerEvents] = useState<LedgerEvent[]>([]);
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [health, setHealth] = useState<HealthCheckData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  const loadDashboardData = async () => {
    try {
      const [intentsData, summaryData, activityData, healthData] = await Promise.all([
        apiService.getIntents(),
        apiService.getDashboardSummary(),
        apiService.getDashboardActivity(),
        apiService.getHealth(),
      ]);
      setIntents(intentsData);
      setSummary(summaryData);
      setLedgerEvents(activityData);
      setHealth(healthData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error loading live dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Commerce Governance Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              AI Commerce Accountability
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE TELEMETRY • {lastUpdated}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Commerce Governance
          </h1>
          <p className="text-xs md:text-sm text-slate-600 mt-1">
            Monitor AI-driven purchasing decisions, approvals, payments and audit activity.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Link
            to="/studio"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Create Intent</span>
          </Link>
          <Link
            to="/simulation"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-surface-border text-slate-700 text-xs font-semibold transition-all shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Run Simulation</span>
          </Link>
        </div>
      </div>

      {/* 4-Card Primary KPI Metric Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Intents */}
        <div className="fintech-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Intents</span>
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
              {loading ? "..." : summary?.activeIntents ?? intents.length}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block font-medium">
              Enforced policy boundaries
            </span>
          </div>
        </div>

        {/* Card 2: Decisions Evaluated */}
        <div className="fintech-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Decisions Evaluated</span>
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
              {loading ? "..." : summary?.decisionsEvaluated ?? 0}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block font-medium">
              Deterministic policy checks
            </span>
          </div>
        </div>

        {/* Card 3: Blocked Transactions */}
        <div className="fintech-card p-5 flex flex-col justify-between border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Blocked Transactions</span>
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-rose-600 tabular-nums tracking-tight">
              {loading ? "..." : summary?.blockedActions ?? 0}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block font-medium">
              Halted before financial exposure
            </span>
          </div>
        </div>

        {/* Card 4: Settled Payments */}
        <div className="fintech-card p-5 flex flex-col justify-between border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Settled Payments</span>
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-700 tabular-nums tracking-tight">
              {loading ? "..." : summary?.successfulPayments ?? 0}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block font-medium">
              Cryptographically verified
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content: Live Governance Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Live Governance Activity */}
        <div className="lg:col-span-2 fintech-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Live Governance Activity
                </h3>
              </div>
              <Link
                to="/ledger"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
              >
                <span>Audit Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
                Loading live activity events...
              </div>
            ) : ledgerEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No activity logged yet. Create an intent or run a simulation.
              </div>
            ) : (
              <div className="space-y-2.5">
                {ledgerEvents.slice(0, 5).map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-lg bg-surface-50 border border-surface-border hover:border-surface-borderHover transition-all flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-mono font-bold shrink-0 mt-0.5">
                      {evt.actor === "USER" ? "USR" : evt.actor === "AI_AGENT" ? "AGT" : evt.actor === "PAYMENT_GATEWAY" ? "PAY" : "ENG"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                          {evt.eventType.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1 font-normal">
                        {evt.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs text-slate-500">
            <span>Showing latest 5 immutable audit events</span>
            <Link to="/replay" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold">
              <span>Replay Timeline</span>
              <RotateCcw className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right Column (1 span): System Health */}
        <div className="fintech-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  System Health
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                ACTIVE
              </span>
            </div>

            <div className="space-y-3">
              {/* API Status */}
              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Express API Engine</div>
                    <div className="text-[10px] text-slate-500 font-mono">Port :5000</div>
                  </div>
                </div>
                <StatusPill status="OPERATIONAL" />
              </div>

              {/* Database Status */}
              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-cyan-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Database Layer</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {health?.database.type === "mongodb" ? "MongoDB Atlas" : "In-Memory Store"}
                    </div>
                  </div>
                </div>
                <StatusPill status={health?.database.type === "mongodb" ? "OPERATIONAL" : "IN-MEMORY"} />
              </div>

              {/* AI Compiler Status */}
              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">AI Compiler</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {health?.aiCompiler.mode === "ready" ? "Gemini 3.6 Flash" : "Rule Engine"}
                    </div>
                  </div>
                </div>
                <StatusPill status={health?.aiCompiler.mode === "ready" ? "OPERATIONAL" : "FALLBACK"} />
              </div>

              {/* Payment Rail Status */}
              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Payment Rail</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {health?.paymentRail.mode === "razorpay_test" ? "Razorpay Test Rail" : "Simulated Sandbox"}
                    </div>
                  </div>
                </div>
                <StatusPill status={health?.paymentRail.mode === "razorpay_test" ? "TEST MODE" : "SANDBOX"} />
              </div>

              {/* Ledger Status */}
              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Audit Ledger</div>
                    <div className="text-[10px] text-slate-500 font-mono">Append-Only Immutability</div>
                  </div>
                </div>
                <StatusPill status="OPERATIONAL" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-surface-border text-[11px] text-slate-500 text-center font-medium">
            Truthful telemetry updated every 6 seconds
          </div>
        </div>
      </div>

      {/* Governance Pipeline Flow */}
      <PipelineFlow />
    </div>
  );
};
