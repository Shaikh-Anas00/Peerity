import React, { useState } from "react";
import { Review } from "../../api/reviewApi";
import { reviewApi } from "../../api/reviewApi";
import { AlertCircle, Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { Modal, Button } from "../../components/ui";

export interface RateReviewModalProps {
  review: Review;
  onClose: () => void;
  onSuccess: () => void;
}

export const RateReviewModal: React.FC<RateReviewModalProps> = ({ review, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [isHelpful, setIsHelpful] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await reviewApi.rateReview(review.id, {
        rating,
        isHelpful,
        comment: comment.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit rating.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Rate Review Quality" maxWidth="md">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-body">
        Provide constructive feedback on <span className="font-semibold text-slate-700 dark:text-slate-300">{review.reviewerPseudonym}</span>'s evaluation (Kritik Model).
      </p>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-xl p-4 flex gap-3 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 font-display">Rating</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => { setRating(s); setIsHelpful(s >= 3); }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition border ${
                  rating >= s
                    ? "bg-amber-50 border-amber-300 text-amber-400 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-400"
                    : "bg-slate-50 border-slate-200 text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-600"
                }`}
              >
                <Star
                  className="w-5 h-5"
                  fill={rating >= s ? "currentColor" : "none"}
                />
              </button>
            ))}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold ml-2 font-display">{rating} of 5 Stars</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 font-display">Was this critique helpful?</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsHelpful(true)}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition font-body ${
                isHelpful
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
                  : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" /> Constructive &amp; Helpful
            </button>
            <button
              type="button"
              onClick={() => setIsHelpful(false)}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition font-body ${
                !isHelpful
                  ? "bg-red-50 border-red-300 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400"
                  : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" /> Unhelpful / Vague
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 font-display">Comment (Optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="What specifically made this evaluation helpful or unhelpful?"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 dark:focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100 resize-none font-body"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting} className="flex-1">
            Submit Rating
          </Button>
        </div>
      </form>
    </Modal>
  );
};
