import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Tag,
  Layers,
  Info,
  Sliders,
  Cpu,
  Lock,
} from "lucide-react";
import { StatusPill } from "../components/StatusBadge";
import { apiService, CompiledIntentResponse } from "../services/api";
import { Intent } from "../types";

export const IntentStudio: React.FC = () => {
  const [rawText, setRawText] = useState<string>(
    "Buy me running shoes under ₹4,000 and ask me before purchasing."
  );
  const [compiled, setCompiled] = useState<CompiledIntentResponse | null>(null);
  const [compiling, setCompiling] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable constraint adjustments
  const [customMaxAmount, setCustomMaxAmount] = useState<number>(4000);
  const [customApproval, setCustomApproval] = useState<boolean>(true);

  // Active intents list
  const [intentsList, setIntentsList] = useState<Intent[]>([]);
  const [loadingIntents, setLoadingIntents] = useState<boolean>(true);

  // Preset sample prompts
  const samplePrompts = [
    {
      title: "Safe Purchase (Approval Required)",
      text: "Buy me running shoes under ₹4,000 and ask me before purchasing.",
    },
    {
      title: "Autonomous Office Supplies",
      text: "Buy office stationery under ₹1,000 automatically without asking.",
    },
    {
      title: "Subscription Guard",
      text: "Buy a one-time streaming pass under ₹500. Do not subscribe or authorize recurring payments.",
    },
    {
      title: "Electronics with Prohibition",
      text: "Find me a laptop below ₹55,000. I can buy it automatically, but don't purchase extended warranty.",
    },
  ];

  const fetchIntents = async () => {
    setLoadingIntents(true);
    try {
      const data = await apiService.getIntents();
      setIntentsList(data);
    } catch (err) {
      console.error("Failed to load intents:", err);
    } finally {
      setLoadingIntents(false);
    }
  };

  useEffect(() => {
    fetchIntents();
    handleCompile("Buy me running shoes under ₹4,000 and ask me before purchasing.");
  }, []);

  const handleCompile = async (textToCompile = rawText) => {
    if (!textToCompile.trim()) return;
    setCompiling(true);
    setErrorMsg(null);
    try {
      const result = await apiService.compileIntent(textToCompile);
      setCompiled(result);
      if (result.constraints.maxAmount) {
        setCustomMaxAmount(result.constraints.maxAmount);
      }
      setCustomApproval(result.constraints.requiresApproval);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Compilation failed");
    } finally {
      setCompiling(false);
    }
  };

  const handleSaveIntent = async () => {
    if (!rawText.trim() || !compiled) return;
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(null);
    try {
      const created = await apiService.createIntent({
        rawText,
        category: compiled.category,
        constraints: {
          ...compiled.constraints,
          maxAmount: Number(customMaxAmount),
          requiresApproval: customApproval,
        },
        permissions: compiled.permissions,
      });
      setSaveSuccess(`Intent ${created.id} registered and activated successfully!`);
      await fetchIntents();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to register intent");
    } finally {
      setSaving(false);
    }
  };

  const isGeminiActive = compiled?.compiler === "gemini";

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-semibold uppercase tracking-wider mb-2">
          Natural Language to Deterministic Policy
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Intent Studio</h1>
        <p className="text-sm text-slate-400 mt-1">
          Express your purchase mandate in plain English. IntentLedger compiles it into verifiable financial constraints and permission boundaries.
        </p>
      </div>

      {/* Preset Scenario Prompts */}
      <div className="rounded-xl bg-surface-100/60 border border-surface-border p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary-light" />
          <span>Quick Benchmark Scenarios:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setRawText(prompt.text);
                handleCompile(prompt.text);
              }}
              className="text-left p-3 rounded-lg bg-surface-200 border border-surface-border hover:border-primary/50 hover:bg-surface-50 transition-all group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-primary-light transition-colors">
                {prompt.title}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                "{prompt.text}"
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Editor: Natural Input on Left, Structured Compilation on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Natural Language Input */}
        <div className="lg:col-span-6 rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span>1. Natural Language Intent Input</span>
              </label>
              <span className="text-[11px] text-slate-400">Plain English description</span>
            </div>

            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g., Buy me running shoes under ₹4000. Ask me before purchasing."
              className="w-full rounded-xl bg-surface-200 border border-surface-border p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none font-sans leading-relaxed"
            />

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleCompile(rawText)}
                disabled={compiling || !rawText.trim()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-50 hover:bg-surface-50/80 border border-surface-border hover:border-primary/50 text-slate-100 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-primary-light ${compiling ? "animate-spin" : ""}`} />
                <span>{compiling ? "Compiling..." : "Re-compile Intent"}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveIntent}
                disabled={saving || !compiled}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-glow transition-all active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Register & Activate Intent"}</span>
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-surface-200/80 border border-surface-border text-xs text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Intent Boundary Guarantee</span>
            </div>
            <p>
              Once saved, AI agents can only execute payments that strictly satisfy all extracted constraints and permission flags.
            </p>
          </div>
        </div>

        {/* Right Column: Structured Intent Compiler Output & AI Transparency */}
        <div className="lg:col-span-6 rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200">
                2. Compiled Structured Intent Policy
              </h3>
            </div>

            {/* AI Compiler Status Pill */}
            {compiled && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-surface-200">
                <span className={`w-2 h-2 rounded-full ${isGeminiActive ? "bg-purple-400 animate-pulse" : "bg-cyan-400"}`} />
                <span className="text-slate-300 uppercase tracking-wider text-[10px]">
                  AI COMPILER: <strong className={isGeminiActive ? "text-purple-300" : "text-cyan-300"}>
                    {isGeminiActive ? "GEMINI" : "DETERMINISTIC FALLBACK"}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {compiled ? (
            <div className="space-y-4">
              {/* AI Transparency Box: "How IntentLedger interpreted this" */}
              <div className={`p-4 rounded-xl border space-y-2.5 ${isGeminiActive ? "bg-indigo-950/40 border-indigo-500/40" : "bg-surface-200 border-surface-border"}`}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 uppercase text-indigo-300">
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    <span>How IntentLedger Interpreted This</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-surface-100 px-2 py-0.5 rounded text-slate-300 border border-surface-border">
                    {isGeminiActive ? "Gemini Intent Extraction" : "Rule Engine Fallback"}
                  </span>
                </div>

                {!isGeminiActive && (
                  <div className="p-2 rounded bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 shrink-0" />
                    <span>Gemini unavailable. IntentLedger safely used its deterministic compiler.</span>
                  </div>
                )}

                {/* Structured Interpretation Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2 rounded bg-surface-100/90 border border-surface-border">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Category</span>
                    <strong className="text-white uppercase text-[11px]">
                      {compiled.constraints.productCategory || compiled.category}
                    </strong>
                  </div>

                  <div className="p-2 rounded bg-surface-100/90 border border-surface-border">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Budget Ceiling</span>
                    <strong className="text-emerald-400 text-[11px]">
                      {compiled.constraints.currency || "INR"} {compiled.constraints.maxAmount?.toLocaleString()}
                    </strong>
                  </div>

                  <div className="p-2 rounded bg-surface-100/90 border border-surface-border">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Approval Mandate</span>
                    <strong className="text-amber-300 text-[11px]">
                      {compiled.constraints.requiresApproval ? "Required" : "Auto-Authorize"}
                    </strong>
                  </div>

                  <div className="p-2 rounded bg-surface-100/90 border border-surface-border">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Purchase Permitted</span>
                    <strong className={compiled.permissions.canPurchase ? "text-emerald-400" : "text-rose-400"}>
                      {compiled.permissions.canPurchase ? "YES" : "NO"}
                    </strong>
                  </div>

                  <div className="p-2 rounded bg-surface-100/90 border border-surface-border">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Subscription Permitted</span>
                    <strong className={compiled.permissions.canSubscribe ? "text-emerald-400" : "text-rose-400"}>
                      {compiled.permissions.canSubscribe ? "YES" : "NO"}
                    </strong>
                  </div>

                  <div className="p-2 rounded bg-surface-100/90 border border-surface-border">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Quantity Limit</span>
                    <strong className="text-white text-[11px]">
                      Max {compiled.constraints.quantity || 1} unit(s)
                    </strong>
                  </div>
                </div>

                {compiled.interpretation?.prohibitions && (
                  <div className="p-2 rounded bg-rose-950/60 border border-rose-500/30 text-[11px] text-rose-300">
                    <strong>Explicit Prohibitions:</strong> {compiled.interpretation.prohibitions}
                  </div>
                )}

                {/* Important Advisory Disclaimer */}
                <div className="p-2 rounded bg-surface-100/60 border border-surface-border text-[11px] text-slate-400 italic flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span>
                    AI interpretation is advisory. The deterministic policy engine enforces the final boundary.
                  </span>
                </div>
              </div>

              {/* Editable Policy Adjustments */}
              <div className="p-3.5 rounded-xl bg-surface-200 border border-surface-border space-y-3">
                <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-cyan-400" />
                  <span>Manual Policy Fine-Tuning</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase mb-1">Max Budget (INR)</span>
                    <input
                      type="number"
                      value={customMaxAmount}
                      onChange={(e) => setCustomMaxAmount(Number(e.target.value))}
                      className="w-full rounded-lg bg-surface-100 border border-surface-border p-2 text-emerald-400 font-bold"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase mb-1">Approval Policy</span>
                    <select
                      value={customApproval ? "true" : "false"}
                      onChange={(e) => setCustomApproval(e.target.value === "true")}
                      className="w-full rounded-lg bg-surface-100 border border-surface-border p-2 text-slate-200 font-medium"
                    >
                      <option value="true">Mandatory Approval</option>
                      <option value="false">Auto-Authorize</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Type or select an intent on the left to compile structured policy.
            </div>
          )}
        </div>
      </div>

      {/* Active Intents Table / History */}
      <div className="rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Registered Intents in Active Memory ({intentsList.length})
            </h3>
          </div>
          <button
            onClick={fetchIntents}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loadingIntents ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loadingIntents ? (
          <div className="py-8 text-center text-slate-500 text-xs animate-pulse">
            Loading registered intents...
          </div>
        ) : intentsList.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No intents in memory.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase tracking-wider font-semibold border-b border-surface-border bg-surface-200/50">
                <tr>
                  <th className="py-3 px-4">Intent ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Natural Intent</th>
                  <th className="py-3 px-4">Max Budget</th>
                  <th className="py-3 px-4">Approval</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-slate-300">
                {intentsList.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-200/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-indigo-300 font-medium">
                      {item.id}
                    </td>
                    <td className="py-3 px-4 uppercase font-semibold text-slate-400">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-200">
                      "{item.rawText}"
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-400">
                      {item.constraints.currency || "INR"} {item.constraints.maxAmount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {item.constraints.requiresApproval ? (
                        <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                          MANDATORY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                          AUTO
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill status={item.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
