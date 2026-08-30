import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Lock,
  UserCheck,
} from "lucide-react";
import { StatusPill } from "../components/StatusBadge";
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Human-in-the-Loop Governance
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Approval Center
          </h1>
          <p className="text-sm text-slate-600 mt-1 font-normal">
            Human authorization queue for transactions requiring additional trust before money moves.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200 self-start md:self-auto text-xs">
          <button
            onClick={() => setFilterMode("pending")}
            className={`px-3.5 py-1.5 rounded-md font-bold transition-all ${
              filterMode === "pending"
                ? "bg-white text-blue-700 shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending Reviews
          </button>
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3.5 py-1.5 rounded-md font-bold transition-all ${
              filterMode === "all"
                ? "bg-white text-blue-700 shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Historical
          </button>
          <button
            onClick={() => fetchApprovals()}
            className="p-1.5 text-slate-500 hover:text-slate-900 ml-1"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-sm">{actionSuccessMsg.msg}</span>
              {actionSuccessMsg.token && (
                <div className="font-mono text-xs text-emerald-900 mt-0.5 font-bold">
                  Cryptographic Token: {actionSuccessMsg.token}
                </div>
              )}
            </div>
          </div>
          <Link
            to="/payment"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0 self-start sm:self-auto shadow-sm"
          >
            <span>Proceed to Payment Gate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2 shadow-xs">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-bold text-sm">{actionErrorMsg.msg}</span>
        </div>
      )}

      {/* Approvals Queue */}
      {loading ? (
        <div className="py-24 text-center text-slate-500 text-xs animate-pulse font-medium">
          Loading approval requests from backend...
        </div>
      ) : approvals.length === 0 ? (
        <div className="fintech-card p-12 text-center space-y-3">
          <UserCheck className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Approval Requests in Queue</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            {filterMode === "pending"
              ? "All transactions are currently reviewed or auto-authorized."
              : "No historical approval records found."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((req) => (
            <div
              key={req.id}
              className="fintech-card p-6 space-y-4 hover:border-slate-300 transition-all"
            >
              {/* Top Row: Product, Amount, Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      REQUEST ID: {req.id}
                    </span>
                    <StatusPill status={req.status} />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                    {req.proposalSnapshot.product}
                  </h3>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    Merchant: <span className="text-slate-900 font-bold">{req.proposalSnapshot.merchant}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Authorization Amount
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 tabular-nums mt-0.5">
                    ₹{req.proposalSnapshot.amount?.toLocaleString()} <span className="text-xs font-mono text-slate-500 font-normal">INR</span>
                  </div>
                </div>
              </div>

              {/* Middle Row: Snapshot & Policy Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Bound Intent ID</span>
                  <span className="font-mono text-slate-900 truncate block mt-0.5 font-bold">
                    {req.intentId}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Requested At</span>
                  <span className="font-mono text-slate-900 block mt-0.5 tabular-nums font-semibold">
                    {new Date(req.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Authorization TTL</span>
                  <span className="font-mono text-amber-800 font-bold block mt-0.5">
                    {req.status === "PENDING"
                      ? "10-Minute Expiry Limit"
                      : req.expiresAt
                      ? `Expires: ${new Date(req.expiresAt).toLocaleTimeString()}`
                      : "Expired"}
                  </span>
                </div>
              </div>

              {/* Cryptographic Snapshot Hash Proof */}
              {req.status === "APPROVED" && req.approvalToken && (
                <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold uppercase text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-blue-700" />
                    <span>Cryptographic Proposal Snapshot Hash Bound</span>
                  </div>
                  <div className="font-mono text-xs text-blue-950 break-all font-bold">
                    Token: {req.approvalToken}
                  </div>
                  <div className="text-[11px] text-slate-700 font-medium">
                    Any modification of amount or merchant at the Payment Gate will result in immediate 403 context rejection.
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {req.status === "PENDING" && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={actionLoadingId === req.id}
                    className="px-4 py-2.5 rounded-lg bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold transition-all disabled:opacity-50 shadow-2xs"
                  >
                    Reject Transaction
                  </button>

                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={actionLoadingId === req.id}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>{actionLoadingId === req.id ? "Authorizing..." : "Approve Request"}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
