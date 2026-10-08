import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Unauthorized } from "./pages/Unauthorized";
import { AssignmentsPage } from "./pages/AssignmentsPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { FeedbackPage } from "./pages/FeedbackPage";
import { AppealsPage } from "./pages/AppealsPage";
import { AuditPage } from "./pages/AuditPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { DiagnosticsPage } from "./pages/DiagnosticsPage";
import LandingPage from "./pages/LandingPage";
import { GroupsPage } from "./pages/GroupsPage";
import { GroupsManagePage } from "./pages/GroupsManagePage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";

export const App: React.FC = () => (
  <Routes>
    {/* ── Public marketing & legal pages (own layout, own nav) ── */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/privacy" element={<PrivacyPolicyPage />} />
    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

    {/* ── Public auth pages ───────────────────────────── */}
    <Route path="/login"        element={<Login />} />
    <Route path="/register"     element={<Register />} />
    <Route path="/unauthorized" element={<Unauthorized />} />

    {/* ── Authenticated — all roles ─────────────────── */}
    <Route element={<AppLayout />}>
      <Route path="/dashboard"   element={<Dashboard />} />
      <Route path="/assignments" element={<AssignmentsPage />} />
      <Route path="/appeals"     element={<AppealsPage />} />
      <Route path="/groups"      element={<GroupsPage />} />
      <Route path="/profile"                  element={<ProfilePage />} />
      <Route path="/settings"                 element={<SettingsPage />} />
      <Route path="/settings/change-password" element={<ChangePasswordPage />} />
    </Route>

    {/* ── Student-only ──────────────────────────────── */}
    <Route element={<AppLayout requiredRoles={["STUDENT"]} />}>
      <Route path="/reviews"  element={<ReviewsPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />
    </Route>

    {/* ── Instructor & Admin: Analytics + Group Manage ─ */}
    <Route element={<AppLayout requiredRoles={["INSTRUCTOR", "ADMIN"]} />}>
      <Route path="/analytics"      element={<AnalyticsPage />} />
      <Route path="/groups/manage"  element={<GroupsManagePage />} />
    </Route>

    {/* ── Admin & Committee: Audit Ledger ──────────── */}
    <Route element={<AppLayout requiredRoles={["ADMIN", "COMMITTEE"]} />}>
      <Route path="/admin/audit" element={<AuditPage />} />
    </Route>

    {/* ── Admin-only: Diagnostics ──────────────────── */}
    <Route element={<AppLayout requiredRoles={["ADMIN"]} />}>
      <Route path="/admin/diagnostics" element={<DiagnosticsPage />} />
    </Route>

    {/* ── Fallback ─────────────────────────────────── */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;

