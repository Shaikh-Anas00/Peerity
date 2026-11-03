import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ClassroomsPage } from "../ClassroomsPage";
import * as AuthContextModule from "../../context/AuthContext";
import * as ToastContextModule from "../../context/ToastContext";
import { classroomApi, CourseRoom } from "../../api/classroomApi";

vi.mock("../../api/classroomApi");

describe("ClassroomsPage Component", () => {
  const showToastMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ToastContextModule, "useToast").mockReturnValue({
      showToast: showToastMock, toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }, dismissToast: vi.fn(),
    });
  });

  const mockRooms: CourseRoom[] = [
    {
      id: "room-1",
      name: "Distributed Systems Lab",
      courseCode: "CS-401",
      description: "Graduate distributed systems coursework.",
      joinCode: "CS401X",
      instructorId: "inst-1",
      instructorName: "Dr. Alan Turing",
      active: true,
      enrolledCount: 24,
      isEnrolled: true,
      createdAt: "2026-10-01T00:00:00Z",
    },
  ];

  it("renders instructor view with create classroom button, metrics, and room cards", async () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: "inst-1",
        email: "prof@test.edu",
        fullName: "Dr. Alan Turing",
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

    vi.mocked(classroomApi.list).mockResolvedValue({
      data: mockRooms,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    render(
      <MemoryRouter>
        <ClassroomsPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Loading classrooms...")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Create Classroom")).toBeTruthy();
      expect(screen.getByText("Total Classrooms")).toBeTruthy();
      expect(screen.getByText("Distributed Systems Lab")).toBeTruthy();
      expect(screen.getByText("CS-401")).toBeTruthy();
      expect(screen.getByText("CS401X")).toBeTruthy();
      expect(screen.getByText("Enter Classroom")).toBeTruthy();
    });
  });

  it("renders student view with 6-character join input and allows uppercase entry", async () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: "stud-1",
        email: "alice@test.edu",
        fullName: "Alice Student",
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

    vi.mocked(classroomApi.list).mockResolvedValue({
      data: [],
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    render(
      <MemoryRouter>
        <ClassroomsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Join a New Classroom")).toBeTruthy();
      expect(screen.getByText("Not Enrolled in Any Classrooms")).toBeTruthy();
    });

    const input = screen.getByLabelText("6-character join code");
    expect(input).toBeTruthy();

    // Test lowercase converts to uppercase
    fireEvent.change(input, { target: { value: "cs401x" } });
    expect((input as HTMLInputElement).value).toBe("CS401X");
  });
});
