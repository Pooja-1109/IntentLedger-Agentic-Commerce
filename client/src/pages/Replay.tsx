import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Bot,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { DecisionBadge } from "../components/StatusBadge";
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

  useEffect(() => {
    const loadIntents = async () => {
      setLoading(true);
      try {
        const data = await apiService.getIntents();
        setIntents(data);
        if (data.length > 0) {
          setSelectedIntentId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load intents:", err);
      } finally {
        setLoading(false);
      }
    };

    loadIntents();
  }, []);

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
  const selectedIntent = intents.find((i) => i.id === selectedIntentId);

  // Player Navigation
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
    if (type.startsWith("INTENT_")) return <Sparkles className="w-4 h-4 text-indigo-400" />;
    if (type.startsWith("AGENT_")) return <Bot className="w-4 h-4 text-purple-400" />;
    if (type === "INTENT_DRIFT_DETECTED") return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    if (type.startsWith("APPROVAL_")) return <CheckCircle2 className="w-4 h-4 text-amber-400" />;
    if (type.startsWith("PAYMENT_")) return <CreditCard className="w-4 h-4 text-emerald-400" />;
    return <ShieldCheck className="w-4 h-4 text-cyan-400" />;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-semibold uppercase tracking-wider mb-2">
            Forensic Time-Travel Reconstruction
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Intent Replay Player</h1>
          <p className="text-sm text-slate-400 mt-1">
            Step through the entire lifecycle from raw intent to policy evaluation, drift detection, human approval, and simulated settlement.
          </p>
        </div>

        {/* Intent Selector */}
        {intents.length > 0 && (
          <div className="w-full md:w-80">
            <select
              value={selectedIntentId}
              onChange={(e) => setSelectedIntentId(e.target.value)}
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
          Loading replay timeline...
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl bg-surface-100 border border-surface-border p-12 text-center text-slate-400 text-xs">
          No ledger events found for this intent. Run an action in Simulation Lab to build replay history.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Replay Stage Screen */}
          <div className="rounded-2xl bg-surface-100 border border-surface-border p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            {/* Stage Counter & Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-primary-light uppercase tracking-wider">
                  Lifecycle Stage {currentStepIndex + 1} of {events.length}
                </span>
                <span className="text-slate-400 font-mono">
                  {currentEvent && new Date(currentEvent.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>

              {/* Visual Scrubber Track */}
              <div className="w-full bg-surface-200 rounded-full h-2 overflow-hidden border border-surface-border">
                <div
                  className="h-full bg-gradient-to-r from-primary via-indigo-500 to-accent-violet transition-all duration-300"
                  style={{ width: `${((currentStepIndex + 1) / events.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Stage Card */}
            {currentEvent && (
              <div className="p-6 rounded-2xl bg-surface-200/90 border border-surface-border space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-100 border border-surface-border flex items-center justify-center shadow-glow">
                      {getStageIcon(currentEvent.eventType)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider block">
                        Actor: {currentEvent.actor}
                      </span>
                      <h2 className="text-lg font-extrabold text-white">
                        {currentEvent.eventType.replace(/_/g, " ")}
                      </h2>
                    </div>
                  </div>

                  {currentEvent.decision && (
                    <DecisionBadge decision={currentEvent.decision} size="md" />
                  )}
                </div>

                {/* What Happened & Forensic Summary */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Event Analysis & Context
                  </span>
                  <p className="text-sm text-slate-200 font-medium leading-relaxed p-4 rounded-xl bg-surface-100 border border-surface-border">
                    {currentEvent.summary}
                  </p>
                  {currentEvent.details && (
                    <p className="text-xs text-slate-300 italic px-2">
                      "{currentEvent.details}"
                    </p>
                  )}
                </div>

                {/* Evidence Payload */}
                {currentEvent.metadata && (
                  <div className="p-4 rounded-xl bg-surface-100 border border-surface-border space-y-2">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Forensic Evidence Metadata:
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-300">
                      {Object.entries(currentEvent.metadata).map(([key, val]) => (
                        <div key={key} className="p-2 rounded bg-surface-200 border border-surface-border">
                          <span className="text-[10px] text-slate-400 block capitalize">{key}:</span>
                          <strong className="text-white truncate block">
                            {typeof val === "object" ? JSON.stringify(val) : String(val)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Video-style Player Control Console */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-border">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFirst}
                  disabled={currentStepIndex === 0}
                  className="p-2.5 rounded-xl bg-surface-200 hover:bg-surface-50 border border-surface-border text-slate-300 disabled:opacity-30 transition-all"
                  title="First Stage"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className="p-2.5 rounded-xl bg-surface-200 hover:bg-surface-50 border border-surface-border text-slate-300 disabled:opacity-30 transition-all"
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-glow ${
                    isPlaying
                      ? "bg-amber-600 hover:bg-amber-500 text-white shadow-glow-amber"
                      : "bg-primary hover:bg-primary-hover text-white"
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause Replay</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Play Lifecycle</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentStepIndex === events.length - 1}
                  className="p-2.5 rounded-xl bg-surface-200 hover:bg-surface-50 border border-surface-border text-slate-300 disabled:opacity-30 transition-all"
                  title="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleLast}
                  disabled={currentStepIndex === events.length - 1}
                  className="p-2.5 rounded-xl bg-surface-200 hover:bg-surface-50 border border-surface-border text-slate-300 disabled:opacity-30 transition-all"
                  title="Last Stage"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-400 font-medium">
                Intent: <strong className="text-slate-200">{selectedIntent?.rawText.substring(0, 40)}...</strong>
              </div>
            </div>
          </div>

          {/* Horizontal Mini-Stepper Bar */}
          <div className="rounded-2xl bg-surface-100 border border-surface-border p-4 shadow-lg overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max">
              {events.map((evt, idx) => (
                <button
                  key={evt.id}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStepIndex(idx);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    idx === currentStepIndex
                      ? "bg-primary text-white shadow-glow scale-105"
                      : idx < currentStepIndex
                      ? "bg-surface-200 text-slate-300 border border-surface-border"
                      : "bg-surface-200/50 text-slate-500 border border-surface-border/50"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-surface-100 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{evt.eventType.replace(/_/g, " ")}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
