import React from "react";
import { CheckCircle2, AlertTriangle, ShieldAlert, Clock, Sparkles, Cpu } from "lucide-react";
import { DecisionType } from "../types";

interface DecisionBadgeProps {
  decision: DecisionType;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const DecisionBadge: React.FC<DecisionBadgeProps> = ({ decision, size = "md", showIcon = true }) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold",
    md: "px-2.5 py-1 text-xs font-bold tracking-wide",
    lg: "px-4 py-1.5 text-sm font-extrabold tracking-wider",
  };

  if (decision === "ALLOW") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 shadow-sm ${sizeClasses[size]}`}
      >
        {showIcon && <CheckCircle2 className={size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} />}
        ALLOW
      </span>
    );
  }

  if (decision === "ASK_APPROVAL") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-400 shadow-sm ${sizeClasses[size]}`}
      >
        {showIcon && <AlertTriangle className={size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} />}
        ASK APPROVAL
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-400 shadow-sm ${sizeClasses[size]}`}
    >
      {showIcon && <ShieldAlert className={size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} />}
      BLOCK
    </span>
  );
};

export const CompilerModeBadge: React.FC<{ mode?: "ai" | "deterministic_fallback" }> = ({ mode }) => {
  if (mode === "ai") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-medium">
        <Sparkles className="w-3 h-3 text-purple-400" />
        Gemini AI Powered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium">
      <Cpu className="w-3 h-3 text-indigo-400" />
      Deterministic Policy Engine
    </span>
  );
};

export const StatusPill: React.FC<{
  status: "active" | "completed" | "cancelled" | "expired" | "pending";
  label?: string;
}> = ({ status, label }) => {
  const styles: Record<string, string> = {
    active: "bg-emerald-950/60 border-emerald-500/30 text-emerald-300",
    completed: "bg-blue-950/60 border-blue-500/30 text-blue-300",
    cancelled: "bg-slate-900 border-slate-700 text-slate-400",
    expired: "bg-amber-950/60 border-amber-500/30 text-amber-300",
    pending: "bg-indigo-950/60 border-indigo-500/30 text-indigo-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium ${
        styles[status] || styles.active
      }`}
    >
      <Clock className="w-2.5 h-2.5 opacity-70" />
      {label || status.toUpperCase()}
    </span>
  );
};
