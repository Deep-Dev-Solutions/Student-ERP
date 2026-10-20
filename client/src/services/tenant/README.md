# Modules and the platform Console: what is mocked

DeepDev ERP is sold per module. Each school (tenant) gets only the modules it buys,
for example Students + Fees + Paper maker without Attendance or HR. Platform admins
(the `super_admin` role) manage schools from the Console at `/console`.

## Modules

| Module | Screens | Needs |
|---|---|---|
| Core (always on) | Dashboard, Settings (institute, users, roles, school rules) | — |
| Students and admissions | Students, admissions, import, Classes and subjects, student printouts | — |
| Fees | Fee collection, vouchers, defaulters, daily closing, receipts | Students |
| Attendance | Attendance (student and staff), teacher attendance page | Students |
| Staff and HR | Staff directory, profiles, teaching allocations | — |
| Payroll | Payroll tab, payslips, advances | Staff and HR |
| Exams and results | Exams, marks, results, report cards, teacher marks page | Students |
| Paper maker | Teacher paper maker, print queue, paper printouts | — |
| Messages | Messages, templates, send log | — |
| Reports | Reports hub (only reports for modules the school has) | — |

`src/lib/modules.ts` is the single source of truth. It maps every route
(`moduleForPath`) and every Settings permission (`moduleForPermission`) to its module,
and lists the requirements.

## How a module is enforced in the UI

A feature shows only when the school has the module **and** the user's role holds
the permission (Settings → Roles). When a module is off, it disappears from:

- the admin and teacher nav and the mobile bottom bar
- pages, through `PlanGate`: opening the URL shows "This isn't part of your plan"
- tabs (student and staff profiles, the staff page) and dashboard cards
- notifications, reports, message audiences, the setup checklist
- Settings: permission matrix rows and school rule sections

`useCan()` already returns false for a permission whose module is off.

**A paper-maker-only school** sees Dashboard (with an exam papers card), Print
queue and Settings. Its teachers see only Paper maker and their profile in the
teacher portal.

## Endpoints the backend builds

| Operation | Method and path | Access |
|---|---|---|
| getMyTenant | `GET /api/tenant` | Any signed-in user (their own school) |
| listTenants | `GET /api/console/tenants` | Platform admin |
| createTenant | `POST /api/console/tenants` | Platform admin |
| setModules | `PUT /api/console/tenants/:id/modules` | Platform admin; requirements added automatically |
| setSeats | `PUT /api/console/tenants/:id/seats` | Platform admin; not below students already enrolled |
| setStatus | `PUT /api/console/tenants/:id/status` | Platform admin; a reason is required to suspend |
| logViewAs | `POST /api/console/tenants/:id/view-as` | Platform admin; short-lived owner session plus an audit entry |

The Console's question bank endpoints are in `src/services/paper/contract.ts`
(`saveCatalogItem`, `deleteCatalogItem`, `saveBankQuestion`, `deleteBankQuestion`).

## What the backend must enforce (the UI only hides)

- Every school endpoint belongs to one module. Refuse it with 403 when that module is
  off for the caller's school.
- Refuse every school endpoint while the school is suspended.
- Refuse admissions and imports past the school's student seats. The mock already
  does this for `admitStudent` and `importStudents`.
- Turning a module off hides its data and must never delete it.

## Mocked for now

- **Schools** (`src/mocks/tenants.ts`):
  - Apex Grammar & Science Academy, the demo school, with every module
  - Bright Future Academy: Students, Fees, Paper maker, Messages
  - Scholars Paper Hub: paper maker only, on trial
  - Crescent Model School: suspended
- **School data:** only the demo school has records (students, fees, staff and so on).
  "View as owner" on another school shows that school's plan, modules and campus.
  The records it can open are empty, or are the demo school's where the mock isn't
  scoped by school (staff, the demo teacher in the portal).
- **Seats used** are counted for the demo school only; other schools show 0.
- **New schools, module changes and suspensions** last until the page reloads, like
  all demo data. The owner's sign-in email isn't sent.
- **"View as owner"** keeps the platform admin signed in and switches the app to act as
  that school's owner. A banner offers "Back to console".
