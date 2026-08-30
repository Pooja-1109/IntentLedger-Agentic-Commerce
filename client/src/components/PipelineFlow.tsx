import React from "react";
import { MessageSquare, Bot, ShieldCheck, GitCommit, CreditCard, Layers } from "lucide-react";

interface PipelineStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badgeText: string;
  badgeColor: string;
  description: string;
}

export const PipelineFlow: React.FC = () => {
  const steps: PipelineStep[] = [
    {
      id: "intent",
      title: "1. User Intent",
      subtitle: "Natural Language",
      icon: MessageSquare,
      badgeText: "Boundary Set",
      badgeColor: "bg-indigo-950/80 text-indigo-300 border-indigo-500/30",
      description: "User defines budget, allowed merchants, category, and approval mandates.",
    },
    {
      id: "agent",
      title: "2. Agent Action",
      subtitle: "Autonomous Proposal",
      icon: Bot,
      badgeText: "Candidate Action",
      badgeColor: "bg-purple-950/80 text-purple-300 border-purple-500/30",
      description: "AI shopping agent finds an item and proposes an exact price & merchant.",
    },
    {
      id: "engine",
      title: "3. Intent Check",
      subtitle: "Policy Engine",
      icon: ShieldCheck,
      badgeText: "Deterministic",
      badgeColor: "bg-cyan-950/80 text-cyan-300 border-cyan-500/30",
      description: "Compares proposed price, merchant, quantity, and subscription flag.",
    },
    {
      id: "decision",
      title: "4. Decision & Drift",
      subtitle: "ALLOW / APPROVAL / BLOCK",
      icon: GitCommit,
      badgeText: "Drift Diagnostic",
      badgeColor: "bg-amber-950/80 text-amber-300 border-amber-500/30",
      description: "Detects budget or merchant drift; blocks unauthorized actions automatically.",
    },
    {
      id: "payment",
      title: "5. Payment Gate",
      subtitle: "Simulated Execution",
      icon: CreditCard,
      badgeText: "Zero Real Risk",
      badgeColor: "bg-emerald-950/80 text-emerald-300 border-emerald-500/30",
      description: "Payment only unlocks if policy ALLOWs or explicit user approval is granted.",
    },
    {
      id: "ledger",
      title: "6. Audit Ledger",
      subtitle: "Immutable Timeline",
      icon: Layers,
      badgeText: "Auditable",
      badgeColor: "bg-blue-950/80 text-blue-300 border-blue-500/30",
      description: "Every proposal, check, decision, and payment is permanently timestamped.",
    },
  ];

  return (
    <div className="rounded-2xl bg-surface-100 border border-surface-border p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-semibold uppercase tracking-wider mb-2">
            Architectural Blueprint
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            How IntentLedger Protects Autonomous Commerce
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Deterministic safety gate operating between AI Agent actions and Financial Execution
          </p>
        </div>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 relative z-10">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className="group relative rounded-xl bg-surface-200/90 border border-surface-border p-4 transition-all duration-200 hover:border-primary/50 hover:bg-surface-50/50 hover:shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-100 border border-surface-border flex items-center justify-center text-primary-light group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${step.badgeColor}`}>
                    {step.badgeText}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                  {step.title}
                </h3>
                <div className="text-xs font-medium text-indigo-400 mt-0.5">
                  {step.subtitle}
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-slate-600 text-xs">
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
