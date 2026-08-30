import React from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  ShieldCheck,
  CheckSquare,
  CreditCard,
  History,
  RotateCcw,
  ArrowRight,
  Construction,
} from "lucide-react";

interface PlaceholderProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  milestoneTag?: string;
  features: string[];
  ctaLink?: string;
  ctaText?: string;
}

const PlaceholderPage: React.FC<PlaceholderProps> = ({
  title,
  subtitle,
  description,
  icon: Icon,
  milestoneTag = "Phase 2 Pipeline",
  features,
  ctaLink = "/studio",
  ctaText = "Go to Intent Studio",
}) => {
  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-semibold uppercase tracking-wider mb-2">
          {milestoneTag}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">{title}</h1>
        <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
      </div>

      <div className="rounded-2xl bg-surface-100 border border-surface-border p-8 shadow-xl space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-surface-200 border border-surface-border flex items-center justify-center text-primary-light shrink-0 shadow-glow">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Module Blueprint</h2>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-surface-200/80 border border-surface-border space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Upcoming Features in this Module:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <Construction className="w-4 h-4" />
            <span>Ready for Milestone 2: Agent Simulation & Decision Engine</span>
          </div>

          <Link
            to={ctaLink}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-glow transition-all"
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export const AgentSimulationPage: React.FC = () => (
  <PlaceholderPage
    title="AI Agent Simulation Lab"
    subtitle="Simulate autonomous shopping agents proposing actions against user-approved intents."
    description="Allows testing different agent behaviors: Safe proposals within budget, Budget drift exceeding maximums, Subscription violations, and Unauthorized merchants."
    icon={Bot}
    features={[
      "One-click scenario runner (Safe vs Drift vs Subscription)",
      "Real-time proposal generation & payload validation",
      "Direct bridge to the Intent Policy Decision Engine",
      "Interactive drift inspection cards",
    ]}
  />
);

export const DecisionCenterPage: React.FC = () => (
  <PlaceholderPage
    title="Intent Decision Center"
    subtitle="Deterministic rule evaluation, risk score calculation, and policy check diagnostics."
    description="The core policy engine compares proposed agent actions with the user's registered intent constraints and yields ALLOW, ASK_APPROVAL, or BLOCK decisions."
    icon={ShieldCheck}
    features={[
      "Deterministic 0-100 risk scoring breakdown",
      "Exact deviation and drift math (e.g., +₹3,999 budget exceedance)",
      "Granular pass/fail policy check badges",
      "Human-readable policy explanations",
    ]}
  />
);

export const ApprovalCenterPage: React.FC = () => (
  <PlaceholderPage
    title="User Approval Center"
    subtitle="Review and authorize pending agent payment requests requiring explicit human confirmation."
    description="Whenever an intent mandates approval, the agent proposal halts here. The user can review the item, amount, merchant, and reason, then Approve or Reject."
    icon={CheckSquare}
    features={[
      "Pending approval queue with countdown and risk alerts",
      "One-click Approve / Reject with audit logging",
      "Automated rejection on policy expiry",
      "Direct trigger to Payment Gateway upon approval",
    ]}
  />
);

export const PaymentGatePage: React.FC = () => (
  <PlaceholderPage
    title="Simulated Payment Gate"
    subtitle="Zero-risk simulated financial execution layer enforcing backend-verified intent decisions."
    description="Demonstrates payment processing after policy clearance. Rejects any transaction that lacks valid policy ALLOW or explicit human approval."
    icon={CreditCard}
    features={[
      "Simulated Razorpay transaction testbed",
      "Backend authorization token verification",
      "Zero real-money risk with realistic idempotency",
      "Immediate ledger event dispatch upon completion",
    ]}
  />
);

export const LedgerPage: React.FC = () => (
  <PlaceholderPage
    title="Audit Decision Ledger"
    subtitle="Immutable-style chronological audit trail of every intent, proposal, decision, and payment."
    description="Provides complete transparency into every action taken by the user, the AI agent, the policy engine, and the payment gateway."
    icon={History}
    features={[
      "Filter by intent ID, actor, event type, and date",
      "Deep metadata inspector for each event",
      "Cryptographic hash / integrity chain representation",
      "Exportable audit logs for compliance",
    ]}
  />
);

export const IntentReplayPage: React.FC = () => (
  <PlaceholderPage
    title="Intent Lifecycle Replay"
    subtitle="Step-by-step interactive time-travel player explaining why each decision occurred."
    description="Allows judges and developers to step through the entire lifecycle from raw intent to final payment block or authorization."
    icon={RotateCcw}
    features={[
      "Timeline scrubber with pause/play/step controls",
      "Visual state transition highlights",
      "Side-by-side Intent vs Proposal delta comparison",
      "Judge demo mode with pre-recorded scenarios",
    ]}
  />
);
