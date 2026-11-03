import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  classroomApi,
  ClassroomWorkspace,
  ClassroomAssignment,
  ClassroomReview,
  ClassroomSubmission,
  CourseRoomStudent,
} from "../api/classroomApi";
import { submissionApi } from "../api/submissionApi";
import { rubricTemplateApi, RubricTemplateDto } from "../api/rubricTemplateApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  BookOpen,
  ShieldCheck,
  Users,
  Lock,
  ArrowLeft,
  Plus,
  Copy,
  Check,
  Calendar,
  Clock,
  FileText,
  UploadCloud,
  Send,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileCheck,
  Sparkles,
  School,
  ExternalLink,
  UserMinus,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Modal,
  Spinner,
  EmptyState,
} from "../components/ui";

export const ClassroomWorkspacePage: React.FC = () => {
  const { id: roomId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isInstructor = user?.role === "INSTRUCTOR" || user?.role === "ADMIN";
  const isStudent = user?.role === "STUDENT";

  const [workspace, setWorkspace] = useState<ClassroomWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [is403, setIs403] = useState(false);
  const [activeTab, setActiveTab] = useState<"assignments" | "reviews" | "roster">("assignments");

  // Join Code Copy State
  const [copiedCode, setCopiedCode] = useState(false);

  // Rubric Templates State (for creating assignments)
  const [rubricTemplates, setRubricTemplates] = useState<RubricTemplateDto[]>([]);

  // Create Assignment Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createDeadline, setCreateDeadline] = useState("");
  const [createReviewDeadline, setCreateReviewDeadline] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [createIsGroup, setCreateIsGroup] = useState(false);
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  // Upload Submission Modal State
  const [uploadAssignment, setUploadAssignment] = useState<ClassroomAssignment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Distribute Reviews Modal State
  const [distributeAssignment, setDistributeAssignment] = useState<ClassroomAssignment | null>(null);
  const [reviewerCount, setReviewerCount] = useState<number>(2);
  const [distributing, setDistributing] = useState(false);

  // Fetch Workspace Data
  const fetchWorkspace = useCallback(async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      setError(null);
      setIs403(false);
      const res = await classroomApi.getWorkspace(roomId);
      setWorkspace(res.data);
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || "Failed to load classroom workspace.";
      if (status === 403) {
        setIs403(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  // Load rubric templates if instructor
  useEffect(() => {
    if (isInstructor) {
      rubricTemplateApi.getAll().then((res: any) => {
        const list = res.data?.content || res.data || [];
        setRubricTemplates(list);
        if (list.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(list[0].id);
        }
      }).catch(() => {
        // Fallback gracefully
      });
    }
  }, [isInstructor]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      showToast(`Join code "${code}" copied to clipboard!`, "success");
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      showToast("Failed to copy join code.", "error");
    }
  };

  // Handle Create Classroom Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;
    if (!createTitle.trim()) {
      showToast("Assignment title is required.", "warning");
      return;
    }
    if (!createDeadline) {
      showToast("Submission deadline is required.", "warning");
      return;
    }

    const template = rubricTemplates.find((t) => t.id === selectedTemplateId);
    const rubricCriteria = template ? template.criteriaJson : undefined;

    try {
      setCreatingAssignment(true);
      await classroomApi.createAssignment(roomId, {
        title: createTitle.trim(),
        description: createDescription.trim(),
        deadline: new Date(createDeadline).toISOString().slice(0, 19),
        reviewDeadline: createReviewDeadline
          ? new Date(createReviewDeadline).toISOString().slice(0, 19)
          : undefined,
        rubricCriteria,
        isGroupAssignment: createIsGroup,
      });

      showToast(`Assignment "${createTitle}" posted to classroom!`, "success");
      setShowCreateModal(false);
      setCreateTitle("");
      setCreateDescription("");
      setCreateDeadline("");
      setCreateReviewDeadline("");
      setCreateIsGroup(false);
      fetchWorkspace();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to create assignment.", "error");
    } finally {
      setCreatingAssignment(false);
    }
  };

  // Handle Remove Student from Classroom
  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!roomId) return;
    const confirm = window.confirm(
      `Are you sure you want to remove ${studentName} from this classroom? They will immediately lose access (403 Forbidden).`
    );
    if (!confirm) return;

    try {
      await classroomApi.removeStudent(roomId, studentId);
      showToast(`${studentName} removed from classroom.`, "success");
      fetchWorkspace();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to remove student.", "error");
    }
  };

  // Handle Student File Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !uploadAssignment || !selectedFile) {
      showToast("Please choose a file to upload.", "warning");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);
      await submissionApi.createWithFile(
        uploadAssignment.id,
        selectedFile,
        roomId,
        (percent) => setUploadProgress(percent)
      );

      showToast(
        `Work submitted and encrypted with AES-256-GCM for "${uploadAssignment.title}"!`,
        "success"
      );
      setUploadAssignment(null);
      setSelectedFile(null);
      setUploadProgress(0);
      fetchWorkspace();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to upload submission.", "error");
    } finally {
      setUploading(false);
    }
  };

  // Handle Distribute Reviews
  const handleDistribute = async () => {
    if (!roomId || !distributeAssignment) return;

    try {
      setDistributing(true);
      const res = await classroomApi.distributeReviews(
        roomId,
        reviewerCount,
        distributeAssignment.id
      );

      showToast(
        `Successfully distributed ${res.data.reviewsCreated} anonymous peer reviews across ${res.data.submissionsProcessed} submissions!`,
        "success"
      );
      setDistributeAssignment(null);
      fetchWorkspace();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to distribute reviews.", "error");
    } finally {
      setDistributing(false);
    }
  };

  // 403 Forbidden Screen
  if (is403) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
        <Link
          to="/classrooms"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-peerity-700 dark:hover:text-teal-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Classrooms</span>
        </Link>

        <Card padding="lg" className="border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-center py-12">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
            Access Restricted (403 Forbidden)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-2 mb-6">
            You are not enrolled in this classroom or do not possess the required instructor credentials to enter this isolated workspace.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate("/classrooms")}>
              View My Classrooms
            </Button>
            <Button variant="primary" onClick={() => navigate("/classrooms")}>
              Join With Code
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Entering classroom workspace...
        </p>
      </div>
    );
  }

  // Generic Error Screen
  if (error || !workspace) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
        <Link
          to="/classrooms"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-peerity-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Classrooms</span>
        </Link>
        <Card padding="md" className="border-rose-200 bg-rose-50 text-rose-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error || "Classroom not found."}</p>
          </div>
        </Card>
      </div>
    );
  }

  const { classroom, assignments, mySubmissions, myReviews, students, canManage } = workspace;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Breadcrumb Navigation ── */}
      <div className="flex items-center justify-between">
        <Link
          to="/classrooms"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-peerity-700 dark:text-slate-400 dark:hover:text-teal-400 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Classrooms</span>
        </Link>
        <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Classroom ID: {classroom.id.slice(0, 8)}
        </span>
      </div>

      {/* ── Google Classroom-Style Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-900 via-peerity-900 to-slate-900 text-white p-6 sm:p-8 shadow-md">
        {/* Subtle Decorative Pattern */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-peerity-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge variant="brand" className="bg-white/20 text-white font-mono font-bold uppercase tracking-wider text-xs border border-white/20">
                {classroom.courseCode}
              </Badge>
              {classroom.active ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Cohort
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                  Archived
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              {classroom.name}
            </h1>

            {classroom.description && (
              <p className="text-sm text-slate-200/90 leading-relaxed max-w-xl">
                {classroom.description}
              </p>
            )}

            {classroom.instructorName && (
              <p className="text-xs text-slate-300/80 pt-1">
                Instructor: <span className="font-semibold text-white">{classroom.instructorName}</span>
                {classroom.instructorEmail && (
                  <span className="text-slate-400 ml-1">({classroom.instructorEmail})</span>
                )}
              </p>
            )}
          </div>

          {/* Banner Right: Join Code (Instructor) */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 flex-shrink-0">
            {canManage && classroom.joinCode && (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3.5 flex items-center justify-between gap-4 min-w-[200px]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                    Student Join Code
                  </span>
                  <span className="font-mono text-xl font-bold tracking-widest text-teal-300">
                    {classroom.joinCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(classroom.joinCode!)}
                  title="Copy Join Code"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 transition active:scale-[0.97]"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-300" />
                <span>{classroom.enrolledCount} {classroom.enrolledCount === 1 ? "student" : "students"}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-300" />
                <span>{assignments.length} {assignments.length === 1 ? "assignment" : "assignments"}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabbed Workspace Navigation ── */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("assignments")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "assignments"
              ? "border-peerity-600 text-peerity-700 dark:border-teal-400 dark:text-teal-300"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Classwork & Assignments</span>
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {assignments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "reviews"
              ? "border-peerity-600 text-peerity-700 dark:border-teal-400 dark:text-teal-300"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Peer Reviews</span>
          {isStudent && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {myReviews.length}
            </span>
          )}
        </button>

        {canManage && (
          <button
            type="button"
            onClick={() => setActiveTab("roster")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === "roster"
                ? "border-peerity-600 text-peerity-700 dark:border-teal-400 dark:text-teal-300"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Roster</span>
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {students.length}
            </span>
          </button>
        )}
      </div>

      {/* ── TAB 1: Classwork & Assignments ── */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          {/* Action Header for Instructor */}
          {canManage && (
            <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                  Classroom Assignments
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Create assignments and manage student submissions for {classroom.name}.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Create Classroom Assignment</span>
              </Button>
            </div>
          )}

          {assignments.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-6 h-6" />}
              title="No Assignments Posted Yet"
              description={
                canManage
                  ? "Post your first classroom assignment with due date and rubric to allow enrolled students to upload encrypted submissions."
                  : "Your instructor has not posted any assignments in this classroom yet. Check back soon!"
              }
              action={
                canManage ? (
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Assignment
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const submissionCount = assignment.submissionCount || 0;
                const meetsKAnonymity = submissionCount >= 3;

                return (
                  <Card
                    key={assignment.id}
                    padding="none"
                    className="border-slate-200/90 dark:border-slate-800 hover:shadow-sm transition overflow-hidden"
                  >
                    <div className="p-5 sm:p-6 space-y-4">
                      {/* Assignment Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                              {assignment.title}
                            </h3>
                            {assignment.isGroupAssignment ? (
                              <Badge variant="info" className="text-xs flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Group Assignment
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-xs">
                                Individual
                              </Badge>
                            )}
                            {isStudent && assignment.hasSubmitted && (
                              <Badge variant="success" className="text-xs flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Submitted
                              </Badge>
                            )}
                            {isStudent && !assignment.hasSubmitted && (
                              <Badge variant="warning" className="text-xs">
                                Pending Submission
                              </Badge>
                            )}
                          </div>
                          {assignment.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed max-w-3xl">
                              {assignment.description}
                            </p>
                          )}
                        </div>

                        {/* Submission Count Indicator (Instructor) */}
                        {canManage && (
                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0">
                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {submissionCount} {submissionCount === 1 ? "Submission" : "Submissions"}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDistributeAssignment(assignment)}
                              className="flex items-center gap-1.5 text-xs text-peerity-800 dark:text-teal-300 border-peerity-300 dark:border-teal-800 hover:bg-peerity-50 dark:hover:bg-teal-950/40"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Distribute Reviews</span>
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* k-Anonymity Warning (Instructor) */}
                      {canManage && (
                        <div
                          className={`rounded-xl p-3 flex items-start gap-2.5 text-xs border ${
                            meetsKAnonymity
                              ? "bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                              : "bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                          }`}
                        >
                          {meetsKAnonymity ? (
                            <>
                              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                              <p>
                                <strong>Ready to Distribute:</strong> {submissionCount} students have submitted work. You can now distribute anonymous peer reviews.
                              </p>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                              <p>
                                <strong>Minimum 3 Submissions Required:</strong> Only {submissionCount} submission(s) so far. At least 3 students must submit before peer reviews can be shared, keeping grading fair and anonymous.
                              </p>
                            </>
                          )}
                        </div>
                      )}

                      {/* Rubric Criteria Chips */}
                      {assignment.rubric && assignment.rubric.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                            Grading Rubric Criteria
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {assignment.rubric.map((criterion, idx) => (
                              <span
                                key={criterion.id || idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                              >
                                <span>{criterion.name}</span>
                                {criterion.maxScore && (
                                  <span className="text-[10px] text-slate-400">({criterion.maxScore} pts)</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metadata Row & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Due: {new Date(assignment.deadline).toLocaleString()}</span>
                          </span>
                          {assignment.reviewDeadline && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Review Deadline: {new Date(assignment.reviewDeadline).toLocaleString()}</span>
                            </span>
                          )}
                        </div>

                        {/* Student Action: Upload or View Submission */}
                        {isStudent && (
                          <div>
                            {assignment.hasSubmitted ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setUploadAssignment(assignment)}
                                className="flex items-center gap-1.5 text-xs"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>Replace Submission</span>
                              </Button>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setUploadAssignment(assignment)}
                                className="flex items-center gap-1.5 text-xs font-semibold"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>Upload Submission (PDF/ZIP)</span>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Anonymous Peer Reviews ── */}
      {activeTab === "reviews" && (
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
              Anonymous Peer Reviews
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Peer reviews for students enrolled in {classroom.name}. Submissions and reviews are anonymous to keep evaluation fair and unbiased.
            </p>
          </div>

          {isStudent && (
            <>
              {myReviews.length === 0 ? (
                <EmptyState
                  icon={<ShieldCheck className="w-6 h-6" />}
                  title="No Peer Reviews Assigned in this Room"
                  description="When your instructor distributes reviews for assignments in this classroom, your assigned submissions to review will appear here."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myReviews.map((review) => {
                    const isCompleted = review.status === "COMPLETED";
                    return (
                      <Card
                        key={review.id}
                        padding="md"
                        className="space-y-3 border-slate-200/90 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="brand" className="font-mono text-xs">
                            {review.assignmentTitle || "Classroom Assignment"}
                          </Badge>
                          <Badge variant={isCompleted ? "success" : "warning"} className="text-xs">
                            {isCompleted ? "Completed" : "Pending Review"}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                            Submission Document:{" "}
                            <span className="font-mono font-medium text-slate-600 dark:text-slate-400">
                              {review.submissionFileName || "submission_masked.pdf"}
                            </span>
                          </p>
                          {review.reviewerPseudonym && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Your Alias: <span className="font-semibold text-peerity-800 dark:text-teal-300">{review.reviewerPseudonym}</span>
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            {review.reviewDeadline ? `Due: ${new Date(review.reviewDeadline).toLocaleDateString()}` : "Active"}
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate("/reviews")}
                            className="flex items-center gap-1.5 text-xs font-semibold"
                          >
                            <span>Open Review Workspace</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {canManage && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card padding="md" className="border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Enrolled</p>
                  <p className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100 mt-1">
                    {classroom.enrolledCount}
                  </p>
                </Card>
                <Card padding="md" className="border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Submissions</p>
                  <p className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100 mt-1">
                    {workspace.totalSubmissions}
                  </p>
                </Card>
                <Card padding="md" className="border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Reviews Distributed</p>
                  <p className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100 mt-1">
                    {workspace.totalReviews}
                  </p>
                </Card>
              </div>

              <Card padding="md" className="border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display mb-2">
                  Anonymous Peer Reviews
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Students review work under anonymous aliases (e.g., 'Reviewer Alpha'). Authors never see reviewer names, and reviewers never see author names to keep scoring fair and unbiased.
                </p>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Student Roster (Instructor Only) ── */}
      {activeTab === "roster" && canManage && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                  Enrolled Students ({students.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Students enrolled in this classroom via join code <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{classroom.joinCode}</span>.
                </p>
              </div>
              {classroom.joinCode && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopyCode(classroom.joinCode!)}
                  className="flex items-center gap-1.5 text-xs whitespace-nowrap"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Join Code</span>
                </Button>
              )}
            </div>

            {students.length === 0 ? (
              <EmptyState
                icon={<Users className="w-6 h-6" />}
                title="No Students Enrolled Yet"
                description={`Share join code "${classroom.joinCode}" with students so they can join this classroom.`}
              />
            ) : (
              <Card padding="none" className="border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-5 py-3.5">Student Name</th>
                        <th className="px-5 py-3.5">Email</th>
                        <th className="px-5 py-3.5">Department</th>
                        <th className="px-5 py-3.5">Academic Standing</th>
                        <th className="px-5 py-3.5 text-right">Enrolled Date</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100">
                            {student.fullName}
                          </td>
                          <td className="px-5 py-3 font-mono text-slate-600 dark:text-slate-400">
                            {student.email}
                          </td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                            {student.department || "General"}
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant="default" className="text-[10px]">
                              {student.academicStanding || "Undergraduate"}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right text-slate-400">
                            {new Date(student.enrolledAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleRemoveStudent(student.id, student.fullName)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:underline transition"
                              title="Remove student from classroom"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE ASSIGNMENT MODAL (INSTRUCTOR) ── */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Classroom Assignment"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              required
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="e.g. Distributed Consensus Engine"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-peerity-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Instructions & Description
            </label>
            <textarea
              rows={3}
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="Provide assignment guidelines, expected architecture, and submission requirements..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-peerity-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Submission Due Date *
              </label>
              <input
                type="datetime-local"
                required
                value={createDeadline}
                onChange={(e) => setCreateDeadline(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-peerity-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Review Deadline (Optional)
              </label>
              <input
                type="datetime-local"
                value={createReviewDeadline}
                onChange={(e) => setCreateReviewDeadline(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-peerity-500"
              />
            </div>
          </div>

          {/* Rubric Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Select Grading Rubric Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-peerity-500"
            >
              {rubricTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>

          {/* Group Assignment Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createIsGroup}
                onChange={(e) => setCreateIsGroup(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-peerity-600 focus:ring-peerity-500"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Collaborative Group Assignment (requires at least 3 group members)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={creatingAssignment || !createTitle.trim() || !createDeadline}
            >
              {creatingAssignment ? "Creating..." : "Post to Classroom"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── UPLOAD SUBMISSION MODAL (STUDENT) ── */}
      <Modal
        open={!!uploadAssignment}
        onClose={() => {
          setUploadAssignment(null);
          setSelectedFile(null);
          setUploadProgress(0);
        }}
        title={`Upload Submission: ${uploadAssignment?.title}`}
      >
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-xl p-3.5 text-xs text-peerity-900 dark:text-teal-200 flex items-start gap-2.5">
            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-peerity-700 dark:text-teal-400" />
            <p>
              <strong>Private & Secure Upload:</strong> Your submission is securely uploaded for anonymous peer review. Classmates will never see your name or identity.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Select Submission File (PDF or ZIP, max 25MB)
            </label>
            <input
              type="file"
              accept=".pdf,.zip,.tar.gz"
              required
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-peerity-50 file:text-peerity-700 hover:file:bg-peerity-100 dark:file:bg-slate-800 dark:file:text-teal-300"
            />
          </div>

          {selectedFile && (
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-xs">
                {selectedFile.name}
              </span>
              <span className="text-slate-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          )}

          {uploading && (
            <div className="space-y-1">
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-peerity-600 dark:bg-teal-400 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 text-right">
                Uploading: {uploadProgress}%
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              disabled={uploading}
              onClick={() => {
                setUploadAssignment(null);
                setSelectedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={uploading || !selectedFile}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Spinner size="sm" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Submit Assignment</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── DISTRIBUTE REVIEWS MODAL (INSTRUCTOR) ── */}
      <Modal
        open={!!distributeAssignment}
        onClose={() => setDistributeAssignment(null)}
        title="Distribute Anonymous Peer Reviews"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Distribute peer reviews for{" "}
            <strong className="text-slate-900 dark:text-slate-100">
              "{distributeAssignment?.title}"
            </strong>{" "}
            strictly among submissions in classroom{" "}
            <strong className="text-slate-900 dark:text-slate-100">
              {classroom.name}
            </strong>
            .
          </p>

          <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <p>
              <strong>Classroom Isolation:</strong> Only students enrolled in this room who submitted work will receive submissions to review. Self-review is strictly blocked.
            </p>
            <p>
              <strong>Anonymous Reviewing:</strong> Submissions are reviewed under random aliases (e.g. "Reviewer Alpha") with real names hidden.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Reviewers Per Submission
            </label>
            <select
              value={reviewerCount}
              onChange={(e) => setReviewerCount(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-peerity-500"
            >
              <option value={1}>1 Reviewer per submission</option>
              <option value={2}>2 Reviewers per submission (Recommended)</option>
              <option value={3}>3 Reviewers per submission</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              disabled={distributing}
              onClick={() => setDistributeAssignment(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={distributing}
              onClick={handleDistribute}
              className="flex items-center gap-2"
            >
              {distributing ? (
                <>
                  <Spinner size="sm" />
                  <span>Distributing Reviews...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Distribute Peer Reviews</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
