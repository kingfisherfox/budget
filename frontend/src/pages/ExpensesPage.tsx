import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPatch } from "../api/client";
import type { Category, Expense } from "../api/types";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";
import { formatMoney } from "../lib/money";

export function ExpensesPage() {
  const { month } = useMonth();
  const { currencyCode } = useCurrency();
  const [items, setItems] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [ex, cat] = await Promise.all([
        apiGet<Expense[]>(`/api/expenses?month=${month}`),
        apiGet<Category[]>("/api/categories"),
      ]);
      setItems(ex);
      setCategories(cat);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!window.confirm("Delete this expense permanently?")) return;
    try {
      await apiDelete(`/api/expenses/${id}`);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  }

  // Group items by date
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, Expense[]>);

  const sortedDates = Object.keys(groupedItems).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold tracking-tight text-slate-900">Expenses</h1>
      {err && <p className="text-sm font-medium text-red-600">{err}</p>}
      
      {items.length === 0 ? (
        <div className="rounded-none border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">No expenses this month.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sortedDates.map((date) => (
            <div key={date} className="flex flex-col gap-2">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h2>
              <ul className="flex flex-col divide-y divide-slate-100 rounded-none border border-slate-200 bg-white shadow-sm">
                {groupedItems[date].map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-col gap-3 p-5 transition-colors hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-baseline gap-3">
                        <span className="text-base font-bold text-slate-900">{e.name || "Unnamed Expense"}</span>
                        <span className="text-base font-medium tabular-nums text-slate-900">
                          {formatMoney(e.amount, currencyCode)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-none bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {e.category.name}
                        </span>
                        <span className="inline-flex items-center rounded-none bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                          {e.date}
                        </span>
                      </div>
                      {e.note ? (
                        <p className="text-sm text-slate-500">
                          {e.note}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        className="h-9 rounded-none border border-slate-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                        onClick={() => setEditing(e)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="h-9 rounded-none border border-red-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-red-600 transition-colors hover:border-red-400 hover:bg-red-50"
                        onClick={() => remove(e.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ExpenseEditModal
          expense={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ExpenseEditModal({
  expense,
  categories,
  onClose,
  onSaved,
}: {
  expense: Expense;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(expense.name);
  const [categoryId, setCategoryId] = useState(expense.categoryId);
  const [amount, setAmount] = useState(expense.amount);
  const [date, setDate] = useState(expense.date);
  const [note, setNote] = useState(expense.note ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      setErr("Enter a name");
      return;
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setErr("Invalid amount");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await apiPatch(`/api/expenses/${expense.id}`, {
        name: name.trim(),
        categoryId,
        amount: n,
        date,
        note: note.trim() || null,
      });
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm transition-opacity md:items-center md:p-4">
      <div className="max-h-[90svh] w-full max-w-md overflow-auto rounded-none border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">Edit expense</h2>
        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span className="text-xs uppercase tracking-wider text-slate-500">Name</span>
            <input
              className="h-10 rounded-none border border-slate-200 bg-slate-50 px-3 text-base transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span className="text-xs uppercase tracking-wider text-slate-500">Category</span>
            <select
              className="h-10 rounded-none border border-slate-200 bg-slate-50 px-3 text-base transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span className="text-xs uppercase tracking-wider text-slate-500">Amount</span>
            <input
              className="h-10 rounded-none border border-slate-200 bg-slate-50 px-3 text-base transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span className="text-xs uppercase tracking-wider text-slate-500">Date</span>
            <input
              type="date"
              className="h-10 rounded-none border border-slate-200 bg-slate-50 px-3 text-base transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span className="text-xs uppercase tracking-wider text-slate-500">Note</span>
            <input
              className="h-10 rounded-none border border-slate-200 bg-slate-50 px-3 text-base transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          {err && <p className="text-sm font-medium text-red-600">{err}</p>}
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              className="h-12 flex-1 rounded-none border border-slate-200 bg-white text-sm font-bold uppercase tracking-wider text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              className="h-12 flex-1 rounded-none bg-indigo-600 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50"
              onClick={() => void save()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
