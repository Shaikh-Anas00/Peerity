import React, { useEffect, useState, useCallback } from "react";
import { auditApi, AuditLog, IntegrityVerificationResult } from "../api/auditApi";
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  Lock,
  Link as LinkIcon,
  Search,
} from "lucide-react";
import { ContentHeader, StatusPill } from "../components/ContentHeader";

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

  const getActionBadge = (action: string) => {
    switch (action) {
      case "SUBMISSION_ENCRYPTED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "REVIEW_SUBMITTED":
        return "bg-peerity-100 text-peerity-800 border-peerity-200";
      case "DISPUTE_FILED":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "QUORUM_VOTE_CAST":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "IDENTITY_DISCLOSED":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "DISPUTE_REJECTED":
        return "bg-red-50 text-red-700 border-red-200";
      case "USER_LOGIN":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
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
              className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition border border-slate-200 bg-white shadow-xs"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-4 py-2 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-2 disabled:opacity-50 font-display"
            >
              {verifying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              {verifying ? "Verifying…" : "Verify Ledger Integrity"}
            </button>
          </div>
        }
      />

      {/* Verification Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-xl border transition-all ${
            verificationResult.valid
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          <div className="flex items-start gap-3">
            {verificationResult.valid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
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
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Total Blocks</span>
            <Database className="w-4 h-4 text-peerity-800" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-display">{totalElements}</p>
          <p className="text-xs text-slate-400 mt-0.5 font-body">Consecutive hash-chained entries</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Chain Status</span>
            <LinkIcon className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2 font-display">
            {verificationResult ? (verificationResult.valid ? "Valid" : "Corrupt") : "Unverified"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 font-body">HMAC-SHA-256 integrity check</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Filter Action</span>
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="mt-2 w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-peerity-600 font-body"
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 font-display">
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
            <tbody className="divide-y divide-slate-100 font-body">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4">
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className="h-6 bg-slate-100 rounded animate-pulse" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <Database className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-slate-600 font-display">No audit records found</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-body">Events are automatically logged as system operations occur.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const isGenesis = log.sequenceNumber === 1;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="hover:bg-slate-50/80 cursor-pointer transition"
                      >
                        {/* Sequence number */}
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md border text-[11px] ${
                              isGenesis
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : "bg-slate-100 text-slate-800 border-slate-300"
                            }`}
                          >
                            #{log.sequenceNumber} {isGenesis && "Genesis"}
                          </span>
                        </td>

                        {/* Action badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${getActionBadge(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        {/* Actor email */}
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          {log.actorEmail || <span className="text-slate-400 italic">system</span>}
                        </td>

                        {/* Target */}
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {log.targetEntity ? (
                            <span>
                              <span className="font-semibold text-slate-800">{log.targetEntity}</span>:{" "}
                              <span className="font-mono text-[11px]">
                                {log.targetId ? log.targetId.substring(0, 8) + "..." : "n/a"}
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Current Hash */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-purple-700">
                            <span>{log.currentEntryHash.substring(0, 12)}...{log.currentEntryHash.substring(56)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(log.currentEntryHash, `curr-${log.id}`);
                              }}
                              className="p-1 hover:bg-purple-100 rounded text-purple-600 transition"
                              title="Copy full SHA-256 hash"
                            >
                              {copiedHash === `curr-${log.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Previous Hash */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                            <span>
                              {isGenesis
                                ? "00000000... (genesis)"
                                : `${log.previousEntryHash.substring(0, 10)}...`}
                            </span>
                            {!isGenesis && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(log.previousEntryHash, `prev-${log.id}`);
                                }}
                                className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
                                title="Copy previous SHA-256 hash"
                              >
                                {copiedHash === `prev-${log.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Timestamp */}
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90">
                          <td colSpan={7} className="px-6 py-4 space-y-2 border-b border-slate-200">
                            <div className="text-xs font-semibold text-slate-700">
                              Block #{log.sequenceNumber} Payload & Verification Details
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Full Current Hash</p>
                                <p className="font-mono text-purple-700 break-all text-[11px]">
                                  {log.currentEntryHash}
                                </p>
                                <p className="text-slate-400 font-bold uppercase text-[10px] pt-1">
                                  Previous Block Hash
                                </p>
                                <p className="font-mono text-slate-600 break-all text-[11px]">
                                  {log.previousEntryHash}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Event Details</p>
                                <p className="text-slate-800 text-[11px] leading-relaxed">
                                  {log.details || "No supplementary details."}
                                </p>
                                <div className="flex gap-4 pt-1 text-[11px] text-slate-500">
                                  <span>
                                    <strong>Target ID:</strong> {log.targetId || "none"}
                                  </span>
                                  {log.ipAddress && (
                                    <span>
                                      <strong>IP:</strong> {log.ipAddress}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> ({totalElements} total entries)
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => loadLogs(page - 1)}
              disabled={page <= 0}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              onClick={() => loadLogs(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
