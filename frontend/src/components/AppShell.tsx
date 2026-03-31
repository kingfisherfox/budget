import { CurrencyProvider } from "../context/CurrencyContext";
import { MonthProvider } from "../context/MonthContext";
import { AppLayout } from "./AppLayout";

export function AppShell() {
  return (
    <CurrencyProvider>
      <MonthProvider>
        <AppLayout />
      </MonthProvider>
    </CurrencyProvider>
  );
}
