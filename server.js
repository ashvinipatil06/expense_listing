const path = require("path");
const express = require("express");
const { readExpensesRaw, appendExpense } = require("./lib/csvExpenseStore");
const {
  validateExpenseBody,
  ALLOWED_CATEGORIES,
} = require("./lib/validateExpense");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "expense-listing" });
});

app.get("/api/categories", (_req, res) => {
  res.json({ categories: ALLOWED_CATEGORIES });
});

app.get("/api/expenses", async (_req, res) => {
  try {
    const rows = await readExpensesRaw();
    res.json({ expenses: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Could not read expense data. Please try again later.",
    });
  }
});

app.post("/api/expenses", async (req, res) => {
  const parsed = validateExpenseBody(req.body);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.message });
  }
  try {
    await appendExpense(parsed.value);
    return res.status(201).json({ saved: parsed.value });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Could not save expense. Please try again later.",
    });
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found." });
  }
  return res.status(404).send("Not found");
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON body." });
  }
  console.error(err);
  return res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`Expense listing server listening on http://localhost:${PORT}`);
});
