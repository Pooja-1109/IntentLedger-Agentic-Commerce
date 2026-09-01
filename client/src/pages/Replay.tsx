import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Bot,
  CreditCard,
  Sparkles,
  History,
  Lock,
} from "lucide-react";
import { apiService } from "../services/api";
import { Intent, LedgerEvent } from "../types";

export const IntentReplayPage: React.FC = () => {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [selectedIntentId, setSelectedIntentId] = useState<string>("");
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEventsForIntent = useCallback(async (intentId: string) => {
    if (!intentId) return;
    setLoading(true);
    setIsPlaying(false);
    try {
      const data = await apiService.getLedgerByIntentId(intentId);
      setEvents(data);
      setCurrentStepIndex(data.length > 0 ? 0 : 0);
    } catch (err) {
      console.error("Failed to load ledger for replay:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadIntents = async () => {
      setLoading(true);
      try {
        const data = await apiService.getIntents();
        setIntents(data);
        if (data.length > 0) {
          const stored = localStorage.getItem("activeIntentId");
          const activeId = stored && data.some((d) => d.id === stored) ? stored : data[0].id;
          setSelectedIntentId(activeId);
          fetchEventsForIntent(activeId);
        }
      } catch (err) {
        console.error("Failed to load intents:", err);
      } finally {
        setLoading(false);
      }
    };

    loadIntents();
  }, [fetchEventsForIntent]);

  useEffect(() => {
    if (selectedIntentId) {
      fetchEventsForIntent(selectedIntentId);
    }
  }, [selectedIntentId, fetchEventsForIntent]);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < events.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 2500);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, events.length]);

  const currentEvent = events[currentStepIndex] || null;

  const handleFirst = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };
  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };
  const handleTogglePlay = () => {
    if (currentStepIndex === events.length - 1 && !isPlaying) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(!isPlaying);
  };
  const handleNext = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.min(events.length - 1, prev + 1));
  };
  const handleLast = () => {
    setIsPlaying(false);
    setCurrentStepIndex(events.length - 1);
  };

  const getStageIcon = (type: string) => {
    if (type.startsWith("INTENT_")) return <Sparkles className="w-4 h-4 text-blue-600" />;
    if (type.startsWith("AGENT_")) return <Bot className="w-4 h-4 text-indigo-600" />;
    if (type.startsWith("POLICY_") || type === "DECISION_MADE") return <ShieldCheck className="w-4 h-4 text-cyan-600" />;
    if (type.startsWith("APPROVAL_")) return <Lock className="w-4 h-4 text-amber-600" />;
    if (type.startsWith("PAYMENT_") || type.startsWith("RAZORPAY_")) return <CreditCard className="w-4 h-4 text-emerald-600" />;
    return <History className="w-4 h-4 text-purple-600" />;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
              Time-Travel Lifecycle Reconstruction
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Forensic Replay
          </h1>
          <p className="text-sm text-slate-600 mt-1 font-normal">
            Reconstruct the complete chronological lifecycle of an AI-driven transaction from immutable ledger records.
          </p>
        </div>

        {/* Intent Selector */}
        {intents.length > 0 && (
          <div className="w-full md:w-80">
            <select
              value={selectedIntentId}
              onChange={(e) => setSelectedIntentId(e.target.value)}
              className="w-full text-xs font-bold rounded-lg bg-white border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
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

      {/* Lifecycle Stage Summary Strip */}
      <div className="fintech-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Transaction Lifecycle Proof
          </span>
          <span className="text-xs font-mono text-slate-500 font-bold">
            {events.length} Historical Events
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
          {[
            { label: "1. Intent", done: events.some((e) => e.eventType.startsWith("INTENT_")) },
            { label: "2. Proposal", done: events.some((e) => e.eventType.startsWith("AGENT_")) },
            { label: "3. Decision", done: events.some((e) => e.eventType === "DECISION_MADE") },
            { label: "4. Approval", done: events.some((e) => e.eventType.startsWith("APPROVAL_")) },
            { label: "5. Payment", done: events.some((e) => e.eventType.startsWith("PAYMENT_") || e.eventType.startsWith("RAZORPAY_")) },
            { label: "6. Ledger", done: events.length > 0 },
          ].map((stg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border text-xs font-bold ${
                stg.done
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              <span>{stg.label}</span>
              <span className="block text-[10px] mt-0.5 font-bold">
                {stg.done ? "✓ Recorded" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Replay Player UI */}
      {loading ? (
        <div className="py-24 text-center text-slate-500 text-xs animate-pulse font-medium">
          Loading replay timeline...
        </div>
      ) : events.length === 0 ? (
        <div className="fintech-card p-12 text-center text-slate-500 text-xs font-medium">
          No audit events found for this intent.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Player Controls Bar */}
          <div className="fintech-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleFirst}
                disabled={currentStepIndex === 0}
                className="p-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-30 text-slate-800 transition-all shadow-2xs"
                title="First Step"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="p-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-30 text-slate-800 transition-all shadow-2xs"
                title="Previous Step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? "Pause" : "Play Timeline"}</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentStepIndex === events.length - 1}
                className="p-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-30 text-slate-800 transition-all shadow-2xs"
                title="Next Step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleLast}
                disabled={currentStepIndex === events.length - 1}
                className="p-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-30 text-slate-800 transition-all shadow-2xs"
                title="Last Step"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-700 font-semibold">
                Step <span className="font-extrabold text-slate-900">{currentStepIndex + 1}</span> of{" "}
                <span className="font-extrabold text-slate-900">{events.length}</span>
              </span>

              <div className="w-36 bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${((currentStepIndex + 1) / events.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Current Step Event Inspector Card */}
          {currentEvent && (
            <div className="fintech-card p-6 md:p-8 space-y-6">
              {/* Event Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-lg bg-slate-100 border border-slate-200">
                    {getStageIcon(currentEvent.eventType)}
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase text-slate-500">
                      Step {currentStepIndex + 1} • {currentEvent.actor}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                      {currentEvent.eventType.replace(/_/g, " ")}
                    </h3>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Timestamp</span>
                  <span className="font-mono text-xs text-slate-900 tabular-nums font-bold">
                    {new Date(currentEvent.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
              </div>

              {/* Summary Statement */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Event Description:
                </span>
                <p className="text-base font-semibold text-slate-900">
                  {currentEvent.summary}
                </p>
              </div>

              {/* Event Metadata */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-700 block">
                  Immutable Event Payload:
                </span>
                <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed shadow-inner font-semibold">
                  {JSON.stringify(
                    {
                      id: currentEvent.id,
                      intentId: currentEvent.intentId,
                      actor: currentEvent.actor,
                      eventType: currentEvent.eventType,
                      decision: currentEvent.decision,
                      metadata: currentEvent.metadata,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}

          {/* Timeline Step Scrubber Ribbon */}
          <div className="fintech-card p-4 overflow-x-auto">
            <div className="flex items-center gap-2.5 min-w-max">
              {events.map((evt, idx) => (
                <button
                  key={evt.id}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStepIndex(idx);
                  }}
                  className={`p-3 rounded-lg border text-left text-xs transition-all ${
                    idx === currentStepIndex
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  <div className="font-mono text-[9px] opacity-80 font-bold">STEP {idx + 1}</div>
                  <div className="font-bold text-xs truncate max-w-[140px] mt-0.5">
                    {evt.eventType.replace(/_/g, " ")}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
