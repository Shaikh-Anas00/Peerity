import React from "react";
import { Copy, Check } from "lucide-react";
import { AuditLog } from "../../api/auditApi";

export interface LedgerRowProps {
  log: AuditLog;
  isExpanded: boolean;
  onToggle: () => void;
  copiedHash: string | null;
  onCopy: (text: string, id: string) => void;
}

const ACTION_BADGE: Record<string, string> = {
  SUBMISSION_ENCRYPTED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  REVIEW_SUBMITTED: "bg-peerity-100 text-peerity-800 border-peerity-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800",
  DISPUTE_FILED: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  QUORUM_VOTE_CAST: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
  IDENTITY_DISCLOSED: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  DISPUTE_REJECTED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
  USER_LOGIN: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};
const DEFAULT_ACTION_BADGE = "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700";

export const LedgerRow: React.FC<LedgerRowProps> = ({ log, isExpanded, onToggle, copiedHash, onCopy }) => {
  const isGenesis = log.sequenceNumber === 1;
  const actionClass = ACTION_BADGE[log.action] ?? DEFAULT_ACTION_BADGE;

  return (
    <React.Fragment>
      <tr
        onClick={onToggle}
        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 cursor-pointer transition"
      >
        {/* Sequence number */}
        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
          <span
            className={`inline-block px-2 py-0.5 rounded-md border text-[11px] ${
              isGenesis
                ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                : "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            }`}
          >
            #{log.sequenceNumber} {isGenesis && "Genesis"}
          </span>
        </td>

        {/* Action badge */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${actionClass}`}>
            {log.action}
          </span>
        </td>

        {/* Actor email */}
        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
          {log.actorEmail || <span className="text-slate-400 dark:text-slate-500 italic">system</span>}
        </td>

        {/* Target */}
        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {log.targetEntity ? (
            <span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{log.targetEntity}</span>:{" "}
              <span className="font-mono text-[11px]">
                {log.targetId ? log.targetId.substring(0, 8) + "..." : "n/a"}
              </span>
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">-</span>
          )}
        </td>

        {/* Current Hash */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-purple-700 dark:text-purple-400">
            <span>{log.currentEntryHash.substring(0, 12)}...{log.currentEntryHash.substring(56)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy(log.currentEntryHash, `curr-${log.id}`);
              }}
              className="p-1 hover:bg-purple-100 dark:hover:bg-purple-950/40 rounded text-purple-600 dark:text-purple-400 transition"
              title="Copy full SHA-256 hash"
            >
              {copiedHash === `curr-${log.id}` ? (
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </td>

        {/* Previous Hash */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              {isGenesis
                ? "00000000... (genesis)"
                : `${log.previousEntryHash.substring(0, 10)}...`}
            </span>
            {!isGenesis && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(log.previousEntryHash, `prev-${log.id}`);
                }}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition"
                title="Copy previous SHA-256 hash"
              >
                {copiedHash === `prev-${log.id}` ? (
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        </td>

        {/* Timestamp */}
        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {new Date(log.timestamp).toLocaleString()}
        </td>
      </tr>

      {/* Expanded Details */}
      {isExpanded && (
        <tr className="bg-slate-50/90 dark:bg-slate-800/60">
          <td colSpan={7} className="px-6 py-4 space-y-2 border-b border-slate-200 dark:border-slate-700">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Block #{log.sequenceNumber} Payload & Verification Details
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px]">Full Current Hash</p>
                <p className="font-mono text-purple-700 dark:text-purple-400 break-all text-[11px]">
                  {log.currentEntryHash}
                </p>
                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] pt-1">
                  Previous Block Hash
                </p>
                <p className="font-mono text-slate-600 dark:text-slate-400 break-all text-[11px]">
                  {log.previousEntryHash}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px]">Event Details</p>
                <p className="text-slate-800 dark:text-slate-200 text-[11px] leading-relaxed">
                  {log.details || "No supplementary details."}
                </p>
                <div className="flex gap-4 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
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
};
