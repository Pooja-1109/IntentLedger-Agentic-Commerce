import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Key,
  CreditCard,
} from "lucide-react";
import { DecisionBadge } from "../components/StatusBadge";
import { apiService } from "../services/api";
import { ApprovalRequest } from "../types";

export const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<"pending" | "all">("pending");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<{ id: string; msg: string; token?: string } | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<{ id: string; msg: string } | null>(null);

  const fetchApprovals = async (mode = filterMode) => {
    setLoading(true);
    try {
      const data = await apiService.getApprovals(mode);
      setApprovals(data);
    } catch (err) {
      console.error("Failed to load approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals(filterMode);
  }, [filterMode]);

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      const result = await apiService.approveApproval(id);
      setActionSuccessMsg({
        id,
        msg: "Approval granted! Cryptographic authorization token issued.",
        token: result.approvalToken,
      });
      await fetchApprovals();
    } catch (err: unknown) {
      setActionErrorMsg({
        id,
        msg: err instanceof Error ? err.message : "Failed to approve request",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      await apiService.rejectApproval(id, "User manually rejected from Approval Center");
      setActionSuccessMsg({
        id,
        msg: "Approval request rejected. Payment execution is permanently blocked.",
      });
      await fetchApprovals();
    } catch (err: unknown) {
      setActionErrorMsg({
        id,
        msg: err instanceof Error ? err.message : "Failed to reject request",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
            Human-in-the-Loop Governance
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Approval Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review and authorize pending agent payment requests requiring explicit human confirmation before money moves.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2 bg-surface-100 p-1.5 rounded-xl border border-surface-border self-start md:self-auto">
          <button
            onClick={() => setFilterMode("pending")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === "pending"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Pending Queue ({approvals.filter((a) => a.status === "PENDING").length})
          </button>
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === "all"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All History
          </button>
          <button
            onClick={() => fetchApprovals(filterMode)}
            className="p-1.5 text-slate-400 hover:text-slate-200"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs animate-pulse">
          Loading approval requests...
        </div>
      ) : approvals.length === 0 ? (
        <div className="rounded-2xl bg-surface-100 border border-surface-border p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-200 border border-surface-border mx-auto flex items-center justify-center text-emerald-400">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Pending Approvals</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All agent proposals are either fully cleared, blocked, or processed. You can trigger an approval request in the Simulation Lab.
          </p>
          <Link
            to="/simulation"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-glow transition-all"
          >
            <span>Simulate Agent Proposal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {approvals.map((req) => {
            const isPending = req.status === "PENDING";
            const isApproved = req.status === "APPROVED";
            const isRejected = req.status === "REJECTED";
            const isActionLoading = actionLoadingId === req.id;
            const currencySym = req.currency === "INR" ? "₹" : "$";

            return (
              <div
                key={req.id}
                className={`rounded-2xl border p-6 shadow-xl space-y-5 transition-all relative overflow-hidden ${
                  isApproved
                    ? "bg-surface-100/90 border-emerald-500/40"
                    : isRejected
                    ? "bg-surface-100/90 border-slate-700 opacity-80"
                    : "bg-surface-100 border-surface-border hover:border-amber-500/40"
                }`}
              >
                {/* Top Status & Timestamp */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-300">
                      {req.id}
                    </span>
                    <span className="text-[10px] text-slate-500">•</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {isPending ? (
                    <DecisionBadge decision="ASK_APPROVAL" size="sm" />
                  ) : isApproved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold tracking-wider uppercase">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold tracking-wider uppercase">
                      <XCircle className="w-3 h-3 text-rose-400" />
                      Rejected
                    </span>
                  )}
                </div>

                {/* Candidate Action Card */}
                <div className="p-4 rounded-xl bg-surface-200 border border-surface-border space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-purple-400 block mb-0.5">
                        Autonomous Agent Request
                      </span>
                      <h3 className="text-sm font-bold text-white">{req.proposal.product}</h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Merchant: <strong className="text-slate-200">{req.proposal.merchant}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Amount</span>
                      <span className="text-lg font-extrabold text-emerald-400">
                        {currencySym}{req.requestedAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Why Approval Is Required */}
                  <div className="pt-2 border-t border-surface-border text-xs text-slate-300 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{req.reason}</span>
                  </div>
                </div>

                {/* Cryptographic Token Display if Approved */}
                {isApproved && req.approvalToken && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                        <Key className="w-3 h-3 text-emerald-400" />
                        <span>Cryptographic Approval Token Issued</span>
                      </span>
                      <span className="text-[9px] font-mono text-emerald-300">Server Verified</span>
                    </div>
                    <div className="font-mono text-[11px] text-emerald-300 truncate bg-surface-300/80 p-2 rounded border border-emerald-500/20">
                      {req.approvalToken}
                    </div>
                  </div>
                )}

                {/* Success / Error Messages */}
                {actionSuccessMsg?.id === req.id && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{actionSuccessMsg.msg}</span>
                  </div>
                )}

                {actionErrorMsg?.id === req.id && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{actionErrorMsg.msg}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleReject(req.id)}
                        disabled={isActionLoading}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-surface-200 hover:bg-rose-950/80 border border-surface-border hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(req.id)}
                        disabled={isActionLoading}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-glow-emerald transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {isActionLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Approve Purchase</span>
                      </button>
                    </>
                  ) : isApproved ? (
                    <Link
                      to="/payment"
                      state={{ approvalId: req.id, approvalToken: req.approvalToken, intentId: req.intentId, proposal: req.proposal }}
                      className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-extrabold text-center shadow-glow transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Continue to Payment Gate</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <div className="w-full text-center text-xs text-slate-500 font-semibold py-1">
                      Payment execution is permanently disabled for this rejected proposal.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
