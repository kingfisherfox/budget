import { formatMoney } from "../lib/money";
import type { DashboardResponse } from "../api/types";

type Props = {
  data: DashboardResponse;
  currencyCode: string;
};

export function DashboardSummary({ data, currencyCode }: Props) {
  const { totals } = data;
  const over = totals.actual > totals.budget;
  return (
    <section className="flex flex-col gap-4 rounded-none border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
        Month overview
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Budget</dt>
          <dd className="text-2xl font-light tracking-tight text-slate-900 tabular-nums">
            {formatMoney(totals.budget, currencyCode)}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Actual</dt>
          <dd
            className={`text-2xl font-light tracking-tight tabular-nums ${
              over ? "text-rose-600" : "text-slate-900"
            }`}
          >
            {formatMoney(totals.actual, currencyCode)}
          </dd>
        </div>
      </div>
      <div className="h-px w-full bg-slate-100" />
      <p className="text-sm font-medium">
        {over ? (
          <span className="text-rose-600">
            {formatMoney(totals.actual - totals.budget, currencyCode)} over budget
          </span>
        ) : (
          <span className="text-emerald-600">
            {formatMoney(totals.budget - totals.actual, currencyCode)} under budget
          </span>
        )}
      </p>
    </section>
  );
}
