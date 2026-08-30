import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Clock,
  User,
  Bot,
  Shield,
  CreditCard,
  RotateCcw,
  X,
  FileText,
} from "lucide-react";
import { DecisionBadge } from "../components/StatusBadge";
import { apiService } from "../services/api";
import { LedgerEvent } from "../types";

export const LedgerPage: React.FC = () => {
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<LedgerEvent | null>(null);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const data = await apiService.getLedgerEvents();
      setEvents(data);
    } catch (err) {
      console.error("Failed to load ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  // Filtering Logic
  const filteredEvents = events.filter((evt) => {
    // 1. Tab filter
    if (activeFilter === "INTENTS" && !evt.eventType.startsWith("INTENT_")) return false;
    if (activeFilter === "DECISIONS" && !evt.eventType.includes("POLICY_") && evt.eventType !== "DECISION_MADE") return false;
    if (activeFilter === "DRIFT" && evt.eventType !== "INTENT_DRIFT_DETECTED") return false;
    if (activeFilter === "APPROVALS" && !evt.eventType.startsWith("APPROVAL_")) return false;
    if (activeFilter === "PAYMENTS" && !evt.eventType.startsWith("PAYMENT_")) return false;
    if (activeFilter === "BLOCKED" && evt.decision !== "BLOCK" && evt.eventType !== "PAYMENT_BLOCKED") return false;

    // 2. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchIntent = evt.intentId.toLowerCase().includes(q);
      const matchType = evt.eventType.toLowerCase().includes(q);
      const matchSummary = evt.summary.toLowerCase().includes(q);
      const matchActor = evt.actor.toLowerCase().includes(q);
      return matchIntent || matchType || matchSummary || matchActor;
    }

    return true;
  });

  const getActorBadge = (actor: LedgerEvent["actor"]) => {
    switch (actor) {
      case "USER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
            <User className="w-2.5 h-2.5" /> USER
          </span>
        );
      case "AI_AGENT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
            <Bot className="w-2.5 h-2.5" /> AI AGENT
          </span>
        );
      case "INTENT_ENGINE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
            <Shield className="w-2.5 h-2.5" /> ENGINE
          </span>
        );
      case "PAYMENT_GATEWAY":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
            <CreditCard className="w-2.5 h-2.5" /> GATEWAY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
            SYSTEM
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-semibold uppercase tracking-wider mb-2">
            Append-Only Audit Trail
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Decision Ledger</h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable timeline of intent registrations, candidate proposals, policy checks, drift detections, human approvals, and settlements.
          </p>
        </div>

        <button
          onClick={fetchLedger}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-100 border border-surface-border hover:border-surface-borderHover text-slate-200 text-xs font-bold transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="rounded-2xl bg-surface-100 border border-surface-border p-4 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            {[
              { id: "ALL", label: "All Events" },
              { id: "INTENTS", label: "Intents" },
              { id: "DECISIONS", label: "Decisions" },
              { id: "DRIFT", label: "🚨 Drift Alerts" },
              { id: "APPROVALS", label: "Approvals" },
              { id: "PAYMENTS", label: "Payments" },
              { id: "BLOCKED", label: "Blocked" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeFilter === f.id
                    ? "bg-primary text-white shadow-glow"
                    : "bg-surface-200 text-slate-400 hover:text-slate-200 hover:bg-surface-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search intent ID, actor, keyword..."
              className="w-full text-xs rounded-xl bg-surface-200 border border-surface-border pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs animate-pulse">
          Loading immutable ledger...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl bg-surface-100 border border-surface-border p-12 text-center text-slate-400 text-xs">
          No ledger events match your current filter query.
        </div>
      ) : (
        <div className="rounded-2xl bg-surface-100 border border-surface-border shadow-xl divide-y divide-surface-border overflow-hidden">
          {filteredEvents.map((evt) => {
            const isDrift = evt.eventType === "INTENT_DRIFT_DETECTED";
            const isBlocked = evt.decision === "BLOCK" || evt.eventType === "PAYMENT_BLOCKED";
            const isCompleted = evt.eventType === "PAYMENT_COMPLETED";

            return (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className={`p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-surface-200/60 transition-all ${
                  isDrift ? "bg-rose-950/20" : isBlocked ? "bg-rose-950/10" : ""
                }`}
              >
                {/* Left: Time, Actor, Event Name */}
                <div className="flex items-start md:items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-200 border border-surface-border flex items-center justify-center text-slate-400 shrink-0 mt-0.5 md:mt-0">
                    <Clock className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold font-mono text-indigo-300">
                        {evt.eventType.replace(/_/g, " ")}
                      </span>
                      {getActorBadge(evt.actor)}
                      {evt.decision && <DecisionBadge decision={evt.decision} size="sm" />}
                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          SETTLED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-200 font-medium line-clamp-2 md:line-clamp-1">
                      {evt.summary}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Intent: <strong className="font-mono text-slate-300">{evt.intentId}</strong></span>
                      {evt.riskScore !== undefined && (
                        <span>• Risk: <strong className={evt.riskScore > 50 ? "text-rose-400" : "text-emerald-400"}>{evt.riskScore}/100</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Timestamp & Action */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                  <span className="text-xs font-mono text-slate-400">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>

                  <button
                    type="button"
                    className="text-xs text-primary-light hover:text-white font-semibold flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Details Slide-over / Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-xl bg-surface-100 border-l border-surface-border h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-light" />
                  <h3 className="text-base font-bold text-white">Ledger Event Inspector</h3>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded-lg hover:bg-surface-200 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Event Meta Card */}
              <div className="p-4 rounded-xl bg-surface-200 border border-surface-border space-y-2">
                <div className="text-xs font-bold uppercase text-slate-400">Event Signature</div>
                <div className="text-sm font-extrabold text-white">{selectedEvent.eventType}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-surface-border">
                  <div>Actor: <strong className="text-white">{selectedEvent.actor}</strong></div>
                  <div>Event ID: <span className="font-mono text-indigo-300">{selectedEvent.id}</span></div>
                  <div>Timestamp: <span className="text-slate-300">{new Date(selectedEvent.timestamp).toLocaleString()}</span></div>
                  <div>Intent ID: <span className="font-mono text-indigo-300">{selectedEvent.intentId}</span></div>
                </div>
              </div>

              {/* Summary & Details */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400 block">Summary Explanation</span>
                <p className="text-xs text-slate-200 leading-relaxed p-3.5 rounded-xl bg-surface-200 border border-surface-border font-medium">
                  {selectedEvent.summary}
                </p>
                {selectedEvent.details && (
                  <p className="text-xs text-slate-400 italic px-1">
                    "{selectedEvent.details}"
                  </p>
                )}
              </div>

              {/* Raw JSON Payload */}
              {selectedEvent.metadata && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-400 block">Forensic Metadata Payload</span>
                  <pre className="p-3.5 rounded-xl bg-surface-300 border border-surface-border text-[11px] text-indigo-300 font-mono overflow-x-auto max-h-60">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Bottom CTA */}
            <div className="pt-4 border-t border-surface-border flex items-center justify-between">
              <Link
                to="/replay"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-light hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay this Intent Lifecycle</span>
              </Link>

              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-lg bg-surface-200 hover:bg-surface-50 text-slate-200 text-xs font-bold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
