const ALLOWED_CATEGORIES = ["Shopping", "Travel", "Food", "Others"];

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isValidIsoDateString(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s.trim())) {
    return false;
  }
  const p = s.trim().split("-").map(Number);
  const y = p[0];
  const m = p[1];
  const day = p[2];
  const d = new Date(Date.UTC(y, m - 1, day));
  return (
    d.getUTCFullYear() === y &&
    d.getUTCMonth() === m - 1 &&
    d.getUTCDate() === day
  );
}

/**
 * @param {unknown} body
 * @returns {{ ok: true, value: { item: string, amount: number, category: string, date: string } } | { ok: false, message: string }}
 */
function validateExpenseBody(body) {
  if (body == null || typeof body !== "object") {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const { item, amount, category, date } = body;

  if (!isNonEmptyString(item)) {
    return { ok: false, message: "Item is required and cannot be empty." };
  }
  if (amount === undefined || amount === null || amount === "") {
    return { ok: false, message: "Amount is required." };
  }
  if (typeof amount === "string" && amount.trim() === "") {
    return { ok: false, message: "Amount is required." };
  }
  const num =
    typeof amount === "number"
      ? amount
      : typeof amount === "string"
        ? Number(amount.trim().replace(/,/g, ""))
        : Number(amount);
  if (!Number.isFinite(num)) {
    return { ok: false, message: "Amount must be a valid number." };
  }
  if (!isNonEmptyString(category)) {
    return { ok: false, message: "Category is required." };
  }
  const cat = String(category).trim();
  if (!ALLOWED_CATEGORIES.includes(cat)) {
    return {
      ok: false,
      message: `Category must be one of: ${ALLOWED_CATEGORIES.join(", ")}.`,
    };
  }
  if (!isNonEmptyString(date)) {
    return { ok: false, message: "Date is required." };
  }
  const dateStr = String(date).trim();
  if (!isValidIsoDateString(dateStr)) {
    return {
      ok: false,
      message: "Date must be a valid calendar date (use YYYY-MM-DD).",
    };
  }

  return {
    ok: true,
    value: {
      item: String(item).trim(),
      amount: num,
      category: cat,
      date: dateStr,
    },
  };
}

module.exports = {
  validateExpenseBody,
  ALLOWED_CATEGORIES,
};
