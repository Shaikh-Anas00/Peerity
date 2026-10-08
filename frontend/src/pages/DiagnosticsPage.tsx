import React, { useState } from "react";
import { apiClient } from "../api/client";
import {
  Settings,
  Activity,
  ShieldCheck,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Terminal,
  Server,
} from "lucide-react";

interface HealthResult {
  ok: boolean;
  message: string;
  detail?: string;
}

export const DiagnosticsPage: React.FC = () => {
  const [rbacResult, setRbacResult] = useState<HealthResult | null>(null);
  const [phpResult, setPhpResult] = useState<HealthResult | null>(null);
  const [rbacLoading, setRbacLoading] = useState(false);
  const [phpLoading, setPhpLoading] = useState(false);

  const testRbac = async () => {
    setRbacLoading(true);
    setRbacResult(null);
    try {
      const res = await apiClient.get<any>("/test/committee-only");
      setRbacResult({ ok: true, message: "Endpoint reachable — RBAC passed", detail: JSON.stringify(res.data, null, 2) });
    } catch (err: any) {
      const status = err.response?.status;
      setRbacResult({
        ok: false,
        message: `Request failed with ${status ?? "network error"}`,
        detail: err.response?.data?.message || err.message,
      });
    } finally {
      setRbacLoading(false);
    }
  };

  const testPhp = async () => {
    setPhpLoading(true);
    setPhpResult(null);
    try {
      const res = await apiClient.get<any>("/test/crypto-health");
      setPhpResult({ ok: true, message: "PHP sidecar is healthy", detail: JSON.stringify(res.data, null, 2) });
    } catch (err: any) {
      const status = err.response?.status;
      setPhpResult({
        ok: false,
        message: `Sidecar unreachable — ${status ?? "network error"}`,
        detail: err.response?.data?.message || err.message,
      });
    } finally {
      setPhpLoading(false);
    }
  };

  const ResultBanner: React.FC<{ result: HealthResult }> = ({ result }) => (
    <div
      className={`mt-3 p-3 rounded-lg border text-xs font-mono ${
        result.ok
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}
    >
      <div className="flex items-center gap-2 mb-1 font-sans font-semibold">
        {result.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        {result.message}
      </div>
      {result.detail && <pre className="whitespace-pre-wrap break-all opacity-80">{result.detail}</pre>}
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-body">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center">
          <Settings className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Internal Diagnostics</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-body">
            Admin-only system health panel — not visible to other roles.
          </p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
        <span>
          This page is accessible to <strong>ADMIN</strong> only and is intentionally excluded from production user-facing navigation.
          Endpoint paths and raw responses are displayed here for diagnostic purposes.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RBAC Check */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-peerity-800" />
              <h2 className="text-sm font-bold text-slate-900 font-display">RBAC Middleware Check</h2>
            </div>
            <p className="text-xs text-slate-500">
              Calls <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">GET /api/test/committee-only</code> which requires{" "}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">ADMIN</code> or{" "}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">COMMITTEE</code> role.
              As ADMIN, this should return 200.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={testRbac}
              disabled={rbacLoading}
              className="flex items-center gap-2 px-4 py-2 bg-peerity-800 hover:bg-peerity-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 font-display shadow-sm"
            >
              {rbacLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
              {rbacLoading ? "Testing..." : "Run RBAC Test"}
            </button>
            {rbacResult && <ResultBanner result={rbacResult} />}
          </div>
        </div>

        {/* PHP Sidecar Health */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 font-display">PHP Crypto Sidecar Health</h2>
            </div>
            <p className="text-xs text-slate-500">
              Calls <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">GET /api/test/crypto-health</code> which proxies to the
              PHP 8.2+ AES-256-GCM sidecar at <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">127.0.0.1:8000</code>.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={testPhp}
              disabled={phpLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 font-display shadow-sm"
            >
              {phpLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
              {phpLoading ? "Pinging..." : "Ping PHP Sidecar"}
            </button>
            {phpResult && <ResultBanner result={phpResult} />}
          </div>
        </div>
      </div>
    </div>
  );
};
