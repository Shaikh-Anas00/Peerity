import { apiClient } from "./client";

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  originalFileName: string;
  fileSize: string;
  fileType: string;
  filePath?: string;
  fileHash?: string;
  status: string;
  submittedAt: string;
  createdAt: string;
  authorPseudonym?: string;
  isAnonymousView: boolean;
  authorId?: string;
  authorName?: string;
  authorEmail?: string;
  authorDepartment?: string;
  courseRoomId?: string;
  courseRoomName?: string;
  courseCode?: string;
}

export const submissionApi = {
  createWithFile: (
    assignmentId: string,
    file: File,
    courseRoomIdOrOnProgress?: string | ((percent: number) => void),
    onProgress?: (percent: number) => void
  ) => {
    let courseRoomId: string | undefined;
    let progressCallback = onProgress;
    if (typeof courseRoomIdOrOnProgress === "function") {
      progressCallback = courseRoomIdOrOnProgress;
    } else {
      courseRoomId = courseRoomIdOrOnProgress;
    }

    const formData = new FormData();
    formData.append("assignmentId", assignmentId);
    formData.append("file", file);
    if (courseRoomId) {
      formData.append("courseRoomId", courseRoomId);
    }

    return apiClient.post<Submission>("/submissions", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressCallback && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          progressCallback(percent);
        }
      },
    });
  },

  getMySubmissions: (courseRoomId?: string) =>
    apiClient.get<Submission[]>("/submissions/my", {
      params: courseRoomId ? { courseRoomId } : undefined,
    }),

  getMy: (courseRoomId?: string) =>
    apiClient.get<Submission[]>("/submissions/my", {
      params: courseRoomId ? { courseRoomId } : undefined,
    }),

  downloadSubmissionFile: (submissionId: string) =>
    apiClient.get<Blob>(`/submissions/${submissionId}/file`, {
      responseType: "blob",
    }),

  downloadFile: (submissionId: string) =>
    apiClient.get<Blob>(`/submissions/${submissionId}/file`, {
      responseType: "blob",
    }),
};
