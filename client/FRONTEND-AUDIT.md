# DeepDev ERP frontend audit, against the reference checklist

> **Progress, 17 Oct 2026:** Phases A and B are done (Phase A except the visual parts of A9). Phase C is done. Phase D is done except D6's on-screen month view. Phase E is done; B1 is also fixed properly through payment records. B3, B5 and B10 are fixed. See the checkboxes in §8. B1 (repeat payment) and B7 (shortcuts open the wrong tab) are fixed. Rendered markup is unchanged from the redesign, checked by a DOM diff of 25 screens at 1440 and 390px.

*Read-only, `client/` on `feat/ui-redesign` at `0fb81aa`, 13 Oct 2026. I read every UI file under `src/` plus `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `components.json` and `globals.css`. There is no Tailwind config file, because Tailwind v4 is configured in CSS. I ran `npx tsc --noEmit` and `npx eslint` without `--fix`.*

**Definitions:**
- **Fake**: shows success after a `setTimeout` but stores nothing.
- **Dead**: has no handler.

## 1. Executive summary

**Pages: 4 Done, 9 Partial, 2 Broken and 17 Missing.** That's 15 page files in code, plus 17 checklist pages with no route.

The code is a polished, accessible shell:
- A shared layout and sidebar, plus `loading`, `error` and `not-found` boundaries.
- A consistent token-based design system on Shadcn (Base UI).
- 0 TypeScript errors and 0 ESLint problems.
- It covers the daily demo flows: mark and lock attendance, collect a fee, defaulters, admission form, marks entry, allocations, payroll and a 3-step paper wizard.

Underneath, there is:
- **No data layer.** Every entity is a hardcoded array inside its component.
- **No Redux.** It isn't in `package.json`; `@reduxjs` is only a recharts dependency.
- **No MSW or RTK Query, no auth, no session, no role or permission model, and no branch, session or user context.** The branch switcher changes nothing.
- **No URL state.** Tabs and filters reset on refresh, and dashboard shortcuts open the wrong tab.

**Two flows are broken:**
- The fee counter lets you take a second payment on a voucher that was just paid.
- Paper Maker's "Print" prints the app screen rather than a paper.

Several selects that look like they choose a class or exam don't change the data shown.

**About two-thirds of the checklist is missing:**
- Academics
- Student profile, edit, transfer and promotion
- Fee structure and vouchers
- Staff profile and staff attendance
- Results and report cards
- Question bank and saved papers
- Reports and messages
- Most settings
- Teacher "my classes" and profile
- The whole Console
- 403 page, session picker, global search, "View as"

**Route structure:** the checklist uses `/dashboard/students`, `/dashboard/academics` and so on. The code uses top-level `/students` and `/attendance` inside a `(dashboard)` route group. Pick one before adding routes.

## 2. Route table

| Route | Exists? | File | Status | Notes |
|---|---|---|---|---|
| `/` | Yes | `src/app/page.tsx` | Done | Redirects to `/dashboard` |
| `/login` | Yes | `src/app/(auth)/login/page.tsx` | Done (UI) | Any input goes to `/dashboard` (`:19` TODO). No error state and no role-based landing. |
| `/reset-password` (forgot password) | Yes | `src/app/(auth)/reset-password/page.tsx` | Done (UI) | `:15` TODO |
| 404 | Yes | `src/app/not-found.tsx` | Done | Not counted in the totals |
| 403 | No | — | Missing | |
| `/dashboard` | Yes | `(dashboard)/dashboard/page.tsx` | Partial | |
| `/dashboard/academics` (+ `/promotion`) | No | — | Missing | |
| `/students` (checklist: `/dashboard/students`) | Yes | `(dashboard)/students/page.tsx` | Partial | Tabs: Directory, Admission form, Bulk import |
| `/dashboard/students/[id]` | No | — | Missing | Only a drawer |
| `/dashboard/students/new` | As a tab | `features/students/components/AdmissionForm.tsx` | Partial | One page, not 4 steps |
| `/dashboard/students/[id]/edit` | No | — | Missing | |
| `/dashboard/students/import` | As a tab | `BulkImport.tsx` | Partial | |
| `/attendance` | Yes | `(dashboard)/attendance/page.tsx` | Partial | Tabs: Mark, Review and lock, Absence alerts |
| Staff attendance | No | — | Missing | |
| `/fees` | Yes | `(dashboard)/fees/page.tsx` | **Broken** | Tabs: Counter, Defaulters |
| Fee structure, vouchers | No | — | Missing | |
| `/staff` | Yes | `(dashboard)/staff/page.tsx` | Partial | Tabs: Directory, Allocations, Payroll |
| Staff profile | No | — | Missing | |
| `/exams` | Yes | `(dashboard)/exams/page.tsx` | Partial | Tabs: Exam setup, Enter marks |
| Results and report cards | No | — | Missing | |
| Question bank | No | — | Missing | |
| Reports, Messages | No | — | Missing | |
| `/settings` | Yes | `(dashboard)/settings/page.tsx` | Partial | Tabs: Campus profile, Roles |
| `/teacher-portal` | Yes | `teacher-portal/page.tsx` | Partial | |
| `/teacher-portal/attendance` | Yes | `teacher-portal/attendance/page.tsx` | Partial | |
| `/teacher-portal/marks` | Yes | `teacher-portal/marks/page.tsx` | Partial | |
| `/teacher-portal/paper-maker` | Yes | `teacher-portal/paper-maker/page.tsx` | Done | Redirects to generate; the saved-papers list should live here |
| `/teacher-portal/paper-maker/generate` | Yes | `teacher-portal/paper-maker/generate/page.tsx` | **Broken** | Steps: Scope, Questions, Export |
| Teacher: my classes, saved papers, profile | No | — | Missing | |
| `/console` | No | — | Missing | |

**Not in the checklist:** none. Every route maps to a checklist item.

## 3. Inventory

- **Feature folders:** `attendance`, `dashboard`, `exams`, `fees`, `paper-maker`, `settings`, `staff`, `students`, `teacher-dashboard`, `teacher-portal`. Each has `components/`; most have `types/`. `students` also has `schemas/admission.ts` and `status.ts`.
- **Mock data:**
  - Inline in components: `StudentDirectory.tsx:59`, `PointOfSale`, `DefaultersTable`, `StaffDirectory`, `TeacherAllocations`, `PayrollList`, `ExamSetup`, `MarksEntryGrid`, `MarkAttendanceUI`, `ReviewAndLock`, `AbsenceAlerts`, `MobileAttendanceList`, `MobileMarksEntry`, `PaperReviewStep`, `generate/page.tsx:36`, `BranchSwitcher.tsx:21`, `UserProfileNav.tsx:29`, `teacher-portal/layout.tsx:10`.
  - Separate data files only in `features/dashboard/data` and `features/teacher-dashboard/data`.
- **Shared components:**
  - `components/shared`: `PageHeader`, `StatCard`, `EmptyState`, `ErrorState`, `PageSkeleton`, `RouteError`, `LabeledSelect`.
  - `components/layout`: `Sidebar` (+ `PortalSwitch`), `Header`, `BranchSwitcher`, `UserProfileNav`, `MobileBottomNav`, `nav-config`.
  - `components/ui` (16 Shadcn components).
- **Hooks:** none (`src/hooks` doesn't exist).
- **Redux slices:** none.
- **Utilities:** `lib/brand.ts`, `lib/status.ts` (status → badge variant), `lib/grades.ts`, `lib/utils.ts` (`cn`).

**Navigation** (`nav-config.ts`):

| Area | Group | Item | Points to |
|---|---|---|---|
| Admin | Daily | Dashboard | `/dashboard` |
| Admin | Daily | Attendance | `/attendance` (pending badge hardcoded `3`, `:32`) |
| Admin | Daily | Fee collection | `/fees` |
| Admin | Records | Students | `/students` |
| Admin | Records | Staff & HR | `/staff` |
| Admin | Academics | Exams & marks | `/exams` |
| Admin | Admin | Settings | `/settings` |
| Teacher | — | Overview | `/teacher-portal` |
| Teacher | — | Mark attendance | `/teacher-portal/attendance` |
| Teacher | — | Marks & grades | `/teacher-portal/marks` |
| Teacher | — | Paper maker | `/teacher-portal/paper-maker` |
| Both | Portal switch | Admin ↔ Teacher | the other portal |

All targets exist. There are no dead nav links.

**Dependencies:**

| Package | Used for |
|---|---|
| next, react, react-dom | App |
| @base-ui/react | Shadcn primitives |
| class-variance-authority | Variants |
| cn | Class merge |
| lucide-react | Icons |
| recharts | 2 dashboard charts |
| react-hook-form, @hookform/resolvers, zod | Admission form only |
| tw-animate-css | Animations |
| shadcn | CSS import in `globals.css:3`; should be a devDependency |
| @tanstack/react-table | **Unused** |

## 4. Per-module audit

### App shell
| Sub-feature | Source | Found in code | Status | Notes |
|---|---|---|---|---|
| Login and forgot password | Checklist | `(auth)/login`, `(auth)/reset-password` | Done (UI) | No inline validation messages; no failed-login state |
| Role-based landing (admin → `/dashboard`, Teacher → `/teacher-portal`, Super-admin → `/console`) | Checklist | `login/page.tsx:20` always pushes `/dashboard` | Missing | |
| 403 page | Checklist | — | Missing | |
| 404, loading and error boundaries | Checklist | `not-found.tsx`; `(dashboard)/loading.tsx`, `error.tsx`; `teacher-portal/loading.tsx`, `error.tsx` | Done | No boundaries for `(auth)` (low risk) |
| Sidebar with active state | Checklist | `Sidebar.tsx:44-58` | Done | |
| Branch switcher | Checklist | `BranchSwitcher.tsx:49` | Partial | Local state only; nothing reads it. Dashboard copy is hardcoded "Lahore Central" (`dashboard/page.tsx:23`). |
| "All branches" for Owner | Checklist | — | Missing | |
| Academic session picker | Checklist | — | Missing | |
| Global student search | Checklist | — | Missing | |
| User menu | Checklist | `UserProfileNav.tsx` | Partial | User hardcoded (`:29-34`). "Billing & subscriptions" goes to `/fees` (`:38`). Log out is a plain link with no session to clear (`:87`). |
| Dev "View as" role switcher | Checklist | — | Missing | |
| Breadcrumbs | Suggested | `Header.tsx:62-91` | Done | |
| Notifications | Suggested | `Header.tsx:95-98` | Dead | The dot is always shown |
| Mobile navigation drawer | Suggested | `Header.tsx:39-60` | Done | |
| Per-page `<title>` | Suggested | Only `layout.tsx` and `dashboard/page.tsx` | Partial | 12 client pages can't export metadata |
| Dark-mode toggle | Suggested | Tokens exist in `globals.css` | Missing | |

### Dashboard (`/dashboard`)
| Sub-feature | Source | Found in code | Status | Notes |
|---|---|---|---|---|
| Active students KPI | Checklist | `dashboard/page.tsx:44-54` (StatCard) | Partial | Doesn't link to a filtered page |
| Today's attendance % with sections marked | Checklist | `TodayRegister.tsx` | Done | Links to `/attendance` (opens the Mark tab, not Review) |
| Fee collected vs billed | Checklist | `FeeTargetCard.tsx`, `FeeCollectionChart.tsx` | Done | |
| Outstanding | Checklist | `FeeTargetCard.tsx:34-43` | Partial | Links to `/fees`, which opens the Counter tab, not Defaulters |
| Quick actions | Checklist | `QuickActions.tsx:6-9` | Partial | 3 of 4 open the wrong tab |
| Alerts strip | Checklist | — | Missing | |
| Activity feed | Checklist | `ActivityFeed.tsx` | Partial | Static, no "view all" |
| Setup checklist for a new school | Checklist | — | Missing | |
| Zero-data state (brand-new school) | Suggested | — | Missing | |
| Export summary | Suggested | `dashboard/page.tsx:26` | Dead | |
| Attendance trend chart | Suggested | `AttendanceTrendChart.tsx` | Done | |

### Academics
| Sub-feature | Source | Found | Status | Notes |
|---|---|---|---|---|
| Sessions | Checklist | — | Missing | Year fixed at `ExamSetup.tsx:109` |
| Classes and sections (capacity, incharge) | Checklist | — | Missing | Hardcoded option lists in about 10 files |
| Subjects; class-subjects (electives) | Checklist | — | Missing | |
| Promotion wizard | Checklist | — | Missing | |
| Timetable | Suggested | — | Missing | |

### Students
| Sub-feature | Source | Found in code | Status | Notes |
|---|---|---|---|---|
| Directory filters | Checklist | `StudentDirectory.tsx:46-57, 148-158` | Partial | Class (9 and 10 only) and status filters work. **No section, gender or fee-status filter.** Not in the URL. |
| Search | Checklist | `:153-156` | Partial | Name, roll ID and phone work. **Not by father's name or admission number.** |
| Columns | Checklist | `:226-234` | Partial | Roll ID, name and email, class, guardian, attendance, status |
| Sorting, pagination, bulk bar | Checklist | — | Missing | |
| Row menu | Checklist | `:308-338` | Partial | View profile works. Issue voucher, WhatsApp and Mark as left are **dead**. |
| Quick-view drawer | Checklist | `StudentProfileDrawer.tsx` | Partial | Fee history and attendance are hardcoded and the same for every student (`:20-29`). |
| Full profile with tabs | Checklist | — | Missing | |
| 4-step admission with duplicate check and sibling or guardian linking | Checklist | `AdmissionForm.tsx` | Partial | 3 card sections on one page, with zod and react-hook-form validation, required markers and inline errors. No duplicate check, siblings or multiple guardians. Submit only shows a banner (`:133-138`) and doesn't open a profile. "Save draft" does nothing (`:359`; no handler is passed from `students/page.tsx:66`). |
| Admission fields | Checklist and Suggested | `schemas/admission.ts` | Partial | **No B-form, photo, address, admission number or date, or branch.** Class enum is `9` and `10` only (`:36`). |
| Masks (CNIC 12345-1234567-1, mobile 03XX-XXXXXXX) | Checklist | Regex at `admission.ts:3-4` | Partial | Validated on blur, but no typing mask. No B-form field at all. |
| Edit page | Checklist | — | Missing | |
| Dialogs: change section, transfer, electives, withdraw, re-admit, guardians, documents, delete | Checklist | — | Missing | No dialog component exists |
| Bulk import (template, upload, map, validate, error file) | Checklist | `BulkImport.tsx` | Partial | File picker shows the name only. Template is **dead** (`:41`). No parse, mapping, validation or error file. |
| Printouts (admission form, student list) | Checklist | — | Missing | |
| Export CSV | Suggested | `students/page.tsx:34` | Dead | |
| Tabs in `?tab=` | Checklist | `students/page.tsx:25` (`useState`) | Missing | |

### Attendance
| Sub-feature | Source | Found in code | Status | Notes |
|---|---|---|---|---|
| Mark P/A/L | Checklist | `MarkAttendanceUI.tsx` | Partial | Radio groups and "Mark all present" work. **Default isn't all-present** (the mock is mixed). **No keyboard shortcuts.** Class, section and date don't change the roster (`:127-129`); date hardcoded to `2026-10-09`. Submit is fake (`:350`). |
| Review and lock | Checklist | `ReviewAndLock.tsx:89-113` | Partial | Lock, unlock and lock-all work locally. Unlock needs no reason or role; there's no confirmation and no change log. |
| Absentees with alerts | Checklist | `AbsenceAlerts.tsx` | Partial | Send is fake. The list is its own mock, not the marked register. Template date hardcoded (`:113`). |
| Staff attendance | Checklist | — | Missing | |
| Holidays respected | Checklist | — | Missing | |
| Locked or read-only states | Checklist | Lock badge only | Partial | A locked register is still editable in the Mark tab |
| Monthly sheet export | Suggested | `attendance/page.tsx:40` | Dead | |
| Attendance modes (class incharge or subject-wise) | Suggested (PRD) | — | Missing | |

### Fees
| Sub-feature | Source | Found in code | Status | Notes |
|---|---|---|---|---|
| Structure: heads, class plans, concessions, late-fine rule | Checklist | — | Missing | |
| Monthly voucher generation with preview; list, reprint, cancel | Checklist | — | Missing | |
| Collect fee: search and unpaid vouchers | Checklist | `PointOfSale.tsx:176-182` | Done | |
| Collect fee: payment method | Checklist | `:358-381` | Done | |
| Collect fee: partial payment | Checklist | `:403-404` | Missing | Disabled unless the amount is at least the total |
| Collect fee: receipt print | Checklist | `:312` | Dead | Receipt number is random (`:162`) |
| Collect fee: repeat payment | — | `:161-174`, `:316` | **Broken** | See B1 |
| Payment reversal | Checklist | — | Missing | |
| Defaulters, aging and reminders | Checklist | `DefaultersTable.tsx` | Partial | Severity buckets serve as aging. Filters work. SMS is fake. Export CSV is **dead** (`:235`). |
| Daily closing | Checklist | `fees/page.tsx:30` "Daily cash report" | Dead | |
| Student ledger | Suggested | — | Missing | |

### Staff
| Sub-feature | Source | Found in code | Status | Notes |
|---|---|---|---|---|
| Directory | Checklist | `StaffDirectory.tsx` | Partial | KPIs, search, department and status filters. No row actions. Export is **dead** (`:184`). |
| Add staff | Suggested | `staff/page.tsx:39` | Partial | Only switches tab; no form |
| Staff profile | Checklist | — | Missing | |
| "Give login access" | Checklist | — | Missing | |
| Allocations grid (sections × subjects) | Checklist | `TeacherAllocations.tsx` | Partial | A form plus a list, not a grid. No duplicate or clash check (`:130-155`). Periods and room hardcoded (`:145-146`). Remove has no confirmation (`:157`). |

### Payroll
| Sub-feature | Source | Found in code | Status | Notes |
|---|---|---|---|---|
| Monthly run with review and adjustments | Checklist | `PayrollList.tsx` | Partial | Read-only table fixed to October 2026 (`:163`). No adjustments and no month picker. "Generate all" is fake (`:133`). |
| Payslips | Checklist | `:128`, `:257` | Partial | Generate is fake; Print is **dead**. |
| Advances | Checklist | — | Missing | |
| Tax sheet export | Suggested | `:167` | Dead | |

### Exams and results
| Sub-feature | Source | Found in code | Status | Notes |
|---|---|---|---|---|
| Exam list and create | Checklist | `ExamSetup.tsx` | Partial | Create works locally with date validation. No edit, delete or row actions (`:270-285`). |
| Date sheet with total and pass marks | Checklist | — | Missing | The page copy promises it (`exams/page.tsx:30`) |
| Marks grid: absent toggle | Checklist | — | Missing | |
| Marks grid: validation | Checklist | `MarksEntryGrid.tsx:153` | **Broken** | Values out of range are silently clamped (B9) |
| Marks grid: autosave | Checklist | `:161` | Missing | Manual save, and it's fake |
| Marks grid: roster follows selectors | Suggested | `:136-141` | Partial | Selectors don't change the roster |
| Results with grades and positions | Checklist | Grade per row via `lib/grades.ts` | Partial | No positions and no results page |
| Report card print | Checklist | `MarksEntryGrid.tsx:214`, `exams/page.tsx:33` | Dead | |
| Result lock | Suggested | — | Missing | |

### Question bank and Paper Maker
| Sub-feature | Source | Found in code | Status | Notes |
|---|---|---|---|---|
| Question bank: browse, add, import, Urdu RTL, math | Checklist | — | Missing | Types are MCQ, short and long only (`paper-maker/types:76`) |
| Step 1: scope | Checklist | `PaperScopeStep.tsx` | Partial | Board, class, subject and chapters. Can continue with 0 chapters. Scope doesn't affect the questions. |
| Step 2: blueprint (sections, attempt-any, marks) | Checklist | — | Missing | |
| Step 3: review swap | Checklist | `PaperReviewStep.tsx:138` | Partial | Swap works |
| Step 3: review lock, edit, add own | Checklist | — | Missing | |
| Step 4: header and export | Checklist | `PaperExportStep.tsx` | **Broken** | Header fields work. Print outputs the app screen (B2). No answer key. Total marks go stale after a swap (`generate/page.tsx:95`). |
| Saved papers list | Checklist | — | Missing | |

### Reports, Messages, Settings
| Sub-feature | Source | Found in code | Status | Notes |
|---|---|---|---|---|
| Reports hub with export | Checklist | — | Missing | |
| Messages: compose, templates, cost preview, send log | Checklist | — | Missing | |
| Settings: institute | Checklist | `CampusProfile.tsx` | Partial | Save is fake (`:51-58`); no validation; logo shows a file name only |
| Settings: roles and permission matrix | Checklist | `RolesMatrix.tsx` | Partial | Toggles work. 4 roles (`:26-31`), with no Owner, Branch Admin or Super-admin and no scopes. Save is fake (`:205`). |
| Settings: branches, users, attendance, fees, grading, notifications, subscription | Checklist | — | Missing | Branches are hardcoded in `BranchSwitcher.tsx:21` |
| Settings tabs in the URL | Checklist | `settings/page.tsx:10` | Missing | |

### Teacher portal
| Sub-feature | Source | Found in code | Status | Notes |
|---|---|---|---|---|
| Mobile bottom nav | Checklist | `MobileBottomNav.tsx` | Done | |
| Home: today's classes and pending tasks | Checklist | `teacher-portal/page.tsx`, `TodaySchedule.tsx`, `PendingTasks.tsx` | Done | Mock data |
| My classes and student lists | Checklist | — | Missing | |
| Attendance for own sections | Checklist | `MobileAttendanceList.tsx` | Partial | Selects aren't wired (B3); "Period 2" hardcoded; submit is fake; not limited to own sections |
| Marks for own subjects | Checklist | `MobileMarksEntry.tsx` | Partial | Selects aren't wired (B4); subtitle hardcoded (`marks/page.tsx:28`); silent clamp (`MobileMarksEntry.tsx:96`); save is fake |
| Paper maker | Checklist | see above | Broken | |
| Saved papers | Checklist | — | Missing | |
| Profile | Checklist | User menu links only | Missing | |

### Console
| Sub-feature | Source | Found | Status |
|---|---|---|---|
| Tenants list and create (first branch and owner), plan and seats, impersonation, global question bank | Checklist | — | Missing |

## 5. Cross-cutting findings

| Area | Finding | Path | Severity |
|---|---|---|---|
| Data layer | Hardcoded arrays inside components; no API or mock layer, no fixtures folder, no hooks | see §3 | **P0** |
| Types | One entity has several shapes: attendance status `"P"\|"A"\|"L"` versus `"present"\|"absent"\|"leave"`; money as a string (`balance: "Rs 0"`) versus a number; class as `"Class 9"`, `"9"` or `"class-9"` | `attendance/types:1`, `MobileAttendanceList.tsx:15`, `students/types:14`, `AdmissionForm.tsx:42` | **P0** |
| Session context | No branch, session or user context | `BranchSwitcher.tsx:49` | **P0** |
| Auth | No `proxy.ts` or middleware, no session, no role landing; every route is public | — | **P0** |
| Permissions | No role model, gate component, 403 or "View as"; everyone sees everything | — | **P0** |
| URL state | 6 tab pages and every filter use `useState` | `students/page.tsx:25` and siblings | **P1** |
| Tables | 10 hand-built tables with no sort, pagination or bulk selection; `@tanstack/react-table` unused | `components/ui/table.tsx` users | **P1** |
| Dialogs | No dialog or confirm component; destructive actions run at once | — | **P1** |
| Feedback | Inline banners on `setTimeout` timers with no cleanup, repeated per feature; no toast | e.g. `RolesMatrix.tsx:207` | P2 |
| Formatters | Rupees done 3 ways (`formatRupees` at `dashboard/data:107`, `rupees()` in `PayrollList`, inline `toLocaleString`); no date or phone helper | — | P2 |
| States | No 403, read-only (past session) or zero-data states | — | P1 |
| Responsiveness | 0 horizontal overflow at 390, 768, 1024 and 1440px on all routes, by script in Phase 6 (`0fb81aa`). **Not re-run here**: the audit rules forbid `next dev` and `next build`. | — | OK |
| Design consistency | One token set, IBM Plex Sans, `Card`, `Badge` variants via `lib/status.ts`, `PageHeader` on every page | `globals.css`, `lib/status.ts` | OK |
| Hydration | Greeting and date come from `new Date()` at render, so server and client time zones can disagree. Unverified at runtime. | `teacher-portal/page.tsx:15`, `teacher-portal/attendance/page.tsx:25` | P2 |
| Folder structure | Pages are thin and logic lives in features, except `generate/page.tsx`, which holds wizard state and 40 lines of mock questions (`:20-79`) | — | P2 |

## 6. Code health

- **TypeScript:** `npx tsc --noEmit` reports **0 errors**.
- **ESLint:** `npx eslint` reports **0 problems**.
- **Unused:**
  - `components/ui/label.tsx`, `scroll-area.tsx` and `toggle-group.tsx` have 0 imports.
  - `@tanstack/react-table` is installed but unused.
  - `ErrorState` is used only through `RouteError`.
- **console.\*:** only `RouteError.tsx:9` (`console.error` in the error boundary, which is intended).
- **TODO/FIXME:** `login/page.tsx:19`, `reset-password/page.tsx:15`, `AdmissionForm.tsx:134`. All say "wire to API".
- **Missing imports or undefined data:** none found. Typecheck is clean.
- **Runtime risk:** `ActivityFeed.tsx:5` uses a non-null assertion `find(...)!` on mock data. It will throw if that section is ever removed.

## 7. Broken list

| # | File:line | What goes wrong |
|---|---|---|
| B1 | `features/fees/components/PointOfSale.tsx:161-174`, `:316` | A payment updates `vouchers` but not `selectedVoucher`. After "Next payment", the same voucher reads as unpaid and **can be collected twice**. |
| B2 | `features/paper-maker/components/PaperExportStep.tsx:128` | `window.print()` runs with no `@media print` styles anywhere in `src`, so it prints the sidebar, header and form instead of a paper. There's no paper preview. |
| B3 | `app/teacher-portal/attendance/page.tsx:21-22, 43` | Class and section selects aren't passed to `MobileAttendanceList`, so it always shows the same roster. |
| B4 | `app/teacher-portal/marks/page.tsx:20-21, 36` | Same as B3 for exam and subject. |
| B5 | `features/attendance/components/MarkAttendanceUI.tsx:127-129` | Class, section and date don't change the register. |
| B6 | `features/students/components/StudentProfileDrawer.tsx:20-29` | Every student, defaulters included, shows "Paid" history and the same attendance. |
| B7 | `features/dashboard/components/QuickActions.tsx:7-9`, `dashboard/page.tsx:30`, `FeeTargetCard.tsx:35` | Shortcuts open the first tab of the page, not the named task. |
| B8 | `components/layout/UserProfileNav.tsx:38` | "Billing & subscriptions" opens Fee collection. |
| B9 | `features/exams/components/MarksEntryGrid.tsx:153`, `features/teacher-portal/components/MobileMarksEntry.tsx:96` | 150 out of 100 silently becomes 100, so a typo is saved as full marks. |
| B10 | `features/attendance/components/ReviewAndLock.tsx` with `MarkAttendanceUI.tsx` | A register locked in Review can still be edited and resubmitted in Mark. |

**Dead buttons:**
- Header bell, `Header.tsx:95`
- Export summary, `dashboard/page.tsx:26`
- Students: Export CSV (`students/page.tsx:34`); row menu Issue voucher, WhatsApp and Mark as left (`StudentDirectory.tsx:323-336`)
- Download template, `BulkImport.tsx:41`
- Attendance monthly sheet, `attendance/page.tsx:40`
- Daily cash report, `fees/page.tsx:30`
- Print receipt, `PointOfSale.tsx:312`
- Defaulters Export CSV, `DefaultersTable.tsx:235`
- Staff: monthly report (`staff/page.tsx:35`); Export directory (`StaffDirectory.tsx:184`)
- Payroll: Export tax sheet (`PayrollList.tsx:167`); Print payslip (`:257`)
- Exams: Result sheet (`exams/page.tsx:33`); Download result sheet (`MarksEntryGrid.tsx:214`)

## 8. Remaining work, prioritised by phase

**Phase A: Foundation (P0)**
- [x] A1. Fix B1 (sync `selectedVoucher` on payment).
- [x] A2. Decide the route prefix: **kept `/students`** (your decision), so no routes moved.
- [x] A3. Shared domain types in `src/types` (Student, Guardian, Branch, Session, Class, Section, Subject, Staff, Assignment, FeeHead, Voucher, Payment, Exam, Mark, Question). Unify attendance status and money as a number.
- [x] A4. Mock layer: move all inline arrays to `src/mocks`, and serve them through typed services or hooks. **Done with Redux Toolkit plus RTK Query** (`src/store`), and MSW not needed yet. Components don't import mocks directly.
- [x] A5. Session context (user, roles, branch including "All branches", session), wired to the BranchSwitcher and dashboard copy.
- [x] A6. Mock auth: login picks a role, role-based landing, real logout, a `proxy.ts` redirect, and a dev "View as" switcher. The switcher is a dev-only `?as=<role>` URL parameter, so there's no new UI.
- [x] A7. Permission map plus a `<Can>` gate, a 403 page and role-filtered nav, for Owner, Branch Admin, Accountant, Front Desk, Teacher and Super-admin.
- [x] A8. `?tab=` and filter URL helpers; apply to the 6 tab pages and fix B7.
- [ ] A9. Shared `DataTable` (sort, pagination, selection, bulk bar), `ConfirmDialog`, toast and formatters (Rs, date, +92 phone). **Formatters done** (`src/lib/format.ts`). DataTable, ConfirmDialog and toast are deferred because they change how screens look; they need your approval.

**Phase B: Academics and settings data (P0)**
- [x] B1. Sessions, with read-only past sessions. Done: Classes and subjects → Sessions, a session picker in the header, a read-only notice, and changes turned off in past sessions.
- [x] B2. Classes and sections (capacity, incharge).
- [x] B3. Subjects and class-subjects (electives).
- [x] B4. Settings: branches and users (with "give login access").
- [x] B5. Roles matrix: all school roles plus scopes. There are 5 columns; Super-admin is the platform, not a school role.
- [x] B6. Settings: attendance (mode, lock window, holidays), fees (late fine, due day), grading and notifications. Grading already drives the grades shown in marks entry. The attendance and fee rules are stored for Phases D and E.
- [x] B7. Replace every hardcoded class, section and subject list. Paper Maker's board curriculum lists are kept on purpose.

**Phase C: Students (P1)**
- [x] C1. Directory: section, gender and fee-status filters; search by father's name and admission number; sorting, pagination and a bulk bar.
- [x] C2. `/students/[id]` profile with tabs (Overview, Attendance, Fees, Results, Documents, Activity); the drawer becomes a quick view (fixes B6).
- [x] C3. 4-step admission at `/students/new`: B-form, photo, address, admission number and date, branch, guardians and siblings, duplicate check, masks, working draft, then land on the profile.
- [x] C4. Edit page.
- [x] C5. Dialogs: change section, transfer branch, electives, withdraw, re-admit, guardians, documents, delete.
- [x] C6. `/students/import`: template, upload, column mapping, validation, import, error file. Takes CSV; Excel `.xlsx` needs a parsing library, pending your approval.
- [x] C7. Printouts (admission form, student list); wire the row actions and export.

**Phase D: Attendance (P1)**
- [x] D1. Class, section, date and subject drive the roster (fixes B3 and B5); all-present by default; keyboard shortcuts (P/A/L, arrow keys).
- [x] D2. Locked registers read-only in Mark (fixes B10); unlock request with a reason and role check; change log.
- [x] D3. Absentees taken from the submitted register; dynamic message template.
- [x] D4. Holidays block marking. Sundays are blocked too.
- [x] D5. Staff attendance. It's a Staff tab on Attendance.
- [ ] D6. Monthly sheet. **Partly done:** the CSV export works; there's no on-screen month view yet.
- [x] Extra: marking works offline. Unsent registers are kept on the device and submitted when the connection is back.

**Phase E: Fees (P1)**
- [x] E1. Fee structure (heads, class plans, concessions, late-fine rule).
- [x] E2. Voucher generation with preview; voucher list with reprint and cancel; printable voucher (a three-copy bank challan, single or bulk).
- [x] E3. Counter: partial payment, receipt view and print. Includes an automatic late fine that can be waived.
- [x] E4. Payment reversal with a reason.
- [x] E5. Defaulters: aging columns, export. Now worked out from overdue vouchers.
- [x] E6. Daily closing report. Includes the cash count, closing the day, and a CSV report.

**Phase F: Staff and payroll (P1)**
- [x] F1. Add or edit staff; staff profile. The profile has Overview, Teaching, Attendance and Payslips tabs; you can mark someone on leave, back, or left (which frees their classes); it shows login status.
- [x] F2. Allocations as a sections × subjects grid with clash and duplicate checks. The grid allows only one teacher per cell, so duplicates can't happen. It also warns about unassigned subjects, teachers on leave who still have classes, and teachers over 30 periods a week. Time-slot clashes need a timetable, which doesn't exist yet.
- [x] F3. Payroll: month picker, review and adjustments, advances, payslip view and print, tax export. A month runs draft, then finalised, then paid. Absences come from staff attendance; tax is estimated from the salary slabs; EOBI is deducted; advances are recovered in monthly instalments.

**Phase G: Exams (P1)**
- [x] G1. Exam edit and delete; date sheet with total and pass marks per class and subject. Exams can cover several classes. Pass marks start at the school's pass percentage; papers on the same day are flagged; dates must fall within the exam.
- [x] G2. Marks grid: roster follows selectors, absent toggle, inline validation errors (fixes B9), autosave. Only subjects on the date sheet are offered; electives list only the students taking them; half marks are allowed; a CSV download replaces the dead result sheet button.
- [x] G3. Results page with grades and positions; report card print. A new Results tab ranks students by section or whole class, highlights failed papers, exports CSV, and publishes or unpublishes results (publishing locks marks). Report cards print for a student, section or class with section and class positions. The student profile's Results tab now shows real exams.

**Phase H: Paper Maker (P1)**. Rebuilt to the team's flow brief: board → class → book → chapters and sub topics → questions → details → Submit for printing, with a print queue gated by the `canPrintPapers` permission. See `src/services/paper/README.md`.
- [x] H1. Paper preview with print styles and an answer key (fixes B2). Teachers preview on screen only; printing, PDF and the answer key are for users with `canPrintPapers`.
- [x] H2. Blueprint step (sections, attempt-any, marks). Question types, how many of each and marks for each; the paper prints in sections by type. "Attempt any" wasn't in the team's brief, so it isn't built.
- [x] H3. Scope drives the questions; at least one chapter required. Chapters expand to sub topics with a partial state. Earlier changes warn, then clear or recheck later steps.
- [x] H4. Review: lock, edit, add own; live total marks. Swap, edit, remove, add own, live total. "Lock" wasn't in the team's brief, so it isn't built.
- [x] H5. Saved papers list. My papers shows drafts and each paper's status (draft, submitted, printed, returned) with any return note.
- [ ] H6. Question bank browse, add and import. Not in the team's paper maker brief; left for later.
- [ ] H7. Spike Urdu RTL and math rendering early. Not in the team's brief; left for later.

**Phase I: Teacher portal (P1)**
- [x] I1. My classes and student lists, from allocations. A new My classes page (in the nav and bottom bar) lists each section with subjects, periods and the incharge badge; each opens a student list with roll numbers, attendance and the parent's number. Other sections' lists aren't shown. Home counts the teacher's real students.
- [x] I2. Attendance and marks limited to own sections and subjects (fixes B4). Attendance follows the school's mode: incharge sections, or every taught section plus a subject picker in subject-wise mode. Marks offer only the teacher's subjects that have a paper, with the same validation, absent toggle and autosave as the admin grid (fixes B9 on mobile). Published exams are read-only.
- [x] I3. Saved papers. Covered by My papers in the rebuilt paper maker (H5).
- [x] I4. Profile page. Reached from the user menu: contact details the teacher can update, employment details, teaching load, this month's attendance, and a change-password link.

**Phase J: Reports and messages (P1/P2)**
- [x] J1. Reports hub (fee, attendance, students, staff and payroll, exams, branch comparison) with export. A new Reports page has 12 reports built from live data, with month or exam filters in the URL, totals, CSV export and a printable version.
- [x] J2. Messages: compose to an audience, templates, cost preview, send log. Audiences are all parents, a class or section, overdue fees, today's absentees, staff or teachers (one message per family). Each message is personalised and previewed. Cost is estimated, with WhatsApp falling back to SMS per Settings. Built-in and custom templates; fee reminders and absence alerts also appear in the send log. Rates are planning estimates.
- [x] J3. Notifications panel; dashboard alerts strip and new-school setup checklist. The header bell lists what needs attention for the signed-in role (teachers see their own registers and marks), and its dot only shows when there's something. The dashboard shows the same items as a strip, plus a 10-step setup checklist that can be hidden.

**Phase K: Console (P2, depends on your v1 decision)**. Built: DeepDev ERP is sold per module, and the Console manages schools and their modules. See `src/services/tenant/README.md`.
- [x] K1. Tenants list and create (first branch and owner), plan and seats, impersonation, global question bank. Each school gets only the modules switched on (on/off, no prices), with requirements handled automatically. Seats are enforced on admission. Schools can be suspended (with a reason) and reactivated. "View as owner" has a banner and an audit entry. The global catalogue and question bank feed the paper maker.
- [x] K2. Module licensing across the app. Nav, pages, tabs, dashboard cards, notifications, reports, message audiences and Settings follow the school's modules. A paper-maker-only school gets Dashboard, Print queue, Settings and a teacher portal with just the paper maker. Super-admins land on `/console`.

**Phase L: Polish (P2)**
- [x] L1. Per-page titles. Every route has its own browser tab title ("Students | DeepDev ERP", "Staff profile | DeepDev ERP" and so on), through small layout files; the teacher portal's client layout became a shell component behind a server layout.
- [x] L2. Time-zone-safe dates. A shared `localISODate()` replaces `toISOString().slice(0, 10)` wherever today's date was meant. In Pakistan (UTC+5) the old code gave yesterday's date between midnight and 5 AM, in admission, withdrawal, payroll, voucher and import defaults.
- [x] L3. Remove unused UI files and dependencies; move `shadcn` to devDependencies. Removed label, scroll-area and toggle-group, four unused barrel files, and the unused react-hook-form, @hookform/resolvers, zod and @tanstack/react-table (found with an import-reachability check).
- [x] L4. Dark-mode toggle. Light, Dark or Same as device in the user menu, saved per device. A small head script applies it before paint, so there's no flash.
- [x] L5. Re-run the Phase 6 checks (axe, overflow, keyboard, contrast) after each phase. Done after every phase. Final run: 58 screens in light and dark mode, 0 axe violations (axe includes colour contrast), every focus indicator present, no unintended overflow at 390, 768, 1024 and 1440 px.
