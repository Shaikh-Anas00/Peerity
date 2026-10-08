import { apiClient } from './client';
import { User } from '../context/AuthContext';

export interface UpdateProfilePayload {
  fullName: string;
  institution: string;
  department: string;
  academicStanding?: string;
  avatarUrl?: string;
}

export interface UpdateSettingsPayload {
  notifyNewReview?: boolean;
  notifyDeadlineApproaching?: boolean;
  notifyDisputeStatusChange?: boolean;
  timezone?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface DataRequestPayload {
  actionType: 'EXPORT' | 'DELETION';
  reason?: string;
}

export const userApi = {
  getProfile: () => apiClient.get<User>('/users/profile'),
  updateProfile: (data: UpdateProfilePayload) => apiClient.put<User>('/users/profile', data),
  updateSettings: (data: UpdateSettingsPayload) => apiClient.put<User>('/users/settings', data),
  verifyPassword: (currentPassword: string) => apiClient.post<{ success: boolean; message: string }>('/users/verify-password', { currentPassword }),
  changePassword: (data: ChangePasswordPayload) => apiClient.post<{ success: boolean; message: string }>('/users/change-password', data),
  requestDataAction: (data: DataRequestPayload) => apiClient.post<User>('/users/data-request', data),
};
