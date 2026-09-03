import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Bot,
  CheckCircle2,
  Shield,
  Layers,
  RotateCcw,
} from "lucide-react";
import { apiService, CompiledIntentResponse } from "../services/api";
import { Intent } from "../types";

export const IntentStudio: React.FC = () => {
  const [rawText, setRawText] = useState<string>("");
  const [compiling, setCompiling] = useState<boolean>(false);
  const [createdIntent, setCreatedIntent] = useState<Intent | null>(null);
  const [compiledInfo, setCompiledInfo] = useState<CompiledIntentResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Active intents list
  const [intentsList, setIntentsList] = useState<Intent[]>([]);

  // Preset sample prompts
  const samplePrompts = [
    {
      title: "Cord Set Kurti",
      text: "I want to buy a cord set kurti for ₹1,500. Ask me before purchasing.",
    },
    {
      title: "Notebook Set (6 Pack)",
      text: "I want to buy a set of 6 notebooks for around ₹500 to ₹600 from an approved store. Ask me before purchasing.",
    },
    {
      title: "Office Monitor",
      text: "Allow my procurement agent to buy a monitor up to ₹25,000 from an approved vendor. Ask me before purchasing.",
    },
    {
      title: "Engineering Laptop",
      text: "Allow the procurement agent to buy an engineering laptop from an approved vendor under ₹40,000, with human approval required.",
    },
    {
      title: "Office Supplies",
      text: "Allow my shopping agent to buy office supplies up to ₹5,000 from approved stores. Ask me before purchasing.",
    },
  ];

  const fetchIntents = async () => {
    try {
      const data = await apiService.getIntents();
      setIntentsList(data);
    } catch (err) {
      console.error("Failed to load intents:", err);
    }
  };

  useEffect(() => {
    fetchIntents();
  }, []);

  // Primary Action: Compile and Activate Intent in One Step
  const handleCompileAndActivate = async (textToCompile = rawText) => {
    if (!textToCompile.trim()) return;
    setCompiling(true);
    setErrorMsg(null);
    setResetSuccess(null);

    try {
      // Step 1: Compile natural language into structured constraints
      const compiledResult = await apiService.compileIntent(textToCompile);
      setCompiledInfo(compiledResult);

      const targetMax = compiledResult.constraints.maxAmount || 5000;

      // Step 2: Automatically persist and activate this intent policy
      const created = await apiService.createIntent({
        rawText: textToCompile,
        category: compiledResult.category,
        constraints: {
          ...compiledResult.constraints,
          maxAmount: targetMax,
          quantity: compiledResult.constraints.quantity || 1,
          requiresApproval: compiledResult.constraints.requiresApproval,
        },
        permissions: compiledResult.permissions,
      });

      setCreatedIntent(created);
      // Store as canonical active intent
      localStorage.setItem("activeIntentId", created.id);
      fetchIntents();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Compilation and activation failed");
    } finally {
      setCompiling(false);
    }
  };

  // Safe Demo Reset
  const handleResetDemo = async () => {
    try {
      await apiService.resetDemo();
      setCreatedIntent(null);
      setCompiledInfo(null);
      setRawText("");
      setResetSuccess("Demo environment cleanly reset. Ready for a fresh authorization test.");
      localStorage.removeItem("activeIntentId");
      fetchIntents();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Reset failed");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Deterministic Intent Compiler
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Define Your AI Agent's Authority
          </h1>
          <p className="text-sm text-slate-600 mt-0.5 font-normal">
            Tell IntentLedger what your AI agent is allowed to purchase. We'll convert your instruction into enforceable policy.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-300 shadow-2xs self-start sm:self-auto"
          title="Safely clear test records and restore clean baseline state"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span>Reset Demo State</span>
        </button>
      </div>

      {resetSuccess && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span>{resetSuccess}</span>
          <button onClick={() => setResetSuccess(null)} className="text-blue-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Main Single Intent Definition Card */}
      <div className="fintech-card p-6 md:p-8 space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-900">
            Natural-Language Instruction
          </label>
          <textarea
            rows={3}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Type what you want your AI agent to be allowed to do… e.g. Allow my shopping agent to buy office supplies up to ₹5,000 from approved stores. Ask me before purchasing."
            className="w-full rounded-xl bg-white border-2 border-slate-300 focus:border-blue-600 p-4 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-sans leading-relaxed shadow-xs"
          />
        </div>

        {/* Quick Sample Suggestions */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">
            Or try a sample request:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setRawText(p.text);
                  handleCompileAndActivate(p.text);
                }}
                className="text-left p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-xs transition-all group shadow-2xs"
              >
                <div className="font-extrabold text-blue-700 group-hover:text-blue-900">
                  {p.title}
                </div>
                <div className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 font-medium leading-relaxed">
                  "{p.text}"
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Compile Action */}
        <div className="pt-2">
          <button
            onClick={() => handleCompileAndActivate()}
            disabled={compiling || !rawText.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-sm active:scale-95"
          >
            <Sparkles className={`w-4 h-4 ${compiling ? "animate-spin" : ""}`} />
            <span>{compiling ? "Compiling Policy..." : "Compile Intent"}</span>
          </button>
        </div>

        {/* Compiled Intent Result & Direct Next Action */}
        {createdIntent && (
          <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/60 border-2 border-emerald-300 space-y-5 shadow-xs animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-extrabold text-emerald-950 block">
                    Intent Compiled ✓
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    This is what IntentLedger understood from your request.
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold uppercase self-start sm:self-auto">
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                <span>Intent Active</span>
              </span>
            </div>

            {/* Extracted Policy Visual Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Category</span>
                <span className="font-extrabold text-blue-700 block mt-0.5 uppercase text-xs">
                  {createdIntent.category}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Product</span>
                <span className="font-extrabold text-slate-900 block mt-0.5 truncate text-xs" title={compiledInfo?.interpretation?.productName || createdIntent.constraints.productCategory || "Requested Item"}>
                  {compiledInfo?.interpretation?.productName || createdIntent.constraints.productCategory || "Requested Item"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Quantity</span>
                <span className="font-extrabold text-slate-900 block mt-0.5 tabular-nums text-xs">
                  {createdIntent.constraints.quantity || 1} units
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Spending Boundary</span>
                <span className="font-extrabold text-slate-900 tabular-nums block mt-0.5 text-xs">
                  {compiledInfo?.interpretation?.budget || `Max ₹${createdIntent.constraints.maxAmount?.toLocaleString()}`}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Merchant</span>
                <span className="font-bold text-slate-800 block mt-0.5 text-xs truncate" title={createdIntent.constraints.allowedMerchants?.join(", ") || "Approved Store"}>
                  {createdIntent.constraints.allowedMerchants?.[0] || "Approved Store"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Purchase</span>
                <span className="font-extrabold text-emerald-800 block mt-0.5 text-xs">
                  {createdIntent.permissions.canPurchase ? "Allowed" : "Not Authorized"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Human Approval</span>
                <span
                  className={`font-extrabold block mt-0.5 text-xs ${
                    createdIntent.constraints.requiresApproval ? "text-amber-800" : "text-emerald-800"
                  }`}
                >
                  {createdIntent.constraints.requiresApproval ? "Required" : "Auto-Allow"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Recurring Billing</span>
                <span
                  className={`font-extrabold block mt-0.5 text-xs ${
                    createdIntent.permissions.canSubscribe ? "text-emerald-800" : "text-rose-700"
                  }`}
                >
                  {createdIntent.permissions.canSubscribe ? "Authorized" : "Not Authorized"}
                </span>
              </div>
            </div>

            {/* Original prompt display */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 italic font-medium">
              "{createdIntent.rawText}"
            </div>

            {/* Primary Workflow CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600 font-medium">
                Authorization policy is live in the governance registry (ID: <span className="font-mono font-bold text-slate-800">{createdIntent.id}</span>).
              </div>
              <Link
                to="/simulation"
                state={{ intentId: createdIntent.id, intent: createdIntent }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-sm active:scale-95 shrink-0"
              >
                <Bot className="w-4 h-4" />
                <span>Simulate Agent →</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Registry Summary */}
      {intentsList.length > 0 && (
        <div className="fintech-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Active Intent Registry ({intentsList.length})
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700 uppercase text-[10px] tracking-wider bg-slate-50 font-extrabold">
                  <th className="py-2 px-3">Intent ID</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">User Authorization Instruction</th>
                  <th className="py-2 px-3">Budget Cap</th>
                  <th className="py-2 px-3">Approval</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {intentsList.map((intent) => (
                  <tr key={intent.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-xs text-blue-700 font-bold">
                      {intent.id}
                    </td>
                    <td className="py-2.5 px-3 font-extrabold text-slate-900 uppercase text-xs">
                      {intent.category}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium italic max-w-xs truncate">
                      "{intent.rawText}"
                    </td>
                    <td className="py-2.5 px-3 font-extrabold text-slate-900 tabular-nums text-xs">
                      ₹{intent.constraints.maxAmount?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          intent.constraints.requiresApproval
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        }`}
                      >
                        {intent.constraints.requiresApproval ? "REQUIRED" : "AUTO-ALLOW"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to="/simulation"
                        state={{ intentId: intent.id, intent }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition-all text-xs"
                      >
                        <span>Simulate</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
