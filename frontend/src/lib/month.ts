export function currentMonthUTC(): string {
  const n = new Date();
  const y = n.getUTCFullYear();
  const m = String(n.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function isValidMonth(s: string): boolean {
  return /^\d{4}-\d{2}$/.test(s);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, mo] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + delta, 1));
  const yy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

/** `YYYY-MM` → e.g. `August - 2026` (UTC month, for UI labels). */
export function formatMonthDisplay(month: string): string {
  if (!isValidMonth(month)) return month;
  const [y, mo] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1, 1));
  const name = new Intl.DateTimeFormat(undefined, {
    month: "long",
    timeZone: "UTC",
  }).format(d);
  return `${name} - ${y}`;
}

export function todayISODateUTC(): string {
  const n = new Date();
  const y = n.getUTCFullYear();
  const m = String(n.getUTCMonth() + 1).padStart(2, "0");
  const d = String(n.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
