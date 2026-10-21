# DeepDev ERP backend plan (NestJS + PostgreSQL + Prisma + better-auth)

## Context
- **Where things stand:** the frontend (`client/`, Next.js 16) is finished and runs on a mock backend.
- **The spec already exists in the code:**
  - **Endpoints:** `client/src/store/api.ts` defines 115 RTK Query endpoints (41 queries, 74 mutations). They run on `fakeBaseQuery` over an in-memory database (`client/src/mocks/db.ts`), and each mock carries the real business rules (validation, status changes, permission checks).
  - **Data shapes:** `client/src/types/*.ts`.
  - **Contracts:** `client/src/services/paper/` and `client/src/services/tenant/` are typed contracts with endpoint tables and what the backend must enforce.
  - **Modules and permissions:** `client/src/lib/modules.ts` maps modules to routes and permissions; `client/src/lib/auth/permissions.ts` holds roles and route access.
- **Goal:** a real backend in `/server` that implements that spec, so the frontend switches from mocks to the API endpoint by endpoint, without UI changes.

**Decided:**
- NestJS, PostgreSQL, Prisma, better-auth.
- A shared database: every school row carries `tenantId`, enforced by Postgres row-level security (RLS).
- Redis + BullMQ for background jobs.
- Google Cloud Storage for files, through its S3-compatible API.
- Docker everywhere; hosting decided later.

**Defaults (change if needed):**
- PDFs: keep the browser print layouts that already exist.
- SMS/WhatsApp: a pluggable provider, with a "log only" provider until accounts exist.
- Shared types: NestJS generates an OpenAPI spec, and the frontend generates its types from it.

**Status:** Phase 0 (foundation) is built. See "Running it" and the endpoint map at the end.

**Versions in use:** NestJS 12, Prisma 7 (driver adapter `@prisma/adapter-pg`, `prisma.config.ts`), better-auth 1.7, TypeScript 6, Node 22+ (developed on Node 24). The plan below originally named NestJS 11 and Prisma 6; we started on the current stable majors instead.

---

## Architecture
- **Repo:** `/server` sits next to `/client` as a separate npm project, because the client uses npm. No workspace monorepo.
- **Runtime:** Node 22 LTS, NestJS 11, Prisma 6, better-auth 1.x. Versions are pinned to the latest stable at scaffold time.
- **Same-origin API:**
  - In every environment, Next.js rewrites `/api/*` to Nest (`client/next.config.ts`). Cookies stay first-party, with no CORS or cross-site cookie problems.
  - Nest uses the global prefix `/api`. better-auth is mounted at `/api/auth/*` with `toNodeHandler`, in front of Nest's body parser.
- **Layout:**
  - `server/src/modules/<domain>/`: controller, service and DTOs (class-validator).
  - `server/src/common/`: guards, decorators, the Prisma tenant extension, errors, pagination.
  - `server/src/jobs/`: BullMQ processors.
  - `server/prisma/`: schema, migrations, RLS SQL and the seed.
- **API style:**
  - REST, with resource routes named after the RTK endpoint names, so mapping is mechanical. For example `getStudents` → `GET /api/students` and `recordPayment` → `POST /api/payments`.
  - Errors follow the mock's `{ status, message }` shape, so `errorMessage()` in the client keeps working.
  - Swagger is served at `/api/docs`, and the OpenAPI JSON is exported for client type generation.
- **Conventions carried over from the frontend:**
  - Money is a whole-rupee `Int`.
  - School dates are `@db.Date` columns (calendar days in Asia/Karachi), with server-side "today" in that zone. This matches `client/src/lib/dates.ts`.
  - Human numbers (`STD-1042`, `STF-201`, voucher and receipt numbers) come from a per-tenant `Counter` table, assigned inside the same transaction.
  - Records are withdrawn or cancelled, never deleted, matching the mocks' reversible flows.

## Tenancy, auth and access (the core of Phase 0)
- **better-auth plugins:**
  - Email and password sessions in an httpOnly cookie.
  - The **organization** plugin: an organization is a tenant (school), and membership carries the user's role.
  - The **admin** plugin: super_admin, plus impersonation for the Console's "View as owner".
  - Password reset feeds the existing `/reset-password` page.
- **Per-school user data:** a `Member` extension holds the role (`owner | branch_admin | accountant | front_desk | teacher`), `branchIds` and `staffId`.
- **Four guards on every school route, in order:**
  1. **AuthGuard:** a valid better-auth session, or 401.
  2. **TenantGuard:** resolves the active organization, then 403 if the school is suspended. A super_admin while impersonating becomes the owner.
  3. **ModuleGuard:** `@RequireModule('fees')` on the controller, using the same map as `client/src/lib/modules.ts` (ported to `server/src/common/modules.ts`, kept identical). 403 "Not part of your plan".
  4. **PermissionGuard:** `@RequirePermission('fin_collect_fee')` checks the school's `RolePermission` matrix (port of `hasPermission` in `client/src/lib/auth/permissions.ts`). No role names in feature code.
- **Data isolation:**
  - A Prisma client extension wraps each request in a transaction running `SELECT set_config('app.tenant_id', $1, true)`.
  - RLS policies on every tenant table require `tenant_id = current_setting('app.tenant_id')`.
  - Platform (Console) routes use a separate bypass connection role, used only by the console module.
- **Branch scoping:** the active campus comes from an `x-branch-id` header (from the client's `session.branchId`), checked against the member's `branchIds`.
- **Read-only past sessions:** mutations on a closed academic session are refused (the server-side version of `useReadOnly`).
- **Audit:** an `AuditLog` (tenantId, actor, action, entity, before/after, at) is written by an interceptor on mutations. It backs the student activity log, Console history and register changes.

## Data model (Prisma, derived from `client/src/types`)
- **Platform:** `Tenant` (status, modules[], studentSeats), `TenantEvent`, better-auth tables (`user`, `session`, `account`, `organization`, `member`, `invitation`).
- **School setup:** `Branch`, `AcademicSession`, `CampusProfile`, `SchoolRules` (JSON columns for grading bands, holidays and notification settings), `RolePermission`, `Counter`.
- **Academics:** `SchoolClass`, `Section`, `Subject`, `ClassSubject`.
- **Students:** `Student`, `Guardian`, `StudentDocument` (GCS object key), `StudentActivity` (a view over `AuditLog`), siblings as a join table.
- **Attendance:** `AttendanceRegister` + `RegisterMark`, `RegisterChange`, `UnlockRequest`, `StaffAttendanceDay`.
- **Fees:** `FeeHead`, `FeePlan`, `Concession`, `FeeVoucher` + `VoucherLine`, `Payment`, `DayClosing`, `FeeReminder`.
- **Staff:** `StaffMember` (allowances as JSON), `TeacherAllocation`, `PayrollRun`, `Payslip`, `Advance`.
- **Exams:** `Exam`, `ExamPaper` (date sheet), `ExamMark`.
- **Paper maker (global catalogue, so no tenantId):** `Board`, `CatalogClass`, `Book`, `Chapter`, `SubTopic`, `BankQuestion`.
- **Paper maker (per school):** `Paper` (questions as JSON snapshots), `PaperEvent`.
- **Messages:** `MessageTemplate`, `MessageBatch` + `MessageRecipient`.

The full field list goes in `BACKEND-PLAN.md`.

## Business rules to port (source: the mock `queryFn`s in `client/src/store/api.ts`)
- **Fees:**
  - Voucher building comes from `client/src/lib/fees.ts` (`buildVoucher`, `settleVoucher`, `feeStanding`, `voucherState`, `lateFineFor`, `graceEnds`).
  - Payments and reversals only on days not yet closed.
  - Idempotency key on `recordPayment`.
- **Payroll:** `client/src/lib/payroll.ts` (`computePayslip`, `monthlyTax`, EOBI, advance recovery); flow is draft → finalised → paid.
- **Results:** `client/src/lib/results.ts` (`computeResults`, `rankResults`, `sitsPaper`, `sectionRoster`) and `client/src/lib/grades.ts`.
- **Attendance:**
  - Lock windows from `SchoolRules`, holidays and Sundays, and the reopen flow.
  - Who may mark (port of `useRegisterPermissions` in `client/src/features/attendance/hooks.ts`).
  - `submitRegister` is idempotent for the phone's offline outbox.
- **Paper maker:** `client/src/services/paper/mockPaperService.ts` and `paperProblem()` in `contract.ts` (ownership, status changes, canPrintPapers).
- **Console:** `client/src/services/tenant/mockTenantService.ts` (`withRequirements`, seat checks, suspension reason).
- **Messaging:** `client/src/lib/messaging.ts` (`smsSegments`, `messageCost`, `renderTemplate`, `deliveryChannel`).
- **How to port:** these pure functions move into `server/src/domain/*` (copied, not imported across apps) with unit tests built from the mock data.

## Jobs, files, messaging
- **BullMQ queues:**
  - `vouchers` (monthly generation)
  - `alerts` (absence WhatsApp after register submit)
  - `reminders` (fee reminders)
  - `messages` (fan-out per recipient, with retries)
  - `payroll` (start payroll for large staff lists)
- **Redis** also caches each tenant's plan and permission matrix (invalidated on change).
- **Files:**
  - `@aws-sdk/client-s3` pointed at `https://storage.googleapis.com` with GCS HMAC keys; MinIO in local Docker.
  - Uploads use presigned PUT URLs, and the API stores only the object key.
  - Used for documents, school logos and (later) PDFs.
- **Messaging:** a `MessageProvider` interface (`send(channel, phone, text)`) with a `LogProvider` now; WhatsApp Cloud API and SMS gateway adapters later.

## Frontend switch (gradual, no UI changes)
- **Mixed base query:**
  - Replace `fakeBaseQuery` in `client/src/store/api.ts` with one that runs either the existing mock `queryFn` or a real `fetchBaseQuery` call (base `/api`, `credentials: 'include'`, `x-branch-id` header).
  - The choice is per endpoint, from a `MIGRATED` set plus `NEXT_PUBLIC_API_MODE=mock|api`. Unmigrated modules keep working on mocks, and demo mode stays available.
- **Sign-in:**
  - `client/src/app/(auth)/login` calls better-auth instead of setting `dd_session`.
  - `client/src/proxy.ts` asks `/api/auth/get-session` (role and tenant) in place of `findUser`. Route rules in `permissions.ts` are unchanged.
  - The session slice is fed from `/api/me`.
- **Startup data:** the server-side cache prefill (`prefilledReads`, `StoreProvider` `serverState`) is used only in mock mode. In API mode, screens use their existing empty or loading defaults.
- **Types:** `npm run gen:api` (openapi-typescript) into `client/src/types/api.d.ts`; the hand-written types stay until each module is migrated.

## Phases (each ends with tests passing and stops for approval)
- **Phase 0, Foundation (built on approval):**
  - `/server` scaffold, Docker Compose (Postgres 16, Redis 7; local file storage deferred, see notes), config validated with zod.
  - Prisma core models: platform, school setup, auth, audit.
  - RLS migration, better-auth with the organization and admin plugins.
  - The four guards and the Prisma tenant extension.
  - Seed from `client/src/mocks` (users, tenants, branches, sessions, permissions, rules, campus profile).
  - Endpoints: `me`, `getMyTenant`, `getBranches`/`addBranch`, `getSessions`/`addSession`/`setCurrentSession`, `getUsers`/`inviteUser`/`setUserStatus`, `getCampusProfile`/`updateCampusProfile`, `getRolePermissions`/`updateRolePermissions`, `getSchoolRules`/`updateSchoolRules`.
  - Swagger, plus the mixed base query and real sign-in on the client.
- **Phase 1:** Academics (classes, sections, subjects, class subjects) and Students (admit, import with seat limit, edit, guardians, documents through GCS, transfer, withdraw and readmit, activity).
- **Phase 2:** Attendance (registers, lock and unlock, reopen requests, alerts job, staff attendance).
- **Phase 3:** Fees (structure, vouchers job, counter payments and reversals, closing, defaulters, reminders).
- **Phase 4:** Staff and Payroll (staff, allocations, payroll runs, payslips, advances).
- **Phase 5:** Exams (exams, date sheet, marks autosave, results, publishing).
- **Phase 6:** Paper maker (global catalogue and question bank, papers, print queue, canPrintPapers).
- **Phase 7:** Messages (templates, audiences, cost, provider fan-out job, send log) and notifications.
- **Phase 8:** Reports (SQL views or queries behind the 12 report definitions in `client/src/features/reports/definitions.ts`) and dashboard data (replacing `client/src/services/dashboard`).
- **Phase 9:** Console (tenants list and create, modules, seats, status, view-as through admin impersonation).
- **Phase 10:** Hardening (rate limits, security headers, backups, observability, production Dockerfiles, CI, deploy guide for whichever host is chosen).

## Phase 0 files (as built)
- **New, server:**
  - Prisma: `server/prisma/schema.prisma`, `server/prisma/migrations/*` (including `rls.sql`), `server/prisma/seed.ts`.
  - App: `server/src/main.ts`, `server/src/app.module.ts`, `server/src/auth/auth.ts` (better-auth config), `server/src/auth/auth.module.ts`.
  - Common: `server/src/common/{guards,decorators,prisma,modules.ts,errors}`.
  - Modules: `server/src/modules/{me,tenant,branches,sessions,users,settings}/*`.
  - Infra and config: `server/docker-compose.yml`, `server/.env.example`, `server/test/{unit,e2e}/*.test.mjs` (Node's built-in test runner: Jest can't load better-auth's ES modules).
- **Edited, client:**
  - `client/next.config.ts` (the `/api` rewrite)
  - `client/src/store/api.ts` (mixed base query plus the `MIGRATED` set)
  - `client/src/app/(auth)/login/page.tsx`
  - `client/src/proxy.ts`
  - `client/src/store/StoreProvider.tsx` (prefill only in mock mode)
  - `client/package.json` (`gen:api`)
- **Reused, not rewritten:** the business-rule functions listed above; `ROUTE_ACCESS`/`canAccessPath` and `MODULES` stay as the frontend's source, mirrored on the server.

## Verification
1. `docker compose up -d`, then `npx prisma migrate dev` and `npx prisma db seed` in `/server`.
2. `npm run test` (unit tests: guards, permission matrix, module map, ported rules) and `npm run test:e2e` (supertest against a test database). The e2e tests include:
   - RLS leak tests: tenant A can't read tenant B even with a raw query.
   - A suspended school gets 403.
   - An off module gets 403.
   - A missing permission gets 403.
3. `GET /api/docs` shows Swagger; `npm run gen:api` produces client types without errors.
4. Run the client with `NEXT_PUBLIC_API_MODE=api` and sign in as the seeded owner through better-auth:
   - Settings (campus profile, users, roles, rules) and branch or session switching hit the real API, and changes survive a reload (they didn't with mocks).
   - Every other screen still works on mocks.
5. Rerun the existing browser suites from the session scratchpad (`flows.mjs`, `flows-b.mjs`) in API mode for the migrated screens, plus the axe/overflow audit, so the UI is unchanged.

## Running it (local development)

```bash
# Services: Postgres 16 (port 5433) and Redis 7 (port 6380)
cd server && docker compose up -d
cp .env.example .env            # first time only
npx prisma migrate deploy && npx prisma generate
npx prisma db seed              # demo schools and logins; password for every demo login: deepdev123
npm run dev                     # API on http://localhost:4000/api, Swagger at /api/docs

# Web app against the real API (unmigrated screens still use mocks)
cd ../client && NEXT_PUBLIC_API_MODE=api npm run dev
```

- **Demo logins (password `deepdev123`):**
  - `tayyab@erp.com` (owner)
  - `usman@erp.com` (branch admin)
  - `ali@erp.com` (accountant)
  - `sana@erp.com` (front desk)
  - `tariq.mahmood@erp.com` (teacher)
  - `support@deepdev.pk` (platform admin)
  - The other schools' owners: `rabia@brightfuture.pk`, `kashif@scholarshub.pk` and `farah@crescent.edu.pk` (suspended).
- **Tests:**
  - `npm test` runs the unit tests: permission rule, guards, and server/client module-map parity.
  - `npm run test:e2e` reseeds the `deepdev_test` database and runs the end-to-end suite: sign-in, row-level security leak checks, suspension, permissions, invites, settings.
- **API types for the client:** `npm run openapi` in `server/`, then `npm run gen:api` in `client/`.
- **Two database roles:**
  - `deepdev` owns the schema. It's used for migrations, the seed, the auth layer and (later) the Console.
  - `app_user` serves every school request, under row-level security.
  - Both are created by `server/docker/postgres-init.sql`.

## Notes from Phase 0

- **Local file storage:** MinIO couldn't be pulled (Docker Hub denied it and quay.io was unreachable from this network). Pick a local S3-compatible option in Phase 1, or use a Google Cloud Storage dev bucket.
- **Email:** password-reset and invite links are recorded in `authOutbox` and logged until an email provider is chosen.
- **Sign-in:**
  - Public self sign-up is off. Schools and staff come from the Console and invites.
  - A suspended school's users are refused at sign-in and on every request.
- **Permission matrix:** only the school owner may change it, so no role can grant itself more access.
- **Audit:** mutations write `audit_log` through `AuditService` (explicit calls rather than an interceptor).

## Endpoint map (all 115 frontend endpoints)

| RTK endpoint | Kind | REST route | Status |
|---|---|---|---|
| `addBranch` | mutation | `POST /api/branches` | ✅ Phase 0 |
| `addSession` | mutation | `POST /api/sessions` | ✅ Phase 0 |
| `getBranches` | query | `GET /api/branches` | ✅ Phase 0 |
| `getCampusProfile` | query | `GET /api/settings/campus-profile` | ✅ Phase 0 |
| `getMyTenant` | query | `GET /api/tenant` | ✅ Phase 0 |
| `getRolePermissions` | query | `GET /api/settings/permissions` | ✅ Phase 0 |
| `getSchoolRules` | query | `GET /api/settings/rules` | ✅ Phase 0 |
| `getSessions` | query | `GET /api/sessions` | ✅ Phase 0 |
| `getUsers` | query | `GET /api/users` | ✅ Phase 0 |
| `inviteUser` | mutation | `POST /api/users` | ✅ Phase 0 |
| `setCurrentSession` | mutation | `PUT /api/sessions/current` | ✅ Phase 0 |
| `setUserStatus` | mutation | `PATCH /api/users/:id/status` | ✅ Phase 0 |
| `updateCampusProfile` | mutation | `PUT /api/settings/campus-profile` | ✅ Phase 0 |
| `updateRolePermissions` | mutation | `PUT /api/settings/permissions` | ✅ Phase 0 |
| `updateSchoolRules` | mutation | `PUT /api/settings/rules` | ✅ Phase 0 |
| `addClass` | mutation | `POST /api/classes` | Phase 1 |
| `addSection` | mutation | `POST /api/sections` | Phase 1 |
| `addStudentDocument` | mutation | `POST /api/students/:id/documents` | Phase 1 |
| `addSubject` | mutation | `POST /api/subjects` | Phase 1 |
| `admitStudent` | mutation | `POST /api/students` | Phase 1 |
| `changeSection` | mutation | `POST /api/students/:id/change-section` | Phase 1 |
| `deleteStudent` | mutation | `DELETE /api/students/:id` | Phase 1 |
| `getClassSubjects` | query | `GET /api/class-subjects` | Phase 1 |
| `getClasses` | query | `GET /api/classes` | Phase 1 |
| `getSections` | query | `GET /api/sections` | Phase 1 |
| `getStudentActivity` | query | `GET /api/students/activity` | Phase 1 |
| `getStudents` | query | `GET /api/students` | Phase 1 |
| `getSubjects` | query | `GET /api/subjects` | Phase 1 |
| `importStudents` | mutation | `POST /api/students/import` | Phase 1 |
| `readmitStudent` | mutation | `POST /api/students/:id/readmit` | Phase 1 |
| `removeClass` | mutation | `DELETE /api/classes/:id` | Phase 1 |
| `removeSection` | mutation | `DELETE /api/sections/:id` | Phase 1 |
| `removeStudentDocument` | mutation | `DELETE /api/students/:id/documents/:docId` | Phase 1 |
| `removeSubject` | mutation | `DELETE /api/subjects/:id` | Phase 1 |
| `setClassSubject` | mutation | `PUT /api/class-subjects` | Phase 1 |
| `setElectives` | mutation | `PUT /api/students/:id/electives` | Phase 1 |
| `transferStudent` | mutation | `POST /api/students/:id/transfer` | Phase 1 |
| `updateGuardians` | mutation | `PUT /api/students/:id/guardians` | Phase 1 |
| `updateSection` | mutation | `PATCH /api/sections/:id` | Phase 1 |
| `updateStudent` | mutation | `PATCH /api/students/:id` | Phase 1 |
| `withdrawStudent` | mutation | `POST /api/students/:id/withdraw` | Phase 1 |
| `decideUnlock` | mutation | `POST /api/unlock-requests/:id/decision` | Phase 2 |
| `getRegisters` | query | `GET /api/registers` | Phase 2 |
| `getStaffAttendance` | query | `GET /api/staff-attendance` | Phase 2 |
| `getUnlockRequests` | query | `GET /api/unlock-requests` | Phase 2 |
| `lockRegisters` | mutation | `POST /api/registers/lock` | Phase 2 |
| `markAlertsSent` | mutation | `POST /api/registers/alerts` | Phase 2 |
| `requestUnlock` | mutation | `POST /api/unlock-requests` | Phase 2 |
| `saveStaffAttendance` | mutation | `PUT /api/staff-attendance/:date` | Phase 2 |
| `submitRegister` | mutation | `PUT /api/registers (idempotent)` | Phase 2 |
| `unlockRegister` | mutation | `POST /api/registers/:id/unlock` | Phase 2 |
| `cancelVoucher` | mutation | `POST /api/vouchers/:id/cancel` | Phase 3 |
| `closeDay` | mutation | `POST /api/day-closings` | Phase 3 |
| `generateVouchers` | mutation | `POST /api/vouchers/generate (job)` | Phase 3 |
| `getConcessions` | query | `GET /api/concessions` | Phase 3 |
| `getDayClosings` | query | `GET /api/day-closings` | Phase 3 |
| `getFeeHeads` | query | `GET /api/fee-heads` | Phase 3 |
| `getFeePlans` | query | `GET /api/fee-plans` | Phase 3 |
| `getFeeReminders` | query | `GET /api/fee-reminders` | Phase 3 |
| `getPayments` | query | `GET /api/payments` | Phase 3 |
| `getVouchers` | query | `GET /api/vouchers` | Phase 3 |
| `recordPayment` | mutation | `POST /api/payments (idempotency key)` | Phase 3 |
| `removeConcession` | mutation | `DELETE /api/concessions/:id` | Phase 3 |
| `removeFeeHead` | mutation | `DELETE /api/fee-heads/:id` | Phase 3 |
| `reversePayment` | mutation | `POST /api/payments/:id/reverse` | Phase 3 |
| `saveConcession` | mutation | `PUT /api/concessions` | Phase 3 |
| `saveFeeHead` | mutation | `PUT /api/fee-heads` | Phase 3 |
| `saveFeePlan` | mutation | `PUT /api/fee-plans` | Phase 3 |
| `sendFeeReminders` | mutation | `POST /api/fee-reminders (job)` | Phase 3 |
| `addAdvance` | mutation | `POST /api/advances` | Phase 4 |
| `finalisePayroll` | mutation | `POST /api/payroll-runs/:id/finalise` | Phase 4 |
| `getAdvances` | query | `GET /api/advances` | Phase 4 |
| `getAllocations` | query | `GET /api/allocations` | Phase 4 |
| `getPayrollRuns` | query | `GET /api/payroll-runs` | Phase 4 |
| `getPayslips` | query | `GET /api/payslips` | Phase 4 |
| `getStaff` | query | `GET /api/staff` | Phase 4 |
| `getTeachers` | query | `GET /api/staff/teachers` | Phase 4 |
| `markPayslipsPaid` | mutation | `POST /api/payslips/paid` | Phase 4 |
| `saveStaff` | mutation | `PUT /api/staff` | Phase 4 |
| `setAllocation` | mutation | `PUT /api/allocations` | Phase 4 |
| `setStaffStatus` | mutation | `POST /api/staff/:id/status` | Phase 4 |
| `startPayroll` | mutation | `POST /api/payroll-runs (job)` | Phase 4 |
| `updatePayslip` | mutation | `PATCH /api/payslips/:id` | Phase 4 |
| `deleteExam` | mutation | `DELETE /api/exams/:id` | Phase 5 |
| `getExamMarks` | query | `GET /api/exam-marks` | Phase 5 |
| `getExamPapers` | query | `GET /api/exam-papers` | Phase 5 |
| `getExams` | query | `GET /api/exams` | Phase 5 |
| `saveDateSheet` | mutation | `PUT /api/exams/:id/date-sheet` | Phase 5 |
| `saveExam` | mutation | `PUT /api/exams` | Phase 5 |
| `saveMarks` | mutation | `PUT /api/exam-marks` | Phase 5 |
| `setResultsPublished` | mutation | `POST /api/exams/:id/publish` | Phase 5 |
| `getPaperCatalog` | query | `GET /api/paper-catalog` | Phase 6 |
| `getPapers` | query | `GET /api/papers` | Phase 6 |
| `getPrintablePaper` | query | `GET /api/papers/:id/printable` | Phase 6 |
| `getQuestionBank` | query | `GET /api/question-bank` | Phase 6 |
| `markPaperPrinted` | mutation | `POST /api/papers/:id/printed` | Phase 6 |
| `returnPaper` | mutation | `POST /api/papers/:id/return` | Phase 6 |
| `savePaperDraft` | mutation | `POST|PUT /api/papers` | Phase 6 |
| `submitPaper` | mutation | `POST /api/papers/:id/submit` | Phase 6 |
| `deleteMessageTemplate` | mutation | `DELETE /api/message-templates/:id` | Phase 7 |
| `getMessageTemplates` | query | `GET /api/message-templates` | Phase 7 |
| `getMessages` | query | `GET /api/messages` | Phase 7 |
| `saveMessageTemplate` | mutation | `POST /api/message-templates` | Phase 7 |
| `sendMessages` | mutation | `POST /api/messages (job)` | Phase 7 |
| `getTeacherDay` | query | `GET /api/teacher/day` | Phase 8 |
| `createTenant` | mutation | `POST /api/console/tenants` | Phase 9 |
| `deleteBankQuestion` | mutation | `POST /api/console/question-bank/:id/delete` | Phase 9 |
| `deleteCatalogItem` | mutation | `POST /api/console/paper-catalog/:kind/:id/delete` | Phase 9 |
| `getTenants` | query | `GET /api/console/tenants` | Phase 9 |
| `logViewAs` | mutation | `POST /api/console/tenants/:id/view-as` | Phase 9 |
| `saveBankQuestion` | mutation | `POST|PUT /api/console/question-bank` | Phase 9 |
| `saveCatalogItem` | mutation | `POST|PUT /api/console/paper-catalog` | Phase 9 |
| `setTenantModules` | mutation | `PUT /api/console/tenants/:id/modules` | Phase 9 |
| `setTenantSeats` | mutation | `PUT /api/console/tenants/:id/seats` | Phase 9 |
| `setTenantStatus` | mutation | `PUT /api/console/tenants/:id/status` | Phase 9 |
