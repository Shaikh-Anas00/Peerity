# Improvements Log

This document lists every change made to the Peerity / TrustReview codebase during the
production-readiness pass, organized by priority. Nothing in this list has been committed
or pushed — it all exists as uncommitted local changes, pending review with the team.

---

## P0 — Critical fixes (correctness + security)

- **Fixed fabricated reviewer data in disclosure responses.** `PolicyEngineService` was
  hardcoding `"Year 3 Undergraduate"` as every reviewer's academic standing instead of
  reading the real field. Now reads `User.academicStanding`.
- **Closed a quorum-bypass endpoint.** `POST /api/appeals/{id}/resolve` let an appeal's
  identity disclosure be authorized without going through the real quorum vote. Deleted
  the endpoint, its service method, and the associated DTO. Disclosure can now only happen
  via `QuorumService.castVote()`.
- **Added a production-secrets guard.** `ProductionSecretsGuard` now refuses to start the
  app under the `prod` profile if `APP_KEY` is still at its committed default value.

## P1 — Structural backend fixes

- **Global exception handler.** Added `GlobalExceptionHandler` (`@RestControllerAdvice`),
  removing ~15 duplicated try/catch blocks across controllers.
- **Auth principal carries the real User.** `PeerityUserDetails` now wraps the actual
  `User` entity, removing 7 duplicated `resolveUser(...)` lookup methods across
  controllers. Fixed two related bugs this surfaced: `User`/`PeerityUserDetails` needed to
  be `Serializable` for session persistence, and several tests needed `@WithUserDetails`
  instead of `@WithMockUser` to get a real principal.
- **Removed the audit ledger's global lock.** `AuditLedgerService.logEvent` no longer uses
  `synchronized`; correctness now comes from a DB unique constraint plus a retry-with-backoff
  loop, verified under a 50-thread concurrency test.
- **Fixed O(n²) reviewer distribution.** `ReviewService.distribute()` now does one bulk
  query instead of one query per candidate pair.
- **Rewrote Analytics to aggregate in SQL.** `AnalyticsService` previously pulled entire
  tables into Java and filtered/aggregated there; now uses scoped SQL queries.
- **Retired the PHP crypto sidecar entirely.** Deleted `php-service/` and
  `CryptoServiceClient.java`. AES-256-GCM file encryption now runs in-process in Java
  (`FileCryptoService`), using the same key derivation and binary layout as before, so
  already-encrypted files still decrypt correctly. One fewer moving part, one fewer process
  to run.
- **Built a shared frontend design system.** New `frontend/src/components/ui/` library
  (`Button`, `Card`, `Input`, `Badge`, `Modal`, `Spinner`, `EmptyState`), each with full
  light/dark styling.
- **Migrated every page onto the design system with full dark-mode support.** All 18
  routed pages now use the shared components and have complete dark-mode coverage (the
  marketing landing page is the one deliberate exception — it uses a fixed brand palette by
  design). The largest page files (700+ lines each: `AppealsPage`, `ReviewsPage`,
  `GroupsPage`, `GroupsManagePage`, `AssignmentsPage`, `FeedbackPage`, `SettingsPage`,
  `ProfilePage`, `ChangePasswordPage`, `AuditPage`, `LandingPage`) were split into
  folders of smaller files along the way.
- Fixed several stale references to the retired PHP sidecar in user-facing copy
  (Privacy Policy, Settings, DocViewer loading states).

## P2 — Feature correctness and quality

- **Shared data-fetching hook.** `useApiResource<T>()` replaces repeated
  `useState`+`useEffect` fetch boilerplate; applied to `AssignmentsPage` so far, available
  for other pages going forward.
- **Real GDPR data export.** `GET /api/users/me/export` now actually serializes and
  downloads the requesting user's own profile, submissions, reviews, and appeals as JSON,
  instead of just flipping a status flag. Deletion requests remain admin-queued (unchanged —
  cascading deletes across submissions/reviews/audit trail need human review).
- **Flyway schema migrations.** The database schema is now version-controlled
  (`V1__baseline.sql`, `V2__password_reset_tokens.sql`) instead of relying on
  Hibernate's `ddl-auto=update`. `ddl-auto=validate` is now used everywhere, so schema drift
  is caught at startup instead of silently tolerated.
- **Self-service password reset.** New `/forgot-password` and `/reset-password` pages and
  matching backend endpoints. Tokens are single-use, expire after 30 minutes, are stored
  only as a hash, and the request flow gives an identical response whether or not the email
  is registered (no account-enumeration signal). Reset links are currently logged rather
  than emailed — swapping in a real email provider only touches that one line.
- **Pagination added** to `/api/groups`, `/api/appeals/pending`, and
  `/api/rubric-templates`, matching the pattern already used by the audit log endpoint.

## P3 — Polish, tooling, and infrastructure

- **Removed dead code.** Deleted an unused `submissionApi.create` method that had no
  matching backend endpoint. (`TestController` was *not* removed — it's still used by the
  admin diagnostics page.)
- **ESLint + Prettier** added to the frontend (`eslint.config.js`, `.prettierrc`), clean
  with 0 errors.
- **Vitest test suite** added — 37 tests covering the new UI component library and the
  `useApiResource` hook. Writing the `Modal` test surfaced and fixed a real accessibility
  bug: the dialog was being hidden from screen readers by a misplaced `aria-hidden`
  attribute on its backdrop, affecting every modal in the app.
- **CI workflow** (`.github/workflows/ci.yml`) — runs backend tests and frontend
  lint/typecheck/test/build on every push and PR.
- **SEO + accessibility pass on the landing page** — meta description, Open Graph tags,
  viewport meta (previously missing entirely), semantic `<main>`/`<section aria-labelledby>`
  landmarks, and a fixed heading-hierarchy skip (`<h4>` directly under `<h2>` in two
  components).
- **Fixed the favicon**, which was silently 404ing (referenced a file that didn't exist).
  Replaced with a proper icon matching the app's existing shield logo.
- **Dockerfiles + docker-compose** for the full stack (MySQL + backend + frontend/nginx).
  Built and ran this for real, which caught a genuine cross-platform bug: the Flyway
  baseline migration's Spring Session table names worked on Windows MySQL (case-insensitive)
  but would have silently failed on any real Linux deployment (case-sensitive by default).
  Fixed in the migration file directly.

---

## Net effect

- Backend test suite: 166 tests passing (was 160 at the start of this pass).
- Frontend: TypeScript strict-checks and lint clean; 37 new tests, 0 before.
- Removed one entire service (the PHP sidecar) and its process-management overhead.
- No breaking changes to existing seeded demo accounts or data.
