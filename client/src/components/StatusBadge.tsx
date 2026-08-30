import React from "react";
import { CheckCircle2, ShieldAlert, Clock } from "lucide-react";
import { DecisionType } from "../types";

interface DecisionBadgeProps {
  decision: DecisionType;
  size?: "sm" | "md" | "lg";
}

export const DecisionBadge: React.FC<DecisionBadgeProps> = ({ decision, size = "md" }) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2 font-bold",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  switch (decision) {
    case "ALLOW":
      return (
        <span
          className={`inline-flex items-center rounded-md font-bold tracking-wide uppercase status-pill-emerald ${sizeClasses[size]}`}
        >
          <CheckCircle2 className={iconSizes[size]} />
          <span>ALLOWED</span>
        </span>
      );
    case "ASK_APPROVAL":
      return (
        <span
          className={`inline-flex items-center rounded-md font-bold tracking-wide uppercase status-pill-amber ${sizeClasses[size]}`}
        >
          <Clock className={iconSizes[size]} />
          <span>REVIEW MANDATE</span>
        </span>
      );
    case "BLOCK":
      return (
        <span
          className={`inline-flex items-center rounded-md font-bold tracking-wide uppercase status-pill-rose ${sizeClasses[size]}`}
        >
          <ShieldAlert className={iconSizes[size]} />
          <span>BLOCKED</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center rounded-md font-bold tracking-wide uppercase status-pill-slate ${sizeClasses[size]}`}
        >
          <span>{decision}</span>
        </span>
      );
  }
};

interface StatusPillProps {
  status: string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, className = "" }) => {
  const s = status.toUpperCase();

  if (s === "ACTIVE" || s === "COMPLETED" || s === "APPROVED" || s === "SETTLED" || s === "VERIFIED" || s === "OPERATIONAL") {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase status-pill-emerald ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {status}
      </span>
    );
  }

  if (s === "PENDING" || s === "AUTHORIZED" || s === "REVIEW" || s === "TEST MODE" || s === "FALLBACK" || s === "IN-MEMORY") {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase status-pill-amber ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {status}
      </span>
    );
  }

  if (s === "BLOCKED" || s === "REJECTED" || s === "FAILED" || s === "VIOLATION" || s === "MISMATCH" || s === "DISCONNECTED") {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase status-pill-rose ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        {status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium uppercase status-pill-slate ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      {status}
    </span>
  );
};
