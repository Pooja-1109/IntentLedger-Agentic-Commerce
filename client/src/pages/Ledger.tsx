import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RefreshCw,
  User,
  Bot,
  Shield,
  CreditCard,
  RotateCcw,
  X,
  FileText,
  Lock,
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

  const filteredEvents = events.filter((evt) => {
    if (activeFilter === "INTENTS" && !evt.eventType.startsWith("INTENT_")) return false;
    if (activeFilter === "DECISIONS" && !evt.eventType.includes("POLICY_") && evt.eventType !== "DECISION_MADE") return false;
    if (activeFilter === "DRIFT" && evt.eventType !== "INTENT_DRIFT_DETECTED") return false;
    if (activeFilter === "APPROVALS" && !evt.eventType.startsWith("APPROVAL_")) return false;
    if (activeFilter === "PAYMENTS" && !evt.eventType.startsWith("PAYMENT_")) return false;
    if (activeFilter === "BLOCKED" && evt.decision !== "BLOCK" && evt.eventType !== "PAYMENT_BLOCKED") return false;

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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
            <User className="w-2.5 h-2.5" /> USER
          </span>
        );
      case "AI_AGENT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
            <Bot className="w-2.5 h-2.5" /> AGENT
          </span>
        );
      case "INTENT_ENGINE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-700 text-[10px] font-bold">
            <Shield className="w-2.5 h-2.5" /> ENGINE
          </span>
        );
      case "PAYMENT_GATEWAY":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
            <CreditCard className="w-2.5 h-2.5" /> GATEWAY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold">
            SYSTEM
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Forensic Audit Trail
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Audit Ledger
          </h1>
          <p className="text-xs md:text-sm text-slate-600 mt-1">
            Immutable chronological record of IntentLedger decisions, approvals, and settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/replay"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-surface-border text-slate-700 text-xs font-semibold transition-all shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            <span>Forensic Replay</span>
          </Link>
          <button
            onClick={fetchLedger}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-surface-border text-slate-600 hover:text-slate-900 transition-all shadow-2xs"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Immutability Invariant Card */}
      <div className="fintech-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block">Append-Only Immutability Contract</span>
            <span className="text-slate-600 text-[11px]">
              Ledger records cannot be edited or deleted. External mutation requests (POST/PUT/DELETE) return HTTP 405 Method Not Allowed.
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2.5 py-1 rounded border border-purple-200 shrink-0 font-bold">
          PROTECTED
        </span>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "ALL", label: "All Events" },
            { id: "INTENTS", label: "Intents" },
            { id: "DECISIONS", label: "Decisions" },
            { id: "DRIFT", label: "Drift" },
            { id: "APPROVALS", label: "Approvals" },
            { id: "PAYMENTS", label: "Payments" },
            { id: "BLOCKED", label: "Blocked" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === f.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-surface-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search event type, ID, actor..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-surface-border text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans shadow-2xs"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="fintech-card overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-xs animate-pulse">
            Loading immutable ledger records...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-xs">
            No ledger events match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-slate-500 uppercase text-[10px] tracking-wider bg-slate-50">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Intent ID</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4 text-right">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap uppercase text-[11px]">
                      {evt.eventType.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActorBadge(evt.actor)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 font-semibold">
                      {evt.intentId}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-md truncate">
                      {evt.summary}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {evt.decision ? (
                        <DecisionBadge decision={evt.decision} size="sm" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event Detail Modal / Slide-over */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="fintech-card w-full max-w-2xl max-h-[85vh] flex flex-col justify-between overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Audit Event Record
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-surface-50 border border-surface-border">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Event ID</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedEvent.id}</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-50 border border-surface-border">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Timestamp</span>
                  <span className="font-mono text-slate-800">{new Date(selectedEvent.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Event Summary</span>
                <p className="text-slate-800 font-medium">{selectedEvent.summary}</p>
              </div>

              <div className="p-3 rounded-lg bg-surface-50 border border-surface-border space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Metadata Payload</span>
                <pre className="p-3 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                  {JSON.stringify(selectedEvent.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-surface-border bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-surface-border text-slate-700 text-xs font-semibold shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
