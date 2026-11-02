import { apiClient, type PageResponse } from "./client";
import { RubricCriterion } from "./assignmentApi";

export type RubricTemplateCategory = "ESSAY" | "PRESENTATION" | "CODING" | "CUSTOM";

export interface RubricTemplateDto {
  id: string;
  name: string;
  category: RubricTemplateCategory;
  description: string;
  criteriaJson: string;
  criteria: RubricCriterion[];
  createdAt: string;
  updatedAt: string;
}

export const rubricTemplateApi = {
  /** `size` defaults large — callers (e.g. TemplatePicker) want the full list in one shot, not paginated browsing. */
  getAll: (page = 0, size = 100) =>
    apiClient.get<PageResponse<RubricTemplateDto>>("/rubric-templates", { params: { page, size } }),
  getById: (id: string) => apiClient.get<RubricTemplateDto>(`/rubric-templates/${id}`),
};
