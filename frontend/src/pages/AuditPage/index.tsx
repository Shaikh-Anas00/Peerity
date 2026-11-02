import React, { useEffect, useState, useCallback } from "react";
import { auditApi, AuditLog, IntegrityVerificationResult } from "../../api/auditApi";
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Lock,
  Link as LinkIcon,
  Search,
} from "lucide-react";
import { ContentHeader, StatusPill } from "../../components/ContentHeader";
import { Button } from "../../components/ui";
import { LedgerRow } from "./LedgerRow";

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<IntegrityVerificationResult | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadLogs = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await auditApi.getLogs(p, 20);
      setLogs(res.data.content);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
      setPage(res.data.number || 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs(0);
  }, [loadLogs]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await auditApi.verifyLedger();
      setVerificationResult(res.data);
    } catch (err: any) {
      setVerificationResult({
        valid: false,
        totalRecords: 0,
        brokenSequenceAt: null,
        verifiedAt: new Date().toISOString(),
        message: err.response?.data?.message || "Failed to verify audit ledger integrity.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredLogs = filterAction === "ALL"
    ? logs
    : logs.filter(l => l.action === filterAction);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-body">
      {/* Page Header */}
      <ContentHeader
        breadcrumbs={["Security & Governance", "Audit Ledger"]}
        title="Tamper-Evident Audit Ledger"
        subtitle="HMAC-SHA-256 hash-chained event log — verifiable, append-only, tamper-detectable."
        icon={Lock}
        statusPill={<StatusPill label="HMAC-SHA-256 CHAINED" variant="brand" />}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadLogs(page)}
              className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition border border-slate-200 bg-white shadow-xs dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 dark:border-slate-700 dark:bg-slate-900"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Button variant="primary" disabled={verifying} onClick={handleVerify} leftIcon={<ShieldCheck className="w-4 h-4" />}>
              {verifying ? "Verifying…" : "Verify Ledger Integrity"}
            </Button>
          </div>
        }
      />

      {/* Verification Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-xl border transition-all ${
            verificationResult.valid
              ? "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
              : "bg-red-50 border-red-300 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300"
          }`}
        >
          <div className="flex items-start gap-3">
            {verificationResult.valid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold font-display">
                  {verificationResult.valid
                    ? "Cryptographic Ledger Verified: Zero Tampering Detected"
                    : `TAMPER DETECTED: Chain Broken at Sequence #${verificationResult.brokenSequenceAt ?? "Unknown"}`}
                </h3>
                <span className="text-xs opacity-75 font-body">
                  Verified at: {new Date(verificationResult.verifiedAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed font-body">{verificationResult.message}</p>
              <p className="text-[11px] mt-1 font-mono opacity-80">
                Total blocks traversed: {verificationResult.totalRecords} &bull; Genesis hash: 00000000...0000
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display">Total Blocks</span>
            <Database className="w-4 h-4 text-peerity-800 dark:text-teal-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-display">{totalElements}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-body">Consecutive hash-chained entries</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display">Chain Status</span>
            <LinkIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-display">
            {verificationResult ? (verificationResult.valid ? "Valid" : "Corrupt") : "Unverified"}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-body">HMAC-SHA-256 integrity check</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display">Filter Action</span>
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="mt-2 w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-peerity-600 dark:focus:ring-teal-500 font-body"
          >
            <option value="ALL">All Actions ({logs.length})</option>
            <option value="SUBMISSION_ENCRYPTED">SUBMISSION_ENCRYPTED</option>
            <option value="REVIEW_SUBMITTED">REVIEW_SUBMITTED</option>
            <option value="DISPUTE_FILED">DISPUTE_FILED</option>
            <option value="QUORUM_VOTE_CAST">QUORUM_VOTE_CAST</option>
            <option value="IDENTITY_DISCLOSED">IDENTITY_DISCLOSED</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700 font-display">
              <tr>
                <th className="px-4 py-3">Block #</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Current Block Hash</th>
                <th className="px-4 py-3">Previous Hash</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-body">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4">
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className="h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 dark:text-slate-500">
                    <Database className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300 font-display">No audit records found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-body">Events are automatically logged as system operations occur.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <LedgerRow
                    key={log.id}
                    log={log}
                    isExpanded={expandedId === log.id}
                    onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    copiedHash={copiedHash}
                    onCopy={copyToClipboard}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <span>
            Showing page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> ({totalElements} total entries)
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => loadLogs(page - 1)}
              disabled={page <= 0}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              onClick={() => loadLogs(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
