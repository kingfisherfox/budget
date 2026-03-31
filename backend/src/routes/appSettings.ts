import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/httpError.js";

const patchSchema = z.object({
  currencyCode: z.string().min(3).max(3).toUpperCase(),
});

export const appSettingsRouter = Router();

async function ensureSettings() {
  await prisma.appSettings.upsert({
    where: { id: 1 },
    create: { id: 1, currencyCode: "THB" },
    update: {},
  });
}

appSettingsRouter.get("/", async (_req, res, next) => {
  try {
    await ensureSettings();
    const row = await prisma.appSettings.findUniqueOrThrow({ where: { id: 1 } });
    res.json(row);
  } catch (e) {
    next(e);
  }
});

appSettingsRouter.patch("/", async (req, res, next) => {
  try {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", { errors: parsed.error.flatten() });
    }
    await ensureSettings();
    const row = await prisma.appSettings.update({
      where: { id: 1 },
      data: { currencyCode: parsed.data.currencyCode },
    });
    res.json(row);
  } catch (e) {
    next(e);
  }
});
