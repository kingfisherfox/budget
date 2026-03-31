import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Expense } from "../api/types";
import { formatMoney } from "../lib/money";

type Props = {
  expenses: Expense[];
  currencyCode: string;
};

const COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#d946ef",
];

function groupByCategory(expenses: Expense[]) {
  return expenses.reduce(
    (acc, expense) => {
      const catName = expense.category.name;
      if (!acc[catName]) acc[catName] = { total: 0, items: [] as Expense[] };
      acc[catName].total += Number(expense.amount);
      acc[catName].items.push(expense);
      return acc;
    },
    {} as Record<string, { total: number; items: Expense[] }>
  );
}

function aggregateByExpenseName(items: Expense[]) {
  const m = new Map<string, number>();
  for (const e of items) {
    const label = e.name?.trim() ? e.name.trim() : "(Unnamed)";
    m.set(label, (m.get(label) ?? 0) + Number(e.amount));
  }
  return [...m.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function DashboardExpenseList({ expenses, currencyCode }: Props) {
  const [drillCategory, setDrillCategory] = useState<string | null>(null);

  const grouped = useMemo(() => groupByCategory(expenses), [expenses]);

  const sortedCategories = useMemo(
    () => Object.entries(grouped).sort((a, b) => b[1].total - a[1].total),
    [grouped]
  );

  const pieData = useMemo(() => {
    if (drillCategory && grouped[drillCategory]) {
      return aggregateByExpenseName(grouped[drillCategory].items);
    }
    return sortedCategories.map(([name, { total }]) => ({ name, value: total }));
  }, [drillCategory, grouped, sortedCategories]);

  const parentTotal = drillCategory && grouped[drillCategory] ? grouped[drillCategory].total : null;

  function onPieClick(entry: { name?: string }) {
    if (!entry?.name) return;
    if (drillCategory === null && grouped[entry.name]) {
      setDrillCategory(entry.name);
    }
  }

  return (
    <section className="flex flex-col gap-6 rounded-none border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            This month
          </h2>
          {drillCategory ? (
            <button
              type="button"
              onClick={() => setDrillCategory(null)}
              className="max-w-full text-left text-sm font-bold text-slate-900 transition-colors hover:text-indigo-600"
            >
              <span className="font-normal text-slate-500">← </span>
              {drillCategory}
              <span className="ml-2 font-normal text-slate-500">· labels in this category · click to show all categories</span>
            </button>
          ) : (
            <p className="text-xs text-slate-500">Tap a category below or a pie slice to see spend by label.</p>
          )}
        </div>
        <Link
          to="/expenses"
          className="shrink-0 text-xs font-bold uppercase tracking-wider text-indigo-600 transition-colors hover:text-indigo-800"
        >
          View all
        </Link>
      </div>

      {sortedCategories.length === 0 ? (
        <p className="text-sm text-slate-500">No expenses yet.</p>
      ) : drillCategory && pieData.length === 0 ? (
        <p className="text-sm text-slate-500">No labeled spend in this category.</p>
      ) : (
        <>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                  onClick={(d) => onPieClick(d as { name?: string })}
                  className={drillCategory ? "cursor-default" : "cursor-pointer outline-none"}
                  label={
                    pieData.length <= 10
                      ? ({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      : false
                  }
                  labelLine={pieData.length <= 10}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    formatMoney(Number(value ?? 0), currencyCode)
                  }
                  labelFormatter={(label) => String(label)}
                  contentStyle={{
                    borderRadius: 0,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#0f172a", fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-4">
            {drillCategory === null
              ? sortedCategories.map(([categoryName, { total }], index) => (
                  <button
                    key={categoryName}
                    type="button"
                    onClick={() => setDrillCategory(categoryName)}
                    className="flex w-full items-center justify-between border-b border-slate-100 pb-3 text-left last:border-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <h3 className="min-w-0 truncate text-sm font-bold uppercase tracking-wider text-slate-900">
                        {categoryName}
                      </h3>
                    </div>
                    <span className="shrink-0 pl-2 text-sm font-bold tabular-nums text-slate-900">
                      {formatMoney(total, currencyCode)}
                    </span>
                  </button>
                ))
              : pieData.map((row, index) => {
                  const pctOfCategory =
                    parentTotal && parentTotal > 0
                      ? ((row.value / parentTotal) * 100).toFixed(0)
                      : null;
                  return (
                    <div
                      key={row.name}
                      className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 last:border-0"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-slate-900">{row.name}</h3>
                          {pctOfCategory !== null ? (
                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                              {pctOfCategory}% of {drillCategory}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
                        {formatMoney(row.value, currencyCode)}
                      </span>
                    </div>
                  );
                })}
          </div>
        </>
      )}
    </section>
  );
}
