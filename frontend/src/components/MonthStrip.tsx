import { shiftMonth } from "../lib/month";
import { useMonth } from "../context/MonthContext";

export function MonthStrip() {
  const { month, setMonth } = useMonth();
  return (
    <div className="flex items-center justify-between py-3">
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-none border border-neutral-200 bg-white text-lg font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 active:bg-neutral-100"
        onClick={() => setMonth(shiftMonth(month, -1))}
        aria-label="Previous month"
      >
        ‹
      </button>
      <span className="text-sm font-bold uppercase tracking-widest text-neutral-900 tabular-nums">
        {month}
      </span>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-none border border-neutral-200 bg-white text-lg font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 active:bg-neutral-100"
        onClick={() => setMonth(shiftMonth(month, 1))}
        aria-label="Next month"
      >
        ›
      </button>
    </div>
  );
}
