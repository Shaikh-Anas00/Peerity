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
}

export interface CreateSubmissionPayload {
  assignmentId: string;
  originalFileName: string;
  fileSize?: string;
  fileType?: string;
}

export const submissionApi = {
  create: (data: CreateSubmissionPayload) =>
    apiClient.post<Submission>("/submissions", data),

  createWithFile: (
    assignmentId: string,
    file: File,
    onProgress?: (percent: number) => void
  ) => {
    const formData = new FormData();
    formData.append("assignmentId", assignmentId);
    formData.append("file", file);

    return apiClient.post<Submission>("/submissions", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },

  downloadFile: (submissionId: string) =>
    apiClient.get<Blob>(`/submissions/${submissionId}/file`, {
      responseType: "blob",
    }),

  getMy: () => apiClient.get<Submission[]>("/submissions/my"),
};