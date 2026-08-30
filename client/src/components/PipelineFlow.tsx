import React from "react";
import { Sparkles, Bot, ShieldCheck, CheckSquare, CreditCard, History } from "lucide-react";

export const PipelineFlow: React.FC = () => {
  const steps = [
    {
      num: "01",
      name: "User Intent",
      desc: "Natural-language policy boundaries",
      icon: Sparkles,
      color: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200",
    },
    {
      num: "02",
      name: "AI Compiler",
      desc: "Gemini / Rule policy extraction",
      icon: Bot,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 border-indigo-200",
    },
    {
      num: "03",
      name: "Policy Gate",
      desc: "Deterministic policy checks",
      icon: ShieldCheck,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 border-cyan-200",
    },
    {
      num: "04",
      name: "Human Approval",
      desc: "Cryptographic token binding",
      icon: CheckSquare,
      color: "text-amber-600",
      bgColor: "bg-amber-50 border-amber-200",
    },
    {
      num: "05",
      name: "Payment Gate",
      desc: "Razorpay Test / Simulated Rail",
      icon: CreditCard,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 border-emerald-200",
    },
    {
      num: "06",
      name: "Audit Ledger",
      desc: "Append-only immutable record",
      icon: History,
      color: "text-purple-600",
      bgColor: "bg-purple-50 border-purple-200",
    },
  ];

  return (
    <div className="fintech-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Governance Pipeline
          </span>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            • 6-Stage Intent Accountability Architecture
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-primary bg-primary-dim px-2 py-0.5 rounded border border-blue-200">
          Deterministic Flow
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="p-3.5 rounded-lg bg-surface-50 border border-surface-border hover:border-surface-borderHover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {step.num}
                  </span>
                  <div className={`p-1.5 rounded-md border ${step.bgColor}`}>
                    <Icon className={`w-3.5 h-3.5 ${step.color}`} />
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-900">{step.name}</div>
                <div className="text-[11px] text-slate-500 mt-1 leading-snug font-normal">
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
