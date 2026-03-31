import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactNumber, formatMoney } from "../lib/money";
import type { DashboardResponse } from "../api/types";

type Props = {
  data: DashboardResponse;
  currencyCode: string;
};

export function DailySpendChart({ data, currencyCode }: Props) {
  const rows = data.dailySpend.map((d) => ({
    day: d.date.slice(5), // "MM-DD"
    total: d.total,
  }));
  return (
    <section className="flex flex-col gap-4 rounded-none border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
        Daily spend
      </h2>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis 
              tick={{ fontSize: 11, fill: '#64748b' }} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(value) => formatCompactNumber(value)}
            />
            <Tooltip
              formatter={(v) =>
                formatMoney(v == null ? 0 : Number(v), currencyCode)
              }
              labelFormatter={(l) => `Date: ${l}`}
              contentStyle={{ borderRadius: 0, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Bar
              dataKey="total"
              name="Spend"
              fill="#4f46e5"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
