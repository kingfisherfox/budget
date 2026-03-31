import { randomBytes } from "crypto";
import type { CookieOptions, Request, Response } from "express";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { SESSION_COOKIE, SESSION_DAYS } from "../lib/authConstants.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { HttpError } from "../middleware/httpError.js";

const signupSchema = z.object({
  username: z.string().min(3).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(128),
});

const loginSchema = signupSchema;

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const authRouter = Router();

function cookieOpts(): CookieOptions {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
}

async function createSession(userId: string, res: Response): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId, token, expiresAt },
  });
  res.cookie(SESSION_COOKIE, token, cookieOpts());
}

authRouter.get("/me", async (req: Request, res: Response, next) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!token) {
      res.json({ user: null });
      return;
    }
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: { select: { id: true, username: true } } },
    });
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      res.clearCookie(SESSION_COOKIE, { path: "/" });
      res.json({ user: null });
      return;
    }
    res.json({
      user: { id: session.user.id, username: session.user.username },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/signup", async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", { errors: parsed.error.flatten() });
    }
    const { username, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        passwordHash,
        appSettings: { create: { currencyCode: "THB", domainName: "" } },
      },
    });
    await createSession(user.id, res);
    res.status(201).json({ user: { id: user.id, username: user.username } });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      next(new HttpError(409, "Username already taken"));
      return;
    }
    next(e);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", { errors: parsed.error.flatten() });
    }
    const username = parsed.data.username.toLowerCase();
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid username or password");
    }
    await createSession(user.id, res);
    res.json({ user: { id: user.id, username: user.username } });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

authRouter.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", { errors: parsed.error.flatten() });
    }
    const uid = req.userId!;
    const user = await prisma.user.findUniqueOrThrow({ where: { id: uid } });
    const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!ok) {
      throw new HttpError(401, "Current password is incorrect");
    }
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: uid },
      data: { passwordHash },
    });
    await prisma.session.deleteMany({ where: { userId: uid } });
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    res.json({ ok: true, message: "Password changed; log in again." });
  } catch (e) {
    next(e);
  }
});
