# Student-ERP UI Design Audit

> **Status (13 Oct 2026): implemented.** All six phases below are done on the `feat/ui-redesign` branch. The original audit follows unchanged, except for one correction noted here.

## Implementation status

| Phase | What shipped | Commit |
|---|---|---|
| 1. Foundation | "Register" colour, type (IBM Plex Sans), radius and status tokens with light and dark sets; single product name (DeepDev ERP); `/` redirects to `/dashboard` | `3c9e3f0` |
| 2. Layout and navigation | One config-driven sidebar for both portals, route breadcrumbs, campus switcher crash fixed, mobile bottom nav fixed | `3c9e3f0` |
| 3. Shared components | Button sizes and `ButtonLink`, single-border cards, status badges, table styling, `PageHeader`, `StatCard`, `EmptyState`, `ErrorState`, skeletons, loading/error/not-found routes (the production build now passes) | `3c9e3f0` |
| 4. Dashboard | "Today's register" grid, real Recharts fee and attendance charts with table views, figures derived from one data source | `3c9e3f0` |
| 5. Remaining pages | Students, attendance, fees, staff, exams, settings, teacher portal, paper maker, sign in and reset password | `a582535`, `446f762`, `c3f71ac` |
| 6. Responsive and accessibility | See results below | this commit |

**Phase 6 results**
- **axe-core 4.10 (WCAG 2.1 A and AA):** 0 violations across 23 routes and tabs.
- **Keyboard:** every one of 504 tab stops shows a visible focus indicator. Menus open with Enter, move with the arrow keys and close with Escape, returning focus to their trigger. The student drawer traps focus. Section tabs move with the arrow keys, and attendance P/A/L works with Space.
- **Layout:** no page or table scrolls sideways at 390, 768, 1024 or 1440 px, except the roles and permissions grid, which scrolls by design with its first column pinned.
- **Contrast:** all 28 token pairs pass in both themes (text 4.5:1, controls and chart marks 3:1).
- **Motion:** the OS "reduce motion" setting disables every animation and transition, and the wizard's smooth scroll.
- **Hardcoded styles:** no hardcoded palette colours, 10–11 px text or all-caps labels remain in `src`.

**Still placeholders (no backend or feature behind them yet)**
- Export, report and download buttons (CSV, cash report, result sheet, tax sheet)
- "Add staff member", "Download template", print receipt and payslip
- Notifications bell, and a Term/Month selector (left out rather than shipped as a dead control)
- Sign in and password reset are UI only; sign-in goes to the dashboard
- A dark-theme toggle (the dark tokens exist and render correctly when `.dark` is set)
- All data is demo data in the feature files

**Correction to the audit:** §3 finding 1 said the duplicate `/` routes would break the build. They didn't; the starter page silently won instead. The fix still applied.

---

## Context
You asked why the Student-ERP frontend (`client/`) looks basic next to two reference dashboards, and for a prioritised plan to lift it. This is an audit only. No project files were changed.

**Inputs I checked**
- `client/reference-design-one.png` (high priority): "Bond CRM" sales analytics. It uses a framed app shell on a tonal canvas, a bento grid of cards in different sizes, a black/lime palette, one accent bar per chart, and grouped navigation with a filled black active pill.
- `client/reference-design-two.png`: "Avare" travel dashboard. It has KPI tiles with sparklines and coloured icon chips, a bar chart with a tooltip, an image card, and a bookings table with pill status badges.
- The `/frontend-design` skill is installed and was loaded. Its guidance shapes the design direction below: subject-grounded palette and type, no templated defaults, spend boldness in one place.

---

## 1. What the frontend is today

| Area | Finding | Evidence |
|---|---|---|
| Framework | Next.js 16.4.0, React 19.3, React Compiler, `cacheComponents` | `client/package.json:13-16`, `client/next.config.ts:5-7` |
| Styling | Tailwind v4 (CSS-first `@theme inline`), `tw-animate-css` | `src/app/globals.css:1-49` |
| Component library | shadcn "base-nova" style on **Base UI** (`@base-ui/react`), `cn` (clsx+tailwind-merge) | `components.json:3`, `src/components/ui/button.tsx:1` |
| Tokens | Stock shadcn **neutral grayscale**: `--primary` near-black, chart-1…5 all grey, radius 0.625rem | `globals.css:51-84` (charts `:70-74`) |
| Actual colours used | Hardcoded Tailwind palette: slate ×1193, blue ×336, emerald ×182, rose ×102, amber ×78. Semantic tokens used only **4×** outside `ui/` | grep over `src/` |
| Typography | Inter from `next/font`, applied via `inter.className` on `<body>` | `src/app/layout.tsx:5-9,23` |
| Font tokens | `--font-sans: var(--font-sans)` refers to itself, `--font-mono` points to a font that's never loaded (`--font-geist-mono`), and `--font-heading` therefore resolves to nothing | `globals.css:10-12` |
| Icons | lucide-react | `components.json:13` |
| Charts | recharts 3.8 plus shadcn `chart.tsx` installed, **used nowhere** | `src/components/ui/chart.tsx`; grep shows 0 imports |
| Tables | shadcn `Table` in 10 feature files; `@tanstack/react-table` installed | `src/components/ui/table.tsx` |
| Admin shell | `h-screen` flex: `w-64` sidebar (hidden below `md`), sticky 64px header, `main p-6` with `max-w-7xl` | `src/app/(dashboard)/layout.tsx:13-31` |
| Navigation | One "Academic Operations" group (6 links) plus "System & Administration" (Settings), and a Teacher Portal pill at the bottom; mobile uses a Sheet | `src/components/layout/Sidebar.tsx:24-35,74-171`, `Header.tsx:24-48` |
| Teacher shell | A second, separate sidebar implementation plus a mobile bottom nav | `src/app/teacher-portal/layout.tsx:55+`, `MobileBottomNav.tsx` |
| Dashboard | Page header, then 4 KPI cards, then a "trends" card, then a 3/7 + 4/7 split (Quick actions / Activity) | `src/app/(dashboard)/page.tsx:13-63` |
| Breakpoints | Tailwind defaults; `sm:` ×171, `lg:` ×43, `md:` ×25 (sidebar switch at `md`) | grep |
| States | **No** `loading.tsx`, `error.tsx` or `not-found.tsx`; no skeletons or empty states | `find src/app` |

---

## 2. Why it looks basic (compared with the references)

The root cause isn't one bad component. **The design system was never really set up.** The tokens are untouched shadcn greys, so every page restyles each element by hand with `slate-*`/`blue-*` utilities. The result is competent but uniform: every surface has the same weight, almost all text is 12px or smaller, and the hero chart is a placeholder. Both references work because of tight tokens, hierarchy through size, and real data visuals.

| Quality | Your code now | What's weak | Why it matters | Improvement |
|---|---|---|---|---|
| Composition and whitespace | Vertical stack, `space-y-8`, KPI row, full-width card, then a split (`page.tsx:13-61`) | Every block has equal weight and there's no focal point | The eye has no entry point, so the page reads like a template. Ref one uses a bento grid with a dominant tile. | A 12-column grid with spans of different sizes and one hero tile |
| Sidebar | `w-64`, one flat group, `text-xs` links, uppercase group labels in `slate-400`, active state `bg-blue-50` (`Sidebar.tsx:76,89-92`) | Low-contrast active state and tiny labels. Students and Staff share the `Users` icon (`:26,29`). | Ref one's filled active pill and grouped sections make location obvious at a glance | Group navigation by workflow, use a solid ink active pill, and set links at 14px |
| Page header | The header shows the same static "Apex Enterprise ERP / Administration Console" on every page (`Header.tsx:51-55`). Each page copies the same h1 markup (9 copies). | No breadcrumb or context, and the markup is duplicated | Ref one's breadcrumb plus period toggle anchors the page | A shared `PageHeader` (title, description, actions) and a dynamic breadcrumb |
| Cards | Callers add `border border-slate-200/80 shadow-xs p-6` on top of a Card that already has a `ring-1` (`card.tsx:14`, `ActivityFeed.tsx:67`) | Border and ring are stacked, and spacing overrides fight the card's own `--card-spacing` | The double hairlines look muddy. Ref one uses a single soft surface. | Fix the Card once with variants instead of per-call overrides |
| Colour | Grey tokens plus hand-picked blue/emerald/indigo/rose per element (`KpiCards.tsx:19-89`) | A different colour per KPI icon is decoration, not meaning. The default `Button` is black but is overridden to blue everywhere (`button.tsx:10` vs `page.tsx:39`). | No brand colour and no semantic logic | Ink primary, one attention accent, strict semantic status colours |
| Contrast | `text-slate-400` ×102 for real content: group labels, timestamps, branch code (`Sidebar.tsx:67,76`, `ActivityFeed.tsx:98`, `BranchSwitcher.tsx:66`) | #94A3B8 on white is about 2.5:1, which fails WCAG AA (4.5:1) | Text looks faded and is hard to read | A muted-text token of at least 4.5:1 |
| Type scale | text-xs ×457, text-[11px] ×132, text-[10px] ×23, against text-sm ×73. Uppercase ×114. | Nearly all UI text is 12px or smaller, with tracked all-caps labels | Cramped, low hierarchy and tiring for staff entering data all day. The references use 14px body text with big bold numbers. | 14px base and a defined scale; sentence-case labels |
| Spacing | KPI cards `p-5`, other cards `p-6`, grids `gap-4` or `gap-6`, buttons forced to `h-9` over the default `h-8` | Ad-hoc values | Small inconsistencies add up to an "unpolished" feel | Spacing and size tokens wired into component variants |
| Charts | The trends card is a dashed box reading "Recharts Visualization Slot" (`AnalyticsTrends.tsx:41-62`) | **The main visual is literally missing** | Both references are led by charts. This is the single biggest gap. | Build it with the existing `chart.tsx` |
| Tables and badges | Uppercase headers and hand-rolled status pills; the `Badge` component is imported **0** times (`StudentDirectory.tsx:197-217`) | Every page invents its own badge colours | Status reads inconsistently across modules | `Badge` variants: success / warning / danger / neutral / info |
| Controls | Segmented control buttons do nothing: no state, no `type`, no `aria-pressed` (`AnalyticsTrends.tsx:27-37`) | Looks interactive but isn't | Erodes trust | A real `ToggleGroup`/`Tabs` |
| Responsive | Sidebar collapses to a Sheet at `md` (good) and tables scroll (good). The dashboard action row doesn't wrap (`page.tsx:30`). | Long button labels can overflow at 360px | Breaks on phones | `flex-wrap`, shorter labels, icon-only on mobile |
| Loading, empty, error | None anywhere | Real API data will flash in or fail silently | A key professional-quality signal | Skeleton, EmptyState and ErrorState primitives plus route files |

**What's intentionally different and should stay:** dense data tables with filters, the multi-campus BranchSwitcher, the separate mobile-first Teacher Portal with bottom nav, Rs currency and challan workflows. Don't copy ref one's per-rep avatars or "source mix" CRM concepts, or ref two's marketing image card. They have no Student-ERP equivalent.

---

## 3. Prioritised findings

| # | Sev | Finding and evidence | Recommended change | Visual impact | Scope |
|---|---|---|---|---|---|
| 1 | **P0** | **Route conflict:** `src/app/page.tsx` (leftover Next.js starter) and `src/app/(dashboard)/page.tsx` both resolve to `/`. There's also a duplicate copy at `(dashboard)/dashboard/page.tsx`. Next normally rejects this with a "two parallel pages" error; confirm with `next build`. | Remove the starter and keep a single dashboard (redirect `/` to `/dashboard`) | Users stop seeing the starter page or a build error | Page or route |
| 2 | **P0** | `slate-400` text at about 2.5:1 contrast ×102 (`Sidebar.tsx:67,76`, `ActivityFeed.tsx:98`, `BranchSwitcher.tsx:66`) | A `--muted-foreground` token of at least 4.5:1, used everywhere | Crisper, more legible UI | Shared tokens |
| 3 | **P0** | `<Link><Button>` produces a nested `<a><button>` (invalid HTML, double tab stop) (`page.tsx:38`, `QuickActions.tsx:31,53`) | `Button render={<Link href…/>}` (Base UI) or `buttonVariants()` on the Link | None visually; correct semantics | Shared pattern |
| 4 | **P0** | Clickable `<span>` "View all" (`ActivityFeed.tsx:77`, `StudentProfileDrawer.tsx:73`). Table rows are clickable only by mouse (`StudentDirectory.tsx` `onClick` row). Dead segmented buttons (`AnalyticsTrends.tsx:27-37`). | Real links and buttons, a keyboard-reachable row action, a working ToggleGroup | Visible focus rings, predictable controls | Shared and page |
| 5 | **P0** | Body and UI text mostly 10–12px (counts above). Nav `text-xs` (`Sidebar.tsx:89`), buttons `text-xs` (`page.tsx:33`). | 14px base; 12px only for metadata; nothing below 12px | Big jump in readability and polish | Shared |
| 6 | **P1** | Hero chart is a placeholder (`AnalyticsTrends.tsx:41-62`); recharts is unused | Fee collected vs target (bars) and attendance % (line) through `ChartContainer` | **Largest single uplift** | Page |
| 7 | **P1** | Tokens are stock grey and bypassed (`globals.css:51-84`; 4 token uses against roughly 1,900 hardcoded colour utilities) | Define a brand palette, semantic and chart tokens; refactor components to use them | Coherent identity | Shared |
| 8 | **P1** | Flat dashboard hierarchy (`page.tsx:13-61`, `KpiCards.tsx` four identical cards) | Bento grid with one hero element (see §4) | Focal point, professional composition | Page |
| 9 | **P1** | No page context in the header (`Header.tsx:51-55`); h1 markup copied in 9 pages | A shared `PageHeader` plus a breadcrumb from the route | Clear orientation | Shared |
| 10 | **P1** | Three product names: "EduCore ERP" (`layout.tsx:12`), "Apex ERP v2.0 / Enterprise School Suite" (`Sidebar.tsx:61-68`), "Apex Enterprise ERP" (`Header.tsx:52`) | Pick one name (your call) and put it in one constant | Feels like one product | Shared |
| 11 | **P1** | Flat navigation grouping; shared icon for Students and Staff; weak active state; Teacher Portal re-implements the sidebar (`teacher-portal/layout.tsx:55`) | Workflow groups; one `AppSidebar` driven by a config per role | Navigation readable at a glance | Shared |
| 12 | **P1** | No loading, empty or error states anywhere | `Skeleton`, `EmptyState`, `ErrorState`; `loading.tsx`/`error.tsx` per route group | Feels finished and robust | Shared |
| 13 | **P2** | Card border and ring stacked; per-call padding overrides (`card.tsx:14` plus every caller) | Card variants (`default`, `inset`, `stat`), no ad-hoc borders | Cleaner surfaces | Shared |
| 14 | **P2** | Arbitrary radii (xl ×135, lg ×105, md ×18, 2xl ×15) | Three tiers: control 8px, card 14px, pill full | Visual rhythm | Shared |
| 15 | **P2** | Uppercase tracked labels ×114 (KPI labels, table headers, sidebar groups) | Sentence case, weight 500, muted colour | Calmer, less templated | Shared |
| 16 | **P2** | `Badge` unused; status pills hand-rolled per module | Status `Badge` variants plus a status-to-variant map per domain (attendance, fees, enrolment) | Consistent status language | Shared |
| 17 | **P2** | Broken font tokens (`globals.css:10-12`); no `tabular-nums` on figures | Wire `--font-sans` and `--font-mono` correctly; tabular numbers in KPIs and tables | Aligned numbers, robust fonts | Shared |
| 18 | **P2** | Ad-hoc spacing and button heights (`p-5`/`p-6`, `h-9` overrides) | Size scale in `buttonVariants` (32/36/40) and card padding tokens | Consistency | Shared |
| 19 | **P2** | Non-clickable KPI cards get `hover:shadow-md` (`KpiCards.tsx:14`); the defaulter card turns the headline number rose (`:94`) | Hover only on interactive cards; red reserved for the status chip or delta | Less noise, honest affordances | Page |
| 20 | **P2** | Dashboard action row doesn't wrap on mobile (`page.tsx:30`) | `flex-wrap`, shorter labels | Mobile polish | Shared (PageHeader) |
| 21 | **P3** | Flat `slate-50` canvas | Tonal canvas plus a slightly lifted surface for the main frame | Depth like ref one | Shared |
| 22 | **P3** | KPIs have no trend context | Sparklines only where trends matter (attendance, fees) | Richer at a glance | Page |
| 23 | **P3** | Dark tokens exist with no toggle | Defer | — | — |

---

## 4. Recommended design direction: "The Register"

**Subject:** a multi-campus school ERP in Lahore (Rs, challans, class sections, attendance locks). It's used all day by admins, accountants and principals, and by teachers on phones. The vernacular comes from the school register and the fee ledger: navy ink on ruled paper, with a highlighter marking what needs action today.

**Self-review against the defaults:** I rejected ref one's black-and-acid-lime palette (a known generated-design cliché with no link to schools) and ref two's blue SaaS card kit, which is also what the current code already is. I kept their *techniques*: a bento hierarchy, one highlighted data point per chart, a solid active nav pill, sparklines.

**Colour tokens**
- Canvas `#F3F5F8` (cool paper) · Surface `#FFFFFF` · Hairline `#E3E7EE`
- Ink (text) `#1B2433` · Muted text `#566176` (about 6:1 on white)
- **Primary, register ink** `#23407A`: buttons, active nav, actual values in charts
- **Accent, highlighter** `#F4C430`: used *only* for "needs action today" and the current period in charts, with ink text on it
- Semantic: present/paid `#15803D` · pending/partial `#B45309` · absent/overdue `#B91C1C` · locked/neutral `#64748B`. Each has a 50-level tint for badge backgrounds.
- Chart ramp: ink `#23407A`, ink tint `#AFC0DE` (target or previous period), highlighter for the current period

**Type:** one family, **IBM Plex Sans**. It reads well in dense data, has true tabular figures, and IBM Plex Sans Arabic pairs with it if Urdu names or vouchers come later. Scale: 12 meta / 14 body and UI / 16 card title / 20 section / 28 page title / 36 KPI figure. Weights 400, 500 and 600, with 700 only for KPI figures. Use sentence case and no all-caps labels.

**Shape and space:** 4px base grid. Radii: control 8, card 14, pill full. One soft shadow, used only on raised layers (popovers, sticky header), plus hairline borders on cards.

**Layout**
```
┌──────────┬──────────────────────────────────────────────────────┐
│ ◼ Brand  │ Students / Directory        [Term ▾] [Campus ▾] 🔔 TS │
│ Search   ├──────────────────────────────────────────────────────┤
│ Daily    │ Good morning, Tayyab               [Export] [+ Admit] │
│ ▣ Dash   │ Lahore Central · Tue 13 Oct                           │
│   Attend │ ┌─ Today's register (hero, span 8) ─┐┌ Fee target ──┐ │
│   Fees   │ │ 9A ■ 9B ■ 9C ▧ 10A ■ 10B □ …      ││ Rs 1.25M     │ │
│ Records  │ │ 31/34 classes locked · 92.4% pres ││ ███████░ 75% │ │
│   Studs  │ └───────────────────────────────────┘└──────────────┘ │
│   Staff  │ ┌ Fee collection vs target (bars) ┐┌ Attendance % ─┐ │
│ Academic │ │ ▆ ▇ ▅ ▇ █(highlighted Oct)       ││ line, 30 days │ │
│   Exams  │ └──────────────────────────────────┘└───────────────┘ │
│ Admin    │ ┌ Defaulters (table, badges) ─────┐┌ Activity ─────┐ │
│   Sett.  │ └──────────────────────────────────┘└───────────────┘ │
│ [Teacher]│                                                       │
└──────────┴──────────────────────────────────────────────────────┘
```
- **The one bold element: "Today's register".** It's a grid of class-section cells that show locked / pending / not started, with pending cells highlighted. It's specific to the ERP and actionable, and replaces the generic four-KPI opener. Everything else stays quiet.
- Sidebar: 248px, workflow groups (Daily, Records, Academics, Admin), a solid ink active pill, a count badge for pending items (e.g., unlocked classes), and the user card at the bottom. The same `AppSidebar` serves the teacher role from a different config.
- Header: breadcrumb on the left; Term/Month selector, campus switcher, notifications and avatar on the right. Campus is first-class context, so it stays prominent.
- Left-aligned content, numbers right-aligned in tables, and visible `focus-visible` rings (2px primary at 40%) everywhere.
- Responsive: 12 columns at `lg`, 6 at `md`, 1 column below; the hero first. The Teacher Portal keeps bottom nav. Reduced motion is respected; the only motion is responses to clicks (drawer, popover, toggle).

---

## 5. Implementation plan (staged; nothing done yet)

1. **Foundation and tokens:** `src/app/globals.css` (palette, semantic and chart tokens, radius, fixed font vars), `src/app/layout.tsx` (Plex font, one product name, drop the hardcoded `bg-slate-50 text-slate-900`). Add a brand constant, e.g. `src/lib/brand.ts`.
2. **Shared layout and navigation:** `src/components/layout/Sidebar.tsx` (config-driven, grouped, active pill), `Header.tsx` (breadcrumb, period selector), `src/app/(dashboard)/layout.tsx`, `src/app/teacher-portal/layout.tsx` (reuse the sidebar), `MobileBottomNav.tsx` (tokens). Remove `src/app/page.tsx` and the duplicate `(dashboard)/dashboard/page.tsx` (fixes P0 #1).
3. **Reusable components:** `src/components/ui/button.tsx` (sizes, Link rendering), `card.tsx` (variants, no double outline), `badge.tsx` (status variants), `table.tsx` (sentence-case headers, tabular numbers, row action). New: `PageHeader`, `StatCard`, `EmptyState`, `ErrorState`, `Skeleton`, `ToggleGroup`/`Tabs` usage, `ChartCard`.
4. **Dashboard:** `src/app/(dashboard)/page.tsx`, `src/features/dashboard/components/{KpiCards,AnalyticsTrends,QuickActions,ActivityFeed}.tsx`, plus a new `TodayRegister.tsx` hero. Real Recharts through `ui/chart.tsx`.
5. **Remaining pages** (same pattern: PageHeader, tokens, Badge, EmptyState): `src/app/(dashboard)/{students,attendance,fees,staff,exams,settings}/page.tsx` and `src/features/*/components/*.tsx`. The biggest are `DefaultersTable`, `PointOfSale`, `MarksEntryGrid`, `StaffDirectory`, `PayrollList` and `StudentDirectory`. Then the teacher-portal pages and `(auth)` pages.
6. **Verification:** `npm run build` and `npm run lint`; run the app and screenshot each page at 360, 768, 1280 and 1440px; keyboard-only pass (tab order, focus rings, row actions); contrast check of the tokens (AA 4.5:1 text, 3:1 UI); `prefers-reduced-motion`; grep for leftover hardcoded `slate-`/`blue-` utilities and `text-[10px]`/`text-[11px]`.

## Five highest-impact first moves
1. **Replace the chart placeholder** with real fee-vs-target bars and an attendance line (`AnalyticsTrends.tsx`, `ui/chart.tsx`).
2. **Set up the token foundation** (palette, semantic and chart colours, radius, fixed font vars) in `globals.css` and make Button, Card and Badge consume it.
3. **Fix the type scale and contrast:** 14px base, a muted-text token of at least 4.5:1, no all-caps labels.
4. **Recompose the dashboard** around the "Today's register" hero in a bento grid, with a shared `PageHeader`.
5. **Clear the P0 correctness issues:** the `/` route conflict, the nested `<a><button>`, clickable spans and dead toggles. Decide on the single product name.
