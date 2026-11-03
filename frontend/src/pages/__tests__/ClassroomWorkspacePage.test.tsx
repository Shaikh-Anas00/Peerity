import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ClassroomWorkspacePage } from "../ClassroomWorkspacePage";
import * as AuthContextModule from "../../context/AuthContext";
import * as ToastContextModule from "../../context/ToastContext";
import { classroomApi, ClassroomWorkspace } from "../../api/classroomApi";

vi.mock("../../api/classroomApi");
vi.mock("../../api/rubricTemplateApi", () => ({
  rubricTemplateApi: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe("ClassroomWorkspacePage Component", () => {
  const showToastMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ToastContextModule, "useToast").mockReturnValue({
      showToast: showToastMock, toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }, dismissToast: vi.fn(),
    });
  });

  const mockWorkspace: ClassroomWorkspace = {
    classroom: {
      id: "room-101",
      name: "Advanced Distributed Systems",
      courseCode: "CS-501",
      description: "Fault tolerance and distributed consensus.",
      joinCode: "CS501X",
      instructorId: "inst-1",
      instructorName: "Dr. Barbara Liskov",
      instructorEmail: "liskov@mit.edu",
      active: true,
      enrolledCount: 3,
      isEnrolled: true,
      createdAt: "2026-10-01T00:00:00Z",
    },
    assignments: [
      {
        id: "assign-1",
        title: "Raft Consensus Algorithm",
        description: "Implement leader election and log replication.",
        deadline: "2026-11-15T23:59:00Z",
        reviewDeadline: "2026-11-22T23:59:00Z",
        createdAt: "2026-10-05T00:00:00Z",
        hasSubmitted: false,
        submissionCount: 3,
        rubric: [{ name: "Safety Guarantees", maxScore: 10, weight: 1.0 }],
      },
    ],
    mySubmissions: [],
    myReviews: [],
    students: [
      {
        id: "stud-1",
        fullName: "Leslie Lamport",
        email: "lamport@test.edu",
        department: "Computer Science",
        academicStanding: "Senior",
        enrolledAt: "2026-10-02T00:00:00Z",
      },
    ],
    canManage: true,
    totalSubmissions: 3,
    totalReviews: 6,
  };

  it("renders instructor view with banner, assignments, and create assignment button", async () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: "inst-1",
        email: "liskov@mit.edu",
        fullName: "Dr. Barbara Liskov",
        role: "INSTRUCTOR",
        isActive: true,
      },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateUserState: vi.fn(),
    });

    vi.mocked(classroomApi.getWorkspace).mockResolvedValue({
      data: mockWorkspace,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    render(
      <MemoryRouter initialEntries={["/classrooms/room-101"]}>
        <Routes>
          <Route path="/classrooms/:id" element={<ClassroomWorkspacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Advanced Distributed Systems")).toBeTruthy();
      expect(screen.getByText("CS-501")).toBeTruthy();
      expect(screen.getByText("Dr. Barbara Liskov")).toBeTruthy();
      expect(screen.getByText("Raft Consensus Algorithm")).toBeTruthy();
      expect(screen.getByText("Create Classroom Assignment")).toBeTruthy();
      expect(screen.getByText("CS501X")).toBeTruthy();
    });
  });

  it("renders 403 Forbidden screen when outsider student tries to view an unauthorized room", async () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: "stud-outsider",
        email: "outsider@test.edu",
        fullName: "Outsider Student",
        role: "STUDENT",
        isActive: true,
      },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateUserState: vi.fn(),
    });

    vi.mocked(classroomApi.getWorkspace).mockRejectedValue({
      response: {
        status: 403,
        data: { message: "You are not authorized to access this course room." },
      },
    });

    render(
      <MemoryRouter initialEntries={["/classrooms/room-restricted"]}>
        <Routes>
          <Route path="/classrooms/:id" element={<ClassroomWorkspacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Access Restricted (403 Forbidden)")).toBeTruthy();
      expect(screen.getByText(/You are not enrolled in this classroom/)).toBeTruthy();
    });
  });
});
