# Paper maker: what is mocked

The paper maker runs entirely in the browser on demo data. Every call goes through
the paper service contract in `contract.ts`. Today `mockPaperService.ts` implements it
against the in-memory mock database; the backend replaces it with HTTP calls to the
endpoints below. Screens don't change.

## Flow

- **Teacher** (teacher portal, `/teacher-portal/paper-maker`)
  - Steps: board → class → book → chapters and sub topics → questions → paper details.
  - Ends with **Submit for printing**.
  - Each step depends on the one before. Changing an earlier choice warns first, then
    clears or rechecks later steps. Unticking sub topics removes only the questions
    drawn from them.
  - Drafts can be saved at any step and reopen on the step they were saved at.
  - Teachers preview the paper on screen only.
- **Print desk** (`/papers`, `/papers/:id`, `/print/papers/:id`)
  - For users with the `canPrintPapers` permission.
  - Lists submitted papers. From a paper you can print it, download the PDF, print the
    answer key, mark it printed, or return it to the teacher with a note.
- **Statuses:** draft → submitted → printed, or submitted → returned (with a note) →
  edited and submitted again. The teacher sees the status and the note.

## Endpoints the backend builds

| Operation | Method and path | Access the backend must enforce |
|---|---|---|
| getCatalog | `GET /api/paper-catalog` | Any signed-in user |
| getQuestionBank | `GET /api/question-bank?subTopicIds=…` | Teachers, or `canPrintPapers` |
| listPapers | `GET /api/papers?status=…` | Own papers; every non-draft paper with `canPrintPapers` |
| saveDraft | `POST /api/papers` · `PUT /api/papers/:id` | Owner only; status draft or returned |
| submit | `POST /api/papers/:id/submit` | Owner only; status draft or returned; paper complete (`paperProblem`) |
| markPrinted | `POST /api/papers/:id/printed` | `canPrintPapers`; status submitted |
| returnToTeacher | `POST /api/papers/:id/return` | `canPrintPapers`; status submitted; note required |
| getPrintable | `GET /api/papers/:id/pdf?answerKey=…` | `canPrintPapers`; status submitted or printed |

The caller (name, staff id, permissions) comes from the sign-in token, never from the
request body.

## The print permission

- `canPrintPapers` is a row in the Settings permission matrix (Settings → Roles), on
  for owner and branch admin by default. No role names are hardcoded in the screens:
  they read the flag through `usePermissionFlags()`. The backend can map the flag to
  any role.
- Without the flag, the Print queue nav item is hidden. `/papers` and
  `/print/papers/:id` show "You can't print exam papers", and no print, PDF or answer
  key control is rendered.
- **That hiding is UI only.** The mock service already refuses `markPrinted`,
  `returnToTeacher` and `getPrintable` without the flag (HTTP 403). The backend must
  do the same.

## Mocked for now

- **Catalogue** (`src/mocks/paper.ts`): two boards (PTB, Oxford), their classes, books,
  chapters and sub topics.
- **Question bank:** real questions for PTB Physics 9, chapters 1 and 2. Every other sub
  topic has generic sample questions ("Sample choice A…") so any scope can be drawn
  from. Types are multiple choice, short answer and long answer.
- **Papers:** five demo papers, one in each status, plus a second submitted one.
- **Ownership:** an admin who opens the teacher portal acts as the demo teacher, so the
  mock trusts the paper's teacher id. The backend checks ownership against the token.
- **PDF:** "Download PDF" opens the print layout and the browser's "Save as PDF". The
  backend should return a real PDF from `getPrintable`.
- **School name and logo** come from Settings → Institute (`campusProfile`). Teachers
  don't type them.
- Nothing is saved between visits: reloading resets the demo data.
