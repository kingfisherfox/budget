import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost } from "../api/client";
import type { Category, WishlistItem } from "../api/types";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoney } from "../lib/money";
import { todayISODateUTC } from "../lib/month";

export function WishlistPage() {
  const { currencyCode } = useCurrency();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", categoryId: "", amount: "", note: "" });
  const [purchase, setPurchase] = useState<WishlistItem | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [w, c] = await Promise.all([
        apiGet<WishlistItem[]>("/api/wishlist"),
        apiGet<Category[]>("/api/categories"),
      ]);
      setItems(w);
      setCategories(c);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (categories.length > 0) {
      setForm((f) =>
        f.categoryId ? f : { ...f, categoryId: categories[0].id }
      );
    }
  }, [categories]);

  async function addItem() {
    if (!form.name.trim() || !form.categoryId) {
      setErr("Name and category required");
      return;
    }
    const n = Number(form.amount);
    if (!Number.isFinite(n) || n <= 0) {
      setErr("Valid amount required");
      return;
    }
    setErr(null);
    try {
      await apiPost("/api/wishlist", {
        name: form.name.trim(),
        categoryId: form.categoryId,
        amount: n,
        note: form.note.trim() || null,
      });
      setForm((f) => ({ ...f, name: "", amount: "", note: "" }));
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this wishlist item?")) return;
    try {
      await apiDelete(`/api/wishlist/${id}`);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold tracking-tight text-slate-900">Wishlist</h1>
      {err && <p className="text-sm font-medium text-red-600">{err}</p>}

      <section className="flex flex-col gap-4 rounded-none border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Add item</h2>
        <div className="flex flex-col gap-3">
          <input
            className="h-10 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <select
            className="h-10 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className="h-10 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
            placeholder="Amount"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <input
            className="h-10 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
            placeholder="Note (optional)"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
          <button
            type="button"
            className="mt-1 h-11 w-full rounded-none bg-indigo-600 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
            onClick={() => void addItem()}
          >
            Add
          </button>
        </div>
      </section>

      <ul className="flex flex-col gap-3">
        {items.length === 0 ? (
          <li className="text-sm text-slate-500">No wishlist items.</li>
        ) : (
          items.map((w) => (
            <li
              key={w.id}
              className="flex flex-col gap-3 rounded-none border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex flex-col gap-1">
                <p className="text-base font-bold text-slate-900">{w.name}</p>
                <p className="text-sm font-medium text-slate-600">
                  <span className="uppercase tracking-wider text-slate-500">{w.category.name}</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="tabular-nums text-slate-900">{formatMoney(w.amount, currencyCode)}</span>
                </p>
                {w.note ? (
                  <p className="mt-1 text-sm text-slate-500">{w.note}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="h-9 rounded-none border border-slate-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                  onClick={() => setPurchase(w)}
                >
                  Purchased
                </button>
                <button
                  type="button"
                  className="h-9 rounded-none border border-red-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-red-600 transition-colors hover:border-red-400 hover:bg-red-50"
                  onClick={() => remove(w.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      {purchase && (
        <PurchaseModal
          item={purchase}
          currencyCode={currencyCode}
          onClose={() => setPurchase(null)}
          onDone={() => {
            setPurchase(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function PurchaseModal({
  item,
  currencyCode,
  onClose,
  onDone,
}: {
  item: WishlistItem;
  currencyCode: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(item.amount);
  const [date, setDate] = useState(todayISODateUTC());
  const [note, setNote] = useState(item.note ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function confirm() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setErr("Valid amount required");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await apiPost(`/api/wishlist/${item.id}/purchase`, {
        name: item.name,
        amount: n,
        date,
        note: note.trim() || null,
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm transition-opacity md:items-center md:p-4">
      <div className="w-full max-w-md rounded-none border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">Record purchase</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">{item.name}</p>
        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span className="text-xs uppercase tracking-wider text-slate-500">Final amount ({currencyCode})</span>
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
              onClick={() => void confirm()}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
