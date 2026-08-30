import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Cpu, RefreshCw, Menu } from "lucide-react";
import { HealthCheckData } from "../services/api";

interface NavbarProps {
  health: HealthCheckData | null;
  loadingHealth: boolean;
  onRefreshHealth: () => void;
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  loadingHealth,
  onRefreshHealth,
  onOpenMobileMenu,
}) => {
  const location = useLocation();
  const isHealthy = health?.status === "healthy";

  const getBreadcrumb = () => {
    switch (location.pathname) {
      case "/":
        return { section: "Overview", title: "Dashboard" };
      case "/demo":
        return { section: "Overview", title: "Judge Demo" };
      case "/studio":
        return { section: "Overview", title: "Intent Studio" };
      case "/simulation":
        return { section: "Overview", title: "Agent Simulation" };
      case "/decisions":
        return { section: "Governance", title: "Decision Center" };
      case "/approvals":
        return { section: "Governance", title: "Approval Center" };
      case "/payment":
        return { section: "Governance", title: "Payment Gate" };
      case "/ledger":
        return { section: "Audit & Security", title: "Audit Ledger" };
      case "/replay":
        return { section: "Audit & Security", title: "Forensic Replay" };
      case "/security":
        return { section: "Audit & Security", title: "Security Center" };
      default:
        return { section: "Platform", title: "Commerce Governance" };
    }
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between shadow-2xs">
      {/* Left Breadcrumb & Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold hidden sm:inline">{breadcrumb.section}</span>
          <span className="text-slate-400 hidden sm:inline">/</span>
          <span className="text-slate-900 font-extrabold text-sm">{breadcrumb.title}</span>
        </div>
      </div>

      {/* Right Telemetry Controls */}
      <div className="flex items-center gap-2.5">
        {/* Live Engine Status Pill */}
        <button
          onClick={onRefreshHealth}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 hover:border-slate-400 transition-all text-xs shadow-2xs"
          title="Click to re-verify backend connectivity"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isHealthy ? "animate-ping bg-emerald-400" : "bg-rose-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isHealthy ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
          </span>

          <span className="font-extrabold text-slate-900 text-xs hidden sm:inline">
            {isHealthy ? "Engine Active" : "Engine Offline"}
          </span>

          <RefreshCw
            className={`w-3.5 h-3.5 text-slate-500 hover:text-slate-900 ${
              loadingHealth ? "animate-spin text-blue-600" : ""
            }`}
          />
        </button>

        {/* Database Persistence Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-xs font-mono shadow-2xs">
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-900 font-extrabold text-xs">
            {health?.database.type === "mongodb" ? "MongoDB Atlas" : "In-Memory"}
          </span>
        </div>

        {/* Quick Action */}
        <Link
          to="/studio"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">+ Create Intent</span>
        </Link>
      </div>
    </header>
  );
};
