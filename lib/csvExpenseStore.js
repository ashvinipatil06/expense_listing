const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const HEADER = ["Item", "Amount", "Category", "Date"];
const HEADER_LINE = HEADER.join(",");

function getCsvPath() {
  const fromEnv = process.env.EXPENSE_CSV_PATH;
  if (fromEnv && String(fromEnv).trim()) {
    return path.resolve(String(fromEnv).trim());
  }
  return path.join(__dirname, "..", "data", "expenses.csv");
}

function escapeField(value) {
  const s = value == null ? "" : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      fields.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  fields.push(current);
  return fields;
}

let writeMutex = Promise.resolve();

async function readExpensesRaw() {
  const csvPath = getCsvPath();
  try {
    const text = await fsp.readFile(csvPath, "utf8");
    const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
    if (lines.length === 0) {
      return [];
    }
    const first = parseCsvLine(lines[0]);
    const hasHeader =
      first.length >= 4 &&
      first[0] === "Item" &&
      first[1] === "Amount" &&
      first[2] === "Category" &&
      first[3] === "Date";
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const rows = [];
    for (const line of dataLines) {
      const cols = parseCsvLine(line);
      if (cols.length < 4) continue;
      const amountNum = Number(cols[1]);
      rows.push({
        item: cols[0],
        amount: Number.isFinite(amountNum) ? amountNum : cols[1],
        category: cols[2],
        date: cols[3],
      });
    }
    return rows;
  } catch (e) {
    if (e && e.code === "ENOENT") {
      return [];
    }
    throw e;
  }
}

function appendFilePromise(csvPath, data) {
  return fsp.appendFile(csvPath, data, "utf8");
}

/**
 * @param {{ item: string, amount: number, category: string, date: string }} row
 */
async function appendExpense(row) {
  const csvPath = getCsvPath();
  await fsp.mkdir(path.dirname(csvPath), { recursive: true });

  const dataLine =
    [
      escapeField(row.item),
      escapeField(String(row.amount)),
      escapeField(row.category),
      escapeField(row.date),
    ].join(",") + "\n";

  const run = async () => {
    let exists = false;
    try {
      await fsp.access(csvPath, fs.constants.F_OK);
      exists = true;
    } catch {
      exists = false;
    }
    if (!exists) {
      await fsp.writeFile(csvPath, HEADER_LINE + "\n", "utf8");
    }
    await appendFilePromise(csvPath, dataLine);
    return { path: csvPath, createdNewFile: !exists };
  };

  const result = writeMutex.then(() => run());
  writeMutex = result.catch(() => {});
  return result;
}

module.exports = {
  getCsvPath,
  readExpensesRaw,
  appendExpense,
  HEADER,
};
