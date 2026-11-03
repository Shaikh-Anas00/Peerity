import { apiClient } from "./client";

export interface CourseRoom {
  id: string;
  name: string;
  courseCode: string;
  description?: string;
  joinCode?: string;
  instructorId?: string;
  instructorName?: string;
  instructorEmail?: string;
  active: boolean;
  enrolledCount: number;
  isEnrolled: boolean;
  createdAt: string;
}

export interface CourseRoomStudent {
  id: string;
  fullName: string;
  email: string;
  department?: string;
  academicStanding?: string;
  enrolledAt: string;
}

export interface CreateCourseRoomData {
  name: string;
  courseCode: string;
  description?: string;
}

export interface DistributeReviewsResult {
  assignmentId?: string;
  courseRoomId?: string;
  courseRoomName?: string;
  submissionsProcessed: number;
  reviewsCreated: number;
  reviewersPerSubmission: number;
}

export interface ClassroomAssignment {
  id: string;
  title: string;
  description?: string;
  rubricCriteria?: string;
  rubric?: Array<{ id?: string; name: string; maxScore: number; weight: number }>;
  deadline: string;
  reviewDeadline?: string;
  createdByName?: string;
  createdById?: string;
  createdAt: string;
  hasSubmitted: boolean;
  courseRoomId?: string;
  courseRoomName?: string;
  courseCode?: string;
  submissionCount?: number;
  isGroupAssignment?: boolean;
}

export interface ClassroomSubmission {
  id: string;
  assignmentId?: string;
  assignmentTitle?: string;
  originalFileName: string;
  fileSize?: string;
  fileType?: string;
  filePath?: string;
  fileHash?: string;
  status: string;
  submittedAt: string;
  createdAt?: string;
  courseRoomId?: string;
  courseRoomName?: string;
  authorName?: string;
  authorEmail?: string;
}

export interface ClassroomReview {
  id: string;
  submissionId: string;
  submissionFileName: string;
  fileHash?: string;
  assignmentId?: string;
  assignmentTitle?: string;
  reviewDeadline?: string;
  status: string;
  scores?: string;
  answers?: string;
  feedbackText?: string;
  reviewerPseudonym?: string;
  submittedAt?: string;
  createdAt: string;
}

export interface ClassroomWorkspace {
  classroom: CourseRoom;
  assignments: ClassroomAssignment[];
  mySubmissions: ClassroomSubmission[];
  myReviews: ClassroomReview[];
  students: CourseRoomStudent[];
  canManage: boolean;
  totalSubmissions: number;
  totalReviews: number;
}

export interface CreateClassroomAssignmentData {
  title: string;
  description?: string;
  rubricCriteria?: string;
  rubric?: Array<{ id?: string; name: string; maxScore: number; weight: number }>;
  deadline: string;
  reviewDeadline?: string;
  isGroupAssignment?: boolean;
}

export const classroomApi = {
  create: (data: CreateCourseRoomData) =>
    apiClient.post<CourseRoom>("/classrooms", data),

  join: (joinCode: string) =>
    apiClient.post<CourseRoom>("/classrooms/join", { joinCode }),

  list: () =>
    apiClient.get<CourseRoom[]>("/classrooms"),

  get: (roomId: string) =>
    apiClient.get<CourseRoom>(`/classrooms/${roomId}`),

  getWorkspace: (roomId: string) =>
    apiClient.get<ClassroomWorkspace>(`/classrooms/${roomId}/workspace`),

  getStudents: (roomId: string) =>
    apiClient.get<CourseRoomStudent[]>(`/classrooms/${roomId}/students`),

  removeStudent: (roomId: string, studentId: string) =>
    apiClient.delete<{ success: boolean; message: string }>(
      `/classrooms/${roomId}/students/${studentId}`
    ),

  createAssignment: (roomId: string, data: CreateClassroomAssignmentData) =>
    apiClient.post<ClassroomAssignment>(`/classrooms/${roomId}/assignments`, data),

  distributeReviews: (
    roomId: string,
    reviewerCount: number = 2,
    assignmentId?: string
  ) =>
    apiClient.post<DistributeReviewsResult>(
      `/classrooms/${roomId}/distribute`,
      null,
      { params: { reviewerCount, assignmentId } }
    ),

  uploadSubmission: (roomId: string, assignmentId: string, file: File) => {
    const formData = new FormData();
    formData.append("assignmentId", assignmentId);
    formData.append("courseRoomId", roomId);
    formData.append("file", file);
    return apiClient.post<ClassroomSubmission>("/submissions", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
