import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { CurrencyProvider } from "./context/CurrencyContext";
import { MonthProvider } from "./context/MonthContext";
import { DashboardPage } from "./pages/DashboardPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { WishlistPage } from "./pages/WishlistPage";

export default function App() {
  return (
    <BrowserRouter>
      <CurrencyProvider>
        <MonthProvider>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MonthProvider>
      </CurrencyProvider>
    </BrowserRouter>
  );
}
