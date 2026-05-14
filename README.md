# Expense listing (stateful)

Web app for capturing expenses with CSV persistence, async save feedback, and a category totals chart. Stack: **Node.js**, **Express**, plain **HTML/CSS/JS**, **Chart.js** (CDN) for graphs.

## Prerequisites

- Node.js 18+

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000/](http://localhost:3000/). The API is available under `/api/`.

### Scripts

- `npm start` — run the server
- `npm run dev` — run with `node --watch` (auto-restart on file changes)

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | HTTP port |
| `EXPENSE_CSV_PATH` | `data/expenses.csv` (under project root) | Absolute or relative path to the CSV file |

## API (summary)

- `GET /api/health` — liveness
- `GET /api/categories` — allowed category labels
- `GET /api/expenses` — list saved rows as JSON
- `POST /api/expenses` — body `{ "item", "amount", "category", "date" }` (`date` as `YYYY-MM-DD`)

See [plan.md](./plan.md), [architecture.md](./architecture.md), and [test/test-cases.md](./test/test-cases.md) for phased delivery and acceptance checks.
