import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";

const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;

/**
 * Reads `BUDGET_ADMIN_USERNAME` and `BUDGET_ADMIN_PASSWORD` from the environment.
 * Called on API startup to create or update the single app user (bcrypt hash).
 * There is no signup; credentials are configured via `.env` (or host/Docker env).
 */
export function assertEnvCredentials(): void {
  const u = process.env.BUDGET_ADMIN_USERNAME?.trim();
  const p = process.env.BUDGET_ADMIN_PASSWORD;
  if (!u || u.length < 3 || u.length > 64 || !USERNAME_RE.test(u)) {
    throw new Error(
      "BUDGET_ADMIN_USERNAME is required: 3–64 chars, letters, numbers, _ and - only"
    );
  }
  if (!p || p.length < 8 || p.length > 128) {
    throw new Error("BUDGET_ADMIN_PASSWORD is required: 8–128 characters");
  }
}

export async function syncEnvUser(): Promise<void> {
  assertEnvCredentials();
  const username = process.env.BUDGET_ADMIN_USERNAME!.trim().toLowerCase();
  const password = process.env.BUDGET_ADMIN_PASSWORD!;
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash },
    });
    return;
  }

  await prisma.user.create({
    data: {
      username,
      passwordHash,
      appSettings: { create: { currencyCode: "THB", domainName: "" } },
    },
  });
}
