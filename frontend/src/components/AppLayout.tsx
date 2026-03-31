import { NavLink, Outlet } from "react-router-dom";
import { MonthStrip } from "./MonthStrip";

const linkCls = ({ isActive }: { isActive: boolean }) =>
  [
    "flex-1 py-4 text-center text-xs uppercase tracking-wider font-semibold border-t-2 transition-colors",
    isActive
      ? "border-neutral-900 text-neutral-900 bg-neutral-100/50"
      : "border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50",
  ].join(" ");

export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col bg-slate-50 md:max-w-2xl md:border-x md:border-slate-200 md:shadow-sm">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md">
        <MonthStrip />
      </header>
      <main className="flex-1 px-4 py-6">
        <Outlet />
      </main>
      <nav className="sticky bottom-0 flex border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:relative md:border-t-0 md:pb-0">
        <NavLink to="/" end className={linkCls}>
          Home
        </NavLink>
        <NavLink to="/expenses" className={linkCls}>
          Expenses
        </NavLink>
        <NavLink to="/wishlist" className={linkCls}>
          Wishlist
        </NavLink>
        <NavLink to="/settings" className={linkCls}>
          Settings
        </NavLink>
      </nav>
    </div>
  );
}
