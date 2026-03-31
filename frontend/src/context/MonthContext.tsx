import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useSearchParams } from "react-router-dom";
import { currentMonthUTC, isValidMonth } from "../lib/month";

type MonthCtx = { month: string; setMonth: (m: string) => void };

const MonthContext = createContext<MonthCtx | null>(null);

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useSearchParams();
  const raw = search.get("month");
  const month = raw && isValidMonth(raw) ? raw : currentMonthUTC();

  useEffect(() => {
    if (!raw || !isValidMonth(raw)) {
      setSearch(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.set("month", currentMonthUTC());
          return n;
        },
        { replace: true }
      );
    }
  }, [raw, setSearch]);

  const setMonth = useCallback(
    (m: string) => {
      setSearch(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.set("month", m);
          return n;
        },
        { replace: true }
      );
    },
    [setSearch]
  );

  const value = useMemo(() => ({ month, setMonth }), [month, setMonth]);

  return (
    <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
  );
}

export function useMonth(): MonthCtx {
  const c = useContext(MonthContext);
  if (!c) throw new Error("useMonth requires MonthProvider");
  return c;
}
