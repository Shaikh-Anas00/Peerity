import React from "react";
import { ChevronLeft } from "lucide-react";
import { groupApi, EVALUATION_RUBRIC, GroupMember } from "../../api/groupApi";
import { SteppedCriterionScoring } from "../../components/SteppedCriterionScoring";

export interface PeerEvalFormProps {
  member: GroupMember;
  groupId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}

export const PeerEvalForm: React.FC<PeerEvalFormProps> = ({ member, groupId, onSubmitted, onCancel }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <SteppedCriterionScoring
        criteria={EVALUATION_RUBRIC}
        title={
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-peerity-700 dark:text-teal-400 font-display">
              Evaluating Teammate
            </p>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">{member.userName}</h3>
          </div>
        }
        subtitle={`Role: ${member.role}`}
        headerExtra={
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Back to roster"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        }
        requireFeedback={true}
        feedbackLabel="Written Feedback"
        feedbackPlaceholder="Provide specific, constructive observations about this team member's contribution, communication, and reliability."
        feedbackMinLength={10}
        submitButtonText="Submit Evaluation"
        onCancel={onCancel}
        onSubmit={async (scores, feedback) => {
          await groupApi.submitEvaluation(groupId, {
            evaluateeId: member.userId,
            scores: JSON.stringify(scores),
            feedback: feedback.trim(),
          });
          onSubmitted();
        }}
      />
    </div>
  );
};
