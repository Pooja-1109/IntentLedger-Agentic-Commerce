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
  ExternalLink,
  Lock,
} from "lucide-react";

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  badgeType?: "new" | "pending" | "ready" | "demo" | "security";
}

export const Sidebar: React.FC = () => {
  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Live Demo Mode",
      path: "/demo",
      icon: Zap,
      badge: "Judge",
      badgeType: "demo",
    },
    {
      name: "Intent Studio",
      path: "/studio",
      icon: Sparkles,
      badge: "Core",
      badgeType: "ready",
    },
    {
      name: "Agent Simulation",
      path: "/simulation",
      icon: Bot,
      badge: "Lab",
      badgeType: "new",
    },
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
    {
      name: "Audit Ledger",
      path: "/ledger",
      icon: History,
    },
    {
      name: "Intent Replay",
      path: "/replay",
      icon: RotateCcw,
    },
    {
      name: "Security Center",
      path: "/security",
      icon: Lock,
      badge: "Defense",
      badgeType: "security",
    },
  ];

  return (
    <aside className="w-64 bg-surface-200 border-r border-surface-border flex flex-col justify-between h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-surface-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent-violet flex items-center justify-center text-white shadow-glow">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">IntentLedger</span>
              <span className="text-[10px] uppercase font-bold bg-primary/20 text-primary-light px-1.5 py-0.5 rounded">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Accountability for AI</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Control Plane
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-primary text-white shadow-glow"
                      : "text-slate-400 hover:text-slate-100 hover:bg-surface-100"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      item.badgeType === "demo"
                        ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                        : item.badgeType === "ready"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                        : item.badgeType === "security"
                        ? "bg-rose-950 text-rose-300 border border-rose-500/30"
                        : "bg-indigo-950 text-indigo-300 border border-indigo-500/30"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Footer / Buildathon info */}
      <div className="p-4 border-t border-surface-border bg-surface-300/40">
        <div className="rounded-xl p-3 bg-surface-100 border border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300">Razorpay Buildathon</span>
            <span className="text-[9px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
              Open Track
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Autonomous Agent Intent Safety Layer</p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-light hover:text-white mt-2 transition-colors"
          >
            <span>Documentation</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </aside>
  );
};
