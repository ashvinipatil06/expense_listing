# Expense Listing — Phased delivery plan

This plan implements [requirement.md](./requirement.md) using the stack in [architecture.md](./architecture.md) Section 2.1 (Express + plain HTML/CSS/JS, CSV on disk). Adjust durations to your schedule.

---

## Phase 0 — Repository and baseline

**Goal:** Versioned project skeleton and agreed scope.

| Step | Outcome |
|------|---------|
| Initialize git (if not done); keep [`.gitignore`](./.gitignore) with `node_modules/` | Clean commits |
| Confirm `requirement.md`, `architecture.md`, and this `plan.md` are current | Single source of truth |
| Optional: add `README.md` with run instructions once the app exists | Onboarding |

**Exit:** Repo ready; no application code required yet.

---

## Phase 1 — Node / Express scaffold

**Goal:** Runnable server that serves static files and a health check.

| Step | Outcome |
|------|---------|
| `package.json` with `express` (and dev script, e.g. `node server.js` or `nodemon`) | `npm install` works |
| Minimal `server.js` (or `app.js`): listen on a port, log startup | Server starts |
| `public/` with placeholder `index.html`, linked CSS/JS | Browser loads UI shell |
| Express `static` middleware for `public/` | Assets served |

**Exit:** Open `http://localhost:<port>/` → see shell page; no CSV yet.

---

## Phase 2 — CSV persistence layer

**Goal:** Append-only storage matching requirement §4.2.

| Step | Outcome |
|------|---------|
| Configurable CSV path (e.g. env var `EXPENSE_CSV_PATH` or `data/expenses.csv`) | No hard-coded absolute paths in code |
| On first write: create file with header `Item,Amount,Category,Date` | Valid empty table |
| `appendExpense(row)` (or equivalent): escape/quote fields safely | No corrupt rows for commas/quotes in item |
| Optional: simple file lock or single-writer assumption per architecture §5.2 | Safe under low concurrency |

**Exit:** Unit-testable module (or manual script) can append one row; file on disk correct.

---

## Phase 3 — HTTP API

**Goal:** Server-side validation and JSON contract; client never writes CSV directly.

| Step | Outcome |
|------|---------|
| `POST /api/expenses` (path may vary): body `{ item, amount, category, date }` | Validates all §4.1 rules |
| Reject invalid payload with `4xx` and clear message | Matches test cases API-02–API-06 |
| On success: append CSV, return `2xx` and optional echo of saved row | DATA-01 satisfied |
| `GET /api/expenses` (recommended): return all rows for list refresh | API-10 / API-11 |

**Exit:** All API rows in [test/test-cases.md](./test/test-cases.md) Section 1–2 pass manually (curl/Thunder Client/Postman).

---

## Phase 4 — Frontend: form, list, async UX

**Goal:** Requirement §§3–4.4 without full page reload.

| Step | Outcome |
|------|---------|
| HTML: item, amount, category (`select`: Shopping, Travel, Food, Others), date, “Add to Expense List” | §3 fields present |
| CSS: readable layout; responsive basics (§5.1) | Works on narrow viewport |
| JS: `fetch` `POST` on submit; `preventDefault` | No full page reload (UI-11) |
| JS: loading flag → show spinner/disable button (§4.3) | UI-10 |
| JS: success and error message regions (§4.3) | UI-11, UI-12 |
| After success: append to in-memory list and/or `GET` refresh (§4.4) | List matches server |

**Exit:** Manual run-through of [test/test-cases.md](./test/test-cases.md) Sections 3–4.

---

## Phase 5 — Integration, polish, and hardening

**Goal:** NFRs and confidence before “done.”

| Step | Outcome |
|------|---------|
| Client-side validation for fast feedback; **always** re-validate on server | Defense in depth |
| Consistent error messages (network vs validation vs server) | Clear UX |
| Smoke NFR checks (resize, latency) | NFR-01, NFR-02 |
| Walk full regression checklist in test doc §7 | Sign-off |

**Exit:** Stakeholder demo; CSV verified on disk after typical session.

---

## Phase 6 — Optional / future (out of initial scope)

Per requirement §6 and architecture §9, when needed:

- Edit/delete rows (stable row identity)
- Filter by category/date
- Export CSV copy from UI
- Dashboard / analytics
- Replace CSV with SQLite or other DB (swap persistence adapter only)

---

## Traceability

| Requirement area | Phases |
|------------------|--------|
| §4.1 Data entry / validation | 3, 4, 5 |
| §4.2 CSV storage | 2, 3 |
| §4.3 Async submission + feedback | 3, 4, 5 |
| §4.4 State | 4, 5 |
| §5 NFRs | 4, 5 |
| Stack (architecture §2.1) | 1–4 |

---

## Related artifacts

- Test cases: [test/test-cases.md](./test/test-cases.md)
