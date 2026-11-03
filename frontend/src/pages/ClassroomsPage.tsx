import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  classroomApi,
  CourseRoom,
  CourseRoomStudent,
  CreateCourseRoomData,
  DistributeReviewsResult,
} from "../api/classroomApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  GraduationCap,
  Plus,
  Users,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Send,
  AlertCircle,
  Hash,
  School,
  Sparkles,
} from "lucide-react";
import { ContentHeader, StatusPill } from "../components/ContentHeader";
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Badge,
  Modal,
  Spinner,
  EmptyState,
} from "../components/ui";

export const ClassroomsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isInstructor = user?.role === "INSTRUCTOR" || user?.role === "ADMIN";
  const isStudent = user?.role === "STUDENT";

  const [rooms, setRooms] = useState<CourseRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Join Classroom (Student) state
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joining, setJoining] = useState(false);

  // Create Classroom (Instructor) modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCourseRoomData>({
    name: "",
    courseCode: "",
    description: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Roster Modal state
  const [rosterRoom, setRosterRoom] = useState<CourseRoom | null>(null);
  const [students, setStudents] = useState<CourseRoomStudent[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Distribute Reviews Modal state
  const [distributeRoom, setDistributeRoom] = useState<CourseRoom | null>(null);
  const [reviewerCount, setReviewerCount] = useState<number>(2);
  const [distributing, setDistributing] = useState(false);

  // Copied code feedback tracking
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await classroomApi.list();
      setRooms(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load course rooms.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      showToast(`Join code "${code}" copied to clipboard!`, "success");
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      showToast("Could not copy to clipboard.", "error");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = joinCodeInput.trim().toUpperCase();
    if (!trimmed || trimmed.length !== 6) {
      showToast("Join code must be exactly 6 characters.", "warning");
      return;
    }

    try {
      setJoining(true);
      const res = await classroomApi.join(trimmed);
      showToast(`Successfully enrolled in ${res.data.name} (${res.data.courseCode})!`, "success");
      setJoinCodeInput("");
      fetchRooms();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to join course room.";
      showToast(msg, "error");
    } finally {
      setJoining(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.courseCode.trim()) {
      setCreateError("Room name and Course Code are required.");
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);
      const res = await classroomApi.create({
        name: createForm.name.trim(),
        courseCode: createForm.courseCode.trim().toUpperCase(),
        description: createForm.description?.trim() || undefined,
      });
      showToast(`Created ${res.data.name} with join code ${res.data.joinCode}!`, "success");
      setShowCreateModal(false);
      setCreateForm({ name: "", courseCode: "", description: "" });
      fetchRooms();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Failed to create classroom.");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenRoster = async (room: CourseRoom) => {
    setRosterRoom(room);
    setLoadingRoster(true);
    try {
      const res = await classroomApi.getStudents(room.id);
      setStudents(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to load student roster.", "error");
      setRosterRoom(null);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleDistributeReviews = async () => {
    if (!distributeRoom) return;
    try {
      setDistributing(true);
      const res = await classroomApi.distributeReviews(distributeRoom.id, reviewerCount);
      const data: DistributeReviewsResult = res.data;
      showToast(
        `Reviews distributed in ${distributeRoom.name}! ${data.reviewsCreated} reviews assigned across ${data.submissionsProcessed} submissions.`,
        "success"
      );
      setDistributeRoom(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to distribute reviews.", "error");
    } finally {
      setDistributing(false);
    }
  };

  const totalEnrolledAcrossRooms = rooms.reduce((acc, r) => acc + (r.enrolledCount || 0), 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen font-body space-y-8">
      {/* Header */}
      <ContentHeader
        breadcrumbs={["Course", "Classrooms"]}
        title="Classrooms & Course Rooms"
        subtitle={
          isInstructor
            ? "Manage isolated classrooms, share 6-character join codes, and control scoped peer review distribution."
            : "Enroll in course rooms using your instructor's join code to access classroom assignments and peer reviews."
        }
        icon={GraduationCap}
        statusPill={<StatusPill label="ISOLATED ROOMS" variant="brand" />}
        actions={
          isInstructor ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Classroom
            </Button>
          ) : undefined
        }
      />

      {/* Instructor Metric Banner */}
      {isInstructor && !loading && rooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Classrooms
              </span>
              <School className="w-4 h-4 text-peerity-600 dark:text-teal-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-display">
              {rooms.length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Enrolled Students
              </span>
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-display">
              {totalEnrolledAcrossRooms}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Room Isolation
              </span>
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-2">
              Assignments and reviews are kept strictly within enrolled classmates.
            </p>
          </div>
        </div>
      )}

      {/* Student: Join Classroom Card */}
      {isStudent && (
        <Card className="bg-gradient-to-r from-peerity-50 to-white dark:from-slate-900 dark:to-slate-850 border-peerity-200/60 dark:border-slate-800 shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-peerity-700 dark:text-teal-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                    Join a New Classroom
                  </h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Got a 6-character join code from your professor? Enter it below to enroll in the classroom and view scoped assignments and peer reviews.
                </p>
              </div>

              <form onSubmit={handleJoin} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 min-w-[320px]">
                <div className="relative flex-1">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. CS401X"
                    aria-label="6-character join code"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-widest uppercase font-bold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-peerity-500"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={joining || joinCodeInput.trim().length !== 6}
                  className="flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {joining ? (
                    <>
                      <Spinner size="sm" />
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <span>Join Room</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading classrooms...</p>
        </div>
      ) : error ? (
        <Card padding="md" className="border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3 text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </Card>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={<School className="w-6 h-6" />}
          title={isInstructor ? "No Classrooms Created Yet" : "Not Enrolled in Any Classrooms"}
          description={
            isInstructor
              ? "Create your first Course Room to generate a unique 6-character join code for your students and enable isolated peer review pools."
              : "Ask your instructor for your 6-character course join code, or check back once they share it with your cohort."
          }
          action={
            isInstructor ? (
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create First Classroom
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-display">
              {isInstructor ? "Managed Classrooms" : "Enrolled Classrooms"} ({rooms.length})
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const isCopied = copiedCode === room.joinCode;
              return (
                <Card
                  key={room.id}
                  padding="none"
                  onClick={() => navigate(`/classrooms/${room.id}`)}
                  className="group flex flex-col justify-between hover:shadow-lg hover:border-peerity-300 dark:hover:border-slate-700 transition-all cursor-pointer overflow-hidden border-slate-200/90 dark:border-slate-800"
                >
                  <div>
                    {/* Card Header Banner */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/50 group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant="brand" className="font-mono font-bold uppercase tracking-wider text-xs">
                          {room.courseCode}
                        </Badge>
                        {isStudent && room.isEnrolled && (
                          <Badge variant="success" className="text-xs">
                            Enrolled
                          </Badge>
                        )}
                        {isInstructor && (
                          <Badge variant={room.active ? "success" : "default"} className="text-xs">
                            {room.active ? "Active" : "Archived"}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg font-display line-clamp-1 group-hover:text-peerity-700 dark:group-hover:text-teal-400 transition-colors">
                        {room.name}
                      </h3>
                      {room.instructorName && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Instructor: <span className="font-medium text-slate-700 dark:text-slate-300">{room.instructorName}</span>
                        </p>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-4">
                      {room.description ? (
                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                          {room.description}
                        </p>
                      ) : (
                        <p className="text-xs italic text-slate-400 dark:text-slate-500">
                          No description provided.
                        </p>
                      )}

                      {/* Join Code Display (Prominent for Instructor) */}
                      {room.joinCode && (
                        <div
                          className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 flex items-center justify-between"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                              Join Code
                            </span>
                            <span className="font-mono text-base font-bold text-peerity-800 dark:text-teal-300 tracking-wider">
                              {room.joinCode}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCode(room.joinCode!);
                            }}
                            title="Copy join code"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-650 transition active:scale-[0.97]"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Roster count info */}
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{room.enrolledCount} {room.enrolledCount === 1 ? "student" : "students"} enrolled</span>
                        </span>
                        <span className="text-slate-400 dark:text-slate-500">
                          {new Date(room.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div
                    className="p-4 bg-slate-50/70 dark:bg-slate-850/70 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/classrooms/${room.id}`)}
                      className="w-full flex items-center justify-center gap-2 text-xs font-semibold"
                    >
                      <span>Enter Classroom</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>

                    {isInstructor && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenRoster(room)}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Roster ({room.enrolledCount})</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDistributeRoom(room)}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-peerity-800 dark:text-teal-300 border-peerity-300 dark:border-teal-800 hover:bg-peerity-50 dark:hover:bg-teal-950/40"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Distribute</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE CLASSROOM MODAL (INSTRUCTOR) */}
      <Modal
        open={showCreateModal}
        onClose={() => !creating && setShowCreateModal(false)}
        title="Create Course Room"
        subtitle="Generate a new isolated classroom with a 6-character join code for your course."
        maxWidthClass="max-w-md"
        footer={
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={creating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={creating || !createForm.name.trim() || !createForm.courseCode.trim()}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Spinner size="sm" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Room</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Course Code *
            </label>
            <Input
              value={createForm.courseCode}
              onChange={(e) => setCreateForm({ ...createForm, courseCode: e.target.value.toUpperCase() })}
              placeholder="e.g. CS-401 or WT-2026"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">Official course identifier used in rosters and reports.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Classroom Title *
            </label>
            <Input
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. Distributed Systems Lab - Section A"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Brief course description, meeting details, or grading policies..."
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-peerity-500 resize-none font-body"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-peerity-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
            <span>
              A unique 6-character join code (excluding ambiguous letters like O and I) will be automatically generated upon creation.
            </span>
          </div>
        </form>
      </Modal>

      {/* STUDENT ROSTER MODAL (INSTRUCTOR) */}
      <Modal
        open={!!rosterRoom}
        onClose={() => setRosterRoom(null)}
        title={rosterRoom ? `${rosterRoom.courseCode}: Student Roster` : "Student Roster"}
        subtitle={rosterRoom ? `${rosterRoom.name} • ${students.length} enrolled student${students.length !== 1 ? "s" : ""}` : ""}
        maxWidthClass="max-w-2xl"
        footer={
          <Button variant="secondary" onClick={() => setRosterRoom(null)} className="w-full sm:w-auto">
            Close
          </Button>
        }
      >
        {loadingRoster ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Spinner size="md" />
            <p className="text-xs text-slate-500 font-medium">Loading roster...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-display">
              No students enrolled yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Share the join code <strong className="font-mono text-peerity-700 dark:text-teal-300">{rosterRoom?.joinCode}</strong> with your students to have them appear in this roster.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto">
            {students.map((st) => (
              <div key={st.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {st.fullName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {st.email}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {st.department && (
                    <Badge variant="default" className="text-[10px] mb-1">
                      {st.department}
                    </Badge>
                  )}
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Joined {new Date(st.enrolledAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* DISTRIBUTE REVIEWS MODAL (INSTRUCTOR) */}
      <Modal
        open={!!distributeRoom}
        onClose={() => !distributing && setDistributeRoom(null)}
        title="Distribute Peer Reviews"
        subtitle={distributeRoom ? `Scoped to ${distributeRoom.courseCode} (${distributeRoom.name})` : ""}
        maxWidthClass="max-w-md"
        footer={
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => setDistributeRoom(null)}
              disabled={distributing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDistributeReviews}
              disabled={distributing}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {distributing ? (
                <>
                  <Spinner size="sm" />
                  <span>Distributing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Run Distribution</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              Review allocation will strictly select peer reviewers from students enrolled in{" "}
              <strong>{distributeRoom?.name}</strong>. Students outside this classroom cannot review these submissions.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Reviewers per Submission
            </label>
            <Input
              type="number"
              min={1}
              max={5}
              value={reviewerCount}
              onChange={(e) => setReviewerCount(Math.max(1, parseInt(e.target.value) || 2))}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Standard anonymous review uses 2 reviewers per submission.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClassroomsPage;
