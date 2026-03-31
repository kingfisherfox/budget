import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut, apiPatch } from "../api/client";
import type { Category, RecurringTemplate } from "../api/types";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoney } from "../lib/money";
import { CURRENCY_CODES } from "../settings/currencies";

export function SettingsPage() {
  const { currencyCode, setCurrency } = useCurrency();
  const [domainName, setDomainName] = useState("");
  const [domainSaved, setDomainSaved] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurring, setRecurring] = useState<RecurringTemplate[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [budgets, setBudgets] = useState<Record<string, string>>({});
  const [recForm, setRecForm] = useState({
    name: "",
    categoryId: "",
    defaultAmount: "",
    isCommon: false,
  });

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [c, r, s] = await Promise.all([
        apiGet<Category[]>("/api/categories"),
        apiGet<RecurringTemplate[]>("/api/recurring-expenses"),
        apiGet<{ domainName: string }>("/api/app-settings"),
      ]);
      setCategories(c);
      setRecurring(r);
      setDomainName(s.domainName ?? "");
      const b: Record<string, string> = {};
      for (const x of c) {
        b[x.id] = x.budget?.monthlyAmount ?? "";
      }
      setBudgets(b);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (categories.length > 0) {
      setRecForm((f) =>
        f.categoryId ? f : { ...f, categoryId: categories[0].id }
      );
    }
  }, [categories]);

  async function saveDomain() {
    try {
      await apiPatch("/api/app-settings", { domainName: domainName.trim() });
      setDomainSaved(true);
      setTimeout(() => setDomainSaved(false), 2000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save domain");
    }
  }

  async function addCategory() {
    if (!catName.trim()) return;
    try {
      await apiPost("/api/categories", { name: catName.trim() });
      setCatName("");
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function saveBudget(categoryId: string) {
    const v = Number(budgets[categoryId]);
    if (!Number.isFinite(v) || v < 0) {
      setErr("Budget must be a non-negative number");
      return;
    }
    try {
      await apiPut(`/api/categories/${categoryId}/budget`, {
        monthlyAmount: v,
      });
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("Delete category?")) return;
    try {
      await apiDelete(`/api/categories/${id}`);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function addRecurring() {
    if (!recForm.name.trim() || !recForm.categoryId) return;
    const payload: Record<string, unknown> = {
      name: recForm.name.trim(),
      categoryId: recForm.categoryId,
      isCommon: recForm.isCommon,
    };
    if (recForm.defaultAmount.trim()) {
      const n = Number(recForm.defaultAmount);
      if (Number.isFinite(n) && n > 0) payload.defaultAmount = n;
    }
    try {
      await apiPost("/api/recurring-expenses", payload);
      setRecForm((f) => ({ ...f, name: "", defaultAmount: "", isCommon: false }));
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function deleteRecurring(id: string) {
    if (!window.confirm("Delete recurring template?")) return;
    try {
      await apiDelete(`/api/recurring-expenses/${id}`);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold tracking-tight text-slate-900">Settings</h1>
      {err && <p className="text-sm font-medium text-red-600">{err}</p>}

      <section className="flex flex-col gap-4 rounded-none border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          General
        </h2>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span className="text-xs uppercase tracking-wider text-slate-500">Currency</span>
            <select
              className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
              value={currencyCode}
              onChange={(e) => void setCurrency(e.target.value)}
            >
              {CURRENCY_CODES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span className="text-xs uppercase tracking-wider text-slate-500">Domain Name</span>
            <div className="flex gap-2">
              <input
                className="h-10 flex-1 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
                placeholder="e.g. my-app.ngrok.io"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
              />
              <button
                type="button"
                className="h-10 rounded-none bg-indigo-600 px-4 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                onClick={() => void saveDomain()}
              >
                {domainSaved ? "Saved!" : "Save"}
              </button>
            </div>
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-none border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Categories
        </h2>
        <div className="flex gap-2">
          <input
            className="h-11 flex-1 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
            placeholder="New category"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />
          <button
            type="button"
            className="h-11 rounded-none bg-indigo-600 px-6 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
            onClick={() => void addCategory()}
          >
            Add
          </button>
        </div>
        <ul className="flex flex-col divide-y divide-slate-100">
          {categories.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-900 md:w-40">{c.name}</span>
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <input
                  className="h-9 w-28 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
                  placeholder="Budget / mo"
                  inputMode="decimal"
                  value={budgets[c.id] ?? ""}
                  onChange={(e) =>
                    setBudgets((b) => ({ ...b, [c.id]: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="h-9 rounded-none border border-slate-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                  onClick={() => void saveBudget(c.id)}
                >
                  Save budget
                </button>
                <button
                  type="button"
                  className="h-9 rounded-none border border-red-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-red-600 transition-colors hover:border-red-400 hover:bg-red-50"
                  onClick={() => void deleteCategory(c.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4 rounded-none border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Recurring / Common Spend
        </h2>
        <div className="flex flex-col gap-3">
          <input
            className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
            placeholder="Name (e.g. Rent, Coffee)"
            value={recForm.name}
            onChange={(e) => setRecForm((f) => ({ ...f, name: e.target.value }))}
          />
          <select
            className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
            value={recForm.categoryId}
            onChange={(e) =>
              setRecForm((f) => ({ ...f, categoryId: e.target.value }))
            }
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
            placeholder="Default amount (optional)"
            inputMode="decimal"
            value={recForm.defaultAmount}
            onChange={(e) =>
              setRecForm((f) => ({ ...f, defaultAmount: e.target.value }))
            }
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={recForm.isCommon}
              onChange={(e) => setRecForm((f) => ({ ...f, isCommon: e.target.checked }))}
              className="accent-indigo-600"
            />
            Common spend (doesn't hide after logging)
          </label>
          <button
            type="button"
            className="mt-1 h-11 w-full rounded-none bg-indigo-600 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
            onClick={() => void addRecurring()}
          >
            Add template
          </button>
        </div>
        <ul className="flex flex-col gap-2 pt-2">
          {recurring.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-none border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-slate-900">
                  {r.name} {r.isCommon && <span className="ml-2 rounded-none bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Common</span>}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  <span className="uppercase tracking-wider">{r.category.name}</span>
                  {r.defaultAmount != null && (
                    <>
                      <span className="mx-2 text-slate-300">|</span>
                      <span className="tabular-nums text-slate-900">{formatMoney(r.defaultAmount, currencyCode)}</span>
                    </>
                  )}
                </span>
              </div>
              <button
                type="button"
                className="h-9 shrink-0 rounded-none border border-red-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-red-600 transition-colors hover:border-red-400 hover:bg-red-50"
                onClick={() => void deleteRecurring(r.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
