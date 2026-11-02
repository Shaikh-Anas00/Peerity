import React from "react";
import { Download, Trash2 } from "lucide-react";
import { Modal, Button } from "../../components/ui";

export interface DataRequestModalProps {
  requestAction: "EXPORT" | "DELETION";
  requestReason: string;
  onReasonChange: (value: string) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const DataRequestModal: React.FC<DataRequestModalProps> = ({
  requestAction,
  requestReason,
  onReasonChange,
  submitting,
  onClose,
  onSubmit,
}) => {
  const isExport = requestAction === "EXPORT";

  return (
    <Modal open onClose={onClose} maxWidth="md">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isExport
              ? "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-teal-400"
              : "bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300"
          }`}
        >
          {isExport ? <Download className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
            {isExport ? "Export Your Account Data" : "Request Account Deletion"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isExport ? "Downloads immediately — no admin review needed" : "Files an administrative ticket for campus processing"}
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
        {isExport
          ? "This downloads a JSON file containing your personal profile, submissions, reviews given and received, and filed appeals — immediately, directly to your device."
          : "This files an administrative request to decouple and purge personal metadata. Note: Historical anonymous calibration data and cryptographically anchored ledger hashes are preserved to protect evaluation integrity."}
      </p>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 font-display">
          Reason or Notes (Optional)
        </label>
        <textarea
          rows={3}
          value={requestReason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="e.g. End of term transfer, privacy audit, personal backup..."
          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
        />
      </div>

      <div className="flex items-center justify-end gap-2.5">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant={isExport ? "primary" : "danger"}
          size="sm"
          loading={submitting}
          onClick={onSubmit}
        >
          {isExport
            ? (submitting ? "Preparing Download..." : "Download My Data")
            : (submitting ? "Filing Request..." : "Submit Request")}
        </Button>
      </div>
    </Modal>
  );
};
