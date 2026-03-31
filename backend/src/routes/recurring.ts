import { Router } from "express";
import { z } from "zod";
import { isValidMonth, monthUtcRange } from "../lib/dates.js";
import { prisma } from "../lib/prisma.js";
import { dec } from "../lib/serialize.js";
import { userId } from "../lib/userScope.js";
import { HttpError } from "../middleware/httpError.js";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  categoryId: z.string().min(1),
  defaultAmount: z.coerce.number().positive().optional().nullable(),
  isCommon: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const patchSchema = createSchema.partial();

export const recurringRouter = Router();

function mapRow(
  r: NonNullable<Awaited<ReturnType<typeof prisma.recurringExpense.findFirst>>> & {
    category: { id: string; name: string };
  }
) {
  return {
    id: r.id,
    name: r.name,
    categoryId: r.categoryId,
    defaultAmount: r.defaultAmount != null ? dec(r.defaultAmount) : null,
    isCommon: r.isCommon,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt,
    category: r.category,
  };
}

recurringRouter.get("/status", async (req, res, next) => {
  try {
    const uid = userId(req);
    const month = req.query.month as string;
    if (!month || !isValidMonth(month)) {
      throw new HttpError(400, "Query month=YYYY-MM is required");
    }
    const { start, endExclusive } = monthUtcRange(month);
    const templates = await prisma.recurringExpense.findMany({
      where: { category: { userId: uid } },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    const completedIds = new Set(
      (
        await prisma.expense.findMany({
          where: {
            date: { gte: start, lt: endExclusive },
            recurringExpenseId: { not: null },
            category: { userId: uid },
          },
          select: { recurringExpenseId: true },
        })
      )
        .map((x) => x.recurringExpenseId)
        .filter(Boolean) as string[]
    );
    res.json(
      templates.map((t) => ({
        id: t.id,
        name: t.name,
        categoryId: t.categoryId,
        defaultAmount: t.defaultAmount != null ? dec(t.defaultAmount) : null,
        isCommon: t.isCommon,
        sortOrder: t.sortOrder,
        category: t.category,
        completed: t.isCommon ? false : completedIds.has(t.id),
      }))
    );
  } catch (e) {
    next(e);
  }
});

recurringRouter.get("/", async (req, res, next) => {
  try {
    const uid = userId(req);
    const rows = await prisma.recurringExpense.findMany({
      where: { category: { userId: uid } },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    res.json(rows.map((r) => mapRow(r)));
  } catch (e) {
    next(e);
  }
});

recurringRouter.post("/", async (req, res, next) => {
  try {
    const uid = userId(req);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", { errors: parsed.error.flatten() });
    }
    await prisma.category.findFirstOrThrow({
      where: { id: parsed.data.categoryId, userId: uid },
    });
    const row = await prisma.recurringExpense.create({
      data: {
        name: parsed.data.name,
        categoryId: parsed.data.categoryId,
        defaultAmount: parsed.data.defaultAmount ?? undefined,
        isCommon: parsed.data.isCommon ?? false,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
      include: { category: { select: { id: true, name: true } } },
    });
    res.status(201).json(mapRow(row));
  } catch (e) {
    next(e);
  }
});

recurringRouter.patch("/:id", async (req, res, next) => {
  try {
    const uid = userId(req);
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", { errors: parsed.error.flatten() });
    }
    const existing = await prisma.recurringExpense.findFirst({
      where: { id: req.params.id, category: { userId: uid } },
    });
    if (!existing) throw new HttpError(404, "Recurring expense not found");
    if (parsed.data.categoryId) {
      await prisma.category.findFirstOrThrow({
        where: { id: parsed.data.categoryId, userId: uid },
      });
    }
    const row = await prisma.recurringExpense.update({
      where: { id: req.params.id },
      data: {
        name: parsed.data.name,
        categoryId: parsed.data.categoryId,
        defaultAmount:
          parsed.data.defaultAmount === null
            ? null
            : parsed.data.defaultAmount ?? undefined,
        isCommon: parsed.data.isCommon,
        sortOrder: parsed.data.sortOrder,
      },
      include: { category: { select: { id: true, name: true } } },
    });
    res.json(mapRow(row));
  } catch (e) {
    next(e);
  }
});

recurringRouter.delete("/:id", async (req, res, next) => {
  try {
    const uid = userId(req);
    const existing = await prisma.recurringExpense.findFirst({
      where: { id: req.params.id, category: { userId: uid } },
    });
    if (!existing) throw new HttpError(404, "Recurring expense not found");
    await prisma.recurringExpense.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
