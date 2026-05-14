(function () {
  "use strict";

  const ALLOWED_CATEGORIES = ["Shopping", "Travel", "Food", "Others"];

  const form = document.getElementById("expense-form");
  const itemInput = document.getElementById("item");
  const amountInput = document.getElementById("amount");
  const categorySelect = document.getElementById("category");
  const dateInput = document.getElementById("date");
  const submitBtn = document.getElementById("submit-btn");
  const feedback = document.getElementById("feedback");
  const tbody = document.getElementById("expense-rows");
  const emptyHint = document.getElementById("empty-hint");

  /** @type {{ item: string, amount: number, category: string, date: string }[]} */
  let expenses = [];

  /** @type {Chart | null} */
  let categoryChart = null;

  function formatMoney(n) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(n);
  }

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

  function validateClient() {
    if (!isNonEmptyString(itemInput.value)) {
      return "Item is required and cannot be empty.";
    }
    const rawAmount = amountInput.value.trim();
    if (!rawAmount) {
      return "Amount is required.";
    }
    const num = Number(rawAmount);
    if (!Number.isFinite(num)) {
      return "Amount must be a valid number.";
    }
    const cat = categorySelect.value.trim();
    if (!cat) {
      return "Please choose a category.";
    }
    if (!ALLOWED_CATEGORIES.includes(cat)) {
      return (
        "Category must be one of: " + ALLOWED_CATEGORIES.join(", ") + "."
      );
    }
    const dateVal = dateInput.value.trim();
    if (!dateVal) {
      return "Date is required.";
    }
    if (!isValidIsoDateString(dateVal)) {
      return "Date must be a valid calendar date (use YYYY-MM-DD).";
    }
    return null;
  }

  function setFeedback(mode, message) {
    feedback.classList.remove("is-loading", "is-success", "is-error");
    if (mode === "loading") {
      feedback.classList.add("is-loading");
      feedback.innerHTML =
        '<span class="spinner" aria-hidden="true"></span>' +
        (message || "Saving…");
    } else if (mode === "success") {
      feedback.classList.add("is-success");
      feedback.textContent = message || "";
    } else if (mode === "error") {
      feedback.classList.add("is-error");
      feedback.textContent = message || "";
    } else {
      feedback.textContent = "";
    }
  }

  function renderTable() {
    tbody.innerHTML = "";
    for (const row of expenses) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        escapeHtml(row.item) +
        "</td><td>" +
        escapeHtml(formatMoney(row.amount)) +
        "</td><td>" +
        escapeHtml(row.category) +
        "</td><td>" +
        escapeHtml(row.date) +
        "</td>";
      tbody.appendChild(tr);
    }
    emptyHint.classList.toggle("hidden", expenses.length > 0);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function aggregateByCategory() {
    const totals = {};
    for (const c of ALLOWED_CATEGORIES) {
      totals[c] = 0;
    }
    for (const e of expenses) {
      const n = Number(e.amount);
      if (Number.isFinite(n) && totals[e.category] != null) {
        totals[e.category] += n;
      }
    }
    return totals;
  }

  function updateChart() {
    const ctx = document.getElementById("category-chart");
    if (!ctx || typeof Chart === "undefined") {
      return;
    }
    const totals = aggregateByCategory();
    const labels = ALLOWED_CATEGORIES;
    const data = labels.map((k) => totals[k]);

    const colors = [
      "rgba(61, 156, 245, 0.75)",
      "rgba(62, 207, 142, 0.75)",
      "rgba(240, 113, 120, 0.75)",
      "rgba(200, 170, 90, 0.75)",
    ];

    if (categoryChart) {
      categoryChart.data.labels = labels;
      categoryChart.data.datasets[0].data = data;
      categoryChart.update();
      return;
    }

    categoryChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Total amount",
            data,
            backgroundColor: colors,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => formatMoney(item.raw),
            },
          },
        },
        scales: {
          x: {
            ticks: { color: getChartTickColor() },
            grid: { color: getChartGridColor() },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: getChartTickColor(),
              callback: (v) => "$" + v,
            },
            grid: { color: getChartGridColor() },
          },
        },
      },
    });
  }

  function getChartTickColor() {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "#5c6b78"
      : "#9aa8b4";
  }

  function getChartGridColor() {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "rgba(0,0,0,0.06)"
      : "rgba(255,255,255,0.08)";
  }

  async function loadExpenses() {
    const res = await fetch("/api/expenses");
    if (!res.ok) {
      throw new Error("LIST_FAILED");
    }
    const body = await res.json();
    expenses = Array.isArray(body.expenses) ? body.expenses : [];
    renderTable();
    updateChart();
  }

  async function submitExpense(ev) {
    ev.preventDefault();

    const clientErr = validateClient();
    if (clientErr) {
      setFeedback("error", clientErr);
      return;
    }

    const payload = {
      item: itemInput.value.trim(),
      amount: Number(amountInput.value.trim()),
      category: categorySelect.value.trim(),
      date: dateInput.value.trim(),
    };

    submitBtn.disabled = true;
    setFeedback("loading", "Saving expense…");

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));

      if (res.ok) {
        setFeedback("success", "Expense saved successfully.");
        if (body.saved) {
          expenses.push(body.saved);
        } else {
          await loadExpenses();
        }
        renderTable();
        updateChart();
        form.reset();
        if (dateInput.value === "") {
          dateInput.valueAsDate = new Date();
        }
        return;
      }

      const serverMsg =
        body && typeof body.error === "string"
          ? body.error
          : "The server rejected this expense.";
      setFeedback("error", serverMsg);
    } catch (_err) {
      setFeedback(
        "error",
        "Network error: could not reach the server. Check your connection or try again."
      );
    } finally {
      submitBtn.disabled = false;
    }
  }

  function initDateDefault() {
    if (!dateInput.value) {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      dateInput.value = y + "-" + m + "-" + day;
    }
  }

  form.addEventListener("submit", submitExpense);

  initDateDefault();
  loadExpenses().catch(() => {
    setFeedback(
      "error",
      "Could not load expenses from the server. You can still try adding one."
    );
  });
})();
