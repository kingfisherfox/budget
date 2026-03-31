import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function SettingsAccountSection() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await apiPost<{ ok: boolean; message: string }>("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      await refresh();
      navigate("/account", { replace: true });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    setLoggingOut(true);
    setErr(null);
    try {
      await logout();
      navigate("/account", { replace: true });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed to log out");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-none border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
        Account
      </h2>
      {user && (
        <p className="text-sm text-slate-600">
          Signed in as <span className="font-semibold text-slate-900">{user.username}</span>
        </p>
      )}
      {err && <p className="text-sm font-medium text-red-600">{err}</p>}

      <form className="flex flex-col gap-3" onSubmit={(e) => void savePassword(e)}>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Change password</p>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          <span className="text-xs uppercase tracking-wider text-slate-500">Current password</span>
          <input
            type="password"
            className="h-10 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          <span className="text-xs uppercase tracking-wider text-slate-500">New password</span>
          <input
            type="password"
            className="h-10 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="h-10 rounded-none border border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-800 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Change password"}
        </button>
      </form>

      <div className="border-t border-slate-100 pt-4">
        <button
          type="button"
          disabled={loggingOut}
          className="h-10 w-full rounded-none border border-red-200 bg-red-50 text-xs font-bold uppercase tracking-wider text-red-800 disabled:opacity-50"
          onClick={() => void onLogout()}
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </section>
  );
}
