# Expense Listing — Test cases

Acceptance and regression checks for [requirement.md](../requirement.md). Execute manually until automated tests exist.

**Convention:** API paths are examples; adjust to match implementation.

---

## 1. API — POST create expense

| ID | Preconditions | Steps | Expected |
|----|-----------------|-------|----------|
| API-01 | Server running; CSV empty or valid | POST valid JSON: item, amount (number), category (allowed), date (valid) | 2xx; row appended; columns match schema |
| API-02 | — | POST with empty item | 4xx; no new row; body explains error |
| API-03 | — | POST with non-numeric amount | 4xx; no new row |
| API-04 | — | POST with invalid date | 4xx; no new row |
| API-05 | — | POST with category not in allowed set | 4xx; no new row |
| API-06 | — | POST with missing required field | 4xx; no new row |
| API-07 | CSV missing on disk (first run) | Valid POST | File created with header plus row |

---

## 2. API — GET list expenses (if implemented)

| ID | Preconditions | Steps | Expected |
|----|-----------------|-------|----------|
| API-10 | Known rows in CSV | GET list endpoint | 2xx; array matches stored rows |
| API-11 | Empty CSV (header only) | GET list endpoint | 2xx; empty list or equivalent |

---

## 3. UI — data entry and validation

| ID | Preconditions | Steps | Expected |
|----|-----------------|-------|----------|
| UI-01 | App open | Fill all fields with valid data | All inputs work; category includes Shopping, Travel, Food, Others |
| UI-02 | — | Submit with one mandatory field empty | Validation error; no full page reload |
| UI-03 | — | Non-numeric amount and submit | Error feedback |
| UI-04 | — | Invalid date and submit | Error feedback |

---

## 4. UI — async submission and feedback

| ID | Preconditions | Steps | Expected |
|----|-----------------|-------|----------|
| UI-10 | Optional: slow network | Submit valid expense | Loading spinner (or equivalent) during request |
| UI-11 | Valid submit | Complete successful POST | Success message; expense in list; page did not reload |
| UI-12 | Server stopped or broken endpoint | Submit valid expense | Error message; list consistent with no save |
| UI-13 | After success | Observe list and messages | State reflects expenses and appropriate feedback |

---

## 5. Data and CSV integrity

| ID | Preconditions | Steps | Expected |
|----|-----------------|-------|----------|
| DATA-01 | After API-01 | Open CSV on disk | Header: Item, Amount, Category, Date; one row per save |
| DATA-02 | Multiple saves | Add several valid rows | One row per expense; quoting handles commas in item |

---

## 6. Non-functional (smoke)

| ID | Preconditions | Steps | Expected |
|----|-----------------|-------|----------|
| NFR-01 | Desktop browser | Resize window | Layout usable; controls reachable |
| NFR-02 | — | Add expense | Prompt response under normal local use |

---

## 7. Regression checklist (quick)

- [ ] API-01, API-03, API-04
- [ ] UI-11, UI-12
- [ ] DATA-01

---

## Automated tests (future)

Optional: add Vitest, Jest, or Node test runner with supertest for API routes; keep this file as the master acceptance list or sync case IDs with automated suites.
