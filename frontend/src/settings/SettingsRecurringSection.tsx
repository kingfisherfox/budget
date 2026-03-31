import type { Dispatch, SetStateAction } from "react";
import type { Category, RecurringTemplate } from "../api/types";
import { formatMoney } from "../lib/money";

type RecForm = {
  name: string;
  categoryId: string;
  defaultAmount: string;
  isCommon: boolean;
};

type Props = {
  categories: Category[];
  recurring: RecurringTemplate[];
  currencyCode: string;
  recForm: RecForm;
  setRecForm: Dispatch<SetStateAction<RecForm>>;
  onAddRecurring: () => void;
  onDeleteRecurring: (id: string) => void;
};

export function SettingsRecurringSection({
  categories,
  recurring,
  currencyCode,
  recForm,
  setRecForm,
  onAddRecurring,
  onDeleteRecurring,
}: Props) {
  return (
    <section className="flex flex-col gap-4 rounded-none border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
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
            onChange={(e) =>
              setRecForm((f) => ({ ...f, isCommon: e.target.checked }))
            }
            className="accent-indigo-600"
          />
          Common spend (doesn&apos;t hide after logging)
        </label>
        <button
          type="button"
          className="mt-1 h-11 w-full rounded-none bg-indigo-600 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
          onClick={() => void onAddRecurring()}
        >
          Add template
        </button>
      </div>
      <ul className="flex flex-col gap-2 pt-2">
        {recurring.map((r) => (
          <li
            key={r.id}
            className="flex min-w-0 items-center gap-1.5 rounded-none border border-slate-200 bg-white px-2 py-2 shadow-sm transition-colors hover:border-slate-300 sm:gap-2 sm:px-3 sm:py-2.5"
          >
            <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-hidden">
              <span className="min-w-0 truncate text-sm font-bold text-slate-900">
                {r.name}
              </span>
              {r.isCommon ? (
                <span className="shrink-0 whitespace-nowrap bg-slate-100 px-1 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                  Com
                </span>
              ) : null}
              <span className="max-w-[32%] shrink truncate whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {r.category.name}
              </span>
              {r.defaultAmount != null ? (
                <span className="ml-auto shrink-0 text-xs font-semibold tabular-nums text-slate-900">
                  {formatMoney(r.defaultAmount, currencyCode)}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              className="h-8 shrink-0 rounded-none border border-red-200 bg-white px-2 text-[10px] font-bold uppercase tracking-wide text-red-600 transition-colors hover:border-red-400 hover:bg-red-50 sm:h-9 sm:px-3 sm:text-xs"
              onClick={() => void onDeleteRecurring(r.id)}
            >
              Del
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
