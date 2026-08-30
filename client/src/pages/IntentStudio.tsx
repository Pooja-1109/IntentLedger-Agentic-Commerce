import React, { useState, useEffect } from "react";
import {
  Sparkles,
  RefreshCw,
  Layers,
  Plus,
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
      title: "Work Laptop",
      text: "Buy a work laptop under ₹40,000 from an approved merchant and ask me before purchasing.",
    },
    {
      title: "Business Travel",
      text: "Book round-trip flight tickets under ₹12,000 automatically without asking.",
    },
    {
      title: "Software Subscription Guard",
      text: "Buy a one-time streaming pass under ₹500. Do not subscribe or authorize recurring payments.",
    },
    {
      title: "Office Equipment",
      text: "Order stationery and office supplies under ₹3,500 from verified suppliers only.",
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
      setSaveSuccess(`Intent policy created successfully (ID: ${created.id})`);
      fetchIntents();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to persist intent policy");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setRawText("");
    setCompiled(null);
    setErrorMsg(null);
    setSaveSuccess(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Policy Compiler
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Intent Studio
        </h1>
        <p className="text-sm text-slate-600 mt-1 font-normal">
          Define what an AI agent is authorized to purchase. Natural language is compiled into deterministic mathematical constraints.
        </p>
      </div>

      {/* Split-Layout Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Natural Language Input (7 cols) */}
        <div className="lg:col-span-7 fintech-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              1. Natural-Language Authorization Prompt
            </span>
            <span className="text-[11px] text-slate-500 font-mono font-semibold">User Expressed Intent</span>
          </div>

          <div>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. Buy a work laptop under ₹40,000 from an approved merchant and ask me first."
              className="w-full rounded-lg bg-white border-2 border-slate-300 focus:border-blue-600 p-4 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-sans leading-relaxed shadow-xs"
            />
          </div>

          {/* Quick Preset Chips */}
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-700 block mb-2">
              PRESET INTENT TEMPLATES:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setRawText(p.text);
                    handleCompile(p.text);
                  }}
                  className="text-left p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs transition-all group shadow-2xs"
                >
                  <div className="font-extrabold text-xs text-blue-700 group-hover:text-blue-900">
                    {p.title}
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-2 mt-1 font-medium leading-relaxed">
                    "{p.text}"
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
            <button
              onClick={() => handleCompile()}
              disabled={compiling || !rawText.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Sparkles className={`w-4 h-4 ${compiling ? "animate-spin" : ""}`} />
              <span>{compiling ? "Compiling Policy..." : "Compile Intent"}</span>
            </button>

            <button
              onClick={handleClear}
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-2xs"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Right Column: Structured Compiled Policy (5 cols) */}
        <div className="lg:col-span-5 fintech-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                2. Structured Policy Extraction
              </span>
              {compiled && (
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded tracking-wide uppercase ${
                    compiled.compiler === "gemini"
                      ? "bg-purple-100 text-purple-900 border border-purple-300"
                      : "bg-blue-100 text-blue-900 border border-blue-300"
                  }`}
                >
                  {compiled.compiler === "gemini" ? "AI COMPILED" : "RULE FALLBACK"}
                </span>
              )}
            </div>

            {compiling ? (
              <div className="py-16 text-center text-slate-500 text-xs animate-pulse font-medium">
                Extracting structured constraints...
              </div>
            ) : !compiled ? (
              <div className="py-16 text-center text-slate-500 text-xs font-medium">
                Enter an intent prompt and click "Compile Intent" to preview structured policy.
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                {/* Budget */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-700 font-bold">Budget Limit</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">₹</span>
                    <input
                      type="number"
                      value={customMaxAmount}
                      onChange={(e) => setCustomMaxAmount(Number(e.target.value))}
                      className="w-28 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-right font-extrabold text-base text-slate-900 focus:outline-none focus:border-blue-500 tabular-nums shadow-2xs"
                    />
                    <span className="text-xs text-slate-600 font-mono font-bold">INR</span>
                  </div>
                </div>

                {/* Category */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-700 font-bold">Category</span>
                  <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 tracking-wide uppercase">
                    {compiled.category}
                  </span>
                </div>

                {/* Approval Mandate */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-700 font-bold">Approval Mandated</span>
                  <button
                    type="button"
                    onClick={() => setCustomApproval(!customApproval)}
                    className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all shadow-2xs ${
                      customApproval
                        ? "bg-amber-100 border border-amber-300 text-amber-900"
                        : "bg-emerald-100 border border-emerald-300 text-emerald-900"
                    }`}
                  >
                    {customApproval ? "REQUIRED" : "AUTO-ALLOW"}
                  </button>
                </div>

                {/* Permissions */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-bold">Can Purchase:</span>
                    <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                      {compiled.permissions?.canPurchase !== false ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-bold">Can Subscribe:</span>
                    <span
                      className={`font-extrabold px-2.5 py-0.5 rounded text-[11px] ${
                        compiled.permissions?.canSubscribe
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {compiled.permissions?.canSubscribe ? "YES" : "NO (Blocked)"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Feedback & Create Intent Action */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold">
                {errorMsg}
              </div>
            )}
            {saveSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold">
                {saveSuccess}
              </div>
            )}

            <button
              onClick={handleSaveIntent}
              disabled={saving || !compiled}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? "Persisting Intent..." : "Create Intent Policy"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Intents Table */}
      <div className="fintech-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Active Intent Policies ({intentsList.length})
            </h3>
          </div>
          <button
            onClick={fetchIntents}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingIntents ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loadingIntents ? (
          <div className="py-8 text-center text-slate-500 text-xs animate-pulse font-medium">
            Loading active intent policies...
          </div>
        ) : intentsList.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs font-medium">
            No intent policies registered. Create your first intent above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700 uppercase text-[10px] tracking-wider bg-slate-100 font-extrabold">
                  <th className="py-3 px-4">Intent ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Raw Intent Prompt</th>
                  <th className="py-3 px-4">Budget Cap</th>
                  <th className="py-3 px-4">Approval Mandate</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {intentsList.map((intent) => (
                  <tr key={intent.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-blue-700 font-bold">
                      {intent.id}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 uppercase text-xs">
                      {intent.category}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium italic max-w-sm truncate">
                      "{intent.rawText}"
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 tabular-nums text-sm">
                      ₹{intent.constraints.maxAmount?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                          intent.constraints.requiresApproval
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        }`}
                      >
                        {intent.constraints.requiresApproval ? "MANDATED" : "AUTO-ALLOW"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusPill status={intent.status} />
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
