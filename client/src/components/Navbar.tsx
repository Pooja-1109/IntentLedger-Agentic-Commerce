import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Cpu, RefreshCw } from "lucide-react";
import { HealthCheckData } from "../services/api";

interface NavbarProps {
  health: HealthCheckData | null;
  loadingHealth: boolean;
  onRefreshHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ health, loadingHealth, onRefreshHealth }) => {
  const isHealthy = health?.status === "healthy";

  return (
    <header className="h-16 bg-surface-200/80 backdrop-blur-md border-b border-surface-border sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Title & Core message */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-200 font-semibold">Intent Accountability Gateway</span>
          <span>/</span>
          <span className="text-indigo-400 font-medium">Deterministic Safety Engine</span>
        </div>
      </div>

      {/* Right Controls & Health Status */}
      <div className="flex items-center gap-3">
        {/* Backend Live Status Pill */}
        <div
          onClick={onRefreshHealth}
          className="cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-100 border border-surface-border hover:border-surface-borderHover transition-all text-xs"
          title="Click to re-verify backend connectivity"
        >
          <div className="relative flex items-center justify-center">
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy ? "bg-emerald-400 shadow-glow-emerald" : "bg-rose-400 shadow-glow-rose"
              }`}
            />
            {isHealthy && (
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-200">
              {isHealthy ? "API Engine" : "Engine Offline"}
            </span>
            <span className="text-slate-400 text-[11px]">
              {loadingHealth ? "checking..." : isHealthy ? "Online :5000" : "Disconnected"}
            </span>
          </div>

          <RefreshCw
            className={`w-3 h-3 text-slate-400 group-hover:text-slate-200 transition-transform ${
              loadingHealth ? "animate-spin" : ""
            }`}
          />
        </div>

        {/* Storage / Database Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100/60 border border-surface-border text-xs text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium text-slate-400">Storage:</span>
          <span className="font-semibold text-slate-200">
            {health?.database.type === "mongodb" ? "MongoDB" : "In-Memory Active"}
          </span>
        </div>

        {/* Quick Action Button */}
        <Link
          to="/studio"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-glow transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Intent</span>
        </Link>
      </div>
    </header>
  );
};
