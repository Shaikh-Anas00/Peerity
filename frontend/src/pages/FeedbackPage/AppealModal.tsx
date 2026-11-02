import React, { useState } from "react";
import { Review } from "../../api/reviewApi";
import { appealApi, AppealReason } from "../../api/appealApi";
import { AlertCircle, ShieldAlert, Send } from "lucide-react";
import { Modal, Button } from "../../components/ui";

export interface AppealModalProps {
  review: Review;
  onClose: () => void;
  onSuccess: () => void;
}

const POLICY_INFO: Record<AppealReason, { level: string; name: string; details: string; badgeColor: string }> = {
  HARASSMENT_OR_ABUSE: {
    level: "Tier 4",
    name: "Full Legal Identity",
    details: "Unmasks full legal name and university email address if approved by the Integrity Committee.",
    badgeColor: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800"
  },
  FACTUAL_FABRICATION: {
    level: "Tier 3",
    name: "Academic Standing",
    details: "Unmasks year of study and historical review counts to assess reviewer credibility.",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800"
  },
  UNFAIR_GRADING_OUTLIER: {
    level: "Tier 2",
    name: "Institution & Department",
    details: "Unmasks institution name and department affiliation to detect inter-departmental grading bias.",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800"
  },
  PROCEDURAL_ERROR: {
    level: "Tier 1",
    name: "Eligibility & Enrollment",
    details: "Verifies student enrollment status and course eligibility without revealing identifying data.",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
  }
};

export const AppealModal: React.FC<AppealModalProps> = ({ review, onClose, onSuccess }) => {
  const [reason, setReason] = useState<AppealReason>("UNFAIR_GRADING_OUTLIER");
  const [statement, setStatement] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const policy = POLICY_INFO[reason];
  const charCount = statement.trim().length;
  const isValid = charCount >= 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError("Statement must be at least 20 characters detailing the dispute.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await appealApi.create({
        reviewId: review.id,
        reason,
        statement: statement.trim()
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to file dispute.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Dispute Peer Review" maxWidth="lg">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-body">
        Reviewer: <span className="font-semibold text-slate-700 dark:text-slate-300">{review.reviewerPseudonym}</span> &bull; Assignment: <span className="font-semibold text-slate-700 dark:text-slate-300">{review.assignmentTitle}</span>
      </p>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-xl p-4 flex gap-3 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 font-display">
            Dispute Category (Reason)
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as AppealReason)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 dark:focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100 font-body"
          >
            <option value="UNFAIR_GRADING_OUTLIER">Unfair Grading Outlier or Bias (Medium Severity)</option>
            <option value="FACTUAL_FABRICATION">Factual Fabrication or False Claims (High Severity)</option>
            <option value="HARASSMENT_OR_ABUSE">Harassment, Hate Speech, or Abuse (Severe)</option>
            <option value="PROCEDURAL_ERROR">Procedural or Rubric Error (Low Severity)</option>
          </select>
        </div>

        {/* Dynamic Policy Engine Preview Badge */}
        <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-display">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              Policy Engine Projected Disclosure Tier
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${policy.badgeColor}`}>
              {policy.level}: {policy.name}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-body">{policy.details}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-display">
              Appellant Statement
            </label>
            <span className={`text-[11px] font-medium ${charCount < 20 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {charCount} / 20 min characters
            </span>
          </div>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={4}
            placeholder="Explain specifically why this review violates fair evaluation standards (minimum 20 characters)..."
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 dark:focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100 resize-none font-body"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!isValid}
            loading={submitting}
            leftIcon={<Send className="w-4 h-4" />}
            className="flex-1"
          >
            File Dispute
          </Button>
        </div>
      </form>
    </Modal>
  );
};
