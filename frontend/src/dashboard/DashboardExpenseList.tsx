import { Link } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Expense } from "../api/types";
import { formatMoney } from "../lib/money";

type Props = {
  expenses: Expense[];
  currencyCode: string;
};

// A vibrant, modern palette for the pie chart
const COLORS = [
  "#4f46e5", // indigo-600
  "#0ea5e9", // sky-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#f43f5e", // rose-500
  "#8b5cf6", // violet-500
  "#d946ef", // fuchsia-500
];

export function DashboardExpenseList({ expenses, currencyCode }: Props) {
  // Group expenses by category
  const grouped = expenses.reduce((acc, expense) => {
    const catName = expense.category.name;
    if (!acc[catName]) {
      acc[catName] = {
        total: 0,
        items: [],
      };
    }
    acc[catName].total += Number(expense.amount);
    acc[catName].items.push(expense);
    return acc;
  }, {} as Record<string, { total: number; items: Expense[] }>);

  const sortedCategories = Object.entries(grouped).sort(
    (a, b) => b[1].total - a[1].total
  );

  const pieData = sortedCategories.map(([name, { total }]) => ({
    name,
    value: total,
  }));

  return (
    <section className="flex flex-col gap-6 rounded-none border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          This month
        </h2>
        <Link
          to="/expenses"
          className="text-xs font-bold uppercase tracking-wider text-indigo-600 transition-colors hover:text-indigo-800"
        >
          View all
        </Link>
      </div>

      {sortedCategories.length === 0 ? (
        <p className="text-sm text-slate-500">No expenses yet.</p>
      ) : (
        <>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatMoney(Number(value), currencyCode)}
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
            {sortedCategories.map(([categoryName, { total }], index) => (
              <div key={categoryName} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    {categoryName}
                  </h3>
                </div>
                <span className="text-sm font-bold tabular-nums text-slate-900">
                  {formatMoney(total, currencyCode)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
