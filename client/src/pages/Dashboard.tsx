import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  History,
  ArrowRight,
  CreditCard,
  Layers,
  Bot,
  Zap,
  ShieldAlert,
  CheckSquare,
  RotateCcw,
  Activity,
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

    // 6-second dynamic live polling
    const interval = setInterval(() => {
      loadDashboardData();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Pitch Hero Section */}
      <div className="relative rounded-2xl bg-gradient-to-r from-surface-100 via-surface-200 to-surface-100 border border-surface-border p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-accent-cyan/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/40 text-primary-light text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-primary-light" />
            <span>AI Intent Accountability Layer</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            AI Agents Can Act.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
              IntentLedger Makes Sure They Act Within User Intent.
            </span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            IntentLedger is an intent accountability layer for AI and agentic commerce — translating natural-language authorization into enforceable policy, detecting intent drift, requiring approval when necessary, and creating an auditable decision trail.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-accent-violet hover:from-primary-hover hover:to-indigo-500 text-white text-sm font-extrabold shadow-glow transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Launch Judge Demo Mode</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/payment"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-50/80 hover:bg-surface-50 border border-surface-border hover:border-surface-borderHover text-slate-200 text-sm font-semibold transition-all"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Payment Gate & Rail</span>
            </Link>

            <Link
              to="/replay"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-50/80 hover:bg-surface-50 border border-surface-border hover:border-surface-borderHover text-slate-200 text-sm font-semibold transition-all"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>Forensic Replay</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Live System Engine Status Bar */}
      <div className="rounded-2xl bg-surface-100 border border-surface-border p-4 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live System Status
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              • Auto-refreshing (Last: {lastUpdated})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-200 border border-surface-border">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-bold">API</span>
                <span className="text-[11px] font-bold text-emerald-400">● ONLINE</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-200 border border-surface-border">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-bold">DATABASE</span>
                <span className="text-[11px] font-bold text-emerald-400">
                  ● {health?.database.type === "mongodb" ? "MONGODB" : "IN-MEMORY"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-200 border border-surface-border">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-bold">AI COMPILER</span>
                <span className="text-[11px] font-bold text-purple-300">
                  ● {health?.aiCompiler.mode === "ready" ? "GEMINI AI" : "RULE ENGINE"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-200 border border-surface-border">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-bold">POLICY ENGINE</span>
                <span className="text-[11px] font-bold text-emerald-400">● ACTIVE</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-200 border border-surface-border">
              <Activity className="w-3.5 h-3.5 text-amber-300" />
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-bold">PAYMENT RAIL</span>
                <span className="text-[11px] font-bold text-amber-300">
                  ● {health?.paymentRail.mode === "razorpay_test" ? "RAZORPAY TEST" : "SIMULATED"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time KPI Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Stat 1 */}
        <div className="rounded-xl bg-surface-100 border border-surface-border p-4 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Intents</span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-extrabold text-white mt-2">
            {loading ? "..." : summary?.activeIntents ?? intents.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Enforced limits</div>
        </div>

        {/* Stat 2 */}
        <div className="rounded-xl bg-surface-100 border border-surface-border p-4 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Evaluated</span>
            <Bot className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-extrabold text-white mt-2">
            {loading ? "..." : summary?.decisionsEvaluated ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Policy checks</div>
        </div>

        {/* Stat 3 */}
        <div className="rounded-xl bg-surface-100 border border-rose-500/40 p-4 hover:border-rose-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-rose-300">Drift Alerts</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-extrabold text-rose-400 mt-2">
            {loading ? "..." : summary?.driftDetected ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Deviations flagged</div>
        </div>

        {/* Stat 4 */}
        <div className="rounded-xl bg-surface-100 border border-amber-500/40 p-4 hover:border-amber-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-amber-300">Approvals</span>
            <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-400 mt-2">
            {loading ? "..." : summary?.approvalRequests ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Human reviews</div>
        </div>

        {/* Stat 5 */}
        <div className="rounded-xl bg-surface-100 border border-emerald-500/40 p-4 hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-emerald-300">Settled</span>
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 mt-2">
            {loading ? "..." : summary?.successfulPayments ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Verified payments</div>
        </div>

        {/* Stat 6 */}
        <div className="rounded-xl bg-surface-100 border border-rose-500/40 p-4 hover:border-rose-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-rose-300">Blocked</span>
            <Layers className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-extrabold text-rose-400 mt-2">
            {loading ? "..." : summary?.blockedActions ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Halted at gate</div>
        </div>
      </div>

      {/* Visual Pipeline Flow */}
      <PipelineFlow />

      {/* 2-Column: Active Intents & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Intents */}
        <div className="rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Active Intent Policies</h3>
              </div>
              <Link
                to="/studio"
                className="text-xs font-semibold text-primary-light hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>+ Add Intent</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-500 text-xs animate-pulse">
                Loading active intents...
              </div>
            ) : intents.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No active intents found. Create your first intent in Intent Studio.
              </div>
            ) : (
              <div className="space-y-3">
                {intents.slice(0, 3).map((intent) => (
                  <div
                    key={intent.id}
                    className="p-3.5 rounded-xl bg-surface-200 border border-surface-border hover:border-surface-borderHover transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-200">
                        {intent.category.toUpperCase()} • Max ₹{intent.constraints.maxAmount?.toLocaleString()}
                      </span>
                      <StatusPill status={intent.status} />
                    </div>
                    <p className="text-xs text-slate-300 italic line-clamp-2">
                      "{intent.rawText}"
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-surface-100 border border-surface-border">
                        {intent.constraints.requiresApproval ? "Approval Mandated" : "Auto-Authorize"}
                      </span>
                      {intent.constraints.productCategory && (
                        <span className="px-2 py-0.5 rounded bg-surface-100 border border-surface-border text-slate-300">
                          {intent.constraints.productCategory}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-surface-border flex justify-end">
            <Link
              to="/studio"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Explore all intents in Intent Studio</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white">Live Activity Stream</h3>
              </div>
              <Link
                to="/ledger"
                className="text-xs font-semibold text-primary-light hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Full Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-500 text-xs animate-pulse">
                Loading live activity...
              </div>
            ) : ledgerEvents.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No activity logged yet.
              </div>
            ) : (
              <div className="space-y-3">
                {ledgerEvents.slice(0, 4).map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl bg-surface-200 border border-surface-border hover:border-surface-borderHover transition-all flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-lg bg-surface-100 border border-surface-border flex items-center justify-center text-slate-300 text-xs font-bold shrink-0 mt-0.5">
                      {evt.actor === "USER" ? "U" : evt.actor === "AI_AGENT" ? "AI" : evt.actor === "PAYMENT_GATEWAY" ? "PG" : "ENG"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                          {evt.eventType.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 font-medium">
                        {evt.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-surface-border flex justify-end">
            <Link
              to="/ledger"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>View full immutable ledger</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
