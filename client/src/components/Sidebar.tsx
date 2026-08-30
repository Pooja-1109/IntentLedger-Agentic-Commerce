import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Zap,
  Sparkles,
  Bot,
  ShieldCheck,
  CheckSquare,
  CreditCard,
  History,
  RotateCcw,
  Shield,
  Lock,
  X,
} from "lucide-react";
import { HealthCheckData } from "../services/api";

interface SidebarProps {
  health?: HealthCheckData | null;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavSection {
  title: string;
  items: {
    name: string;
    path: string;
    icon: React.ElementType;
    badge?: string;
    badgeVariant?: "blue" | "amber" | "emerald" | "rose" | "indigo";
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ health, isOpen = true, onClose }) => {
  const sections: NavSection[] = [
    {
      title: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          path: "/",
          icon: LayoutDashboard,
        },
        {
          name: "Judge Demo",
          path: "/demo",
          icon: Zap,
          badge: "Live Tour",
          badgeVariant: "amber",
        },
        {
          name: "Intent Studio",
          path: "/studio",
          icon: Sparkles,
        },
        {
          name: "Agent Simulation",
          path: "/simulation",
          icon: Bot,
        },
      ],
    },
    {
      title: "GOVERNANCE",
      items: [
        {
          name: "Decision Center",
          path: "/decisions",
          icon: ShieldCheck,
        },
        {
          name: "Approval Center",
          path: "/approvals",
          icon: CheckSquare,
        },
        {
          name: "Payment Gate",
          path: "/payment",
          icon: CreditCard,
        },
      ],
    },
    {
      title: "AUDIT & SECURITY",
      items: [
        {
          name: "Audit Ledger",
          path: "/ledger",
          icon: History,
        },
        {
          name: "Forensic Replay",
          path: "/replay",
          icon: RotateCcw,
        },
        {
          name: "Security Center",
          path: "/security",
          icon: Lock,
          badge: "Defense",
          badgeVariant: "rose",
        },
      ],
    },
  ];

  const isHealthy = health?.status === "healthy";

  return (
    <aside
      className={`fixed lg:sticky top-0 z-40 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out text-slate-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">IntentLedger</span>
                <span className="text-[9px] uppercase font-mono font-bold bg-slate-800 text-slate-300 px-1 py-0.2 rounded border border-slate-700">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">AI Commerce Governance</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="px-3 py-4 space-y-6 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {sections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {sec.title}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose && onClose()}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase ${
                          item.badgeVariant === "amber"
                            ? "bg-amber-950/80 text-amber-300 border border-amber-500/30"
                            : item.badgeVariant === "rose"
                            ? "bg-rose-950/80 text-rose-300 border border-rose-500/30"
                            : "bg-blue-950/80 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Status</span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isHealthy ? "Operational" : "Engine Ready"}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between font-mono">
            <span>Storage:</span>
            <span className="text-slate-200 font-semibold">
              {health?.database.type === "mongodb" ? "MongoDB Atlas" : "In-Memory"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-medium">
          <span>Razorpay Buildathon</span>
          <span className="text-blue-400 font-semibold">Open Track</span>
        </div>
      </div>
    </aside>
  );
};
