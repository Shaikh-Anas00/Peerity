import { apiClient } from "./client";

export interface AuditLog {
  id: string;
  sequenceNumber: number;
  action: string;
  actorEmail?: string;
  targetEntity?: string;
  targetId?: string;
  payloadHash: string;
  previousEntryHash: string;
  currentEntryHash: string;
  timestamp: string;
  details?: string;
  ipAddress?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface IntegrityVerificationResult {
  valid: boolean;
  totalRecords: number;
  brokenSequenceAt: number | null;
  verifiedAt: string;
  message: string;
}

export const auditApi = {
  getLogs: (page = 0, size = 20) =>
    apiClient.get<PageResponse<AuditLog>>(`/audit/logs?page=${page}&size=${size}`),

  verifyLedger: () =>
    apiClient.get<IntegrityVerificationResult>("/audit/verify"),
};
