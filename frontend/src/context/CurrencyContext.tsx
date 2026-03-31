import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiGet, apiPatch } from "../api/client";
import type { AppSettings } from "../api/types";

type Ctx = {
  currencyCode: string;
  refresh: () => Promise<void>;
  setCurrency: (code: string) => Promise<void>;
};

const CurrencyContext = createContext<Ctx | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyCode, setCode] = useState("THB");

  const refresh = useCallback(async () => {
    const s = await apiGet<AppSettings>("/api/app-settings");
    setCode(s.currencyCode);
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const setCurrency = useCallback(async (code: string) => {
    const s = await apiPatch<AppSettings>("/api/app-settings", {
      currencyCode: code,
    });
    setCode(s.currencyCode);
  }, []);

  const value = useMemo(
    () => ({ currencyCode, refresh, setCurrency }),
    [currencyCode, refresh, setCurrency]
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): Ctx {
  const c = useContext(CurrencyContext);
  if (!c) throw new Error("useCurrency requires CurrencyProvider");
  return c;
}
