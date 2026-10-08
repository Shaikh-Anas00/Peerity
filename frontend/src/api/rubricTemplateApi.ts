import { apiClient } from "./client";
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
  getAll: () => apiClient.get<RubricTemplateDto[]>("/rubric-templates"),
  getById: (id: string) => apiClient.get<RubricTemplateDto>(`/rubric-templates/${id}`),
};
